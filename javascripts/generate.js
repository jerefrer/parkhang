var beginGeneration = function () {
  if (delay) $("#loading-overlay").remove();

  // First, handle prayer insertion at markers
  // Check if there are any markers or legacy selected prayers
  var hasMarkerPrayers =
    markerPrayers &&
    Object.keys(markerPrayers).some(function (key) {
      return markerPrayers[key] && markerPrayers[key].length > 0;
    });
  var hasLegacyPrayers = selectedPrayers && selectedPrayers.length > 0;

  if (hasMarkerPrayers || hasLegacyPrayers) {
    insertPrayersAtMarkers(function () {
      continueGeneration();
    });
  } else {
    continueGeneration();
  }
};

var continueGeneration = function () {
  if (selectedExtraTexts.length) {
    var addedGroups = [];
    _(selectedExtraTexts).each(function (textId, index) {
      var extraText = JSON.parse(
        localStorage[appName + ".extra-texts." + textId]
      );
      var groups = extraText.groups;
      if (index > 0 || isASplitPage() || isAClassicPage()) {
        addedGroups = addedGroups.concat({
          tibetan: "༄༅།",
          smallWritings: true,
          mergeNext: true,
        });
        groups[0].tibetan = "།" + groups[0].tibetan;
      }
      addedGroups = addedGroups.concat(groups);
    });
    pecha.groups = addedGroups
      .concat({
        tibetan: pecha.title.tibetan.full,
        english: pecha.title.english.title,
        french: pecha.title.french.title,
        smallWritings: true,
        practiceTitle: true,
      })
      .concat(pecha.groups);
  }
  startRendering();
};

var startRendering = function () {
  if (isAPecha()) {
    if (pecha.title.tibetan.full) addPechaTitlePage();
    setTimeout(function () {
      addNextPechaPage();
      addNextGroup();
    }, 100);
  } else if (isAPage()) {
    if (pecha.title.tibetan.full) {
      if (isPageScreen()) addPechaTitlePage();
      else addPageTitlePage();
    }
    setTimeout(function () {
      addNextPechaPage();
      addNextGroup();
    }, 100);
  } else if (isAClassicPage()) {
    generateClassicPages();
  } else if (isASplitPage()) {
    generateSplitPages();
  }
};

var endGeneration = function () {
  setTimeout(function () {
    $("#print-button").show();
    $("#color-mode-button").show();
    $("#loading-overlay").fadeOut(500);
  }, 500);
};
