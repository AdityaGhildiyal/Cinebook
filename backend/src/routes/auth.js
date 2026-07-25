const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, wrap } = require('../middleware');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (u) => jwt.sign({ sub: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const out = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/register', wrap(async (req, res) => {
  // String() coercion blocks NoSQL operator injection such as {"$ne": null}
  const name = String(req.body.name || '').trim(), email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  if (!name || !EMAIL.test(email) || password.length < 6) throw new AppError(400, 'Name, valid email and a password of 6+ characters are required');
  if (await User.exists({ email })) throw new AppError(409, 'Email already registered');
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: out(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError(401, 'Invalid email or password');
  res.json({ token: sign(user), user: out(user) });
}));

module.exports = router;
