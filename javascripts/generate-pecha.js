var pechaContentWidth;
var numberOfLinesPerPage;
var lineWidth = 0;
var pageNumber = 1;
var physicalPageNumber = 1;
var groupIndex = 0;
var translationIndex = 0;
var pageBeginningMarker = '༄༅།  །';
var spaceBetweenGroups = '<span class="space"></span>';

var pechaLeftMargin = function() {
  var margin = $('<div class="pecha-left-margin">');
  margin.append('<div class="pecha-left-margin-first">དང་པོ་པ་ནི།</div>');
  margin.append('<div class="pecha-left-margin-last">དང་པོ་པ་ནི།</div>');
  margin.append('<div class="pecha-left-margin-center">དང་པོ་པ་ནི།</div>');
  return margin;
}

var pechaRightMargin = function() {
  var margin = $('<div class="pecha-right-margin">');
  if (pageNumber % 2 == 1) { // Even page
    margin.append('<div class="pecha-right-margin-first">དང་པོ་པ་ནི།</div>');
    margin.append('<div class="pecha-right-margin-last">དང་པོ་པ་ནི།</div>');
    margin.append('<div class="pecha-right-margin-center">'+tibetanNumber(physicalPageNumber)+'</div>');
  } else { // Odd page
    margin.append('<div class="pecha-right-margin-first"></div>');
    margin.append('<div class="pecha-right-margin-last"></div>');
    margin.append('<div class="pecha-right-margin-center">དང་པོ་པ་ནི་དང་པོ་པ་ནི།</div>');
  }
  return margin;
}

var addPechaTitlePage = function() {
  var translation = pecha.title[selectedLanguage];
  var titlePage = '\
    <div class="pecha-page-container" id="title-page">\
      <div class="pecha-title-page">\
        <div class="pecha-title-page-inner">\
          <div class="pecha-title-page-inner-inner">\
            <div class="pecha-title-left-box"></div>\
            <div class="pecha-title-left-gap"></div>\
            <div class="pecha-title-content">\
              <table class="line">\
                <tbody>\
                  <tr class="tibetan">\
                    <td>'+pecha.title.tibetan.full+'</td>\
                  </tr>\
                  <tr class="translation">\
                    <td>\
                      <div class="title">'+translation.title+'</div>'+
                      (translation.subtitle && '<div class="subtitle">'+translation.subtitle+'</div>' || '')+'\
                    </td>\
                  </tr>\
                </tbody>\
              </table>\
            </div>\
            <div class="pecha-title-right-gap"></div>\
            <div class="pecha-title-right-box"></div>\
          </div>\
        </div>\
      </div>\
    </div>\
  ';
  $('#main').append(titlePage);
  setTimeout(function() {
    var pageHeight = $('.pecha-page-container').height();
    var contentHeight = $('.pecha-title-content').height();
    $('.pecha-title-page').css({height: 'calc('+contentHeight+'px + (3px * 6) + (3 * 3pt) + (2 * 6pt) + (2 * 17.52pt) - 0.5px)' });
    $('.pecha-title-page').css({'margin-top': 'calc(('+pageHeight+'px - '+$('.pecha-title-page').outerHeight()+'px) / 2)'});
    $('.pecha-title-page').css({'margin-bottom': 'calc(('+pageHeight+'px - '+$('.pecha-title-page').outerHeight()+'px) / 2)'});
  }, 200);
  pageNumber++;
}

var renderBeginningPage = function() {
  var pechaPage = $('<div class="pecha-beginning-page pecha-page">');
  pechaPage.append(pechaLeftMargin());
  pechaPage.append('\
    <div class="pecha-beginning-page-inner">\
      <div class="pecha-beginning-page-inner-inner">\
        <div class="pecha-beginning-left-box"></div>\
        <div class="pecha-beginning-left-gap"></div>\
        <div class="pecha-content"></div>\
        <div class="pecha-beginning-right-gap"></div>\
        <div class="pecha-beginning-right-box"></div>\
      </div>\
    </div>\
  ');
  pechaPage.append(pechaRightMargin());
  return pechaPage;
}

