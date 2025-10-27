var pechaContentWidth;
var numberOfLinesPerPage;
var lineWidth = 0;
var pageNumber = 1;
var physicalPageNumber = 1;
var groupIndex = 0;
var translationIndex = 0;
var pageBeginningMarker = "༄༅།  །";
var spaceBetweenGroups = '<span class="space"></span>';

// Fix Tibetan character ྅ (U+0F45) spacing
// This character is zero-width and needs to be wrapped in a span with fixed width
var fixTibetanAvagraha = function (text) {
  if (!text) return text;
  // Wrap ྅ in a span with the tibetan-avagraha class
  return text.replace(/྅/g, '<span class="tibetan-avagraha">྅</span>');
};

// Remove optional parts from translation for pecha (space-constrained)
var removeOptionalParts = function (text) {
  if (!text) return text;
  return text.replace(/<optional>.*?<\/optional>/g, "").trim();
};

// Parse text with <small> markers and return array of {text, isSmall} objects
var parseSmallMarkers = function (text) {
  if (!text) return [{ text: text, isSmall: false }];

  var result = [];
  var remaining = text;
  var smallRegex = /<small>(.*?)<\/small>/g;
  var lastIndex = 0;
  var match;

  while ((match = smallRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      result.push({
        text: text.substring(lastIndex, match.index),
        isSmall: false,
      });
    }
    // Add the small text
    result.push({ text: match[1], isSmall: true });
    lastIndex = smallRegex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    result.push({ text: text.substring(lastIndex), isSmall: false });
  }

  return result.length > 0 ? result : [{ text: text, isSmall: false }];
};

// Convert <small>...</small> markers to span.small-writings for non-split text
var convertSmallMarkers = function (text) {
  if (!text) return text;
  return text.replace(
    /<small>(.*?)<\/small>/g,
    '<span class="small-writings">$1</span>'
  );
};

// Constants for layout calculations
var LINE_END_MARGIN = 120; // Minimum space to leave at end of line before wrapping

// Check if text is a yigo (section marker)
var isYigo = function (text) {
  if (!text) return false;
  var yigos = ["༄༅།  །", "༄༅། །", "༄༅།།", "༈ །", "༈།", "༄ །", "༄།"];
  for (var i = 0; i < yigos.length; i++) {
    if (text.trim() === yigos[i]) {
      return true;
    }
  }
  return false;
};

// Check if we need space before the next group
var needsSpaceBefore = function (text) {
  if (!text) return true; // Default to adding space if no text

  // Always add space before yigos (section markers)
  var yigos = ["༄༅།", "༈", "༄"];
  for (var i = 0; i < yigos.length; i++) {
    if (text.startsWith(yigos[i])) {
      return true;
    }
  }

  // Don't add space if text starts right after double shad
  // Check the last cell's content
  var lastCell = $(".pecha-page tr.tibetan:last td:last");
  if (lastCell.length) {
    var lastText = lastCell.text().trim();
    // If previous text ends with double shad, no space needed
    if (
      lastText.endsWith("།།") ||
      lastText.endsWith("། །") ||
      lastText.endsWith("ག །")
    ) {
      return false;
    }
  }
  return true;
};

// Remove leading yigos from text if the line already has a page-beginning marker
var stripLeadingYigo = function (text, $currentRow) {
  // Check if this row has a page-beginning marker
  if ($currentRow.find("td.page-beginning").length > 0) {
    // Common yigos that mark section beginnings
    var yigos = ["༄༅།  །", "༄༅། །", "༄༅།།", "༈ །", "༈།", "༄ །", "༄།"];
    for (var i = 0; i < yigos.length; i++) {
      if (text.startsWith(yigos[i])) {
        return text.substring(yigos[i].length).trim();
      }
    }
  }
  return text;
};

var pechaLeftMargin = function () {
  var margin = $('<div class="pecha-left-margin">');
  if (pageNumber % 2 == 1) {
    // Odd page - show page number
    margin.append('<div class="pecha-left-margin-first"></div>');
    margin.append('<div class="pecha-left-margin-last"></div>');
    var pageNumberText =
      tibetanPageNumbersInPlainText[physicalPageNumber - 1] || "";
    margin.append(
      '<div class="pecha-left-margin-center">' + pageNumberText + "</div>"
    );
  } else {
    // Even page - show title
    margin.append('<div class="pecha-left-margin-first"></div>');
    margin.append('<div class="pecha-left-margin-last"></div>');
    var titleText =
      (pecha.title && pecha.title.tibetan && pecha.title.tibetan.short) || "";
    margin.append(
      '<div class="pecha-left-margin-center">' + titleText + "</div>"
    );
  }
  return margin;
};

