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
// Creates a 3x3 grid with the last 2 items centered
var layoutSelectCards = function () {
  var gridSize = 3;
  var totalLayouts = layouts.length;
  var fullRows = Math.floor(totalLayouts / gridSize);
  var remainder = totalLayouts % gridSize;

  var html = '<div class="ui centered layouts cards">';

  // Generate full rows (first 9 items in 3x3)
  var fullRowItems = fullRows * gridSize;
  for (var i = 0; i < fullRowItems; i++) {
    var layout = layouts[i];
    html +=
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
      </div>";
  }

  // Generate centered last row if there are remaining items
  if (remainder > 0) {
    html += '<div class="layouts-last-row">';
    for (var j = fullRowItems; j < totalLayouts; j++) {
      var layout = layouts[j];
      html +=
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
        </div>";
    }
    html += "</div>";
  }

  html += "</div>";
  return html;
};

// Legacy function for compatibility
var layoutSelect = function () {
  return '<div class="ui field">' + layoutSelectCards() + "</div>";
};

// Inline language select for new layout
var languageSelectInline = function () {
  var defaultLanguageId = getDefaultLanguage();
  return (
    '<div class="segmented-control language-control">' +
    _(languages)
      .map(function (language) {
        var isSelected = language.id === defaultLanguageId;
        return (
          '<button type="button" class="segment-btn" data-value="' +
          language.id +
          '"' +
          (isSelected ? ' data-selected="true"' : "") +
          ">" +
          language.name +
          "</button>"
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

  var currentValue =
    localStorage[appName + ".displayMantraPhonetics"] !== "false";
  return (
    '\
    <div class="option-row">\
      <span class="option-label">Display mantra phonetics</span>\
      <div class="segmented-control mantra-phonetic-control">\
        <button type="button" class="segment-btn" data-value="yes"' +
    (currentValue ? ' data-selected="true"' : "") +
    '>Yes</button>\
        <button type="button" class="segment-btn" data-value="no"' +
    (!currentValue ? ' data-selected="true"' : "") +
    ">No</button>\
      </div>\
    </div>\
  "
  );
};

var pageNumberTypeSelect = function () {
  var selectedLayout = localStorage[appName + ".layout"] || "";
  // Only show for Pecha layouts
  if (!selectedLayout.startsWith("pecha")) {
    return "";
  }

  var currentType = localStorage[appName + ".pageNumberType"] || "arabic";
  return (
    '\
    <div class="option-row">\
      <span class="option-label">Page Number Style</span>\
      <div class="segmented-control page-number-type-control">\
        <button type="button" class="segment-btn" data-value="tibetan"' +
    (currentType === "tibetan" ? ' data-selected="true"' : "") +
    '>Tibetan</button>\
        <button type="button" class="segment-btn" data-value="arabic"' +
    (currentType === "arabic" ? ' data-selected="true"' : "") +
    ">Arabic</button>\
      </div>\
    </div>\
  "
  );
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
// Now uses same UI pattern as conclusion prayers - orderable and togglable
var extraTextsSelectCards = function (type, textId) {
  if (!extraTexts || extraTexts.length === 0) return "";

  // Get saved order and enabled state, or use defaults (per-text)
  var savedState = textId
    ? localStorage[appName + ".intro-prayers-state." + textId]
    : null;
  var prayerStates = savedState ? JSON.parse(savedState) : {};

  // Build list with order preserved
  var orderedPrayers = extraTexts.map(function (prayer) {
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
    '<div class="intro-prayers-list" id="intro-prayers-list">' +
    _(orderedPrayers)
      .map(function (prayer, index) {
        var enabledClass = prayer.enabled ? "selected" : "";
        return (
          '<div class="intro-prayer-item ' +
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
              <div class="ui toggle checkbox intro-prayer-checkbox">\
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

// Generate conclusion prayers cards HTML with enable/disable and reorder
// Uses conclusionPrayersList (only prayers from conclusion folder)
var conclusionPrayersSelectCards = function (textId) {
  if (!conclusionPrayersList || conclusionPrayersList.length === 0) return "";

  // Get saved order and enabled state, or use defaults (per-text)
  var savedState = textId
    ? localStorage[appName + ".conclusion-prayers-state." + textId]
    : null;
  var prayerStates = savedState ? JSON.parse(savedState) : {};

  // Build list with order preserved
  var orderedPrayers = conclusionPrayersList.map(function (prayer) {
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
    <div id="saved-projects-sidebar">\
      <h3><i class="folder icon"></i> Saved Projects</h3>\
      <div class="projects-list">' +
    projectCards +
    "</div>\
    </div>\
    "
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

  // Theme toggle button - cycles through dark/light/lapis-lazuli
  var currentTheme = localStorage[appName + ".theme"] || "dark";
  $("body")
    .removeClass("theme-dark theme-light theme-lapis")
    .addClass("theme-" + currentTheme);

  var themeIcons = { dark: "moon", light: "sun", lapis: "gem" };
  form.append(
    '<button type="button" id="theme-toggle" class="theme-toggle-btn" title="Toggle theme (dark/light/lapis-lazuli)">' +
      '<i class="' +
      themeIcons[currentTheme] +
      ' icon"></i>' +
      "</button>"
  );

  // Hidden file input
  form.append(
    '<input type="file" id="hidden-file-input" style="display: none;" accept=".json,.xlsx,.docx" />'
  );

  // Layout wrapper with sidebar and main content
  var sidebarHtml = savedProjectsSection();
  var hasSidebar = sidebarHtml && sidebarHtml.length > 0;
  var layoutWrapper = $(
    '<div class="form-layout-wrapper' + (hasSidebar ? "" : " no-sidebar") + '">'
  );

  // Sidebar for saved projects
  if (hasSidebar) {
    layoutWrapper.append(sidebarHtml);
  }

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
  var currentTextId = localStorage[appName + ".textId"];
  var introTextsHtml = extraTextsSelectCards("intro", currentTextId);
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
    <div class="form-section" id="options-section">\
      <h3><i class="cog icon"></i> Options</h3>\
      <div class="option-row">\
        <span class="option-label">Translation Language</span>\
        ' +
      languageSelectInline() +
      "\
      </div>\
      " +
      mantraPhoneticCheckbox() +
      pageNumberTypeSelect() +
      "\
    </div>"
  );

  // 5. Conclusion prayers section
  var conclusionTextsHtml = conclusionPrayersSelectCards(currentTextId);
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

  // Render button - inside content so it aligns with form
  content.append(
    '\
    <div class="render-section">\
      <button class="ui fluid green button" id="render-button">\
        <i class="play icon"></i> Render\
      </button>\
    </div>'
  );

  // Add content to layout wrapper, then wrapper to form
  layoutWrapper.append(content);
  form.append(layoutWrapper);

  $("#main").html(form);
  $("#layout").dropdown({ showOnFocus: false });
  $(".extra-text.checkbox").checkbox();
  $(".language.checkbox").checkbox();
  $(".intro-prayer-checkbox").checkbox();
  $(".conclusion-prayer-checkbox").checkbox();
  var textId = localStorage[appName + ".textId"];
  var layout = localStorage[appName + ".layout"];
  var language = localStorage[appName + ".language"];
  var selectedExtraTexts = localStorage[appName + ".selected-extra-texts"];

  if (textId) $(".text[data-id=" + textId + "]").click();
  if (layout) $(".layout[data-id=" + layout + "]").click();
  if (language)
    $(".language-control .segment-btn[data-value=" + language + "]").click();

  // Load prayers section if text is already selected
  if (textId) {
    var storedText = localStorage[appName + ".texts." + textId];
    if (storedText) {
      try {
        pecha = JSON.parse(storedText);
        // Load marker prayers for this text before updating UI
        if (window.loadMarkerPrayersForCurrentText) {
          window.loadMarkerPrayersForCurrentText();
        }
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
  var texts =
    (localStorage[appName + ".texts"] &&
      JSON.parse(localStorage[appName + ".texts"])) ||
    {};

  // Update the main texts grid (not the extra texts grid)
  $("#main-texts-grid").html(textSelectCards());
};

$(document).on("click", ".layout:not(.disabled)", function (event) {
  $(".layout").removeClass("selected");
  $(event.currentTarget).addClass("selected");

  // Update layout in localStorage
  var layout = $(event.currentTarget).data("id");
  localStorage[appName + ".layout"] = layout;

  // Rebuild options section with updated visibility for mantra phonetic and page number type
  var defaultLanguageId = getDefaultLanguage();
  var optionsHtml =
    '<h3><i class="cog icon"></i> Options</h3>\
    <div class="option-row">\
      <span class="option-label">Translation Language</span>\
      <div class="segmented-control language-control">' +
    _(languages)
      .map(function (lang) {
        var isSelected = lang.id === defaultLanguageId;
        return (
          '<button type="button" class="segment-btn" data-value="' +
          lang.id +
          '"' +
          (isSelected ? ' data-selected="true"' : "") +
          ">" +
          lang.name +
          "</button>"
        );
      })
      .join("") +
    "</div>\
    </div>" +
    mantraPhoneticCheckbox() +
    pageNumberTypeSelect();

  $("#options-section").html(optionsHtml);
});

// Theme toggle handler - cycles through dark -> light -> lapis -> dark
$(document).on("click", "#theme-toggle", function (event) {
  var $body = $("body");
  var $icon = $(this).find("i");
  var themes = ["dark", "light", "lapis"];
  var icons = { dark: "moon", light: "sun", lapis: "gem" };

  // Find current theme
  var currentTheme = "dark";
  for (var i = 0; i < themes.length; i++) {
    if ($body.hasClass("theme-" + themes[i])) {
      currentTheme = themes[i];
      break;
    }
  }

  // Get next theme
  var currentIndex = themes.indexOf(currentTheme);
  var nextIndex = (currentIndex + 1) % themes.length;
  var nextTheme = themes[nextIndex];

  // Update body class
  $body
    .removeClass("theme-dark theme-light theme-lapis")
    .addClass("theme-" + nextTheme);

  // Update icon
  $icon.removeClass("sun moon gem").addClass(icons[nextTheme]);

  // Save to localStorage
  localStorage[appName + ".theme"] = nextTheme;
});

// Language segmented control handler
$(document).on("click", ".language-control .segment-btn", function (event) {
  var $btn = $(event.currentTarget);
  var value = $btn.data("value");

  // Update visual state
  $btn.siblings().removeAttr("data-selected");
  $btn.attr("data-selected", "true");

  // Save to localStorage and update global variable
  localStorage[appName + ".language"] = value;
  window.selectedLanguage = value;
});

// Page number type segmented control handler
$(document).on(
  "click",
  ".page-number-type-control .segment-btn",
  function (event) {
    var $btn = $(event.currentTarget);
    var value = $btn.data("value");

    // Update visual state
    $btn.siblings().removeAttr("data-selected");
    $btn.attr("data-selected", "true");

    // Save to localStorage
    localStorage[appName + ".pageNumberType"] = value;
  }
);

// Mantra phonetic segmented control handler
$(document).on(
  "click",
  ".mantra-phonetic-control .segment-btn",
  function (event) {
    var $btn = $(event.currentTarget);
    var value = $btn.data("value");

    // Update visual state
    $btn.siblings().removeAttr("data-selected");
    $btn.attr("data-selected", "true");

    // Save to localStorage (yes = true, no = false)
    localStorage[appName + ".displayMantraPhonetics"] =
      value === "yes" ? "true" : "false";
  }
);

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
    localStorage[appName + ".textId"] = textId;
    pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
    // Reload marker prayers for this text
    if (window.loadMarkerPrayersForCurrentText) {
      window.loadMarkerPrayersForCurrentText();
    }
    updatePrayersSection();
    // Reload intro and conclusion prayers UI for this text
    reloadPrayersUIForText(textId);
  }
});

// Reload intro and conclusion prayers UI for a specific text
var reloadPrayersUIForText = function (textId) {
  // Reload intro prayers
  var introHtml = extraTextsSelectCards("intro", textId);
  if (introHtml) {
    $("#intro-prayers-list").replaceWith(
      $(introHtml).find("#intro-prayers-list").length
        ? $(introHtml).find("#intro-prayers-list")
        : introHtml
    );
    $(".intro-prayer-checkbox").checkbox();
  }

  // Reload conclusion prayers
  var conclusionHtml = conclusionPrayersSelectCards(textId);
  if (conclusionHtml) {
    $("#conclusion-prayers-list").replaceWith(
      $(conclusionHtml).find("#conclusion-prayers-list").length
        ? $(conclusionHtml).find("#conclusion-prayers-list")
        : conclusionHtml
    );
    $(".conclusion-prayer-checkbox").checkbox();
  }
};

// Old extra-text click handler removed - now using intro-prayer-checkbox toggle

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

// Save conclusion prayers state to localStorage (per-text)
var saveConclusionPrayersState = function () {
  var textId = getCurrentTextId();
  if (!textId) return;

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
  localStorage[appName + ".conclusion-prayers-state." + textId] =
    JSON.stringify(state);
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

// Introduction prayers toggle
$(document).on("change", ".intro-prayer-checkbox input", function (event) {
  var $checkbox = $(event.currentTarget);
  var prayerId = $checkbox.data("id");
  var isEnabled = $checkbox.is(":checked");
  var $item = $checkbox.closest(".intro-prayer-item");

  if (isEnabled) {
    $item.addClass("selected");
  } else {
    $item.removeClass("selected");
  }

  saveIntroPrayersState();
});

// Get current selected text ID
var getCurrentTextId = function () {
  return $(".text.selected").data("id") || localStorage[appName + ".textId"];
};

// Save introduction prayers state to localStorage (per-text)
var saveIntroPrayersState = function () {
  var textId = getCurrentTextId();
  if (!textId) return;

  var state = {};
  $("#intro-prayers-list .intro-prayer-item").each(function (index) {
    var $item = $(this);
    var prayerId = $item.data("id");
    var isEnabled = $item.find("input[type=checkbox]").is(":checked");
    state[prayerId] = {
      enabled: isEnabled,
      order: index,
    };
  });
  localStorage[appName + ".intro-prayers-state." + textId] =
    JSON.stringify(state);
};

// Introduction prayers drag and drop
var draggedIntroItem = null;

$(document).on("dragstart", ".intro-prayer-item", function (event) {
  draggedIntroItem = this;
  $(this).addClass("dragging");
  event.originalEvent.dataTransfer.effectAllowed = "move";
});

$(document).on("dragend", ".intro-prayer-item", function (event) {
  $(this).removeClass("dragging");
  $(".intro-prayer-item").removeClass("drag-over");
  draggedIntroItem = null;
  saveIntroPrayersState();
});

$(document).on("dragover", ".intro-prayer-item", function (event) {
  event.preventDefault();
  event.originalEvent.dataTransfer.dropEffect = "move";

  if (this !== draggedIntroItem) {
    $(this).addClass("drag-over");
  }
});

$(document).on("dragleave", ".intro-prayer-item", function (event) {
  $(this).removeClass("drag-over");
});

$(document).on("drop", ".intro-prayer-item", function (event) {
  event.preventDefault();
  $(this).removeClass("drag-over");

  if (draggedIntroItem && this !== draggedIntroItem) {
    var $list = $("#intro-prayers-list");
    var $draggedItem = $(draggedIntroItem);
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

  // Get prayers specific to this marker type (e.g., TSOK -> prayers/tsok, TSEGUK -> prayers/tseguk)
  var markerSpecificPrayers = window.getPrayersForMarker
    ? window.getPrayersForMarker(markerType)
    : availablePrayers;

  if (!markerSpecificPrayers || markerSpecificPrayers.length === 0) {
    // Fallback to all available prayers if no specific prayers found
    markerSpecificPrayers = availablePrayers;
  }

  // Sort prayers: selected ones first (in saved order), then unselected ones
  var orderedPrayers = [];

  // First, add selected prayers in their saved order
  currentPrayers.forEach(function (prayerId) {
    var prayer = _.find(markerSpecificPrayers, function (p) {
      return p.id === prayerId;
    });
    if (prayer) {
      orderedPrayers.push(prayer);
    }
  });

  // Then add unselected prayers
  markerSpecificPrayers.forEach(function (prayer) {
    if (currentPrayers.indexOf(prayer.id) === -1) {
      orderedPrayers.push(prayer);
    }
  });

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
    _(orderedPrayers)
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
  // Save marker prayers to localStorage (per-text)
  var textId = localStorage[appName + ".textId"];
  if (textId) {
    localStorage[appName + ".marker-prayers." + textId] =
      JSON.stringify(markerPrayers);
  }

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

window.selectedLanguage = getDefaultLanguage();
window.selectedExtraTexts = undefined;
window.includeTransliteration = true;
window.displayMantraPhonetics = true;
$(document).on("click", "#render-button", function () {
  var textId = (localStorage[appName + ".textId"] =
    $(".text.selected").data("id"));
  var layout = (localStorage[appName + ".layout"] =
    $(".layout.selected").data("id"));
  window.selectedLanguage = localStorage[appName + ".language"] =
    $(".language-control .segment-btn[data-selected]").data("value") ||
    getDefaultLanguage();

  // Get selected intro prayers from the per-text state format (ordered and enabled)
  var introState = textId
    ? localStorage[appName + ".intro-prayers-state." + textId]
    : null;
  var introPrayerStates = introState ? JSON.parse(introState) : {};
  window.selectedExtraTexts = [];
  // Get prayers in order from the state
  var orderedIntroPrayers = [];
  for (var prayerId in introPrayerStates) {
    if (introPrayerStates[prayerId].enabled) {
      orderedIntroPrayers.push({
        id: prayerId,
        order: introPrayerStates[prayerId].order,
      });
    }
  }
  orderedIntroPrayers.sort(function (a, b) {
    return a.order - b.order;
  });
  window.selectedExtraTexts = orderedIntroPrayers.map(function (p) {
    return p.id;
  });

  // Save mantra phonetic preference
  var mantraPhoneticValue = $(
    ".mantra-phonetic-control .segment-btn[data-selected]"
  ).data("value");
  window.displayMantraPhonetics = mantraPhoneticValue !== "no";
  localStorage[appName + ".displayMantraPhonetics"] =
    window.displayMantraPhonetics ? "true" : "false";

  // Save page number type preference
  var pageNumberType =
    $(".page-number-type-control .segment-btn[data-selected]").data("value") ||
    "arabic";
  localStorage[appName + ".pageNumberType"] = pageNumberType;

  $("body").addClass(layout);
  if (window.includeTransliteration) $("body").addClass("with-phonetics");
  if (window.displayMantraPhonetics)
    $("body").addClass("with-mantra-phonetics");
  if (pageNumberType === "arabic") $("body").addClass("arabic-numbers");
  $("#input-form").remove();
  $("#loading-overlay").show();

  if (textId) {
    pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
    // Update window.pecha so prayers.js can access it
    window.pecha = pecha;
    beginGeneration();
  } else if (pecha && pecha.groups && pecha.groups.length > 0) {
    // File was already imported, just start generation
    window.pecha = pecha;
    beginGeneration();
  } else {
    // Import file and start generation
    importFile(true);
  }
});

// Export functions for ES module usage
export {
  getDefaultLanguage,
  isAClassicPage,
  isAPage,
  isAPecha,
  isASplitPage,
  isPageA4,
  isPageA5,
  isPageScreen,
  languages,
  layouts,
  renderInputForm,
};
