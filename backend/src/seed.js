require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'), Movie = require('./models/Movie'), Show = require('./models/Show'), Booking = require('./models/Booking');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinebook');
  await Promise.all([User.deleteMany(), Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);
  await User.create([
    { name: 'Admin', email: 'admin@cinebook.dev', password: await bcrypt.hash('Admin@123', 10), role: 'admin' },
    { name: 'Demo User', email: 'user@cinebook.dev', password: await bcrypt.hash('User@123', 10) },
  ]);
  const movies = await Movie.create([
    { title: 'Orbit Break', description: 'A salvage crew finds a signal that should not exist.', genre: ['Sci-Fi', 'Thriller'], durationMins: 128, rating: 8.1 },
    { title: 'The Last Monsoon', description: 'Two rival chefs reunite in a flooded hill town.', genre: ['Drama', 'Romance'], language: 'Hindi', durationMins: 141, rating: 7.6 },
    { title: 'Midnight Express 9', description: 'One train, nine hours, no brakes.', genre: ['Action'], durationMins: 112, rating: 7.2 },
    { title: 'Paper Lanterns', description: 'An animated journey across a festival of lights.', genre: ['Animation', 'Family'], durationMins: 98, rating: 8.4 },
  ]);
  const shows = [];
  for (const m of movies) for (let d = 0; d < 3; d++) for (const [h, screen, price] of [[14, 'Screen 1', 220], [19, 'Screen 2', 300]]) {
    const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
    if (t > new Date()) shows.push({ movie: m._id, screen, startsAt: t, price });
  }
  await Show.create(shows);
  console.log(`Seeded ${movies.length} movies, ${shows.length} shows.\nAdmin: admin@cinebook.dev / Admin@123\nUser: user@cinebook.dev / User@123`);
  await mongoose.disconnect();
})();
