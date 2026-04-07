const mongoose = require('mongoose');

const CalculationSchema = new mongoose.Schema({
  expression: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // optional for now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Calculation', CalculationSchema);
