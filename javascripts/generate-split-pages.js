var SplitPages = {
  isTibetanPage: true,
  margins: [cmToPixel(1.5), cmToPixel(2), cmToPixel(1.5), cmToPixel(2)],
  tibetanGroupIndex: 0,
  translationGroupIndex: 0,
  pageNumber: 0,
  initialize: function() {
    this.addTitlePage();
    if (this.thereIsAnIndex()) this.addIndexPage();
    this.addTwoPages();
    this.addNextTibetanLine();
  },
  thereIsAnIndex: function() {
    return _(pecha.groups).where({linkInIndex: true}).length;
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
          <div>'+pecha.title.tibetan.full+'</div>\
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
  linkId: function(group) {
    return 'link-'+pecha.groups.indexOf(group);
  },
  addIndexPage: function() {
    var that = this;
    var indexPage = this.newPage();
    var list = $('<div class="ui link list">');
    var links = _(pecha.groups).where({linkInIndex: true});
    _(links).each(function(group) {
      var linkText = group[selectedLanguage].replace(/\<span class\="subtitle">[^\>]*\>/, '');
      var link = $('<a class="item">');
      link.attr('href', '#'+that.linkId(group));
      link.html('<span class="title">'+linkText+'</span><span class="page"></span>');
      var linkLevel = _(group).keys().toString().match(/(indexLevel[0-9])/);
      if (linkLevel) link.addClass(linkLevel[1].dasherize());
      list.append(link);
    })
    indexPage.addClass('index-page');
    indexPage.append('<div class="header">Contents</div>');
    indexPage.append(list);
    $('#main').append(indexPage);
    this.pageNumber++;
  },
  addPagesToIndex: function() {
    $('.index-page a').each(function() {
      var linkedLine = $($(this).attr('href'));
      var pageNumber = linkedLine.parents('.translation-page').find('.page-number').html();
      $(this).find('.page').html(pageNumber);
    })
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
  newGroupLine: function(group, groupIndex) {
    var line = $('<div class="line" data-group-index='+groupIndex+'>');
    if (group.emptyLineAfter)            line.addClass('empty-line-after');
    if (group.emptyLineAfterTibetan)     line.addClass('empty-line-after');
    if (group.emptyLineAfterTranslation) line.addClass('empty-line-after');
    return line;
  },
  setLineDiv: function(div, text, group) {
    div.append(text);
    if (group.smallWritings) div.addClass('small-writings');
    if (group.practiceTitle) div.addClass('practice-title');
    if (group.header)        div.addClass('header');
    if (group.centered)      div.addClass('centered');
  },
  shouldStartNewPage: function(group, type) {
    if (group.newPage && $('.'+type+'-page:last .line').length) return true;
    if (group.preferNewPage && $('.'+type+'-page:last .page-inner').height() > this.innerPageHeight() * goldenRatio) return true;
    return false;
  },
  addSpaceOrNot: function(group, text) {
    if (group.addSpaceBetweenMerged)
      return '<span class="space"></span>'+text;
    else
      return ' '+text;
  },
  addNextTibetanLine: function() {
    var group = pecha.groups[this.tibetanGroupIndex];
    if (group) {
      if (this.shouldStartNewPage(group, 'tibetan')) {
        this.addNextTranslationLine();
        return;
      }
      var line = this.newGroupLine(group, this.tibetanGroupIndex);
      var tibetanLine = $('<div class="tibetan">');
      this.setLineDiv(tibetanLine, group.tibetan, group);
      if (group.centeredTibetan) tibetanLine.addClass('centered');
      if (group.mergeNext || group.mergeNextTibetan) {
        this.tibetanGroupIndex++;
        var nextGroup = pecha.groups[this.tibetanGroupIndex];
        var nextText = nextGroup.tibetan;
        if (nextGroup.emptyLineAfterTibetan)
          line.addClass('empty-line-after');
        if (nextGroup.smallWritings)
          nextText = '<span class="small-writings">'+nextText+'</span>';
        nextText = this.addSpaceOrNot(nextGroup, nextText);
        tibetanLine.append(nextText);
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
      if (this.shouldStartNewPage(group, 'translation')) {
        this.makePagesEven();
        this.addTwoPages();
        this.addNextTibetanLine();
        return;
      }
      var line = this.newGroupLine(group, this.translationGroupIndex);
      if (group.linkInIndex)
        line.attr('id', this.linkId(group));
      var phoneticsLine = $('<div class="phonetics">');
      var translationLine = $('<div class="translation">');
      this.setLineDiv(phoneticsLine, group.phonetics, group);
      this.setLineDiv(translationLine, group[selectedLanguage], group);
      if (group.centeredTranslation) {
        phoneticsLine.addClass('centered');
        translationLine.addClass('centered');
      }
      if (group.mergeNext || group.mergeNextTranslation) {
        this.translationGroupIndex++;
        var nextGroup = pecha.groups[this.translationGroupIndex];
        var nextTransliteration = nextGroup.phonetics;
        var nextTranslation = nextGroup[selectedLanguage];
        if (nextGroup.emptyLineAfterTranslation)
          line.addClass('empty-line-after');
        if (nextGroup.smallWritings) {
          nextTransliteration = '<span class="small-writings">'+nextTransliteration+'</span>';
          nextTranslation = '<span class="small-writings">'+nextTranslation+'</span>';
        }
        nextTransliteration = this.addSpaceOrNot(nextGroup, nextTransliteration);
        nextTranslation     = this.addSpaceOrNot(nextGroup, nextTranslation);
        phoneticsLine.append(nextTransliteration);
        translationLine.append(nextTranslation);
      }
      if (group.phonetics)
        line.append(phoneticsLine);
      if (group[selectedLanguage])
        line.append(translationLine);
      this.lastTranslationPage().append(line);
      if (this.lastTranslationPage().height() > this.innerPageHeight()) {
        console.log('too high, adding new page');
        $(line).remove();
        this.translationGroupIndex--;
        this.makePagesEven();
        this.addTwoPages();
        this.addNextTibetanLine();
      } else {
        console.log('adding a new line');
        this.translationGroupIndex++;
        this.addNextTranslationLine();
      }
    } else {
      console.log('adding a new line');
      this.makePagesEven();
      if (pecha.groups[this.tibetanGroupIndex]) { // If there are still groups to add
        this.addTwoPages();
        this.addNextTibetanLine();
      }
      else {
        if (this.thereIsAnIndex())
          this.addPagesToIndex();
        endGeneration();
      }
    }
  }
}

var generateSplitPages = function() {
  SplitPages.initialize();
}