var renderStandardPage = function() {
  var pechaPage = $('<div class="pecha-standard-page pecha-page">');
  pechaPage.append(pechaLeftMargin());
  pechaPage.append('<div class="pecha-content"></div>');
  pechaPage.append(pechaRightMargin());
  return pechaPage;
}

var addPageTitlePage = function() {
  var translation = pecha.title[selectedLanguage];
  var titlePage = '\
    <div class="pecha-page-container" id="title-page">\
      <div class="pecha-title-page">\
        <div class="pecha-title-page-content">\
          <div class="tibetan">\
            '+pecha.title.tibetan.full+'\
          </div>\
          <div class="translation">\
            <div class="title">'+translation.title+'</div>'+
            (translation.subtitle && '<div class="subtitle">'+translation.subtitle+'</div>' || '')+'\
          </div>\
        </div>\
      </div>\
    </div>\
  ';
  $('#main').append(titlePage);
  setTimeout(function() {
    var pageHeight = $('.pecha-title-page').height();
    var contentHeight = $('.pecha-title-page-content').height();
    $('.pecha-title-page').css({'margin-top': 'calc(('+pageHeight+'px - '+contentHeight+'px) / 2)'});
  }, 200);
  pageNumber++;
}

var renderSimplePage = function() {
  var pechaPage = $('<div class="pecha-simple-page pecha-page">');
  pechaPage.append('<div class="pecha-content"></div>');
  return pechaPage;
}

var evenPage = function() {
  return pageNumber % 2 == 0;
}

var oddPage = function() {
  return pageNumber % 2 == 1;
}

var addNextPechaPage = function() {
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
  $('#main').append(pechaPageContainer);
  pechaContentWidth = $('.pecha-page:last .pecha-content').width();
  addNewEmptyLine();
  if (isAPage() || oddPage() || pageNumber <= 3) {
    $('tr.tibetan:last').append('<td class="page-beginning">'+pageBeginningMarker+'</td>');
    $('tr.translation:last').append('<td class="page-beginning"></td>');
    lineWidth = $('tr.tibetan:last td:last').width();
  } else {
    lineWidth = 0;
  }
  pageNumber++;
  if (evenPage()) physicalPageNumber++;
  if (delay) $(window).scrollTop(pechaPageContainer.offset().top);
}

var addNewEmptyLine = function() {
  $('.pecha-page:last .pecha-content').append('\
    <table class="line">\
      <tbody>\
        <tr class="tibetan"></tr>\
        <tr class="translation"></tr>\
      </tbody>\
    </table>\
  ');
}

var pageOverflows = function() {
  var pageHeightWithOnMoreLine = $('.pecha-page:last').height() + $('.line:last').height();
  var pageMaxHeight = parseFloat($('.pecha-page-container:last').height());
  return pageHeightWithOnMoreLine > pageMaxHeight;
}

var continueOnNewLineStartingWith = function(remainingWords) {
  fitWidth($('table:last'), pechaContentWidth);
  if (isAPage() && !isPageScreen() && pageOverflows())
    addNextPechaPage();
  else if ($('.pecha-page:last .line').length == numberOfLinesPerPage)
    addNextPechaPage();
  else {
    addNewEmptyLine();
    lineWidth = 0;
  }
  setTimeout(function() {
    addNextGroup(remainingWords);
  }, delay);
}

var newTibetanCell = function(index) {
  var line = pecha.groups[index];
  var td = $('<td>');
  td.attr('data-index', index);
  if (line.smallWritings) td.addClass('small-writings');
  return td;
}

var addRowspanCell = function(td, text) {
  var fontSize = 10;
  var ratioPerCharacterPerFontPixel = 0.45;
  var width = text.length * fontSize * ratioPerCharacterPerFontPixel / 2.5;
  td.attr('rowspan', 2).css({
    'min-width': width,
    width: width
  });
  td.html(text);
}