var pechaRightMargin = function () {
  var margin = $('<div class="pecha-right-margin">');
  margin.append('<div class="pecha-right-margin-first"></div>');
  margin.append('<div class="pecha-right-margin-last"></div>');

  // Use Arabic numbers if the body has the arabic-numbers class
  var pageNumberText;
  if ($("body").hasClass("arabic-numbers")) {
    pageNumberText = pageNumber.toString();
  } else {
    pageNumberText = tibetanNumber(pageNumber);
  }

  margin.append(
    '<div class="pecha-right-margin-center">' + pageNumberText + "</div>"
  );
  return margin;
};

var addPechaTitlePage = function () {
  var translation = pecha.title[selectedLanguage];
  var titlePage = $('<div class="pecha-page-container" id="title-page">');
  titlePage.append('<div class="pecha-title-page">');
  titlePage
    .find(".pecha-title-page")
    .append('<div class="pecha-title-page-inner">');
  titlePage.find(".pecha-title-page-inner").append(pechaLeftMargin());
  titlePage.find(".pecha-title-page-inner").append(
    '\
    <div class="pecha-title-page-inner-inner">\
      <div class="pecha-title-left-box"></div>\
      <div class="pecha-title-left-gap"></div>\
      <div class="pecha-title-content">\
        <table class="line">\
          <tbody>\
            <tr class="tibetan">\
              <td>' +
      pecha.title.tibetan.full +
      '</td>\
            </tr>\
            <tr class="translation">\
              <td>\
                <div class="title">' +
      translation.title +
      "</div>" +
      ((translation.subtitle &&
        '<div class="subtitle">' + translation.subtitle + "</div>") ||
        "") +
      '\
              </td>\
            </tr>\
          </tbody>\
        </table>\
      </div>\
      <div class="pecha-title-right-gap"></div>\
      <div class="pecha-title-right-box"></div>\
    </div>'
  );
  titlePage.find(".pecha-title-page-inner").append(pechaRightMargin());
  $("#main").append(titlePage);
  setTimeout(function () {
    var pageHeight = $(".pecha-page-container").height();
    var contentHeight = $(".pecha-title-content").height();
    $(".pecha-title-page").css({
      height:
        "calc(" +
        contentHeight +
        "px + (3px * 6) + (3 * 3pt) + (2 * 6pt) + (2 * 17.52pt) - 0.5px)",
      "margin-top":
        "calc((" +
        pageHeight +
        "px - " +
        $(".pecha-title-page").outerHeight() +
        "px) / 2)",
      "margin-bottom":
        "calc((" +
        pageHeight +
        "px - " +
        $(".pecha-title-page").outerHeight() +
        "px) / 2)",
    });
    var innerHeight = $(".pecha-title-page-inner-inner").outerHeight();
    $(
      ".pecha-title-page .pecha-left-margin, .pecha-title-page .pecha-right-margin"
    ).css({
      height: innerHeight,
    });
  }, 200);
  pageNumber++;
};

var renderBeginningPage = function () {
  var pechaPage = $('<div class="pecha-beginning-page pecha-page">');
  pechaPage.append(pechaLeftMargin());
  pechaPage.append(
    '\
    <div class="pecha-beginning-page-inner">\
      <div class="pecha-beginning-page-inner-inner">\
        <div class="pecha-beginning-left-box"></div>\
        <div class="pecha-beginning-left-gap"></div>\
        <div class="pecha-content"></div>\
        <div class="pecha-beginning-right-gap"></div>\
        <div class="pecha-beginning-right-box"></div>\
      </div>\
    </div>\
  '
  );
  pechaPage.append(pechaRightMargin());
  return pechaPage;
};

var renderStandardPage = function () {
  var pechaPage = $('<div class="pecha-standard-page pecha-page">');
  pechaPage.append(pechaLeftMargin());
  pechaPage.append('<div class="pecha-content"></div>');
  pechaPage.append(pechaRightMargin());
  return pechaPage;
};

