var currentGroupIndex = 0;

var addNextPageLine = function() {
  var group = pecha.groups[currentGroupIndex];
  if (group) {
    var tibetanLine = $('<div class="tibetan">');
    var translationLine = $('<div class="translation">');
    tibetanLine.html(group.tibetan);
    translationLine.html(group[selectedLanguage]);
    if (group.smallWritings) {
      tibetanLine.addClass('small-writings');
      translationLine.addClass('small-writings');
    }
    if (group.mergeNext) {
      currentGroupIndex++;
      var nextGroup = pecha.groups[currentGroupIndex];
      tibetanLine.append('<span class="space"></span>'+nextGroup.tibetan);
      translationLine.append(nextGroup[selectedLanguage]);
    }
    var line = $('<div class="line">');
    line.append(tibetanLine);
    line.append(translationLine);
    $('#main').append(line);
    currentGroupIndex++;
    addNextPageLine();
  } else {
    setTimeout(function() {
      $('#print-button').show();
      $('#color-mode-button').show();
      $('#loading-overlay').fadeOut(500);
    }, 500);
  }
}

var generateClassicPages = function() {
  addNextPageLine();
}