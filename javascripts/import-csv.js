var languageIndexes = {
  'english': 1,
  'french': 2
}

var translationIndexFor = function(language) {
  return languageIndexes[language];
}

var fillForAllTranslations = function(key, cells) {
  _(languageIndexes).each(function(index, language) {
    if (!pecha.title[language]) pecha.title[language] = {};
    pecha.title[language][key] = cells[index];
  });
}

var parameterize = function(text) {
  return text.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
}

var pecha = {
  title: {
    tibetan: {
      full: '',
      short: ''
    }
  },
  groups: []
}

var importCSV = function() {
  var file = $('#file-input input')[0].files[0];
  var reader = new FileReader();
  var lines = [];
  var line_buffer = { words: [] };
  var lineIndex = 0;
  var titlePage = false;
  reader.onload = function() {
    Papa.parse(
      reader.result,
      {
        config: {
          delimiter: "|",
          newline: "\r\n"
        },
        error: function(err, file, inputElem, reason)
        {
          console.log('ERR');
          console.log(err);
        },
        step:  function(line, parser) {
          if (line.data.length == 1 && line.data[0] == '') return; // Skip empty lines
          var cells = line.data[0];
          if (lineIndex == 0) {
            pecha.id = parameterize(cells[1]);
            pecha.shortName = cells[1];
          }
          if (lineIndex == 1 && cells[0] == 'Tibetan title') titlePage = true;
          if (titlePage) {
            switch(lineIndex) {
              case 1: pecha.title.tibetan.full = cells[1]; break;
              case 2: pecha.title.tibetan.short = cells[1]; break;
              case 3: fillForAllTranslations('title', cells); break;
              case 4: fillForAllTranslations('subtitle', cells); break;
            }
          }
          if (lineIndex != 0 && (!titlePage || lineIndex > 6)) {
            var hash = {
              tibetan: cells[0],
              smallWritings: cells[3].match(/smallWritings/),
              mergeNext: cells[3].match(/mergeNext/)
            };
            _(languageIndexes).each(function(index, language) {
              hash[language] = cells[index];
            });
            pecha.groups.push(hash);
          }
          lineIndex++;
        },
        complete: function(response) {
          var texts = localStorage['pechanator.texts'] && JSON.parse(localStorage['pechanator.texts']) || {};
          texts[pecha.id] = pecha.shortName;
          localStorage['pechanator.texts'] = JSON.stringify(texts);
          localStorage['pechanator.texts.'+pecha.id] = JSON.stringify(pecha);
          localStorage['pechanator.textId'] = pecha.id;
          beginGeneration();
        }
      }
    )
  };
  setTimeout(function() {
    reader.readAsText(file);
  }, 100);
}

var beginGeneration = function() {
  if (delay) $('#loading-overlay').remove();
  if (isAPecha()) {
    if (pecha.title.tibetan.full) addPechaTitlePage();
    setTimeout(function() {
      addNextPechaPage();
      addNextGroup();
    }, 100);
  } else if (isAPage()) {
    if (pecha.title.tibetan.full) {
      if (isPageScreen()) addPechaTitlePage()
      else                addPageTitlePage();
    }
    setTimeout(function() {
      addNextPechaPage();
      addNextGroup();
    }, 100);
  } else if (isAClassicPage()) {
    generateClassicPages();
  }
}