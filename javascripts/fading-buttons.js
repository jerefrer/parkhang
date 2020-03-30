var hoveringOverButtons;
var hiddenButtonsLoop;
var colorModeLoop;
var revealDuration = 300;
var fadeAttributes   = {transition: 'all 0.2s ease-in-out', left:  '5px', opacity: 0, transform: 'rotate(-90deg)'};
var revealAttributes = {transition: 'all 0.2s ease-in-out', left: '20px', opacity: 1, transform: 'rotate(0deg)'};

$(document).on('mouseenter', '#print-button, #color-mode-button',
  function() { hoveringOverButtons =  true }
);
$(document).on('mouseleave', '#print-button, #color-mode-button',
  function() { hoveringOverButtons = false }
);

var fadeButtons = function() {
  $('#print-button, #color-mode-button').finish();
  $('#color-mode-button').css(fadeAttributes, revealDuration);
  setTimeout(function() {
    $('#print-button').css(fadeAttributes, revealDuration);
  }, 200);
}

var waitThenFade = function() {
  hiddenButtonsLoop = setTimeout(fadeButtons, 3000);
}

$(document).mousemove(function() {
  clearTimeout(hiddenButtonsLoop);
  clearTimeout(colorModeLoop);
  if (!$('body').hasClass('no-pointer')) {
    $('#print-button').css(revealAttributes, revealDuration);
    colorModeLoop = setTimeout(function() {
      $('#color-mode-button').css(revealAttributes, revealDuration);
    }, 75);
    if (!hoveringOverButtons) waitThenFade();
  }
})