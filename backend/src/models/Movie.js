const { Schema, model } = require('mongoose');
const s = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' },
  genre: [String],
  language: { type: String, default: 'English' },
  durationMins: { type: Number, required: true, min: 1 },
  rating: { type: Number, min: 0, max: 10, default: 0 },
  posterUrl: String,
}, { timestamps: true });
module.exports = model('Movie', s);
