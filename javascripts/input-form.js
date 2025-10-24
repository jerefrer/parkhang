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

var prayersSelect = function () {
  if (!availablePrayers || availablePrayers.length === 0) {
    return '';
  }
  
  return (
    '\
    <div class="ui field">\
      <h4 style="color: white; text-align: center; margin-bottom: 15px;">Prayers for Tsok</h4>\
      <div class="ui prayers-list" id="prayers-list">' +
    _(availablePrayers)
      .map(function (prayer) {
        var isSelected = selectedPrayers.indexOf(prayer.id) !== -1;
        return (
          '\
            <div class="ui prayer-item" data-id="' +
          prayer.id +
          '" draggable="true">\
              <div class="prayer-checkbox">\
                <input type="checkbox" id="prayer-' +
          prayer.id +
          '"' +
          (isSelected ? ' checked' : '') +
          ' />\
                <label for="prayer-' +
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
  '
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
  form.append(prayersSelect);
  if (availablePrayers && availablePrayers.length > 0) {
    form.append(
      '<div class="ui inverted divider" style="margin-top: 25px;"></div>'
    );
  }
  form.append(languageSelect);
  form.append('<div class="ui inverted divider"></div>');
  form.append(layoutSelect);
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
  if (textId) $(".text[data-id=" + textId + "]").click();
  if (layout) $(".layout[data-id=" + layout + "]").click();
  if (language) $("input[name=language][value=" + language + "]").click();
  if (selectedExtraTexts && selectedExtraTexts.length) {
    _(JSON.parse(selectedExtraTexts)).each(function (extraTextId) {
      $(".extra-text[data-id=" + extraTextId + "]").click();
    });
  }
  initializePrayerDragAndDrop();
};

$(document).on("click", ".layout:not(.disabled)", function (event) {
  $(".layout").removeClass("selected");
  $(event.currentTarget).addClass("selected");
});

$(document).on("change", "input[type=radio]", function (event) {
  $(".language.radio").removeClass("selected");
  $(event.currentTarget).parents(".language.radio").addClass("selected");
});

$(document).on("change", "#file-input input", function (event) {
  $(".text").removeClass("selected");
  $(event.currentTarget).parents(".file.field").addClass("selected");
});

$(document).on("click", ".text", function (event) {
  $(".text").removeClass("selected");
  $("#file-input").parents(".file.field").removeClass("selected");
  $("#file-input input").val("");
  $(event.currentTarget).addClass("selected");
});

$(document).on("click", ".extra-text", function (event) {
  $(event.currentTarget).toggleClass("selected");
});

// Prayer checkbox handling
$(document).on("change", ".prayer-item input[type=checkbox]", function (event) {
  var prayerId = $(event.currentTarget).closest('.prayer-item').data('id');
  var isChecked = $(event.currentTarget).is(':checked');
  
  if (isChecked) {
    if (selectedPrayers.indexOf(prayerId) === -1) {
      selectedPrayers.push(prayerId);
    }
  } else {
    selectedPrayers = selectedPrayers.filter(function(id) { return id !== prayerId; });
  }
  
  saveSelectedPrayers();
  updatePrayerOrder();
});

// Update prayer order based on visual order
var updatePrayerOrder = function() {
  // Rebuild selectedPrayers array based on visual order of checked items
  var newOrder = [];
  $('.prayer-item').each(function() {
    var prayerId = $(this).data('id');
    var isChecked = $(this).find('input[type=checkbox]').is(':checked');
    if (isChecked) {
      newOrder.push(prayerId);
    }
  });
  selectedPrayers = newOrder;
  saveSelectedPrayers();
};

// Drag and drop for prayer reordering
var draggedPrayerElement = null;
var draggedPrayerId = null;

var initializePrayerDragAndDrop = function() {
  $('.prayer-item').on('dragstart', function(e) {
    draggedPrayerElement = this;
    draggedPrayerId = $(this).data('id');
    e.originalEvent.dataTransfer.effectAllowed = 'move';
    $(this).addClass('dragging');
  });
  
  $('.prayer-item').on('dragend', function(e) {
    $(this).removeClass('dragging');
    draggedPrayerElement = null;
    draggedPrayerId = null;
  });
  
  $('.prayer-item').on('dragover', function(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.originalEvent.dataTransfer.dropEffect = 'move';
    return false;
  });
  
  $('.prayer-item').on('dragenter', function(e) {
    if (draggedPrayerElement !== this) {
      $(this).addClass('drag-over');
    }
  });
  
  $('.prayer-item').on('dragleave', function(e) {
    $(this).removeClass('drag-over');
  });
  
  $('.prayer-item').on('drop', function(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    $(this).removeClass('drag-over');
    
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
      
      // Update the order based on new visual positions
      updatePrayerOrder();
    }
    
    return false;
  });
};

var selectedLanguage;
var selectedExtraTexts;
var includeTransliteration = true;
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
  $("body").addClass(layout);
  if (includeTransliteration) $("body").addClass("with-phonetics");
  if (textId) {
    pecha = JSON.parse(localStorage[appName + ".texts." + textId]);
    beginGeneration();
  } else importFile();
  $("#input-form").remove();
  $("#loading-overlay").show();
});
