// Prayer management functionality
var availablePrayers = [];
var selectedPrayers = []; // Deprecated: kept for backward compatibility
var markerPrayers = {}; // Maps marker type (e.g., 'TSOK', 'TSEGUK') to array of prayer IDs

// Prayer data registry - maps prayer IDs to their global variable names
var prayerDataRegistry = {
  "tsikdun-kasung": "prayerData_tsikdunKasung",
  "lama-yidam": "prayerData_lamaYidam",
  "jetsun-lama": "prayerData_jetsunLama",
  "dom-zung": "prayerData_domZung",
  lamps: "prayerData_lamps",
  "lamps-short": "prayerData_lampsShort",
  "tsikdun-tsok": "prayerData_tsikdunTsok",
  "tsikdun-tseguk": "prayerData_tsikdunTseguk",
  "yeshe-tsogyal": "prayerData_prayerOfYesheTsogyal",
  // Add more prayers here as they are added to the prayers folder
};

// Load prayers from the prayers folder
var loadPrayers = function () {
  // Build availablePrayers in the order defined by prayerDataRegistry
  var prayerNames = {
    "tsikdun-kasung": "Tsikdün Kasung - Unimpeded Activity",
    "lama-yidam": 'Chokling Tor-ngo – "Lama Yidam"',
    "jetsun-lama": 'Gyün Shak – The Daily Confession – "Jetsun Lama"',
    "dom-zung": "Dom Zung – A short prayer for keeping the vows",
    lamps: "Marmé mönlam – Lamp offering",
    "lamps-short": "Marmé mönlam – Lamp offering (short)",
    "tsikdun-tsok": "Tsikdün Tsok Offering",
    "tsikdun-tseguk": "Tsikdün Tseguk Offering",
    "yeshe-tsogyal": "Prayer of Yeshe Tsogyal",
  };

  availablePrayers = [];
  for (var prayerId in prayerDataRegistry) {
    if (prayerNames[prayerId]) {
      availablePrayers.push({
        id: prayerId,
        name: prayerNames[prayerId],
      });
    }
  }

  // Load selected prayers from localStorage
  var stored = localStorage[appName + ".selected-prayers"];
  if (stored) {
    selectedPrayers = JSON.parse(stored);
  }

  // Load marker-specific prayers from localStorage (per-text)
  loadMarkerPrayersForCurrentText();
};

// Load marker prayers for the current text
var loadMarkerPrayersForCurrentText = function () {
  var textId = localStorage[appName + ".textId"];
  var newPrayers = {};

  if (textId) {
    var storedMarkerPrayers =
      localStorage[appName + ".marker-prayers." + textId];
    if (storedMarkerPrayers) {
      newPrayers = JSON.parse(storedMarkerPrayers);
    }
  }

  // Fallback to legacy global storage for migration
  if (Object.keys(newPrayers).length === 0) {
    var legacyMarkerPrayers = localStorage[appName + ".marker-prayers"];
    if (legacyMarkerPrayers) {
      newPrayers = JSON.parse(legacyMarkerPrayers);
    }
  }

  // Clear and update markerPrayers object (mutate, don't reassign)
  // This preserves the reference that window.markerPrayers points to
  for (var key in markerPrayers) {
    delete markerPrayers[key];
  }
  for (var key in newPrayers) {
    markerPrayers[key] = newPrayers[key];
  }
};

// Save selected prayers to localStorage
var saveSelectedPrayers = function () {
  localStorage[appName + ".selected-prayers"] = JSON.stringify(selectedPrayers);
};

// Save marker-specific prayers to localStorage (per-text)
var saveMarkerPrayers = function () {
  var textId = localStorage[appName + ".textId"];
  if (textId) {
    localStorage[appName + ".marker-prayers." + textId] =
      JSON.stringify(markerPrayers);
  }
};

