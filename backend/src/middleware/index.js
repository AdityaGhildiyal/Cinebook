const jwt = require('jsonwebtoken');
class AppError extends Error { constructor(status, message) { super(message); this.status = status; } }
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const auth = (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return next(new AppError(401, 'Authentication required'));
  try {
    const p = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch { next(new AppError(401, 'Invalid or expired token')); }
};
const requireRole = (role) => (req, _res, next) =>
  req.user && req.user.role === role ? next() : next(new AppError(403, 'Forbidden'));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err.code === 11000) return res.status(409).json({ error: 'Already exists' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
};
module.exports = { AppError, wrap, auth, requireRole, errorHandler };
