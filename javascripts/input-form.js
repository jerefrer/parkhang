var layouts = [
  { id: "pecha-a3", name: "A3", imageName: "pecha-big.png" },
  { id: "pecha-a4", name: "A4", imageName: "pecha-small.png" },
  { id: "pecha-screen", name: "", imageName: "pecha-screen.png" },
  { id: "page-a4", name: "A4", imageName: "page-big.png" },
  { id: "page-a5", name: "A5", imageName: "page-small.png" },
  { id: "page-screen", name: "", imageName: "page-screen.png" },
  { id: "classic-a4", name: "Classic A4", imageName: "page-big.png" },
  { id: "classic-a5", name: "Classic A5", imageName: "page-small.png" },
  { id: "classic-screen", name: "Classic", imageName: "page-screen.png" },
  { id: "split-a4", name: "Split A4", imageName: "page-dual-big.png" },
  { id: "split-a5", name: "Split A5", imageName: "page-dual-small.png" },
];

var bodyHasClass = function (cssClass) {
  return ($("body").attr("class") || "").match(cssClass);
};
var isAPecha = function () {
  return !!bodyHasClass("pecha");
};
var isAPage = function () {
  return !!bodyHasClass("page");
};
var isPageA4 = function () {
  return !!bodyHasClass("page-a4");
};
var isPageA5 = function () {
  return !!bodyHasClass("page-a5");
};
var isPageScreen = function () {
  return !!bodyHasClass("page-screen");
};
var isAClassicPage = function () {
  return !!bodyHasClass("classic");
};
var isASplitPage = function () {
  return !!bodyHasClass("split");
};

var languages = [
  { id: "english", name: '<i class="gb flag"></i> English' },
  { id: "french", name: '<i class="france flag"></i> French' },
];

var layoutSelect = function () {
  return (
    '\
    <div class="ui field">\
      <div class="ui centered layouts cards">' +
    _(layouts)
      .map(function (layout) {
        return (
          '\
            <div class="ui layout link card ' +
          ((layout.disabled && "disabled") || "") +
          '" data-id="' +
          layout.id +
          '">\
              <div class="image">\
                <img src="images/layouts/' +
          layout.imageName +
          '"</div>\
                <div class="name">' +
          layout.name +
          "</div>\
              </div>\
            </div>\
          "
        );
      })
      .join("") +
    "\
      </div>\
    </div>\
  "
  );
};

var languageSelect = function () {
  return (
    '\
    <div class="ui inline languages fields">' +
    _(languages)
      .map(function (language) {
        return (
          '\
          <div class="field">\
            <div class="ui language radio checkbox">\
              <input type="radio" name="language" value="' +
          language.id +
          '">\
              <label>' +
          language.name +
          "</label>\
            </div>\
          </div>\
        "
        );
      })
      .join("") +
    "\
    </div>\
  "
  );
};

var mantraPhoneticCheckbox = function () {
  var selectedLayout = localStorage[appName + ".layout"] || "";
  // Hide for Split and Classic layouts
  if (
    selectedLayout.startsWith("split") ||
    selectedLayout.startsWith("classic")
  ) {
    return "";
  }

  return '\
    <div class="ui field" style="text-align: center; margin-top: 15px;">\
      <div class="ui mantra-phonetic checkbox">\
        <input type="checkbox" id="mantra-phonetic-checkbox" checked>\
        <label for="mantra-phonetic-checkbox" style="color: white;">Display mantra phonetics</label>\
      </div>\
    </div>\
  ';
};

var pageNumberTypeSelect = function () {
  var selectedLayout = localStorage[appName + ".layout"] || "";
  // Only show for Pecha layouts
  if (!selectedLayout.startsWith("pecha")) {
    return "";
  }

  return '\
    <div class="ui field" style="text-align: center; margin-top: 15px;">\
      <label style="color: white; display: block; margin-bottom: 8px; font-weight: bold;">Page Number Style</label>\
      <div class="ui inline page-number-type fields" style="justify-content: center;">\
        <div class="field">\
          <div class="ui page-number-type radio checkbox">\
            <input type="radio" name="page-number-type" value="tibetan">\
            <label style="color: white;">Tibetan</label>\
          </div>\
        </div>\
        <div class="field">\
          <div class="ui page-number-type radio checkbox">\
            <input type="radio" name="page-number-type" value="arabic" checked>\
            <label style="color: white;">Arabic</label>\
          </div>\
        </div>\
      </div>\
    </div>\
  ';
};

