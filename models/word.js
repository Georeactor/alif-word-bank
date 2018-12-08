const mongoose = require('mongoose');

const wordSchema = mongoose.Schema({
  word: String,
  language: String,
  clue: String,
  normal: String,
  shaped: [String],
  glyphs: [String],
  baseline: [String],
  categories: [String]
});

module.exports = mongoose.model('Word', wordSchema);
