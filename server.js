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
  Word.find({}, (err, words) => {
    return res.json(err || words);
  });
});

app.post('/word', (req, res) => {
  // console.log(req.body);
  let normal = Normal(req.body.word),
      w = new Word({
        language: 'ar',
        clue: req.body.clue,
        normal: normal,
        word: req.body.word,
        glyphs: GlyphSplitter(normal),
        baseline: BaselineSplitter(normal),
        shaped: GlyphSplitter(WordShaper(normal))
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
