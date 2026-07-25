const { Schema, model } = require('mongoose');
const s = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
  seats: { type: [String], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });
module.exports = model('Booking', s);
