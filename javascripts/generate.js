var beginGeneration = function () {
  if (window.delay) $("#loading-overlay").remove();

  // First, handle prayer insertion at markers
  // Check if there are any markers or legacy selected prayers
  var hasMarkerPrayers =
    window.markerPrayers &&
    Object.keys(window.markerPrayers).some(function (key) {
      return window.markerPrayers[key] && window.markerPrayers[key].length > 0;
    });
  var hasLegacyPrayers =
    window.selectedPrayers && window.selectedPrayers.length > 0;

  if (hasMarkerPrayers || hasLegacyPrayers) {
    window.insertPrayersAtMarkers(function () {
      continueGeneration();
    });
  } else {
    continueGeneration();
  }
};

var continueGeneration = function () {
  // Add introduction prayers (extra texts) at the beginning
  // Get selectedExtraTexts from localStorage if not defined globally
  var selectedExtraTexts =
    window.selectedExtraTexts ||
    (localStorage[appName + ".selected-extra-texts"] &&
      JSON.parse(localStorage[appName + ".selected-extra-texts"])) ||
    [];
  if (selectedExtraTexts.length) {
    var addedGroups = [];
    _(selectedExtraTexts).each(function (textId, index) {
      var extraText = JSON.parse(
        localStorage[appName + ".extra-texts." + textId]
      );
      var prayerGroups = extraText.groups;

      // Convert prayer groups to pecha format (same as conclusion prayers)
      var convertedGroups = [];
      var i = 0;
      while (i < prayerGroups.length) {
        var prayerGroup = prayerGroups[i];
        var convertedGroup = {
          tibetan: prayerGroup.tibetan || "",
          english:
            (prayerGroup.translations && prayerGroup.translations.english) ||
            prayerGroup.english ||
            "",
          french:
            (prayerGroup.translations && prayerGroup.translations.french) ||
            prayerGroup.french ||
            "",
        };

        // Check if this is a prayer-title followed by a prayer-subtitle with no Tibetan
        if (
          prayerGroup.type === "prayer-title" &&
          i + 1 < prayerGroups.length &&
          prayerGroups[i + 1].type === "prayer-subtitle" &&
          (!prayerGroups[i + 1].tibetan ||
            prayerGroups[i + 1].tibetan.trim() === "")
        ) {
          var subtitle = prayerGroups[i + 1];
          convertedGroup.tibetan = prayerGroup.tibetan || "";
          var titleEnglish =
            (prayerGroup.translations && prayerGroup.translations.english) ||
            prayerGroup.english ||
            "";
          var subtitleEnglish =
            (subtitle.translations && subtitle.translations.english) ||
            subtitle.english ||
            "";
          convertedGroup.english =
            titleEnglish +
            (titleEnglish && subtitleEnglish ? " " : "") +
            subtitleEnglish;
          var titleFrench =
            (prayerGroup.translations && prayerGroup.translations.french) ||
            prayerGroup.french ||
            "";
          var subtitleFrench =
            (subtitle.translations && subtitle.translations.french) ||
            subtitle.french ||
            "";
          convertedGroup.french =
            titleFrench +
            (titleFrench && subtitleFrench ? " " : "") +
            subtitleFrench;
          i++;
        }

        // Preserve type
        if (prayerGroup.type) convertedGroup.type = prayerGroup.type;

        // Preserve tibetanAttachedToPrevious
        if (prayerGroup.tibetanAttachedToPrevious) {
          convertedGroup.tibetanAttachedToPrevious =
            prayerGroup.tibetanAttachedToPrevious;
        }

        // Set smallWritings for any type that is not verse or mantra
        if (
          prayerGroup.type &&
          prayerGroup.type !== "verse" &&
          prayerGroup.type !== "mantra"
        ) {
          convertedGroup.smallWritings = true;
        } else if (prayerGroup.smallWritings) {
          convertedGroup.smallWritings = prayerGroup.smallWritings;
        }

        convertedGroups.push(convertedGroup);
        i++;
      }
      addedGroups = addedGroups.concat(convertedGroups);
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

  // Add conclusion prayers at the end (per-text)
  var currentTextId = localStorage[appName + ".textId"];
  var conclusionState = currentTextId
    ? localStorage[appName + ".conclusion-prayers-state." + currentTextId]
    : null;
  if (conclusionState) {
    var prayerStates = JSON.parse(conclusionState);

    // Get enabled prayers sorted by order
    var enabledPrayers = [];
    for (var prayerId in prayerStates) {
      if (prayerStates[prayerId].enabled) {
        enabledPrayers.push({
          id: prayerId,
          order: prayerStates[prayerId].order,
        });
      }
    }
    enabledPrayers.sort(function (a, b) {
      return a.order - b.order;
    });

    // Append each enabled prayer's groups to the end
    _(enabledPrayers).each(function (prayerInfo, index) {
      var prayerData = getPrayerData(prayerInfo.id);
      if (prayerData && prayerData.groups) {
        // Convert prayer groups to pecha format (same as marker insertion)
        var prayerGroups = prayerData.groups;
        var convertedGroups = [];
        var i = 0;
        while (i < prayerGroups.length) {
          var prayerGroup = prayerGroups[i];
          var convertedGroup = {
            tibetan: prayerGroup.tibetan || "",
            english:
              (prayerGroup.translations && prayerGroup.translations.english) ||
              prayerGroup.english ||
              "",
            french:
              (prayerGroup.translations && prayerGroup.translations.french) ||
              prayerGroup.french ||
              "",
          };

          // Check if this is a prayer-title followed by a prayer-subtitle with no Tibetan
          if (
            prayerGroup.type === "prayer-title" &&
            i + 1 < prayerGroups.length &&
            prayerGroups[i + 1].type === "prayer-subtitle" &&
            (!prayerGroups[i + 1].tibetan ||
              prayerGroups[i + 1].tibetan.trim() === "")
          ) {
            var subtitle = prayerGroups[i + 1];
            convertedGroup.tibetan = prayerGroup.tibetan || "";
            var titleEnglish =
              (prayerGroup.translations && prayerGroup.translations.english) ||
              prayerGroup.english ||
              "";
            var subtitleEnglish =
              (subtitle.translations && subtitle.translations.english) ||
              subtitle.english ||
              "";
            convertedGroup.english =
              titleEnglish +
              (titleEnglish && subtitleEnglish ? " " : "") +
              subtitleEnglish;
            var titleFrench =
              (prayerGroup.translations && prayerGroup.translations.french) ||
              prayerGroup.french ||
              "";
            var subtitleFrench =
              (subtitle.translations && subtitle.translations.french) ||
              subtitle.french ||
              "";
            convertedGroup.french =
              titleFrench +
              (titleFrench && subtitleFrench ? " " : "") +
              subtitleFrench;
            i++;
          }

          // Preserve type
          if (prayerGroup.type) convertedGroup.type = prayerGroup.type;

          // Preserve tibetanAttachedToPrevious
          if (prayerGroup.tibetanAttachedToPrevious) {
            convertedGroup.tibetanAttachedToPrevious =
              prayerGroup.tibetanAttachedToPrevious;
          }

          // Set smallWritings for any type that is not verse or mantra
          if (
            prayerGroup.type &&
            prayerGroup.type !== "verse" &&
            prayerGroup.type !== "mantra"
          ) {
            convertedGroup.smallWritings = true;
          } else if (prayerGroup.smallWritings) {
            convertedGroup.smallWritings = prayerGroup.smallWritings;
          }

          convertedGroups.push(convertedGroup);
          i++;
        }

        // Add yigo prefix to first group
        if (convertedGroups.length > 0) {
          convertedGroups[0].tibetan = "།" + (convertedGroups[0].tibetan || "");
        }

        pecha.groups = pecha.groups.concat(convertedGroups);
      }
    });
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
    $("#inspect-td-button").show();
    $("#loading-overlay").fadeOut(500);

    // Auto-create project if not already one
    if (!ProjectManager.getCurrentProjectId()) {
      var projectName =
        pecha && pecha.title && pecha.title.english
          ? pecha.title.english.title
          : "Untitled Project";
      var projectId = ProjectManager.saveAsProject(projectName);
      var project = ProjectManager.getProject(projectId);
      ProjectManager.startTrackingChanges();
      ProjectManager.showProjectControls(project, 0);
    }
  }, 500);
};

// Export functions for ES module usage
export { beginGeneration, continueGeneration, endGeneration };
