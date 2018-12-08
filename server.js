const express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      compression = require('compression'),
      mongoose = require('mongoose');

const Alif = require('alif-toolkit'),
      Normal = Alif.Normal,
      WordShaper = Alif.WordShaper,
      GlyphSplitter = Alif.GlyphSplitter,
      BaselineSplitter = Alif.BaselineSplitter;

const Word = require('./models/word');

const languages = ['ar', 'fa'],
      catlanguages = ['en', 'ar', 'fa'];

let app = express();

console.log('Connecting to MongoDB (required)');
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/citynamer');

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(express['static'](__dirname + '/static'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
// app.use(session({
//   store: new MongoStore({
//     mongooseConnection: mongoose.connection
//   }),
//   secret: process.env.SESSION || 'fj23f90jfoijfl2mfp293i019eoijdoiqwj129'
// }));

app.get('/', (req, res) => {
  res.render('homepage');
});

app.get('/random/:language', (req, res) => {
  let lang = req.params.language.toLowerCase()
  if (languages.indexOf(lang) === -1) {
    return res.json({
      error: 'unsupported language'
    });
  }

  Word.aggregate([{ $match: { language: lang }},
                  { $sample: { size: 1 }}]).exec((err, words) => {
    return res.json(err || words[0]);
  });
});

app.get('/topic/:language/:category', (req, res) => {
  let lang = req.params.language.toLowerCase()
  if (languages.indexOf(lang) === -1) {
    return res.json({
      error: 'unsupported language'
    });
  }

  let category = req.params.category.toLowerCase().split(':'),
      catlang = category[0],
      catname = category[1];
  if (catlanguages.indexOf(catlang) === -1) {
    return res.json({
      error: 'unsupported language'
    });
  }

  Word.aggregate([{ $match: { language: lang,
                              categories: { $in: [catlang + ':' + catname] } } },
                  { $sample: { size: 1 } }]).exec((err, words) => {
    if (err) {
      return res.json(err);
    }
    if (!words.length) {
      return res.json({ error: 'none found' });
    }
    return res.json(words[0]);
  });
});

app.get('/words', (req, res) => {
  Word.aggregate([{ $sample: { size: 100 } }]).exec((err, words) => {
    return res.json(err || words);
  });
});

app.post('/word', (req, res) => {
  // console.log(req.body);
  let normal = Normal(req.body.word),
      w = new Word({
        language: req.body.language,
        clue: req.body.clue,
        normal: normal,
        word: req.body.word,
        glyphs: GlyphSplitter(normal),
        baseline: BaselineSplitter(normal),
        shaped: GlyphSplitter(WordShaper(normal)),
        categories: req.body.categories || []
      });
  w.save((err) => {
    res.json(err || 'saved');
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('app is running');
});

app.turnoff = function() {
  mongoose.connection.close();
  app.close();
};

module.exports = app;
