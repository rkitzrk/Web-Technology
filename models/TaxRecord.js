const mongoose = require('mongoose');

const TaxRecordSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  fromYear: {
    type: Number,
    required: true,
  },
  toYear: {
    type: Number,
    required: true,
  },
  annualIncome: {
    type: Number,
    required: true,
  },
  deductions: {
    type: Number,
    required: true,
    default: 0,
  },
  taxableIncome: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  effectiveRate: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TaxRecord', TaxRecordSchema);
