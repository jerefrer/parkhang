var currentPageIndex = 0;

var stepsClass = function() {
  if      (isAPecha()       ) return '.pecha-page-container'
  else if (isAPage()        ) return '.line'
  else if (isAClassicPage() ) return '.line'
  else                        return '';
}

var steps = function() {
  if ($('#title-page').find(stepsClass()).length)
    return $('#title-page').add($(stepsClass()).slice(1));
  else
    return $('#title-page, '+stepsClass());
}

var scrollToElement = function(element) {
  $('iframe, #document, html, body').stop();
  $.scrollTo(element, 400, {offset: stepsClass() == '.line' && -8 || 0});
}

var maxIndex = function() {
  return steps().length-1;
}

var scrollToCurrentPecha = function() {
  if (currentPageIndex > maxIndex()) currentPageIndex = maxIndex();
  else if (currentPageIndex < 0) currentPageIndex = 0;
  scrollToElement(steps().eq(currentPageIndex));
}

var scrolling;
var scrollingSpeed = 400;
var scroll = function(numberOfPages) {
  if (!scrolling) {
    scrolling = true;
    currentPageIndex += numberOfPages;
    scrollToCurrentPecha();
    setTimeout(function() { scrolling = false; }, scrollingSpeed);
  }
}

$(document).on('keydown', function(event) {
  if (stepsClass()) {
    if      (event.keyCode == 33) { event.preventDefault(); scroll(-999); } // Page Up
    else if (event.keyCode == 34) { event.preventDefault(); scroll( 999); } // Page Down
    else if (event.keyCode == 36) { event.preventDefault(); scroll(-999); } // Origin
    else if (event.keyCode == 35) { event.preventDefault(); scroll( 999); } // End
    else if (event.keyCode == 38) { event.preventDefault(); scroll(  -1); } // Up
    else if (event.keyCode == 40) { event.preventDefault(); scroll(   1); } // Down
    else if (event.keyCode == 37) { event.preventDefault(); scroll(  -2); } // Left
    else if (event.keyCode == 39) { event.preventDefault(); scroll(   2); } // Right
  }
});
