require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { errorHandler } = require('./middleware');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }

const app = express();
const server = http.createServer(app);
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const io = new Server(server, { cors: { origin } });
app.set('io', io);

app.use(helmet());
app.use(cors({ origin }));
app.use(express.json({ limit: '50kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/bookings', require('./routes/bookings'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinebook')
  .then(() => server.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