var addPageTitlePage = function () {
  var translation = pecha.title[selectedLanguage];
  var titlePage =
    '\
    <div class="pecha-page-container" id="title-page">\
      <div class="pecha-title-page">\
        <div class="pecha-title-page-content">\
          <div class="tibetan">\
            ' +
    pecha.title.tibetan.full +
    '\
          </div>\
          <div class="translation">\
            <div class="title">' +
    translation.title +
    "</div>" +
    ((translation.subtitle &&
      '<div class="subtitle">' + translation.subtitle + "</div>") ||
      "") +
    "\
          </div>\
        </div>\
      </div>\
    </div>\
  ";
  $("#main").append(titlePage);
  setTimeout(function () {
    var pageHeight = $(".pecha-title-page").height();
    var contentHeight = $(".pecha-title-page-content").height();
    $(".pecha-title-page").css({
      "margin-top":
        "calc((" + pageHeight + "px - " + contentHeight + "px) / 2)",
    });
  }, 200);
  pageNumber++;
};

var renderSimplePage = function () {
  var pechaPage = $('<div class="pecha-simple-page pecha-page">');
  pechaPage.append('<div class="pecha-content"></div>');
  return pechaPage;
};

var evenPage = function () {
  return pageNumber % 2 == 0;
};

var oddPage = function () {
  return pageNumber % 2 == 1;
};

var addNextPechaPage = function () {
  var pechaPageContainer = $('<div class="pecha-page-container">');
  if (isAPage()) {
    pechaPageContainer.html(renderSimplePage());
  } else {
    if (pageNumber <= 3) {
      pechaPageContainer.html(renderBeginningPage());
      numberOfLinesPerPage = 3;
    } else {
      pechaPageContainer.html(renderStandardPage());
      numberOfLinesPerPage = 4;
    }
  }
  $("#main").append(pechaPageContainer);
  pechaContentWidth = $(".pecha-page:last .pecha-content").width();
  addNewEmptyLine();
  if (isAPage() || oddPage() || pageNumber <= 3) {
    $("tr.tibetan:last").append(
      '<td class="page-beginning">' + pageBeginningMarker + "</td>"
    );
    $("tr.translation:last").append('<td class="page-beginning"></td>');
    lineWidth = $("tr.tibetan:last td:last").width();
  } else {
    lineWidth = 0;
  }
  pageNumber++;
  if (evenPage()) physicalPageNumber++;
  if (delay) $(window).scrollTop(pechaPageContainer.offset().top);
};

var addNewEmptyLine = function () {
  $(".pecha-page:last .pecha-content").append(
    '\
    <table class="line">\
      <tbody>\
        <tr class="tibetan"></tr>\
        <tr class="translation"></tr>\
      </tbody>\
    </table>\
  '
  );
};

var pageOverflows = function () {
  var pageHeightWithOnMoreLine =
    $(".pecha-page:last").height() + $(".line:last").height();
  var pageMaxHeight = parseFloat($(".pecha-page-container:last").height());
  return pageHeightWithOnMoreLine > pageMaxHeight;
};

var continueOnNewLineStartingWith = function (remainingWords) {
  fitWidth($("table:last"));
  if (isAPage() && !isPageScreen() && pageOverflows()) addNextPechaPage();
  else if ($(".pecha-page:last .line").length == numberOfLinesPerPage)
    addNextPechaPage();
  else {
    addNewEmptyLine();
    lineWidth = 0;
  }
  setTimeout(function () {
    addNextGroup(remainingWords);
  }, delay);
};

var newTibetanCell = function (index) {
  var line = pecha.groups[index];
  var td = $("<td>");
  td.attr("data-index", index);
  if (line.smallWritings) td.addClass("small-writings");
  return td;
};

var addRowspanCell = function (td, text) {
  // Handle undefined or null text
  if (!text) text = "";
  var fontSize = 10;
  var ratioPerCharacterPerFontPixel = 0.45;
  var width = (text.length * fontSize * ratioPerCharacterPerFontPixel) / 2.5;
  td.attr("rowspan", 2).css({
    "min-width": width,
    width: width,
  });
  td.html(text);
};