var texts =
  (localStorage[appName + ".texts"] &&
    JSON.parse(localStorage[appName + ".texts"])) ||
  {};
var textSelect = function () {
  return (
    '\
    <div class="ui field">\
      <div class="ui centered cards">' +
    _(texts)
      .map(function (name, id) {
        return (
          '\
            <div class="ui text link card" data-id="' +
          id +
          '">\
              <div class="content">\
                <div class="header">' +
          name +
          "</div>\
              </div>\
            </div>\
          "
        );
      })
      .join("") +
    "\
      </div>\
    </div>\
  "
  );
};

var extraTexts =
  (localStorage[appName + ".extra-texts"] &&
    JSON.parse(localStorage[appName + ".extra-texts"])) ||
  [];
var extraTextsSelect = function () {
  return (
    '\
    <div class="ui field">\
      <div class="ui centered cards">' +
    _(extraTexts)
      .map(function (extraText) {
        return (
          '\
            <div class="ui extra-text link card" data-id="' +
          extraText.id +
          '">\
              <div class="content">\
                <div class="header">Include ' +
          extraText.name +
          "</div>\
              </div>\
            </div>\
          "
        );
      })
      .join("") +
    "\
      </div>\
    </div>\
  "
  );
};

// Detect INSERT markers in the current text
var detectMarkersInText = function () {
  var markers = [];
  var markerRegex = /^\[INSERT (.+?) HERE\]$/;

  if (!pecha || !pecha.groups) {
    return markers;
  }

  var seenTypes = {};
  for (var i = 0; i < pecha.groups.length; i++) {
    var group = pecha.groups[i];
    // Check all language fields, but only add the first match per group
    var foundInGroup = false;
    ["tibetan", "english", "french"].forEach(function (lang) {
      if (!foundInGroup && group[lang]) {
        var text = group[lang].trim(); // Trim whitespace
        var match = text.match(markerRegex);
        if (match) {
          if (!seenTypes[match[1]]) {
            seenTypes[match[1]] = true;
            markers.push({
              type: match[1],
              displayName: match[1].charAt(0) + match[1].slice(1).toLowerCase(),
              index: i, // Store the index for ordering
            });
            foundInGroup = true;
          }
        }
      }
    });
  }

  // Sort markers by their index in the document
  markers.sort(function (a, b) {
    return a.index - b.index;
  });

  return markers;
};

var prayersSelect = function () {
  if (!availablePrayers || availablePrayers.length === 0) {
    return "";
  }

  var markers = detectMarkersInText();

  if (markers.length === 0) {
    return "";
  }

  return (
    '\
    <div class="ui field">\
      <h4 style="color: white; text-align: center; margin-bottom: 15px;">Prayer Insertions</h4>\
      <div class="marker-buttons" style="width: 400px; margin: 0 auto;">' +
    _(markers)
      .map(function (marker) {
        var prayerCount = (markerPrayers[marker.type] || []).length;
        return (
          '\
            <button class="ui fluid button marker-button" data-marker-type="' +
          marker.type +
          '" style="margin: 8px 0; background: #333; color: white;">\
              <i class="list icon"></i> ' +
          marker.displayName +
          " (" +
          prayerCount +
          " prayer" +
          (prayerCount !== 1 ? "s" : "") +
          ")\
            </button>\
          "
        );
      })
      .join("") +
    "\
      </div>\
    </div>\
  "
  );
};

