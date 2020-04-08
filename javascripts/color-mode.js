var colorMode = 0;

var switchColorMode = function() {
  colorMode++;
  if (colorMode > 2) colorMode = 0;
}

$(document).on('click', '#color-mode-button', function() {
  switchColorMode();
  switch(colorMode) {
    case 0:
      $('#light-mode').remove();
      $('#lapis-lazuli-mode').remove();
      break;
    case 1:
      $('#lapis-lazuli-mode').remove();
      $('head').append('<link id="light-mode" rel="stylesheet" href="stylesheets/color-modes/light-mode.css">');
      break;
    case 2:
      $('#light-mode').remove();
      $('head').append('<link id="lapis-lazuli-mode" rel="stylesheet" href="stylesheets/color-modes/gold-on-lapis-lazuli.css">');
      break;
  }
  $('#effects').remove();
  $('head').append('<link id="effects" rel="stylesheet" href="stylesheets/effects.css">');
});