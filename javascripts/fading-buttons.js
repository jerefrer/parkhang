var hoveringOverButtons;
var hiddenButtonsLoop;
var colorModeLoop;
var revealDuration = 300;
var fadeAttributes = {
  transition: "all 0.2s ease-in-out",
  left: "5px",
  opacity: 0,
  transform: "rotate(-90deg)",
};
var revealAttributes = {
  transition: "all 0.2s ease-in-out",
  left: "20px",
  opacity: 1,
  transform: "rotate(0deg)",
};

$(document).on(
  "mouseenter",
  "#print-button, #color-mode-button, #inspect-td-button",
  function () {
    hoveringOverButtons = true;
  }
);
$(document).on(
  "mouseleave",
  "#print-button, #color-mode-button, #inspect-td-button",
  function () {
    hoveringOverButtons = false;
  }
);

var fadeButtons = function () {
  $("#print-button, #color-mode-button, #inspect-td-button").finish();
  $("#color-mode-button").css(fadeAttributes, revealDuration);
  $("#inspect-td-button").css(fadeAttributes, revealDuration);
  setTimeout(function () {
    $("#print-button").css(fadeAttributes, revealDuration);
  }, 200);
};

var waitThenFade = function () {
  hiddenButtonsLoop = setTimeout(fadeButtons, 3000);
};

// Debounce helper function
var debounce = function (func, wait) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      func.apply(context, args);
    }, wait);
  };
};

var handleMouseMove = function (event) {
  clearTimeout(hiddenButtonsLoop);
  clearTimeout(colorModeLoop);
  if (!$("body").hasClass("no-pointer")) {
    $("#print-button").css(revealAttributes, revealDuration);
    colorModeLoop = setTimeout(function () {
      $("#color-mode-button").css(revealAttributes, revealDuration);
    }, 75);
    $("#inspect-td-button").css(revealAttributes, revealDuration);
    if (!hoveringOverButtons) waitThenFade();
    updateInspectorHover(event);
  }
};

$(document).mousemove(debounce(handleMouseMove, 50));

var inspectorActive = false;
var inspectorHighlightTarget = null;
var inspectorHighlightRow = null;
var inspectorPopup = null;
var inspectorPopupTarget = null;
var inspectorOutsideHandler = null;

var getTranslationTd = function (target) {
  var td = $(target).closest("td");
  if (!td.length) return $();
  if (!td.closest("tr").hasClass("translation")) return $();
  return td;
};

var clearInspectorHighlight = function () {
  if (inspectorHighlightTarget) {
    inspectorHighlightTarget.removeClass("inspect-td-highlight");
    inspectorHighlightTarget = null;
  }
  inspectorHighlightRow = null;
};

var stripTdStyles = function (td) {
  if (!td || !td.length) return;
  td.css({
    background: "",
    letterSpacing: "",
    fontSize: "",
  });
  td.closest("tr").css({
    background: "",
  });
};

var updateInspectorHover = function (event) {
  if (!inspectorActive) return;
  var td = getTranslationTd(event.target);
  if (!td.length) {
    clearInspectorHighlight();
    return;
  }
  if (inspectorHighlightTarget && inspectorHighlightTarget[0] === td[0]) return;
  clearInspectorHighlight();
  inspectorHighlightTarget = td;
  inspectorHighlightRow = td.closest("tr");
  inspectorHighlightTarget.addClass("inspect-td-highlight");
};

var closeInspectorPopup = function () {
  if (inspectorPopup) {
    inspectorPopup.remove();
    inspectorPopup = null;
  }
  inspectorPopupTarget = null;
  if (inspectorOutsideHandler) {
    $(document).off("mousedown", inspectorOutsideHandler);
    inspectorOutsideHandler = null;
  }
};

var attachOutsideHandler = function () {
  if (inspectorOutsideHandler) return;
  inspectorOutsideHandler = function (event) {
    if (!inspectorPopup) return;
    var target = $(event.target);
    if (
      target.closest(".inspect-td-popup").length ||
      target.closest("td").is(inspectorPopupTarget)
    )
      return;
    closeInspectorPopup();
  };
  $(document).on("mousedown", inspectorOutsideHandler);
};

var clamp = function (value, min, max) {
  return Math.min(Math.max(value, min), max);
};

var updateSliderLabel = function (labelEl, value, suffix) {
  labelEl.find(".value").text(value.toFixed(suffix === "px" ? 1 : 2) + suffix);
};

var createSliderControl = function (options) {
  var wrapper = $('<div class="slider-control"></div>');
  var label = $(
    "<label>" + options.label + ' <span class="value"></span></label>'
  );
  var input = $(
    '<input type="range" step="' +
      options.step +
      '" min="' +
      options.min +
      '" max="' +
      options.max +
      '" value="' +
      options.value +
      '">'
  );
  var update = function (val) {
    label.find(".value").text(options.format(val));
  };
  update(options.value);
  input.on("input", function () {
    var val = parseFloat(this.value);
    update(val);
    options.onChange(val);
  });
  wrapper.append(label, input);
  return { wrapper: wrapper, input: input, update: update };
};