var renderInputForm = function () {
  var form = $('<div id="input-form" class="ui form">');
  form.append(textSelect);
  if (texts.length)
    form.append(
      '<div class="ui horizontal inverted divider" style="width: 220px; margin-top: 25px">or</div>'
    );
  form.append(
    '\
    <div class="ui file field">\
      <div class="ui input" id="file-input">\
        <input type="file" />\
      </div>\
    </div>\
  '
  );
  form.append(
    '<div class="ui inverted divider" style="margin-bottom: 25px;"></div>'
  );
  form.append(extraTextsSelect);
  form.append(
    '<div class="ui inverted divider" style="margin-top: 25px;"></div>'
  );
  form.append('<div id="prayers-section"></div>');
  form.append(
    '<div id="prayers-divider" style="display: none;"><div class="ui inverted divider" style="margin-top: 25px;"></div></div>'
  );
  form.append(languageSelect);
  form.append('<div id="mantra-phonetic-section"></div>');
  form.append('<div class="ui inverted divider"></div>');
  form.append(layoutSelect);
  form.append('<div id="page-number-type-section"></div>');
  form.append(
    '<div class="ui inverted divider" style="margin: 15px auto 20px"></div>'
  );
  form.append(
    '<div class="file field"><button class="ui fluid green button" id="render-button">Render!</button></div>'
  );
  $("#main").html(form);
  $("#layout").dropdown({ showOnFocus: false });
  $(".extra-text.checkbox").checkbox();
  $(".language.checkbox").checkbox();
  var textId = localStorage[appName + ".textId"];
  var layout = localStorage[appName + ".layout"];
  var language = localStorage[appName + ".language"];
  var selectedExtraTexts = localStorage[appName + ".selected-extra-texts"];

  // Update mantra phonetic checkbox visibility based on layout
  var updateMantraPhoneticSection = function () {
    $("#mantra-phonetic-section").html(mantraPhoneticCheckbox());
    $(".mantra-phonetic.checkbox").checkbox();
    var displayMantraPhonetics =
      localStorage[appName + ".displayMantraPhonetics"];
    if (displayMantraPhonetics === "false") {
      $("#mantra-phonetic-checkbox").prop("checked", false);
    }
  };

  // Update page number type section visibility based on layout
  var updatePageNumberTypeSection = function () {
    $("#page-number-type-section").html(pageNumberTypeSelect());
    $(".page-number-type.checkbox").checkbox();
    var pageNumberType = localStorage[appName + ".pageNumberType"];
    if (pageNumberType === "arabic") {
      $("input[name=page-number-type][value=arabic]").prop("checked", true);
    }
  };

  if (textId) $(".text[data-id=" + textId + "]").click();
  if (layout) $(".layout[data-id=" + layout + "]").click();
  if (language) $("input[name=language][value=" + language + "]").click();

  // Initialize mantra phonetic section
  updateMantraPhoneticSection();
  // Initialize page number type section
  updatePageNumberTypeSection();
  if (selectedExtraTexts && selectedExtraTexts.length) {
    _(JSON.parse(selectedExtraTexts)).each(function (extraTextId) {
      $(".extra-text[data-id=" + extraTextId + "]").click();
    });
  }

  // Load prayers section if text is already selected
  if (textId) {
    try {
      pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
      updatePrayersSection();
    } catch (e) {
      console.error("Error loading pecha from localStorage:", e);
    }
  }
};

// Update the prayers section based on current text
var updatePrayersSection = function () {
  var prayersHtml = prayersSelect();
  $("#prayers-section").html(prayersHtml);
  if (prayersHtml) {
    $("#prayers-divider").show();
  } else {
    $("#prayers-divider").hide();
  }
};

$(document).on("click", ".layout:not(.disabled)", function (event) {
  $(".layout").removeClass("selected");
  $(event.currentTarget).addClass("selected");

  // Update mantra phonetic checkbox visibility when layout changes
  var layout = $(event.currentTarget).data("id");
  localStorage[appName + ".layout"] = layout;
  $("#mantra-phonetic-section").html(mantraPhoneticCheckbox());
  $(".mantra-phonetic.checkbox").checkbox();
  var displayMantraPhonetics =
    localStorage[appName + ".displayMantraPhonetics"];
  if (displayMantraPhonetics === "false") {
    $("#mantra-phonetic-checkbox").prop("checked", false);
  }

  // Update page number type section visibility when layout changes
  $("#page-number-type-section").html(pageNumberTypeSelect());
  $(".page-number-type.checkbox").checkbox();
  var pageNumberType = localStorage[appName + ".pageNumberType"];
  if (pageNumberType === "arabic") {
    $("input[name=page-number-type][value=arabic]").prop("checked", true);
  }
});