var addNextGroup = function(remainingWords) {
  var group = pecha.groups[groupIndex];
  if (remainingWords || group) {
    var td = newTibetanCell(groupIndex);
    var text = remainingWords || group.tibetan;
    if (!group.tibetan) {
      text = group[selectedLanguage];
      addRowspanCell(td, text);
    } else {
      if ($('.pecha-page tr.tibetan:last td:not(.page-beginning)').length)
        td.html(spaceBetweenGroups + text);
      else
        td.html(text);
    }
    $('.pecha-page tr.tibetan:last').append(td);
    if (lineWidth + td.width() <= pechaContentWidth) { // If group fits then add next group
      lineWidth += td.width();
      groupIndex++;
      setTimeout(function() {
        addNextGroup();
      }, delay);
    } else { // If group overflows
      td.html(spaceBetweenGroups);
      if (lineWidth + td.width() + 120 <= pechaContentWidth) { // And there is some space left (with some margin)
        var wordIndex = 0;
        var words = text.split('་');
        var addNextWord = function() { 
          var td = $('.pecha-page tr.tibetan td:last');
          var word = words[wordIndex];
          if (word) { // Then if there is more words
            td.append('<span>'+word+(words[wordIndex+1] && '་' || '')+'</span>');
            if (lineWidth + td.width() <= pechaContentWidth) { // And the next ones fits, add it
              wordIndex++;
              setTimeout(function() {
                addNextWord();
              }, delay);
            } else if (words.slice(wordIndex).length == 1) { // And there is just one word left, tighten the line to make it fit
              continueOnNewLineStartingWith('');
            } else { // And there is at least two and they don't fit, start a new line with them
              td.find('span:last').remove();
              if (!td.find('span:not(.space)').length) td.remove();
              var remainingWords = _(words).rest(wordIndex).join('་');
              continueOnNewLineStartingWith(remainingWords);
            }
          } else {
            lineWidth += td.width();
            groupIndex++;
            addNextGroup(); 
          }
        }
        addNextWord();
      } else { // If there isn't enough space at the end of the line start a new line
        td.remove();
        continueOnNewLineStartingWith('');
      }
    }
  } else { // If all groups have been processed
    addNextTranslation();
  }
}

var newTranslationCell = function(tibetanTd) {
  var width = tibetanTd.width();
  var space = tibetanTd.find('.space') && tibetanTd.find('.space').width();
  var line = pecha.groups[translationIndex];
  var td = $('<td>');
  if (space) td.css({'padding-left': space+'px'});
  if (line.smallWritings) td.addClass('small-writings');
  return td;
}

var addTranslationCell = function(tibetanTd, text) {
  var table = tibetanTd.parents('table');
  var td = newTranslationCell(tibetanTd);
  td.html(text);
  table.find('tr.translation').append(td);
  translationIndex++;
  if (delay) $(window).scrollTop(table.parents('.pecha-page-container').offset().top);
}

var rowSpansSum = function(table, position) {
  return _(table.find('tr.tibetan td').toArray().slice(0, position)).inject(function(sum, cell) {
    if ($(cell).attr('rowspan')) sum += 1;
    return sum;
  }, 0);
}

var findFirstTibetanForGroupWhereTranslationIsEmpty = function() {
  var tibetanTd = _($('.tibetan [data-index='+translationIndex+']')).find(function(td) {
    var table = $(td).parents('table');
    var position = table.find('tr.tibetan td').toArray().indexOf(td);
    var text = table.find('.translation td').eq(position - rowSpansSum(table, position)).text();
    return text == '';
  });
  return $(tibetanTd);
}

var addEmptyTdsIfNeeded = function(table, td) {
  var position = table.find('tr.tibetan td').toArray().indexOf(td.get(0));
  if (position > 0) {
    missingTds = position - table.find('tr.translation td').length - rowSpansSum(table, position);
    _(missingTds).times(function() {
      table.find('tr.translation').append('<td></td>');
    });
  }
}