// Get prayer data from global variable
var getPrayerData = function (prayerId) {
  // First try the global getPrayerData function (set by main.js from loader)
  if (window.getPrayerData && window.getPrayerData !== getPrayerData) {
    var data = window.getPrayerData(prayerId);
    if (data) return data;
  }
  // Fallback to global registry
  var registry = window.prayerDataRegistry || prayerDataRegistry;
  var varName = registry[prayerId];
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

// Get prayers for a specific marker type
var getPrayersDataForMarker = function (markerType, callback) {
  var prayersData = [];
  var prayerIds = markerPrayers[markerType] || [];

  if (prayerIds.length === 0) {
    callback([]);
    return;
  }

  prayerIds.forEach(function (prayerId) {
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

// Find all INSERT markers in the pecha
var findAllMarkers = function () {
  var markers = [];
  var markerRegex = /^\[INSERT (.+?) HERE\]$/;

  if (!window.pecha || !window.pecha.groups) {
    return markers;
  }

  for (var i = 0; i < window.pecha.groups.length; i++) {
    var group = window.pecha.groups[i];

    // Check all language fields to find markers
    var languages = ["tibetan", "english", "french"];
    for (var j = 0; j < languages.length; j++) {
      var lang = languages[j];
      var text = group[lang];
      if (text) {
        var trimmedText = text.trim();
        var match = trimmedText.match(markerRegex);

        if (match) {
          markers.push({
            index: i,
            type: match[1], // e.g., 'TSOK', 'TSEGUK'
            text: trimmedText,
          });
          break; // Found marker in this group, no need to check other languages
        }
      }
    }
  }

  return markers;
};

// Insert prayers at all markers
var insertPrayersAtMarkers = function (callback) {
  var markers = findAllMarkers();

  if (markers.length === 0) {
    callback();
    return;
  }

  // Process markers in reverse order to maintain correct indices
  var processNextMarker = function (markerIndex) {
    if (markerIndex < 0) {
      callback();
      return;
    }

    var marker = markers[markerIndex];
    insertPrayersAtSingleMarker(marker, function () {
      processNextMarker(markerIndex - 1);
    });
  };

  processNextMarker(markers.length - 1);
};

// Get insertion point state from localStorage
var getInsertionPointStateForPrayer = function (
  markerType,
  prayerId,
  category
) {
  var textId = localStorage[appName + ".textId"];
  if (!textId) return null;
  var stateKey = appName + ".insertion-point-state." + textId;
  var allState = localStorage[stateKey];
  if (!allState) return null;
  var parsed = JSON.parse(allState);
  var path = markerType + "." + prayerId + "." + category;
  return parsed[path] || null;
};

// Get nested prayers for an insertion point
var getNestedPrayersForInsertionPoint = function (
  markerType,
  prayerId,
  insertionPoint
) {
  var state = getInsertionPointStateForPrayer(
    markerType,
    prayerId,
    insertionPoint.category
  );
  if (!state || !state.selectedIds || state.selectedIds.length === 0) return [];

  var nestedPrayers = [];
  state.selectedIds.forEach(function (nestedPrayerId) {
    var nestedPrayerData = getPrayerData(nestedPrayerId);
    if (nestedPrayerData) {
      nestedPrayers.push({
        id: nestedPrayerId,
        data: nestedPrayerData,
      });
    }
  });
  return nestedPrayers;
};

// Convert a single prayer group to pecha format
var convertPrayerGroupToPechaFormat = function (prayerGroup) {
  var convertedGroup = {
    tibetan: prayerGroup.tibetan || "",
    english:
      (prayerGroup.translations && prayerGroup.translations.english) || "",
    french: (prayerGroup.translations && prayerGroup.translations.french) || "",
  };

  // Preserve type and other properties
  if (prayerGroup.type) convertedGroup.type = prayerGroup.type;

  // Preserve tibetanAttachedToPrevious attribute
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

  return convertedGroup;
};

// Convert prayer groups to pecha format, handling insertion points
var convertPrayerGroupsWithInsertionPoints = function (
  prayerGroups,
  markerType,
  prayerId
) {
  var result = [];
  var i = 0;

  while (i < prayerGroups.length) {
    var prayerGroup = prayerGroups[i];

    // Handle insertion-point type
    if (prayerGroup.type === "insertion-point") {
      var nestedPrayers = getNestedPrayersForInsertionPoint(
        markerType,
        prayerId,
        prayerGroup
      );

      if (nestedPrayers.length > 0) {
        // Add space before nested prayers if there are previous groups
        if (result.length > 0) {
          result[result.length - 1].spaceAfter = true;
        }

        nestedPrayers.forEach(function (nestedPrayer, nestedIndex) {
          if (nestedPrayer && nestedPrayer.data && nestedPrayer.data.groups) {
            // Add space between nested prayers
            if (nestedIndex > 0 && result.length > 0) {
              result[result.length - 1].spaceAfter = true;
            }

            // Convert nested prayer groups (no further nesting supported)
            nestedPrayer.data.groups.forEach(function (nestedGroup) {
              if (nestedGroup.type !== "insertion-point") {
                result.push(convertPrayerGroupToPechaFormat(nestedGroup));
              }
            });
          }
        });

        // Add space after nested prayers
        if (result.length > 0) {
          result[result.length - 1].spaceAfter = true;
        }
      }

      i++;
      continue;
    }

    // Handle prayer-title + prayer-subtitle merge
    if (
      prayerGroup.type === "prayer-title" &&
      i + 1 < prayerGroups.length &&
      prayerGroups[i + 1].type === "prayer-subtitle" &&
      (!prayerGroups[i + 1].tibetan ||
        prayerGroups[i + 1].tibetan.trim() === "")
    ) {
      var subtitle = prayerGroups[i + 1];
      var convertedGroup = {
        tibetan: prayerGroup.tibetan || "",
        type: prayerGroup.type,
        smallWritings: true,
      };

      var titleEnglish =
        (prayerGroup.translations && prayerGroup.translations.english) || "";
      var subtitleEnglish =
        (subtitle.translations && subtitle.translations.english) || "";
      convertedGroup.english =
        titleEnglish +
        (titleEnglish && subtitleEnglish ? " " : "") +
        subtitleEnglish;

      var titleFrench =
        (prayerGroup.translations && prayerGroup.translations.french) || "";
      var subtitleFrench =
        (subtitle.translations && subtitle.translations.french) || "";
      convertedGroup.french =
        titleFrench +
        (titleFrench && subtitleFrench ? " " : "") +
        subtitleFrench;

      result.push(convertedGroup);
      i += 2;
      continue;
    }

    // Normal group conversion
    result.push(convertPrayerGroupToPechaFormat(prayerGroup));
    i++;
  }

  return result;
};

// Insert prayers at a single marker
var insertPrayersAtSingleMarker = function (marker, callback) {
  getPrayersDataForMarker(marker.type, function (prayersData) {
    // If no prayers are selected, remove the marker
    if (!prayersData || prayersData.length === 0) {
      var beforeMarker = window.pecha.groups.slice(0, marker.index);
      var afterMarker = window.pecha.groups.slice(marker.index + 1);
      window.pecha.groups = beforeMarker.concat(afterMarker);
      callback();
      return;
    }

    // Collect all prayer groups
    var allPrayerGroups = [];

    prayersData.forEach(function (prayerData, prayerIndex) {
      if (prayerData && prayerData.data && prayerData.data.groups) {
        // Add space between prayers (except before the first one)
        if (prayerIndex > 0 && allPrayerGroups.length > 0) {
          allPrayerGroups[allPrayerGroups.length - 1].spaceAfter = true;
        }

        // Convert prayer groups with insertion point handling
        var convertedGroups = convertPrayerGroupsWithInsertionPoints(
          prayerData.data.groups,
          marker.type,
          prayerData.id
        );

        allPrayerGroups = allPrayerGroups.concat(convertedGroups);
      }
    });

    // Replace the marker with the prayer groups
    var beforeMarker = window.pecha.groups.slice(0, marker.index);
    var afterMarker = window.pecha.groups.slice(marker.index + 1);
    window.pecha.groups = beforeMarker
      .concat(allPrayerGroups)
      .concat(afterMarker);

    callback();
  });
};

// Legacy function for backward compatibility
var insertPrayersAtMarker = function (callback) {
  insertPrayersAtMarkers(callback);
};

// Initialize prayers on page load
$(function () {
  loadPrayers();
});

// Make loadMarkerPrayersForCurrentText available globally
window.loadMarkerPrayersForCurrentText = loadMarkerPrayersForCurrentText;

// Export functions for ES module usage
export {
  availablePrayers,
  getPrayerData,
  insertPrayersAtMarkers,
  loadMarkerPrayersForCurrentText,
  loadPrayers,
  markerPrayers,
  prayerDataRegistry,
  selectedPrayers,
};
