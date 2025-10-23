// Prayer management functionality
var availablePrayers = [];
var selectedPrayers = [];

// Prayer data registry - maps prayer IDs to their global variable names
var prayerDataRegistry = {
  "tsikdun-kasung": "prayerData_tsikdunKasung",
  "tsikdun-tsok": "prayerData_tsikdunTsok",
  // Add more prayers here as they are added to the prayers folder
};

// Load prayers from the prayers folder
var loadPrayers = function () {
  availablePrayers = [
    {
      id: "tsikdun-kasung",
      name: "Tsikdün Kasung - Unimpeded Activity",
    },
    {
      id: "tsikdun-tsok",
      name: "Tsikdün Tsok Offering",
    },
    // Add more prayers here as they are added to the prayers folder
  ];

  // Load selected prayers from localStorage
  var stored = localStorage[appName + ".selected-prayers"];
  if (stored) {
    selectedPrayers = JSON.parse(stored);
  }
};

// Save selected prayers to localStorage
var saveSelectedPrayers = function () {
  localStorage[appName + ".selected-prayers"] = JSON.stringify(selectedPrayers);
};

// Get prayer data from global variable
var getPrayerData = function (prayerId) {
  var varName = prayerDataRegistry[prayerId];
  if (varName && window[varName]) {
    return window[varName];
  }
  return null;
};

// Get all selected prayers in order
var getSelectedPrayersData = function (callback) {
  var prayersData = [];

  if (selectedPrayers.length === 0) {
    callback([]);
    return;
  }

  selectedPrayers.forEach(function (prayerId) {
    var data = getPrayerData(prayerId);
    if (data) {
      prayersData.push({
        id: prayerId,
        data: data,
      });
    }
  });

  callback(prayersData);
};

// Insert prayers at the [INSERT TSOK HERE] marker
var insertPrayersAtMarker = function (callback) {
  getSelectedPrayersData(function (prayersData) {
    if (!prayersData || prayersData.length === 0) {
      callback();
      return;
    }

    // Find the marker in the pecha groups
    var markerIndex = -1;
    for (var i = 0; i < pecha.groups.length; i++) {
      var group = pecha.groups[i];
      if (group[selectedLanguage] === "[INSERT TSOK HERE]") {
        markerIndex = i;
        break;
      }
    }

    if (markerIndex === -1) {
      // No marker found, just continue
      callback();
      return;
    }

    // Collect all prayer groups
    var allPrayerGroups = [];
    prayersData.forEach(function (prayerData, prayerIndex) {
      if (prayerData && prayerData.data && prayerData.data.groups) {
        var prayerGroups = prayerData.data.groups;

        // Add separator between prayers (except for the first one)
        if (prayerIndex > 0) {
          allPrayerGroups.push({
            tibetan: "༄༅།",
            english: "",
            french: "",
            smallWritings: true,
          });
        }

        // Convert prayer groups to pecha format
        var i = 0;
        while (i < prayerGroups.length) {
          var prayerGroup = prayerGroups[i];
          var convertedGroup = {
            tibetan: prayerGroup.tibetan || "",
            english:
              (prayerGroup.translations && prayerGroup.translations.english) ||
              "",
            french:
              (prayerGroup.translations && prayerGroup.translations.french) ||
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
            // Merge: use title's Tibetan and concatenate translations
            var subtitle = prayerGroups[i + 1];
            convertedGroup.tibetan = prayerGroup.tibetan || "";

            var titleEnglish =
              (prayerGroup.translations && prayerGroup.translations.english) ||
              "";
            var subtitleEnglish =
              (subtitle.translations && subtitle.translations.english) || "";
            convertedGroup.english =
              titleEnglish +
              (titleEnglish && subtitleEnglish ? " " : "") +
              subtitleEnglish;

            var titleFrench =
              (prayerGroup.translations && prayerGroup.translations.french) ||
              "";
            var subtitleFrench =
              (subtitle.translations && subtitle.translations.french) || "";
            convertedGroup.french =
              titleFrench +
              (titleFrench && subtitleFrench ? " " : "") +
              subtitleFrench;

            // Skip the subtitle in the next iteration
            i++;
          }

          // Preserve type and other properties
          if (prayerGroup.type) convertedGroup.type = prayerGroup.type;

          // Preserve tibetanAttachedToPrevious attribute
          if (prayerGroup.tibetanAttachedToPrevious) {
            convertedGroup.tibetanAttachedToPrevious = prayerGroup.tibetanAttachedToPrevious;
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

          allPrayerGroups.push(convertedGroup);
          i++;
        }
      }
    });

    // Replace the marker with the prayer groups
    var beforeMarker = pecha.groups.slice(0, markerIndex);
    var afterMarker = pecha.groups.slice(markerIndex + 1);
    pecha.groups = beforeMarker.concat(allPrayerGroups).concat(afterMarker);

    callback();
  });
};

// Initialize prayers on page load
$(function () {
  loadPrayers();
});
