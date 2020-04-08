var SplitPages = {
  isTibetanPage: true,
  margins: [cmToPixel(1.5), cmToPixel(3), cmToPixel(1.5), cmToPixel(3)],
  tibetanGroupIndex: 0,
  translationGroupIndex: 0,
  pageNumber: 0,
  initialize: function() {
    this.addPages();
    this.addNextTibetanLine();
  },
  pageWidth: function() {
    if      (bodyHasClass('a4'))     return cmToPixel(21.006)
    else if (bodyHasClass('a5'))     return cmToPixel(14.800)
    else if (bodyHasClass('screen')) return 0.9 * $(window).width();
  },
  pageHeight: function() {
    if      (bodyHasClass('a4'))     return cmToPixel(29.693)
    else if (bodyHasClass('a5'))     return cmToPixel(20.997)
    else if (bodyHasClass('screen')) return Infinite;
  },
  innerPageWidth: function() {
    return this.pageWidth() - this.margins[1] - this.margins[3];
  },
  innerPageHeight: function() {
    return this.pageHeight() - this.margins[0] - this.margins[2];
  },
  lastTibetanPage: function() {
    return $('.tibetan-page:last .page-inner');
  },
  lastTranslationPage: function() {
    return $('.translation-page:last .page-inner');
  },
  pageNumberDiv: function(options) {
    var div = $('<div class="page-number">');
    div.css({ width: this.innerPageWidth() });
    if (options && options.tibetan) div.html(tibetanNumber(this.pageNumber))
    else                            div.html(this.pageNumber);
    return div;
  },
  translationPageNumber: function() {
    return this.pageNumber;
  },
  addPages: function() {
    this.pageNumber++;
    var tibetanPage = $('<div class="split-page-container tibetan-page">');
    var translationPage = $('<div class="split-page-container translation-page">');
    var pageStyle = {
      width: this.pageWidth(),
      height: this.pageHeight(),
      padding: this.margins[0]+'px '+
               this.margins[1]+'px '+
               this.margins[2]+'px '+
               this.margins[3]+'px'
    };
    $(tibetanPage).css(pageStyle);
    $(translationPage).css(pageStyle);
    tibetanPage.append(this.pageNumberDiv({tibetan: true}));
    translationPage.append(this.pageNumberDiv());
    tibetanPage.append('<div class="page-inner"></div>');
    translationPage.append('<div class="page-inner"></div>');
    $('#main').append(tibetanPage);
    $('#main').append(translationPage);
  },
  makePagesEven: function() {
    var that = this;
    if (this.tibetanGroupIndex > this.translationGroupIndex) {
      _(this.tibetanGroupIndex - this.translationGroupIndex).times(function(i) {
        $('.tibetan-page .line[data-group-index='+(that.translationGroupIndex+i+1)+']').remove();
      });
      this.translationGroupIndex++;
      this.tibetanGroupIndex = this.translationGroupIndex;
    } else if (this.tibetanGroupIndex < this.translationGroupIndex) {
      _(this.translationGroupIndex - this.tibetanGroupIndex).times(function(i) {
        $('.translation-page .line[data-group-index='+(that.tibetanGroupIndex+i+1)+']').remove();
      })
      this.tibetanGroupIndex++;
      this.translationGroupIndex = this.tibetanGroupIndex;
    }
  },
  addNextTibetanLine: function() {
    var group = pecha.groups[this.tibetanGroupIndex];
    if (group) {
      var line = $('<div class="line" data-group-index='+this.tibetanGroupIndex+'>');
      var tibetanLine = $('<div class="tibetan">');
      tibetanLine.html(group.tibetan);
      if (group.smallWritings)
        tibetanLine.addClass('small-writings');
      if (group.mergeNext) {
        this.tibetanGroupIndex++;
        var nextGroup = pecha.groups[this.tibetanGroupIndex];
        tibetanLine.append('<span class="space"></span>'+nextGroup.tibetan);
      }
      line.append(tibetanLine);
      this.lastTibetanPage().append(line);
      if (this.lastTibetanPage().height() > this.innerPageHeight()) {
        $(line).remove();
        this.tibetanGroupIndex--;
        this.addNextTranslationLine();
      } else {
        this.tibetanGroupIndex++;
        this.addNextTibetanLine();
      }
    } else {
      this.addNextTranslationLine();
    }
  },
  addNextTranslationLine: function() {
    var group = pecha.groups[this.translationGroupIndex];
    if (group) {
      var line = $('<div class="line" data-group-index='+this.translationGroupIndex+'>');
      var transliterationLine = $('<div class="transliteration">');
      var translationLine = $('<div class="translation">');
      transliterationLine.html(group.transliteration);
      translationLine.html(group[selectedLanguage]);
      if (group.smallWritings) {
        translationLine.addClass('small-writings');
        transliterationLine.addClass('small-writings');
      }
      if (group.mergeNext) {
        this.translationGroupIndex++;
        var nextGroup = pecha.groups[this.translationGroupIndex];
        translationLine.append('<span class="space"></span>'+nextGroup[selectedLanguage]);
      }
      if (group.transliteration) line.append(transliterationLine);
      line.append(translationLine);
      this.lastTranslationPage().append(line);
      if (this.lastTranslationPage().height() > this.innerPageHeight()) {
        $(line).remove();
        this.translationGroupIndex--;
        this.makePagesEven();
        this.addPages();
        this.addNextTibetanLine();
      } else {
        this.translationGroupIndex++;
        this.addNextTranslationLine();
      }
    } else {
      this.makePagesEven();
      endGeneration();
    }
  }
}

var generateSplitPages = function() {
  SplitPages.initialize();
}