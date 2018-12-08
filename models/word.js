const mongoose = require('mongoose');

const wordSchema = mongoose.Schema({
  word: String,
  language: String,
  clue: String,
  normal: String,
  shaped: [String],
  glyphs: [String],
  baseline: [String],
  categories: [String],
  inSimple: Boolean,
  translations: {
    ar: String,
    fa: String,
    en: String,
    zht: String,
    zhs: String
  }
});

module.exports = mongoose.model('Word', wordSchema);
