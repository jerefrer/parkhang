// Remove optional markers but keep the content for classic pages
var removeOptionalMarkers = function (text) {
  if (!text) return text;
  return text.replace(/<optional>/g, "").replace(/<\/optional>/g, "");
};

// Convert <small>...</small> markers to span.small-writings for Tibetan text
var convertSmallMarkers = function (text) {
  if (!text) return text;
  return text.replace(/<small>(.*?)<\/small>/g, '<span class="small-writings">$1</span>');
};

var ClassicPage = {
  margins: cmToPixel(1),
  currentGroupIndex: 0,
  initialize: function () {
    this.addPage();
    this.addNextLine();
  },
  pageWidth: function () {
    if (bodyHasClass("a4")) return cmToPixel(21.006);
    else if (bodyHasClass("a5")) return cmToPixel(14.8);
    else if (bodyHasClass("screen")) return 0.9 * $(window).width();
  },
  pageHeight: function () {
    if (bodyHasClass("a4")) return cmToPixel(29.693);
    else if (bodyHasClass("a5")) return cmToPixel(20.997);
    else if (bodyHasClass("screen")) return Infinity;
  },
  innerPageWidth: function () {
    return this.pageWidth() - this.margins * 2;
  },
  innerPageHeight: function () {
    return this.pageHeight() - this.margins * 2;
  },
  lastPage: function () {
    return $(".classic-page-container:last");
  },
  addPage: function () {
    var page = $('<div class="classic-page-container">');
    page.css({ width: this.innerPageWidth() });
    $("#main").append(page);
  },
  addNextLine: function () {
    var group = pecha.groups[this.currentGroupIndex];
    if (group) {
      var tibetanLine = $('<div class="tibetan">');
      var translationLine = $('<div class="translation">');
      var phoneticsLine;
      tibetanLine.html(convertSmallMarkers(group.tibetan));
      translationLine.html(removeOptionalMarkers(group[selectedLanguage]));
      if (includeTransliteration) {
        phoneticsLine = $('<div class="phonetics">');
        phoneticsLine.html(group.phonetics);
      }
      if (group.smallWritings) {
        tibetanLine.addClass("small-writings");
        translationLine.addClass("small-writings");
        if (includeTransliteration && phoneticsLine)
          phoneticsLine.addClass("small-writings");
      }
      if (group.mergeNextWhenLineByLine) {
        this.currentGroupIndex++;
        var nextGroup = pecha.groups[this.currentGroupIndex];
        tibetanLine.append('<span class="space"></span>' + convertSmallMarkers(nextGroup.tibetan));
        translationLine.append(removeOptionalMarkers(nextGroup[selectedLanguage]));
        if (includeTransliteration && phoneticsLine)
          phoneticsLine.append(nextGroup.phonetics);
      }
      var line = $('<div class="line">');
      line.append(tibetanLine);
      if (includeTransliteration && phoneticsLine) line.append(phoneticsLine);
      line.append(translationLine);
      this.lastPage().append(line);
      if (this.lastPage().height() > this.innerPageHeight()) {
        this.addPage();
        this.lastPage().append(line);
      }
      this.currentGroupIndex++;
      this.addNextLine();
    } else {
      endGeneration();
    }
  },
};

var generateClassicPages = function () {
  ClassicPage.initialize();
};