var fitWordsOnLine = function (text) {
  // Parse text to identify small sections
  var segments = parseSmallMarkers(text);

  // Build array of syllables with their isSmall flag
  var syllables = [];
  segments.forEach(function (segment) {
    // Split by ་ (tsheg) to get syllables
    var parts = segment.text.split("་");
    parts.forEach(function (part, i) {
      // Include empty parts at the end (they become just a tsheg)
      if (part || i < parts.length - 1) {
        // Each part gets the tsheg back except the last one
        var syllableText = part + (i < parts.length - 1 ? "་" : "");
        syllables.push({
          text: syllableText,
          isSmall: segment.isSmall,
        });
      }
    });
  });

  var syllableIndex = 0;
  var addNextSyllable = function () {
    var td = $(".pecha-page tr.tibetan td:last");
    var syllable = syllables[syllableIndex];
    if (syllable) {
      // Add syllable with appropriate class
      var spanClass = syllable.isSmall ? ' class="small-writings"' : "";
      var syllableText = fixTibetanAvagraha(syllable.text);
      td.append("<span" + spanClass + ">" + syllableText + "</span>");

      if (lineWidth + td.width() <= pechaContentWidth) {
        // Syllable fits, add next one
        syllableIndex++;
        setTimeout(function () {
          addNextSyllable();
        }, delay);
      } else if (syllables.slice(syllableIndex).length == 1) {
        // Just one syllable left, finish this group and move to next
        lineWidth += td.width();
        groupIndex++;
        fitWidth($("table:last"));
        setTimeout(function () {
          addNextGroup();
        }, delay);
      } else {
        // Doesn't fit, start a new line with remaining syllables
        td.find("span:last").remove();
        if (!td.find("span:not(.space)").length) td.remove();

        // Reconstruct remaining text with small markers
        var remainingText = "";
        var currentIsSmall = null;
        for (var i = syllableIndex; i < syllables.length; i++) {
          var syl = syllables[i];
          if (syl.isSmall !== currentIsSmall) {
            if (currentIsSmall === true) remainingText += "</small>";
            if (syl.isSmall === true) remainingText += "<small>";
            currentIsSmall = syl.isSmall;
          }
          remainingText += syl.text;
        }
        if (currentIsSmall === true) remainingText += "</small>";

        continueOnNewLineStartingWith(remainingText);
      }
    } else {
      lineWidth += td.width();
      groupIndex++;
      addNextGroup();
    }
  };
  addNextSyllable();
};

