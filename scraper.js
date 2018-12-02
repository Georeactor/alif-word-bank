const request = require('request'),
      cheerio = require('cheerio'),
      isArabic = require('alif-toolkit').isArabic;

let findGoodTopic = (language, callback) => {
  request('https://' + language + '.wikipedia.org/wiki/Special:Random', (err, resp, body) => {
    if (err) {
      return callback(err);
    }
    let $ = cheerio.load(body);
    let articleName = $('#firstHeading').text();
    articleName = articleName.split(' (')[0].split(',')[0].replace("'", '');

    // remove year articles
    if (!isNaN(articleName * 1)) {
      return findGoodTopic(language, callback);
    }

    // must be all Arabic script
    for (let c = 0; c < articleName.length; c++) {
      if (!isArabic(articleName[c])) {
        return findGoodTopic(language, callback);
      }
    }

    let firstArticlePara = $($('.mw-parser-output > p')[0])
    let articleText = firstArticlePara.text()
      .replace(/\[\d+\]/g, '');

    let biographyPotential = $('.biography').text();
    let biography = (biographyPotential.indexOf('Nacimiento') > -1 || biographyPotential.indexOf('Naissance') > -1 || biographyPotential.indexOf('Geboren') > -1);

    // make people articles feasible
    let lastName = false;
    if (articleName.indexOf(' ') > -1 && (articleText.indexOf('–') > -1 || articleText.indexOf('(born ') > -1 || biography)) {
      // last name only
      let articleNames = articleName.split(' ');
      articleName = articleNames.pop();
      if (articleNames[articleNames.length - 1] === 'de') {
        articleName = 'de' + articleName;
      }
      if (articleNames.length > 1 && articleNames[articleNames.length - 2] === 'de' && articleNames[articleNames.length - 1] === 'la') {
        articleName = 'dela' + articleName;
      }
      lastName = true;
    }
    if (articleName.indexOf(' ') > -1 || articleName.indexOf('-') > -1 || articleName.indexOf('!') > -1 || articleName.indexOf('?') > -1) {
      // articles with spaces and hyphens could be really confusing
      return findGoodTopic(language, callback);
    }

    // remove and smooth out multiple references to the name
    let nameInstances = firstArticlePara.find('b, em');
    for (let i = 0; i < nameInstances.length; i++) {
      articleText = articleText.replace($(nameInstances[i]).text(), '__');
    }
    articleText = articleText.replace(new RegExp(articleName, 'ig'), '__');
    articleText = articleText.substring(articleText.indexOf('__'))
      .replace('__ is ', '')
      .replace('__ are ', '')
      .replace('(__)', '')
      .replace(/\s+/, ' ');

    let formatText = articleText;
    let sentenceEnd = (language === 'my') ? '။' : '.';
    if (articleText.indexOf(sentenceEnd + ' ') > -1) {
      formatText = articleText.substring(0, articleText.indexOf(sentenceEnd + ' ')) + sentenceEnd;
      if (formatText.length < 100) {
        articleText = articleText.substring(articleText.indexOf(sentenceEnd + ' ') + 2);
        if (articleText.indexOf(sentenceEnd) > -1) {
          formatText += ' ' + articleText.substring(0, articleText.indexOf(sentenceEnd)) + sentenceEnd;
        }
      }
    }
    if ((formatText.indexOf('Coordinates: ') > -1) || (formatText.indexOf('Koordinaten: ') > -1) || (formatText.length < 6)) {
      return findGoodTopic(language, callback);
    }
    if (lastName) {
      formatText += ' (last name only)';
    }
    callback(null, articleName, formatText);
  });
};

function addWord(err, articleName, articleClue) {
  if (err) {
    return console.log(err);
  }
  console.log(articleName);
  request.post('https://alif-word-bank.herokuapp.com/word', {
    json: {
      word: articleName,
      clue: articleClue
    }
  }, (err, response, body) => {
    console.log(err || body);
  });
}

// get 10 words as starting point
for (var w = 0; w < 10; w++) {
  findGoodTopic('ar', addWord);
}
