const router = require('express').Router();
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const { AppError, wrap, auth } = require('../middleware');

router.use(auth);

router.get('/mine', wrap(async (req, res) => {
  const list = await Booking.find({ user: req.user.id }).sort('-createdAt')
    .populate({ path: 'show', select: 'screen startsAt price movie', populate: { path: 'movie', select: 'title posterUrl' } }).lean();
  res.json(list);
}));

router.delete('/:id', wrap(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!b) throw new AppError(404, 'Booking not found');
  if (b.status === 'cancelled') throw new AppError(409, 'Already cancelled');
  const show = await Show.findById(b.show);
  if (show && show.startsAt <= new Date()) throw new AppError(400, 'Show already started');
  await Show.updateOne({ _id: b.show }, { $pull: { bookedSeats: { $in: b.seats } } });
  b.status = 'cancelled'; await b.save();
  req.app.get('io').emit('seats', { showId: String(b.show) });
  res.json(b);
}));

module.exports = router;