var addNextGroup = function (remainingWords) {
  var group = pecha.groups[groupIndex];
  if (remainingWords || group) {
    var td = newTibetanCell(groupIndex);
    var text = remainingWords || group.tibetan;
    var $currentTibetanRow = $(".pecha-page tr.tibetan:last");
    var textWithMarkers = text;
    var textConverted = text;

    if (!group.tibetan) {
      text = group[selectedLanguage];
      // Skip groups without Tibetan content that are smallWritings (usually long English-only intro paragraphs)
      // or are completely empty
      if (!text || text.trim() === "" || group.smallWritings) {
        groupIndex++;
        setTimeout(function () {
          addNextGroup();
        }, delay);
        return;
      }
      addRowspanCell(td, text);
    } else {
      // Strip leading yigo if this row already has a page-beginning marker
      text = stripLeadingYigo(text, $currentTibetanRow);

      // Store original text with <small> markers for fitWordsOnLine
      textWithMarkers = text;
      // Convert markers for display when text fits without splitting
      textConverted = convertSmallMarkers(text);
      // Fix Tibetan spacing for ྅ character
      textConverted = fixTibetanAvagraha(textConverted);

      if ($currentTibetanRow.find("td:not(.page-beginning)").length) {
        // Add space only if needed (not after double shad or if tibetanAttachedToPrevious is true)
        var shouldAddSpace =
          needsSpaceBefore(textConverted) && !group.tibetanAttachedToPrevious;
        var prefix = shouldAddSpace ? spaceBetweenGroups : "";
        td.html(prefix + textConverted);
      } else {
        td.html(textConverted);
      }
    }
    // Calculate prefix before appending td (so needsSpaceBefore checks the previous td, not current)
    var needsSpace =
      $currentTibetanRow.find("td:not(.page-beginning)").length > 0 &&
      needsSpaceBefore(textConverted) &&
      !group.tibetanAttachedToPrevious;

    // Check if current group is a yigo - if so, it must stay with next group's first 2 syllables
    var currentIsYigo = isYigo(textConverted);

    // Before appending, check if yigo + next syllables will fit
    if (currentIsYigo && groupIndex + 1 < pecha.groups.length) {
      var nextGroup = pecha.groups[groupIndex + 1];
      if (nextGroup && nextGroup.tibetan) {
        // Get first two syllables of next group
        var nextText = nextGroup.tibetan;
        var syllables = nextText.split("་");
        var firstTwoSyllables = syllables.slice(0, 2).join("་");
        if (syllables.length > 1) firstTwoSyllables += "་";

        // Create temporary td to measure if yigo + first two syllables would fit
        // Must append to DOM to measure width
        var tempNextTd = $("<td>").html(fixTibetanAvagraha(firstTwoSyllables));
        $currentTibetanRow.append(td);
        $currentTibetanRow.append(tempNextTd);
        var yigoWidth = td.width();
        var nextWidth = tempNextTd.width();
        var yigoAndNextWidth = yigoWidth + nextWidth;
        tempNextTd.remove();
        td.remove();

        // If yigo + next syllables won't fit on current line (including margin), start new line
        if (
          lineWidth + yigoAndNextWidth + LINE_END_MARGIN >
          pechaContentWidth
        ) {
          fitWidth($("table:last"));
          if (isAPage() && !isPageScreen() && pageOverflows())
            addNextPechaPage();
          else if ($(".pecha-page:last .line").length == numberOfLinesPerPage)
            addNextPechaPage();
          else {
            addNewEmptyLine();
            lineWidth = 0;
          }
          // Retry adding this group on the new line
          setTimeout(function () {
            addNextGroup();
          }, delay);
          return;
        }
      }
    }

    $currentTibetanRow.append(td);

    if (lineWidth + td.width() <= pechaContentWidth) {
      // Group fits, add next group
      lineWidth += td.width();
      groupIndex++;
      setTimeout(function () {
        addNextGroup();
      }, delay);
    } else {
      // If group overflows
      if ($currentTibetanRow.find("td").length == 1) {
        // If it's a new line (just one group) don't add space at the beginning
        td.html("");
      } else {
        // Add space only if needed (not after double shad or if tibetanAttachedToPrevious is true)
        var prefix = needsSpace ? spaceBetweenGroups : "";
        td.html(prefix);
      }
      // Try to fit words on line - this will squeeze if needed
      // Use original text with <small> markers for proper parsing
      fitWordsOnLine(textWithMarkers);
    }
  } else {
    // If all groups have been processed
    addNextTranslation();
  }
};

var newTranslationCell = function (tibetanTd) {
  var width = tibetanTd.width();
  var space = tibetanTd.find(".space") && tibetanTd.find(".space").width();
  var line = pecha.groups[translationIndex];
  var td = $("<td>");
  if (space) td.css({ "padding-left": space + "px" });
  if (line.smallWritings) td.addClass("small-writings");

  // Add padding-right if Tibetan text ends with "། །" or "ག །"
  var tibetanText = tibetanTd.text().trim();
  if (
    tibetanText.endsWith("། །") ||
    tibetanText.endsWith("ག །") ||
    tibetanText.endsWith("།། །།") ||
    tibetanText.endsWith("ག །།") ||
    tibetanText.endsWith("ག། །།")
  ) {
    td.css({ "padding-right": "25px" });
  }

  return td;
};