$(document).on("change", "input[type=radio]", function (event) {
  $(".language.radio").removeClass("selected");
  $(event.currentTarget).parents(".language.radio").addClass("selected");
});

$(document).on("change", "#file-input input", function (event) {
  $(".text").removeClass("selected");
  $(event.currentTarget).parents(".file.field").addClass("selected");

  // Import the file but don't generate yet - just load it and show markers
  importFile(false);
});

$(document).on("click", ".text", function (event) {
  $(".text").removeClass("selected");
  $("#file-input").parents(".file.field").removeClass("selected");
  $("#file-input input").val("");
  $(event.currentTarget).addClass("selected");

  // Load the text and update prayer markers
  var textId = $(event.currentTarget).data("id");
  if (textId) {
    pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
    updatePrayersSection();
  }
});

$(document).on("click", ".extra-text", function (event) {
  $(event.currentTarget).toggleClass("selected");
});

// Open modal for marker-specific prayer selection
$(document).on("click", ".marker-button", function (event) {
  event.preventDefault();
  var markerType = $(event.currentTarget).data("marker-type");
  openPrayerModal(markerType);
});

// Open prayer selection modal for a specific marker
var openPrayerModal = function (markerType) {
  var currentPrayers = markerPrayers[markerType] || [];
  var displayName = markerType.charAt(0) + markerType.slice(1).toLowerCase();

  var modalHtml =
    '\
    <div class="ui modal prayer-modal" id="prayer-modal-' +
    markerType +
    '">\
      <div class="header" style="background: #1b1c1d; color: white;">\
        Select Prayers for ' +
    displayName +
    '\
      </div>\
      <div class="content" style="background: #1b1c1d;">\
        <div class="ui prayers-list" id="modal-prayers-list-' +
    markerType +
    '">' +
    _(availablePrayers)
      .map(function (prayer) {
        var isSelected = currentPrayers.indexOf(prayer.id) !== -1;
        return (
          '\
            <div class="ui prayer-item" data-id="' +
          prayer.id +
          '" draggable="true">\
              <div class="prayer-checkbox">\
                <input type="checkbox" id="modal-prayer-' +
          markerType +
          "-" +
          prayer.id +
          '"' +
          (isSelected ? " checked" : "") +
          ' />\
                <label for="modal-prayer-' +
          markerType +
          "-" +
          prayer.id +
          '">' +
          prayer.name +
          '</label>\
              </div>\
              <div class="prayer-handle">☰</div>\
            </div>\
          '
        );
      })
      .join("") +
    '\
        </div>\
      </div>\
      <div class="actions" style="background: #1b1c1d;">\
        <button class="ui button" id="modal-cancel">Cancel</button>\
        <button class="ui primary button" id="modal-save" data-marker-type="' +
    markerType +
    '">Save</button>\
      </div>\
    </div>\
  ';

  // Remove any existing modal
  $(".prayer-modal").remove();

  // Add modal to page
  $("body").append(modalHtml);

  // Initialize Semantic UI modal
  $("#prayer-modal-" + markerType)
    .modal({
      closable: true,
      onHidden: function () {
        $(this).remove();
      },
    })
    .modal("show");

  // Initialize drag and drop for modal
  initializeModalPrayerDragAndDrop(markerType);
};

// Save prayers from modal
$(document).on("click", "#modal-save", function (event) {
  var markerType = $(event.currentTarget).data("marker-type");
  var modalId = "#prayer-modal-" + markerType;

  // Collect selected prayers in order
  var selectedPrayerIds = [];
  $(modalId + " .prayer-item").each(function () {
    var prayerId = $(this).data("id");
    var isChecked = $(this).find("input[type=checkbox]").is(":checked");
    if (isChecked) {
      selectedPrayerIds.push(prayerId);
    }
  });

  markerPrayers[markerType] = selectedPrayerIds;
  saveMarkerPrayers();

  // Update button text
  var prayerCount = selectedPrayerIds.length;
  var displayName = markerType.charAt(0) + markerType.slice(1).toLowerCase();
  $('.marker-button[data-marker-type="' + markerType + '"]').html(
    '<i class="list icon"></i> ' +
      displayName +
      " (" +
      prayerCount +
      " prayer" +
      (prayerCount !== 1 ? "s" : "") +
      ")"
  );

  $(modalId).modal("hide");
});

