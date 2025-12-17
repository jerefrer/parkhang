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

var getDefaultLanguage = function () {
  return localStorage[appName + ".language"] || languages[0].id;
};

// Generate layout cards HTML (without wrapper)
var layoutSelectCards = function () {
  return (
    '<div class="ui centered layouts cards">' +
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
          '">\
              <div class="name">' +
          layout.name +
          "</div>\
            </div>\
          </div>"
        );
      })
      .join("") +
    "</div>"
  );
};

// Legacy function for compatibility
var layoutSelect = function () {
  return '<div class="ui field">' + layoutSelectCards() + "</div>";
};

// Inline language select for new layout
var languageSelectInline = function () {
  var defaultLanguageId = getDefaultLanguage();
  return (
    '<div class="ui inline languages fields">' +
    _(languages)
      .map(function (language) {
        return (
          '\
          <div class="field">\
            <div class="ui language radio checkbox">\
              <input type="radio" name="language" value="' +
          language.id +
          '"' +
          (language.id === defaultLanguageId ? " checked" : "") +
          ">\
              <label>" +
          language.name +
          "</label>\
            </div>\
          </div>"
        );
      })
      .join("") +
    "</div>"
  );
};

// Legacy function for compatibility
var languageSelect = function () {
  return languageSelectInline();
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

// Generate text cards HTML (without wrapper)
var textSelectCards = function () {
  // Always read fresh from localStorage
  var currentTexts =
    (localStorage[appName + ".texts"] &&
      JSON.parse(localStorage[appName + ".texts"])) ||
    {};
  return (
    _(currentTexts)
      .map(function (name, id) {
        return (
          '\
        <div class="ui text link card" data-id="' +
          id +
          '">\
          <div class="content">\
            <div class="header">' +
          escapeHtml(name) +
          '</div>\
          </div>\
          <div class="extra content">\
            <button class="ui mini icon button download-text-btn" data-id="' +
          id +
          '" title="Download as JSON"><i class="download icon"></i></button>\
            <button class="ui mini icon button delete-text-btn" data-id="' +
          id +
          '" title="Delete"><i class="trash icon"></i></button>\
          </div>\
        </div>'
        );
      })
      .join("") +
    '<div class="ui file-upload link card" id="file-upload-card">\
      <div class="content" style="text-align: center; padding: 16px;">\
        <div class="header" style="font-size: 2em; color: rgba(255,255,255,0.3); margin: 0;"><i class="plus icon"></i></div>\
      </div>\
    </div>'
  );
};

// Legacy function for compatibility
var textSelect = function () {
  return (
    '<div class="ui field"><div class="ui centered cards">' +
    textSelectCards() +
    "</div></div>"
  );
};

var extraTexts =
  (localStorage[appName + ".extra-texts"] &&
    JSON.parse(localStorage[appName + ".extra-texts"])) ||
  [];

// Conclusion prayers state - uses same prayers as extraTexts
var conclusionPrayers =
  (localStorage[appName + ".conclusion-prayers"] &&
    JSON.parse(localStorage[appName + ".conclusion-prayers"])) ||
  [];

// Generate extra text cards HTML for introduction prayers (without wrapper)
var extraTextsSelectCards = function (type) {
  if (!extraTexts || extraTexts.length === 0) return "";
  var prefix = type || "intro";
  return (
    '<div class="texts-grid">' +
    _(extraTexts)
      .map(function (extraText) {
        return (
          '\
          <div class="ui extra-text link card" data-id="' +
          extraText.id +
          '" data-type="' +
          prefix +
          '">\
            <div class="content">\
              <div class="header">' +
          escapeHtml(extraText.name) +
          "</div>\
            </div>\
          </div>"
        );
      })
      .join("") +
    "</div>"
  );
};

// Generate conclusion prayers cards HTML with enable/disable and reorder
// Uses availablePrayers (same as marker insertions), not extraTexts
var conclusionPrayersSelectCards = function () {
  if (!availablePrayers || availablePrayers.length === 0) return "";

  // Get saved order and enabled state, or use defaults
  var savedState = localStorage[appName + ".conclusion-prayers-state"];
  var prayerStates = savedState ? JSON.parse(savedState) : {};

  // Build list with order preserved
  var orderedPrayers = availablePrayers.map(function (prayer) {
    var state = prayerStates[prayer.id] || { enabled: false, order: 999 };
    return {
      id: prayer.id,
      name: prayer.name,
      enabled: state.enabled,
      order: state.order,
    };
  });

  // Sort by order
  orderedPrayers.sort(function (a, b) {
    return a.order - b.order;
  });

  return (
    '<div class="conclusion-prayers-list" id="conclusion-prayers-list">' +
    _(orderedPrayers)
      .map(function (prayer, index) {
        var enabledClass = prayer.enabled ? "selected" : "";
        return (
          '<div class="conclusion-prayer-item ' +
          enabledClass +
          '" data-id="' +
          prayer.id +
          '" data-order="' +
          index +
          '" draggable="true">\
            <div class="drag-handle"><i class="grip lines icon"></i></div>\
            <div class="prayer-name">' +
          escapeHtml(prayer.name) +
          '</div>\
            <div class="prayer-toggle">\
              <div class="ui toggle checkbox conclusion-prayer-checkbox">\
                <input type="checkbox" ' +
          (prayer.enabled ? "checked" : "") +
          ' data-id="' +
          prayer.id +
          '">\
                <label></label>\
              </div>\
            </div>\
          </div>'
        );
      })
      .join("") +
    "</div>"
  );
};

// Legacy function for compatibility
var extraTextsSelect = function () {
  return (
    '<div class="ui field"><div class="ui centered cards">' +
    _(extraTexts)
      .map(function (extraText) {
        return (
          '<div class="ui extra-text link card" data-id="' +
          extraText.id +
          '"><div class="content"><div class="header">Include ' +
          extraText.name +
          "</div></div></div>"
        );
      })
      .join("") +
    "</div></div>"
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

// Generate prayer buttons content (without wrapper)
var prayersSelectContent = function () {
  if (!availablePrayers || availablePrayers.length === 0) {
    return "";
  }

  var markers = detectMarkersInText();

  if (markers.length === 0) {
    return "";
  }

  return (
    '<div class="marker-buttons">' +
    _(markers)
      .map(function (marker) {
        var prayerCount = (markerPrayers[marker.type] || []).length;
        return (
          '\
          <button class="ui fluid button marker-button" data-marker-type="' +
          marker.type +
          '" style="margin: 8px 0; background: #1a1a1a; color: white; border: 1px solid rgba(255,255,255,0.1);">\
            <i class="list icon"></i> ' +
          marker.displayName +
          " (" +
          prayerCount +
          " prayer" +
          (prayerCount !== 1 ? "s" : "") +
          ")\
          </button>"
        );
      })
      .join("") +
    "</div>"
  );
};

// Legacy function for compatibility
var prayersSelect = function () {
  var content = prayersSelectContent();
  if (!content) return "";
  return (
    '<div class="ui field"><h4 style="color: white; text-align: center; margin-bottom: 15px;">Prayer Insertions</h4>' +
    content +
    "</div>"
  );
};

var savedProjectsSection = function () {
  var projects = ProjectManager.getProjectsList();
  if (!projects || projects.length === 0) return "";

  var projectCards = projects
    .map(function (project) {
      var date = new Date(project.updatedAt);
      var dateStr = date.toLocaleDateString();
      var layoutName = project.layout
        ? project.layout.replace("-", " ").replace(/\b\w/g, function (l) {
            return l.toUpperCase();
          })
        : "";

      return (
        '\
      <div class="project-card" data-id="' +
        project.id +
        '">\
        <button class="delete-project-btn ui mini red icon button"><i class="trash icon"></i></button>\
        <div class="project-card-name">' +
        escapeHtml(project.name) +
        '</div>\
        <div class="project-card-meta">\
          <span class="project-card-layout">' +
        layoutName +
        '</span>\
          <span class="project-card-date">Updated: ' +
        dateStr +
        "</span>\
        </div>\
      </div>\
    "
      );
    })
    .join("");

  return (
    '\
    <div id="saved-projects-section">\
      <h3>Saved Projects</h3>\
      <div class="projects-grid">' +
    projectCards +
    '</div>\
      <div class="ui horizontal inverted divider" style="width: 220px; margin-top: 25px">or create new</div>\
    </div>\
  '
  );
};

var escapeHtml = function (text) {
  if (!text) return "";
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

var renderInputForm = function () {
  var form = $('<div id="input-form" class="ui form">');

  // Hidden file input
  form.append(
    '<input type="file" id="hidden-file-input" style="display: none;" accept=".json,.xlsx,.docx" />'
  );

  // Saved projects section
  form.append(savedProjectsSection());

  // Main single-column content
  var content = $('<div class="form-content">');

  // 1. Text selection section
  content.append(
    '\
    <div class="form-section">\
      <h3><i class="file text icon"></i> Select Text</h3>\
      <div class="texts-grid" id="main-texts-grid">' +
      textSelectCards() +
      "</div>\
    </div>"
  );

  // 2. Introduction prayers section
  var introTextsHtml = extraTextsSelectCards("intro");
  if (introTextsHtml) {
    content.append(
      '\
      <div class="form-section">\
        <h3><i class="arrow right icon"></i> Introduction Prayers</h3>\
        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: -8px 0 12px 0;">These prayers will be added at the beginning of the document</p>\
        ' +
        introTextsHtml +
        "\
      </div>"
    );
  }

  // 3. Prayers section (only shows when text has markers)
  content.append(
    '\
    <div class="form-section" id="prayers-section-wrapper" style="display: none;">\
      <h3><i class="list icon"></i> Prayer Insertions</h3>\
      <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: -8px 0 12px 0;">Select prayers to insert at marked positions in the text</p>\
      <div id="prayers-section"></div>\
    </div>'
  );

  // 4. Language & Options section
  content.append(
    '\
    <div class="form-section">\
      <h3><i class="cog icon"></i> Options</h3>\
      <div style="margin-bottom: 16px;">\
        <label style="color: rgba(255,255,255,0.6); font-size: 12px; display: block; margin-bottom: 8px;">Translation Language</label>\
        ' +
      languageSelectInline() +
      '\
      </div>\
      <div id="mantra-phonetic-section"></div>\
      <div id="page-number-type-section"></div>\
    </div>'
  );

  // 5. Conclusion prayers section
  var conclusionTextsHtml = conclusionPrayersSelectCards();
  if (conclusionTextsHtml) {
    content.append(
      '\
      <div class="form-section">\
        <h3><i class="arrow left icon"></i> Conclusion Prayers</h3>\
        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: -8px 0 12px 0;">These prayers will be added at the end of the document</p>\
        ' +
        conclusionTextsHtml +
        "\
      </div>"
    );
  }

  // 6. Layout selection section
  content.append(
    '\
    <div class="form-section">\
      <h3><i class="th icon"></i> Layout</h3>\
      ' +
      layoutSelectCards() +
      "\
    </div>"
  );

  form.append(content);

  // Render button
  form.append(
    '\
    <div class="render-section">\
      <button class="ui fluid green button" id="render-button">\
        <i class="play icon"></i> Render\
      </button>\
    </div>'
  );

  $("#main").html(form);
  $("#layout").dropdown({ showOnFocus: false });
  $(".extra-text.checkbox").checkbox();
  $(".language.checkbox").checkbox();
  $(".conclusion-prayer-checkbox").checkbox();
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
    var storedText = localStorage[appName + ".texts." + textId];
    if (storedText) {
      try {
        pecha = JSON.parse(storedText);
        updatePrayersSection();
      } catch (e) {
        console.error("Error loading pecha from localStorage:", e);
        // Clear invalid textId
        localStorage.removeItem(appName + ".textId");
      }
    } else {
      // Text was deleted, clear the reference
      localStorage.removeItem(appName + ".textId");
    }
  }
};

// Update the prayers section based on current text
var updatePrayersSection = function () {
  var prayersHtml = prayersSelectContent();
  $("#prayers-section").html(prayersHtml);
  if (prayersHtml) {
    $("#prayers-section-wrapper").show();
  } else {
    $("#prayers-section-wrapper").hide();
  }
};

// Refresh the text selection area with updated texts
var refreshTextSelection = function () {
  // Update the texts object from localStorage
  texts =
    (localStorage[appName + ".texts"] &&
      JSON.parse(localStorage[appName + ".texts"])) ||
    {};

  // Update the main texts grid (not the extra texts grid)
  $("#main-texts-grid").html(textSelectCards());
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

// Handle click on the upload card to trigger the hidden file input
$(document).on("click", "#file-upload-card", function (event) {
  $("#hidden-file-input").click();
});

$(document).on("change", "#hidden-file-input", function (event) {
  $(".text").removeClass("selected");
  $("#file-upload-card").addClass("selected");

  // Import the file but don't generate yet - just load it and show markers
  importFile(false);

  // After import, refresh the text selection area to include the newly uploaded file
  // and automatically select it
  setTimeout(function () {
    refreshTextSelection();
    var textId = localStorage[appName + ".textId"];
    if (textId) {
      // Clear upload card selection since we now have a proper text card
      $("#file-upload-card").removeClass("selected");

      // Click the newly added text card to select it
      $(".text[data-id=" + textId + "]").click();
    }
  }, 200);
});

$(document).on("click", ".text", function (event) {
  $(".text").removeClass("selected");
  $("#file-upload-card").removeClass("selected");
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

// Conclusion prayers toggle
$(document).on("change", ".conclusion-prayer-checkbox input", function (event) {
  var $checkbox = $(event.currentTarget);
  var prayerId = $checkbox.data("id");
  var isEnabled = $checkbox.is(":checked");
  var $item = $checkbox.closest(".conclusion-prayer-item");

  if (isEnabled) {
    $item.addClass("selected");
  } else {
    $item.removeClass("selected");
  }

  saveConclusionPrayersState();
});

// Save conclusion prayers state to localStorage
var saveConclusionPrayersState = function () {
  var state = {};
  $("#conclusion-prayers-list .conclusion-prayer-item").each(function (index) {
    var $item = $(this);
    var prayerId = $item.data("id");
    var isEnabled = $item.find("input[type=checkbox]").is(":checked");
    state[prayerId] = {
      enabled: isEnabled,
      order: index,
    };
  });
  localStorage[appName + ".conclusion-prayers-state"] = JSON.stringify(state);
};

// Conclusion prayers drag and drop
var draggedConclusionItem = null;

$(document).on("dragstart", ".conclusion-prayer-item", function (event) {
  draggedConclusionItem = this;
  $(this).addClass("dragging");
  event.originalEvent.dataTransfer.effectAllowed = "move";
});

$(document).on("dragend", ".conclusion-prayer-item", function (event) {
  $(this).removeClass("dragging");
  $(".conclusion-prayer-item").removeClass("drag-over");
  draggedConclusionItem = null;
  saveConclusionPrayersState();
});

$(document).on("dragover", ".conclusion-prayer-item", function (event) {
  event.preventDefault();
  event.originalEvent.dataTransfer.dropEffect = "move";

  if (this !== draggedConclusionItem) {
    $(this).addClass("drag-over");
  }
});

$(document).on("dragleave", ".conclusion-prayer-item", function (event) {
  $(this).removeClass("drag-over");
});

$(document).on("drop", ".conclusion-prayer-item", function (event) {
  event.preventDefault();
  $(this).removeClass("drag-over");

  if (draggedConclusionItem && this !== draggedConclusionItem) {
    var $list = $("#conclusion-prayers-list");
    var $draggedItem = $(draggedConclusionItem);
    var $targetItem = $(this);

    // Determine if we should insert before or after
    var targetRect = this.getBoundingClientRect();
    var mouseY = event.originalEvent.clientY;
    var insertBefore = mouseY < targetRect.top + targetRect.height / 2;

    if (insertBefore) {
      $draggedItem.insertBefore($targetItem);
    } else {
      $draggedItem.insertAfter($targetItem);
    }
  }
});

// Download text as JSON
$(document).on("click", ".download-text-btn", function (event) {
  event.stopPropagation();
  var textId = $(event.currentTarget).data("id");
  if (textId) {
    var textData = JSON.parse(localStorage[appName + ".texts." + textId]);
    downloadPechaAsJSON(textData);
  }
});

// Delete text
$(document).on("click", ".delete-text-btn", function (event) {
  event.stopPropagation();
  var textId = $(event.currentTarget).data("id");
  if (textId && confirm("Delete this text?")) {
    var texts = JSON.parse(localStorage[appName + ".texts"] || "{}");
    delete texts[textId];
    localStorage[appName + ".texts"] = JSON.stringify(texts);
    localStorage.removeItem(appName + ".texts." + textId);
    refreshTextSelection();
  }
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

var selectedLanguage = getDefaultLanguage();
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
