const { Schema, model } = require('mongoose');
const s = new Schema({
  movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
  screen: { type: String, required: true },
  startsAt: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  rows: { type: Number, default: 8, min: 1, max: 26 },
  cols: { type: Number, default: 12, min: 1, max: 30 },
  bookedSeats: { type: [String], default: [] },
});
s.index({ movie: 1, startsAt: 1 });
module.exports = model('Show', s);
