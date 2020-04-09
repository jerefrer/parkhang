var SplitPages = {
  isTibetanPage: true,
  margins: [cmToPixel(1.5), cmToPixel(3), cmToPixel(1.5), cmToPixel(3)],
  tibetanGroupIndex: 0,
  translationGroupIndex: 0,
  pageNumber: 0,
  initialize: function() {
    this.addTitlePage();
    this.addTwoPages();
    this.addNextTibetanLine();
  },
  pageWidth: function() {
    if      (bodyHasClass('a4'))     return cmToPixel(21.006)
    else if (bodyHasClass('a5'))     return cmToPixel(21.006)
    else if (bodyHasClass('screen')) return 0.9 * $(window).width();
  },
  pageHeight: function() {
    if      (bodyHasClass('a4'))     return cmToPixel(29.693)
    else if (bodyHasClass('a5'))     return cmToPixel(29.693)
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
  newPage: function() {
    var page = $('<div class="split-page-container">');
    page.css({
      width:   this.pageWidth()+'px',
      height:  this.pageHeight()+'px',
      padding: this.margins[0]+'px '+
               this.margins[1]+'px '+
               this.margins[2]+'px '+
               this.margins[3]+'px'
    });
    return page;
  },
  addTitlePage: function() {
    var that = this;
    var translation = pecha.title[selectedLanguage];
    var titlePage = this.newPage();
    titlePage.attr('id', 'title-page');
    titlePage.html('\
      <div class="split-title-page-content">\
        <div class="tibetan">\
          '+pecha.title.tibetan.full+'\
        </div>\
        <div class="translation">\
          <div class="title">'+translation.title+'</div>'+
          (translation.subtitle && '<div class="subtitle">'+translation.subtitle+'</div>' || '')+'\
        </div>\
        <img class="logo" src="images/padmakara-logo.png">\
      </div>\
    ');
    $('#main').append(titlePage);
    setTimeout(function() {
      var contentHeight = $('.split-title-page-content').height();
      $('.split-title-page-content').css({'margin-top': 'calc(('+that.innerPageHeight()+'px - '+contentHeight+'px) / 2)'});
    }, 200);
    this.pageNumber++;
  },
  addTwoPages: function() {
    this.pageNumber++;
    var tibetanPage     = this.newPage().addClass('tibetan-page');
    var translationPage = this.newPage().addClass('translation-page');
    tibetanPage.append(this.pageNumberDiv({tibetan: true}));
    tibetanPage.append('<div class="page-inner"></div>');
    translationPage.append(this.pageNumberDiv());
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
      if (group.newPage) console.log('tibetan:'+$('.tibetan-page:last .line').length);
      if (group.newPage && $('.tibetan-page:last .line').length) {
        this.addNextTranslationLine();
        return;
      }
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
  setLine: function(line, text, group) {
    line.html(text);
    if (group.smallWritings) line.addClass('small-writings');
    if (group.practiceTitle) line.addClass('practice-title');
  },
  addNextTranslationLine: function() {
    var group = pecha.groups[this.translationGroupIndex];
    if (group) {
      if (group.newPage) console.log('translation:'+$('.translation-page:last .line').length);
      if (group.newPage && $('.translation-page:last .line').length) {
        this.makePagesEven();
        this.addTwoPages();
        this.addNextTibetanLine();
        return;
      }
      var line = $('<div class="line" data-group-index='+this.translationGroupIndex+'>');
      var transliterationLine = $('<div class="transliteration">');
      var translationLine = $('<div class="translation">');
      this.setLine(transliterationLine, group.transliteration, group);
      this.setLine(translationLine, group[selectedLanguage], group);
      if (group.mergeNext) {
        this.translationGroupIndex++;
        var nextGroup = pecha.groups[this.translationGroupIndex];
        this.setLine(translationLine, '<span class="space"></span>'+nextGroup[selectedLanguage], nextGroup);
      }
      if (group.transliteration) line.append(transliterationLine);
      line.append(translationLine);
      this.lastTranslationPage().append(line);
      if (this.lastTranslationPage().height() > this.innerPageHeight()) {
        $(line).remove();
        this.translationGroupIndex--;
        this.makePagesEven();
        this.addTwoPages();
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