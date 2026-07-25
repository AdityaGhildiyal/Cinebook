const router = require('express').Router();
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const store = require('../store');
const { AppError, wrap, auth, requireRole } = require('../middleware');

const CACHE_KEY = 'cache:movies:all', CACHE_TTL = 60;

// Cache-aside: read from cache, fall back to MongoDB, repopulate with a TTL
router.get('/', wrap(async (_req, res) => {
  const hit = await store.get(CACHE_KEY);
  if (hit) { res.set('X-Cache', 'HIT'); return res.json(JSON.parse(hit)); }
  const movies = await Movie.find().sort({ createdAt: -1 }).lean();
  await store.set(CACHE_KEY, JSON.stringify(movies), CACHE_TTL);
  res.set('X-Cache', 'MISS').json(movies);
}));

router.get('/:id', wrap(async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();
  if (!movie) throw new AppError(404, 'Movie not found');
  const shows = await Show.find({ movie: movie._id, startsAt: { $gte: new Date() } }).sort('startsAt').select('-bookedSeats').lean();
  res.json({ movie, shows });
}));

// Admin: invalidate the cache on every write
router.post('/', auth, requireRole('admin'), wrap(async (req, res) => {
  const { title, description, genre, language, durationMins, rating, posterUrl } = req.body;
  const movie = await Movie.create({ title, description, genre, language, durationMins, rating, posterUrl });
  await store.del(CACHE_KEY);
  res.status(201).json(movie);
}));

router.post('/:id/shows', auth, requireRole('admin'), wrap(async (req, res) => {
  if (!(await Movie.exists({ _id: req.params.id }))) throw new AppError(404, 'Movie not found');
  const { screen, startsAt, price, rows, cols } = req.body;
  res.status(201).json(await Show.create({ movie: req.params.id, screen, startsAt, price, rows, cols }));
}));

module.exports = router;
