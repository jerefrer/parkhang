var beginGeneration = function() {
  if (delay) $('#loading-overlay').remove();
  if (selectedExtraTexts.length) {
    var addedGroups = [];
    _(selectedExtraTexts).each(function(textId, index) {
      var extraText = JSON.parse(localStorage[appName+'.extra-texts.'+textId]);
      var groups = extraText.groups;
      if (index > 0) {
        addedGroups = addedGroups.concat({tibetan: '༄༅།', smallWritings: true, mergeNext: true});
        groups[0].tibetan = '།' + groups[0].tibetan;
      }
      addedGroups = addedGroups.concat(groups);
    })
    pecha.groups = addedGroups.
      concat({
        tibetan: pecha.title.tibetan.full,
        english: pecha.title.english.title,
        french: pecha.title.french.title,
        smallWritings: true
      }).
      concat(pecha.groups);
  }
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
  } else if (isASplitPage()) {
    generateSplitPages();
  }
}

var endGeneration = function() {
  setTimeout(function() {
    $('#print-button').show();
    $('#color-mode-button').show();
    $('#loading-overlay').fadeOut(500);
  }, 500);
}