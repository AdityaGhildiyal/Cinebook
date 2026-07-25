const router = require('express').Router();
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const store = require('../store');
const { AppError, wrap, auth } = require('../middleware');

const TTL = parseInt(process.env.SEAT_LOCK_TTL, 10) || 120;
const MAX_SEATS = 6;
const lockKey = (showId, seat) => `lock:${showId}:${seat}`;

const loadShow = async (id) => { const s = await Show.findById(id); if (!s) throw new AppError(404, 'Show not found'); return s; };
const cleanSeats = (show, raw) => {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_SEATS) throw new AppError(400, `Choose between 1 and ${MAX_SEATS} seats`);
  const seats = [...new Set(raw.map(String))];
  for (const s of seats) {
    const m = /^([A-Z])(\d{1,2})$/.exec(s);
    if (!m || m[1].charCodeAt(0) - 65 >= show.rows || +m[2] < 1 || +m[2] > show.cols) throw new AppError(400, `Invalid seat ${s}`);
  }
  return seats;
};
const notify = (req, showId) => req.app.get('io').emit('seats', { showId });

router.use(auth);

router.get('/:id', wrap(async (req, res) => {
  const show = await loadShow(req.params.id);
  const prefix = lockKey(show.id, '');
  const keys = await store.keys(prefix);
  const locked = [];
  for (const k of keys) { const owner = await store.get(k); if (owner) locked.push({ seat: k.slice(prefix.length), mine: owner === req.user.id }); }
  res.json({ id: show.id, movie: show.movie, screen: show.screen, startsAt: show.startsAt, price: show.price,
    rows: show.rows, cols: show.cols, bookedSeats: show.bookedSeats, locked, lockTtl: TTL });
}));

// Temporarily hold seats. SET NX EX is atomic, so two users can never hold the same seat.
router.post('/:id/lock', wrap(async (req, res) => {
  const show = await loadShow(req.params.id);
  const seats = cleanSeats(show, req.body.seats);
  const taken = seats.filter((s) => show.bookedSeats.includes(s));
  if (taken.length) throw new AppError(409, `Already booked: ${taken.join(', ')}`);
  const acquired = [];
  for (const seat of seats) {
    const key = lockKey(show.id, seat);
    if (await store.setnx(key, req.user.id, TTL)) { acquired.push(key); continue; }
    if ((await store.get(key)) === req.user.id) { await store.set(key, req.user.id, TTL); continue; } // refresh own hold
    await store.del(...acquired); // roll back partial holds
    throw new AppError(409, `Seat ${seat} is being held by another user`);
  }
  notify(req, show.id);
  res.json({ seats, expiresAt: Date.now() + TTL * 1000 });
}));

router.post('/:id/unlock', wrap(async (req, res) => {
  const show = await loadShow(req.params.id);
  for (const seat of cleanSeats(show, req.body.seats)) {
    const key = lockKey(show.id, seat);
    if ((await store.get(key)) === req.user.id) await store.del(key);
  }
  notify(req, show.id);
  res.json({ ok: true });
}));

router.post('/:id/book', wrap(async (req, res) => {
  const show = await loadShow(req.params.id);
  const seats = cleanSeats(show, req.body.seats);
  for (const seat of seats) if ((await store.get(lockKey(show.id, seat))) !== req.user.id) throw new AppError(409, 'Your seat hold expired. Please select seats again');
  // Atomic guard: the update only matches if none of the seats are already booked (final defence against double-booking)
  const upd = await Show.updateOne({ _id: show._id, bookedSeats: { $nin: seats } }, { $push: { bookedSeats: { $each: seats } } });
  if (!upd.modifiedCount) throw new AppError(409, 'One or more seats were just booked by someone else');
  let booking;
  try { booking = await Booking.create({ user: req.user.id, show: show._id, seats, amount: seats.length * show.price }); }
  catch (e) { await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: seats } } }); throw e; }
  await store.del(...seats.map((s) => lockKey(show.id, s)));
  notify(req, show.id);
  res.status(201).json(booking);
}));

module.exports = router;