var addTranslationCell = function (tibetanTd, text, callback) {
  var table = tibetanTd.parents("table");
  var td = newTranslationCell(tibetanTd);
  td.html(text);
  table.find("tr.translation").append(td);
  translationIndex++;
  if (delay)
    $(window).scrollTop(table.parents(".pecha-page-container").offset().top);

  // Adjust letter-spacing if translation exceeds two lines
  if (text) {
    var maxHeight;
    if ($("body").hasClass("pecha-a3")) maxHeight = 19.3;
    if ($("body").hasClass("pecha-a4")) maxHeight = 19.3;
    if ($("body").hasClass("pecha-screen")) maxHeight = 32.73;

    var initialHeight = td[0].offsetHeight;
    if (initialHeight > maxHeight) {
      var letterSpacing = 0;
      var minLetterSpacing = -0.9;
      var fitsDetected = false;

      var adjustLetterSpacing = function () {
        letterSpacing -= 0.1;
        td.css({ "letter-spacing": letterSpacing + "px" });

        // Use requestAnimationFrame to ensure browser has painted before measuring
        requestAnimationFrame(function () {
          // Force reflow by accessing offsetHeight, then get precise height
          td[0].offsetHeight; // Force browser to recalculate layout
          var currentHeight = td.height();

          // Check if it fits
          if (currentHeight <= maxHeight) {
            if (fitsDetected) {
              // Already fit in previous iteration, now we're sure - stop
              td.css({ width: td.width() + "px" });
              if (callback) callback();
              return;
            } else {
              // First time detecting fit - continue one more iteration to be sure
              fitsDetected = true;
              setTimeout(adjustLetterSpacing, delay / 10);
              return;
            }
          } else if (letterSpacing <= minLetterSpacing) {
            // Hit minimum, lock width, highlight and continue
            td.css({
              width: td.width() + "px",
              background: "rgba(255,0,0,0.5)",
            });
            if (callback) callback();
            return;
          } else {
            // Continue reducing
            setTimeout(adjustLetterSpacing, delay / 10);
          }
        });
      };

      adjustLetterSpacing();
    } else {
      // Cell fits, lock the width and continue immediately
      td.css({ width: td.width() + "px" });
      if (callback) callback();
    }
  } else {
    // Empty text, continue immediately
    if (callback) callback();
  }
};

var rowSpansSum = function (table, position) {
  return _(table.find("tr.tibetan td").toArray().slice(0, position)).inject(
    function (sum, cell) {
      if ($(cell).attr("rowspan")) sum += 1;
      return sum;
    },
    0
  );
};

var findFirstTibetanForGroupWhereTranslationIsEmpty = function () {
  var tibetanTd = _($(".tibetan [data-index=" + translationIndex + "]")).find(
    function (td) {
      var table = $(td).parents("table");
      var position = table.find("tr.tibetan td").toArray().indexOf(td);
      var text = table
        .find(".translation td")
        .eq(position - rowSpansSum(table, position))
        .text();
      return text == "";
    }
  );
  return $(tibetanTd);
};

var addEmptyTdsIfNeeded = function (table, td) {
  var position = table.find("tr.tibetan td").toArray().indexOf(td.get(0));
  if (position > 0) {
    missingTds =
      position -
      table.find("tr.translation td").length -
      rowSpansSum(table, position);
    _(missingTds).times(function () {
      table.find("tr.translation").append("<td></td>");
    });
  }
};

var splitTranslationWords = function (text) {
  var words = [];
  text.split(/(\<span[^\/]*\/span\>)/).map(function (subtext) {
    if (subtext.match("<span")) words = words.concat([subtext]);
    else words = words.concat(subtext.split(" "));
  });
  return words;
};

