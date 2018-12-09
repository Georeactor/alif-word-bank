const request = require('request-promise');

// identify if in Farsi, Arabic, Simple English
// scrape all categories in the languages
let banSources = [
  'http://www.w3.org',
  'http://www.wikidata.org',
  'http://dbpedia.org/class/yago'
]

scrapeCategory = async function (category) {
  let body = await request("http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=PREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0D%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0APREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+foaf%3A+%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0D%0APREFIX+dc%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F11%2F%3E%0D%0APREFIX+%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F%3E%0D%0APREFIX+dbpedia2%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fproperty%2F%3E%0D%0APREFIX+dbpedia%3A+%3Chttp%3A%2F%2Fdbpedia.org%2F%3E%0D%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0D%0Aselect+distinct+%3Fs%0D%0Awhere+%7B+%3Fs+a+%3Chttp%3A%2F%2Fdbpedia.org%2Fontology%2F" + category + "%3E+%7D&output=json");
  let articles = JSON.parse(body).results.bindings;

  articles.slice(12).forEach(async function (article) {
    setTimeout(async function() {
      let articleName = article.s.value.split('/');
      articleName = articleName[articleName.length - 1];
      console.log(articleName);

      let bd2 = await request("http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=PREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0D%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0APREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+foaf%3A+%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0D%0APREFIX+dc%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%0D%0APREFIX+%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F%3E%0D%0APREFIX+dbpedia2%3A+%3Chttp%3A%2F%2Fdbpedia.org%2Fproperty%2F%3E%0D%0APREFIX+dbpedia%3A+%3Chttp%3A%2F%2Fdbpedia.org%2F%3E%0D%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0D%0ASELECT+%3Fproperty+%3FhasValue+%3FisValueOf%0D%0AWHERE+%7B%0D%0A++%7B+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F" + articleName + "%3E+%3Fproperty+%3FhasValue+%7D%0D%0A++UNION%0D%0A++%7B+%3FisValueOf+%3Fproperty+%3Chttp%3A%2F%2Fdbpedia.org%2Fresource%2F" + articleName + "%3E+%7D%0D%0A%7D&output=json");
      let relations = JSON.parse(bd2).results.bindings,
          saveCategories = [],
          langs = {},
          wikidata = null,
          entityID = null,
          inSimple = false;
      //console.log(relations);

      relations.forEach((relation) => {
        // translations
        if (relation.property.value === 'http://www.w3.org/2000/01/rdf-schema#label') {
          if (["en", "ar"].indexOf(relation.hasValue["xml:lang"]) > -1) {
            langs[relation.hasValue["xml:lang"]] = relation.hasValue.value;
          }
        }

        // wikidata
        if (relation.property.value === 'http://www.w3.org/2002/07/owl#sameAs' && relation.hasValue.value.indexOf('http://www.wikidata.org/entity/') === 0) {
          entityID = relation.hasValue.value.split('/');
          entityID = entityID[entityID.length - 1];
          wikidata = 'https://www.wikidata.org/wiki/Special:EntityData/' + entityID + '.json';
        }

        // categories
        if (relation.property.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
          let category = relation.hasValue.value.toLowerCase().split('/');
          category = category[category.length - 1];

          if (saveCategories.indexOf(category) > -1) {
            return;
          }

          let banned = false;
          banSources.forEach((source) => {
            if (relation.hasValue.value.indexOf(source) > -1) {
              banned = true;
            }
          });

          if (!banned) {
            saveCategories.push(category);
          }
        }
      });

      if (wikidata) {
        let bd3 = await request(wikidata);
        let wd = JSON.parse(bd3),
            names = wd.entities[entityID].labels,
            aliases = wd.entities[entityID].aliases,
            sitelinks = wd.entities[entityID].sitelinks;
        if (names.fa) {
          langs.fa = names.fa.value;
        }
        if (names.zh) {
          langs.zht = names.zh.value;
        }
        if (aliases.zh) {
          langs.zhs = aliases.zh[aliases.zh.length - 1].value;
        }
        if (sitelinks.simplewiki) {
          inSimple = true;
        }
      }

      console.log(langs);
      console.log(saveCategories);

      if (langs.ar) {
        await request.post('https://alif-word-bank.herokuapp.com/word', {
          json: {
            word: langs.ar,
            clue: '',
            language: 'ar',
            categories: saveCategories.map((cat) => { return 'en:' + cat }),
            inSimple: inSimple ? 'yes' : 'no',
            translations: langs
          }
        });
      }
      if (langs.fa) {
        await request.post('https://alif-word-bank.herokuapp.com/word', {
          json: {
            word: langs.fa,
            clue: '',
            language: 'fa',
            categories: saveCategories.map((cat) => { return 'en:' + cat }),
            inSimple: inSimple ? 'yes' : 'no',
            translations: langs
          }
        });
      }
    }, Math.round(Math.random() * articles.length * 1000));
  });
};

scrapeCategory("Animal");