// Cancel modal
$(document).on("click", "#modal-cancel", function (event) {
  $(".prayer-modal").modal("hide");
});

// Prayer checkbox handling in modal
$(document).on(
  "change",
  ".prayer-modal .prayer-item input[type=checkbox]",
  function (event) {
    // No need to save here, will save when modal is closed with Save button
  }
);

// Drag and drop for prayer reordering in modal
var draggedPrayerElement = null;
var draggedPrayerId = null;

var initializeModalPrayerDragAndDrop = function (markerType) {
  var selector = "#prayer-modal-" + markerType + " .prayer-item";

  $(selector).on("dragstart", function (e) {
    draggedPrayerElement = this;
    draggedPrayerId = $(this).data("id");
    e.originalEvent.dataTransfer.effectAllowed = "move";
    $(this).addClass("dragging");
  });

  $(selector).on("dragend", function (e) {
    $(this).removeClass("dragging");
    draggedPrayerElement = null;
    draggedPrayerId = null;
  });

  $(selector).on("dragover", function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.originalEvent.dataTransfer.dropEffect = "move";
    return false;
  });

  $(selector).on("dragenter", function (e) {
    if (draggedPrayerElement !== this) {
      $(this).addClass("drag-over");
    }
  });

  $(selector).on("dragleave", function (e) {
    $(this).removeClass("drag-over");
  });

  $(selector).on("drop", function (e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    $(this).removeClass("drag-over");

    if (draggedPrayerElement !== this) {
      // Reorder the visual elements
      var $draggedElement = $(draggedPrayerElement);
      var $targetElement = $(this);

      // Insert dragged element before or after target based on position
      var draggedRect = draggedPrayerElement.getBoundingClientRect();
      var targetRect = this.getBoundingClientRect();

      if (draggedRect.top < targetRect.top) {
        // Dragging down - insert after target
        $targetElement.after($draggedElement);
      } else {
        // Dragging up - insert before target
        $targetElement.before($draggedElement);
      }
    }

    return false;
  });
};

var selectedLanguage;
var selectedExtraTexts;
var includeTransliteration = true;
var displayMantraPhonetics = true;
$(document).on("click", "#render-button", function () {
  var textId = (localStorage[appName + ".textId"] =
    $(".text.selected").data("id"));
  var layout = (localStorage[appName + ".layout"] =
    $(".layout.selected").data("id"));
  selectedLanguage = localStorage[appName + ".language"] = $(
    "input[name=language]:checked"
  ).val();
  selectedExtraTexts = _($(".extra-text.selected")).map(function (text) {
    return $(text).data("id");
  });
  localStorage[appName + ".selected-extra-texts"] =
    JSON.stringify(selectedExtraTexts);

  // Save mantra phonetic preference
  displayMantraPhonetics = $("#mantra-phonetic-checkbox").is(":checked");
  localStorage[appName + ".displayMantraPhonetics"] = displayMantraPhonetics;

  // Save page number type preference
  var pageNumberType =
    $("input[name=page-number-type]:checked").val() || "tibetan";
  localStorage[appName + ".pageNumberType"] = pageNumberType;

  $("body").addClass(layout);
  if (includeTransliteration) $("body").addClass("with-phonetics");
  if (displayMantraPhonetics) $("body").addClass("with-mantra-phonetics");
  if (pageNumberType === "arabic") $("body").addClass("arabic-numbers");
  $("#input-form").remove();
  $("#loading-overlay").show();

  if (textId) {
    pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
    beginGeneration();
  } else if (pecha && pecha.groups && pecha.groups.length > 0) {
    // File was already imported, just start generation
    beginGeneration();
  } else {
    // Import file and start generation
    importFile(true);
  }
});