var addNextTranslation = function () {
  var tibetanTd = findFirstTibetanForGroupWhereTranslationIsEmpty();
  var tibetanWidth = tibetanTd.width();
  var space = tibetanTd.find(".space") && tibetanTd.find(".space").width();
  var groupIsSplit =
    $(".tibetan [data-index=" + translationIndex + "]").length > 1;
  var group = pecha.groups[translationIndex];
  var table = tibetanTd.parents("table");
  addEmptyTdsIfNeeded(table, tibetanTd);
  if (group != undefined) {
    // Check if this is a mantra group and if mantra phonetics should be hidden
    var isMantraGroup = group.type === "mantra";
    var hideMantraPhonetics = !$("body").hasClass("with-mantra-phonetics");

    // If it's a mantra and we should hide phonetics, use empty translation
    var translation;
    if (isMantraGroup && hideMantraPhonetics) {
      translation = "";
    } else {
      translation = removeOptionalParts(group[selectedLanguage]);
    }

    if (!translation) {
      addTranslationCell(tibetanTd, "", function () {
        setTimeout(addNextTranslation, delay);
      });
      return;
    }
    if (!group.tibetan) {
      translationIndex++;
      setTimeout(addNextTranslation, delay);
      return;
    }
    if (groupIsSplit) {
      var td = newTranslationCell(tibetanTd);
      td.css({ "padding-left": space });
      table.find("tr.translation").append(td);
      var height = td.height();
      var wordIndex = 0;
      var words = splitTranslationWords(translation);
      var addNextWord = function () {
        var word = words[wordIndex];
        if (word != undefined) {
          td.append("<span>" + word + " </span>");
          if (td.height() <= height) {
            // If the word fits try the next one
            wordIndex++;
            setTimeout(function () {
              addNextWord();
            }, delay);
          } else {
            // If the word  doesn't fit then continue in the next cell
            td.find("span:last").remove();
            var tibetan = findFirstTibetanForGroupWhereTranslationIsEmpty();
            var remainingWords = _(words).rest(wordIndex).join(" ");
            addTranslationCell(tibetan, remainingWords, function () {
              setTimeout(addNextTranslation, delay);
            });
          }
        } else {
          var tibetan = $(
            ".tibetan [data-index=" + translationIndex + "]:last"
          );
          addTranslationCell(tibetan, "", function () {
            setTimeout(addNextTranslation, delay);
          });
        }
      };
      addNextWord();
    } else {
      addTranslationCell(tibetanTd, translation, function () {
        setTimeout(addNextTranslation, delay);
      });
    }
  } else {
    // If all translations have been added
    fitLinesTooWide();
    setTimeout(function () {
      revealTranslationsThatAreTooTall();
      endGeneration();
    }, 500);
  }
};

var revealTranslationsThatAreTooTall = function () {
  var height;
  if ($("body").hasClass("pecha-a3")) height = 19.3;
  if ($("body").hasClass("pecha-a4")) height = 19.3;
  if ($("body").hasClass("pecha-screen")) height = 32.73;
  $(".pecha-content tr.translation").each(function () {
    if ($(this).height() > height)
      $(this).css({ background: "rgba(255,0,0,0.5)" });
  });
};

var pechaContentWidthFor = function (line) {
  return $(line).parents(".pecha-content").width();
};

// Happens that lines become wider after adding a translation (since no hyhenation for now)
// So we adjust in case it happens
var fitLinesTooWide = function () {
  var tolerance = 0.5; // Allow 0.5px tolerance to avoid unnecessary adjustments
  _($(".line")).each(function (line) {
    var lineWidth = $(line).width();
    var maxWidth = pechaContentWidthFor(line);
    if (lineWidth > maxWidth + tolerance) {
      decreaseUntilItFits($(line));
    }
  });
};

var fitWidth = function (table) {
  if (table.width() < pechaContentWidthFor(table)) increaseUntilItFits(table);
  else if (table.width() > pechaContentWidthFor(table))
    decreaseUntilItFits(table);
};

var increaseUntilItFits = function (table) {
  var spacing = 0.01;
  var maxSpacing = 5; // Maximum 5px letter-spacing to prevent infinite loop
  var setWidth = function () {
    table.css({ "letter-spacing": spacing + "px" });
    if (table.width() > pechaContentWidthFor(table)) {
      // Found the right spacing, use previous value
      table.css({ "letter-spacing": spacing - 0.01 + "px" });
    } else if (spacing >= maxSpacing) {
      // Hit maximum, stop here
      table.css({ "letter-spacing": maxSpacing + "px" });
    } else {
      spacing += 0.01;
      setTimeout(setWidth, delay / 10);
    }
  };
  setWidth();
};

var decreaseUntilItFits = function (table) {
  var spacing = 0;
  var minSpacing = -2; // Minimum -2px letter-spacing to prevent infinite loop
  var tolerance = 0.5; // Allow 0.5px tolerance
  var setWidth = function () {
    table.css({ "letter-spacing": spacing + "px" });
    var tableWidth = table.width();
    var maxWidth = pechaContentWidthFor(table);
    if (tableWidth <= maxWidth + tolerance) {
      // Fits now, keep this spacing
      table.css({ "letter-spacing": spacing + "px" });
    } else if (spacing <= minSpacing) {
      // Hit minimum, stop here
      table.css({ "letter-spacing": minSpacing + "px" });
    } else {
      spacing -= 0.01;
      setTimeout(setWidth, delay / 10);
    }
  };
  setWidth();
};