var splitTranslationWords = function(text) {
  var words = [];
  text.split(/(\<span[^\/]*\/span\>)/).map(function(subtext) {
    if (subtext.match('<span')) words = words.concat([subtext]);
    else words = words.concat(subtext.split(' '));
  })
  return words;
}

var addNextTranslation = function() {
  var tibetanTd = findFirstTibetanForGroupWhereTranslationIsEmpty();
  var tibetanWidth = tibetanTd.width(); 
  var space = tibetanTd.find('.space') && tibetanTd.find('.space').width()
  var groupIsSplit = $('.tibetan [data-index='+translationIndex+']').length > 1;
  var group = pecha.groups[translationIndex];
  var table = tibetanTd.parents('table');
  addEmptyTdsIfNeeded(table, tibetanTd);
  if (group != undefined) {
    var translation = group[selectedLanguage];
    if (!group.tibetan) {
      translationIndex++;
      setTimeout(addNextTranslation, delay);
      return;
    }
    if (groupIsSplit) {
      var td = newTranslationCell(tibetanTd);
      td.css({'padding-left': space});
      table.find('tr.translation').append(td);
      var height = td.height();
      var wordIndex = 0;
      var words = splitTranslationWords(translation);
      var addNextWord = function() {
        var word = words[wordIndex];
        if (word != undefined) {
          td.append('<span>'+word+' </span>');
          if (td.height() <= height) { // If the word fits try the next one
            wordIndex++;
            setTimeout(function() {
              addNextWord();
            }, delay);
          } else { // If the word  doesn't fit then continue in the next cell
            td.find('span').last().remove();
            var tibetan = findFirstTibetanForGroupWhereTranslationIsEmpty();
            var remainingWords = _(words).rest(wordIndex).join(' ');
            addTranslationCell(tibetan, remainingWords);
            setTimeout(addNextTranslation, delay);
          }
        } else {
          var tibetan = $('.tibetan [data-index='+translationIndex+']:last');
          addTranslationCell(tibetan, '');
          setTimeout(addNextTranslation, delay);
        }
      }
      addNextWord();
    } else {
      addTranslationCell(tibetanTd, translation);
      setTimeout(addNextTranslation, delay);
    }
  } else { // If all translations have been added
    fitLinesTooWide();
    setTimeout(function() {
      revealTranslationsThatAreTooTall();
      endGeneration();
    }, 500)
  }
}

var revealTranslationsThatAreTooTall = function() {
  var height;
  if ($('body').hasClass('a3')) height = 19.3;
  if ($('body').hasClass('a4')) height = 19.3;
  if ($('body').hasClass('screen')) height = 32.73;
  $('.pecha-content tr.translation').each(function() {
    if ($(this).height() > height) $(this).css({background: 'rgba(255,0,0,0.5)'});
  })
}

// Happens that lines become wider after adding a translation (since no hyhenation for now)
// So we adjust in case it happens
var fitLinesTooWide = function(maxWidth) {
  _($('.line')).each(function(line) { 
    if ($(line).width() > pechaContentWidth) fitWidth($(line))
  });
}

var fitWidth = function(table) {
  if      (table.width() < pechaContentWidth) increaseUntilItFits(table);
  else if (table.width() > pechaContentWidth) decreaseUntilItFits(table);
}

var increaseUntilItFits = function(table) {
  var spacing = 0.01;
  var setWidth = function() {
    table.css({'letter-spacing': spacing+'px'});
    if (table.width() > pechaContentWidth)
      table.css({'letter-spacing': (spacing-0.01)+'px'});
    else {
      spacing += 0.01;
      setTimeout(setWidth, delay/10);
    }
  }
  setWidth();
}

var decreaseUntilItFits = function(table) {
  var spacing = 0.01;
  var setWidth = function() {
    table.css({'letter-spacing': spacing+'px'});
    if (table.width() < pechaContentWidth)
      table.css({'letter-spacing': (spacing-0.01)+'px'});
    else {
      spacing -= 0.01;
      setTimeout(setWidth, delay/10);
    }
  }
  setWidth();
}