var openInspectorPopup = function (td) {
  closeInspectorPopup();
  inspectorPopupTarget = td;

  var isSmall = td.hasClass("small-writings");
  var fontMin = isSmall ? 6 : 8;
  var fontMax = isSmall ? 8 : 10;
  var letterMin = -0.6;
  var letterMax = -0.1;

  var currentFont = parseFloat(td.css("font-size")) || fontMin;
  currentFont = clamp(currentFont, fontMin, fontMax);
  var currentLetter = parseFloat(td.css("letter-spacing"));
  if (isNaN(currentLetter)) currentLetter = -0.3;
  currentLetter = clamp(currentLetter, letterMin, letterMax);

  inspectorPopup = $('<div class="inspect-td-popup"></div>');

  var fontControl = createSliderControl({
    label: "Font size",
    min: fontMin,
    max: fontMax,
    step: 0.1,
    value: currentFont,
    format: function (val) {
      return val.toFixed(1) + "px";
    },
    onChange: function (val) {
      td.css("font-size", val + "px");
    },
  });

  var letterControl = createSliderControl({
    label: "Letter spacing",
    min: letterMin,
    max: letterMax,
    step: 0.01,
    value: currentLetter,
    format: function (val) {
      return val.toFixed(2) + "px";
    },
    onChange: function (val) {
      td.css("letter-spacing", val + "px");
    },
  });

  var pairId = td.data("split-pair-id");
  var splitControl;
  if (pairId) {
    var isFirst = td.data("split-role") === "first";
    var words = JSON.parse(td.attr("data-split-words") || "[]");
    var totalWords = parseInt(td.attr("data-split-total-words"), 10);
    var firstCount = parseInt(td.attr("data-split-first-count"), 10);
    var pairedTd = $('[data-split-pair-id="' + pairId + '"]').not(td);

    var applySplit = function (firstCountValue) {
      firstCountValue = clamp(firstCountValue, 0, totalWords);
      var firstWords = words.slice(0, firstCountValue);
      var secondWords = words.slice(firstCountValue);
      var firstTarget = isFirst ? td : pairedTd;
      var secondTarget = isFirst ? pairedTd : td;
      renderTranslationWords(firstTarget, firstWords);
      renderTranslationWords(secondTarget, secondWords);
      annotateTranslationSplit(
        firstTarget,
        secondTarget,
        pairId,
        words,
        firstWords.length
      );
    };

    splitControl = createSliderControl({
      label: "Split words",
      min: 0,
      max: totalWords,
      step: 1,
      value: totalWords - firstCount,
      format: function (val) {
        var first = totalWords - val;
        var second = val;
        return first.toFixed(0) + "/" + second.toFixed(0);
      },
      onChange: function (val) {
        var first = totalWords - val;
        applySplit(first);
      },
    });
  }

  var actions = $('<div class="popup-actions"></div>');
  var resetButton = $(
    '<button type="button" class="ui tiny inverted button"><i class="broom icon"></i> Reset</button>'
  );
  var closeButton = $(
    '<button type="button" class="ui tiny inverted button">Close</button>'
  );

  resetButton.on("click", function () {
    stripTdStyles(td);
    fontControl.input.val(fontMin);
    letterControl.input.val(letterMin);
    fontControl.update(parseFloat(fontControl.input.val()));
    letterControl.update(parseFloat(letterControl.input.val()));
  });

  closeButton.on("click", function () {
    closeInspectorPopup();
  });

  actions.append(resetButton, closeButton);
  inspectorPopup.append(
    fontControl.wrapper,
    letterControl.wrapper,
    splitControl ? splitControl.wrapper : null,
    actions
  );
  $("body").append(inspectorPopup);

  var tdOffset = td.offset();
  var top = tdOffset.top + td.outerHeight() + 8;
  var left = tdOffset.left;
  var popupWidth = inspectorPopup.outerWidth();
  var viewportWidth = $(window).width();
  if (left + popupWidth + 20 > viewportWidth) {
    left = viewportWidth - popupWidth - 20;
  }
  inspectorPopup.css({ top: top, left: left });
  attachOutsideHandler();
};

$(document).on("click", "#inspect-td-button", function () {
  inspectorActive = !inspectorActive;
  $(this).toggleClass("active", inspectorActive);
  if (!inspectorActive) {
    clearInspectorHighlight();
    closeInspectorPopup();
  } else {
    // force highlight to update on next move
    clearInspectorHighlight();
  }
});

$(document).on("click", "tr.translation td", function (event) {
  if (!inspectorActive) return;
  var td = getTranslationTd(event.target);
  if (!td.length) return;
  if (event.altKey) {
    stripTdStyles(td);
    closeInspectorPopup();
    return;
  }
  event.stopPropagation();
  openInspectorPopup(td);
});
