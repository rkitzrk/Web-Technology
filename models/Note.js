const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: 'Anonymous',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Note', NoteSchema);
