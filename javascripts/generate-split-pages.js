// Remove optional markers but keep the content for split pages
var removeOptionalMarkers = function (text) {
  if (!text) return text;
  return text.replace(/<optional>/g, "").replace(/<\/optional>/g, "");
};

// Convert <small>...</small> markers to span.small-writings for Tibetan text
var convertSmallMarkers = function (text) {
  if (!text) return text;
  return text.replace(/<small>(.*?)<\/small>/g, '<span class="small-writings">$1</span>');
};

var SplitPages = {
  isTibetanPage: true,
  margins: [cmToPixel(1.5), cmToPixel(2), cmToPixel(1.5), cmToPixel(2)],
  tibetanGroupIndex: 0,
  translationGroupIndex: 0,
  pageNumber: 0,
  initialize: function () {
    this.addTitlePage();
    if (this.thereIsAnIndex()) this.addIndexPage();
    this.addTwoPages();
    this.addNextTibetanLine();
  },
  thereIsAnIndex: function () {
    return _(pecha.groups).where({ linkInIndex: true }).length;
  },
  pageWidth: function () {
    if (bodyHasClass("a4")) return cmToPixel(21.006);
    else if (bodyHasClass("a5")) return cmToPixel(21.006);
    else if (bodyHasClass("screen")) return 0.9 * $(window).width();
  },
  pageHeight: function () {
    if (bodyHasClass("a4")) return cmToPixel(29.693);
    else if (bodyHasClass("a5")) return cmToPixel(29.693);
    else if (bodyHasClass("screen")) return Infinity;
  },
  innerPageWidth: function () {
    return this.pageWidth() - this.margins[1] - this.margins[3];
  },
  innerPageHeight: function () {
    return this.pageHeight() - this.margins[0] - this.margins[2];
  },
  lastTibetanPage: function () {
    return $(".tibetan-page:last .page-inner");
  },
  lastTranslationPage: function () {
    return $(".translation-page:last .page-inner");
  },
  pageNumberDiv: function (options) {
    var div = $('<div class="page-number">');
    div.css({ width: this.innerPageWidth() });
    if (options && options.tibetan) div.html(tibetanNumber(this.pageNumber));
    else div.html(this.pageNumber);
    return div;
  },
  translationPageNumber: function () {
    return this.pageNumber;
  },
  newPage: function () {
    var page = $('<div class="split-page-container">');
    page.css({
      width: this.pageWidth() + "px",
      height: this.pageHeight() + "px",
      padding:
        this.margins[0] +
        "px " +
        this.margins[1] +
        "px " +
        this.margins[2] +
        "px " +
        this.margins[3] +
        "px",
    });
    return page;
  },
  addTitlePage: function () {
    var that = this;
    var translation = pecha.title[selectedLanguage];
    var titlePage = this.newPage();
    titlePage.attr("id", "title-page");
    titlePage.html(
      '\
      <div class="split-title-page-content">\
        <div class="tibetan">\
          <div>' +
        pecha.title.tibetan.full +
        '</div>\
        </div>\
        <div class="translation">\
          <div class="title">' +
        translation.title +
        "</div>" +
        ((translation.subtitle &&
          '<div class="subtitle">' + translation.subtitle + "</div>") ||
          "") +
        '\
        </div>\
        <img class="logo" src="images/padmakara-logo.png">\
      </div>\
    '
    );
    $("#main").append(titlePage);
    setTimeout(function () {
      var contentHeight = $(".split-title-page-content").height();
      $(".split-title-page-content").css({
        "margin-top":
          "calc((" +
          that.innerPageHeight() +
          "px - " +
          contentHeight +
          "px) / 2)",
      });
    }, 200);
    this.pageNumber++;
  },
  linkId: function (group) {
    return "link-" + pecha.groups.indexOf(group);
  },
  addIndexPage: function () {
    var that = this;
    var indexPage = this.newPage();
    var list = $('<div class="ui link list">');
    var links = _(pecha.groups).where({ linkInIndex: true });
    _(links).each(function (group) {
      var linkText = removeOptionalMarkers(group[selectedLanguage]).replace(
        /\<span class\="subtitle">[^\>]*\>/,
        ""
      );
      var link = $('<a class="item">');
      link.attr("href", "#" + that.linkId(group));
      link.html(
        '<span class="title">' + linkText + '</span><span class="page"></span>'
      );
      var linkLevel = _(group)
        .keys()
        .toString()
        .match(/(indexLevel[0-9])/);
      if (linkLevel) link.addClass(linkLevel[1].dasherize());
      list.append(link);
    });
    indexPage.addClass("index-page");
    indexPage.append('<div class="header">Contents</div>');
    indexPage.append(list);
    $("#main").append(indexPage);
    this.pageNumber++;
  },
  addPagesToIndex: function () {
    $(".index-page a").each(function () {
      var linkedLine = $($(this).attr("href"));
      var pageNumber = linkedLine
        .parents(".translation-page")
        .find(".page-number")
        .html();
      $(this).find(".page").html(pageNumber);
    });
  },
  addTwoPages: function () {
    this.pageNumber++;
    var tibetanPage = this.newPage().addClass("tibetan-page");
    var translationPage = this.newPage().addClass("translation-page");
    tibetanPage.append(this.pageNumberDiv({ tibetan: true }));
    tibetanPage.append('<div class="page-inner"></div>');
    translationPage.append(this.pageNumberDiv());
    translationPage.append('<div class="page-inner"></div>');
    $("#main").append(tibetanPage);
    $("#main").append(translationPage);
  },
  makePagesEven: function () {
    if (this.tibetanGroupIndex > this.translationGroupIndex) {
      _(this.tibetanGroupIndex - this.translationGroupIndex).times((i) => {
        $(
          ".tibetan-page .line[data-group-index=" +
            (this.translationGroupIndex + i + 1) +
            "]"
        ).remove();
      });
      this.translationGroupIndex++;
      this.tibetanGroupIndex = this.translationGroupIndex;
    } else if (this.tibetanGroupIndex < this.translationGroupIndex) {
      _(this.translationGroupIndex - this.tibetanGroupIndex).times((i) => {
        $(
          ".translation-page .line[data-group-index=" +
            (this.tibetanGroupIndex + i + 1) +
            "]"
        ).remove();
      });
      this.tibetanGroupIndex++;
      this.translationGroupIndex = this.tibetanGroupIndex;
    }
  },
  newGroupLine: function (group, groupIndex) {
    var line = $('<div class="line" data-group-index=' + groupIndex + ">");
    if (group.emptyLineAfter) line.addClass("empty-line-after");
    if (group.emptyLineAfterTibetan) line.addClass("empty-line-after");
    if (group.emptyLineAfterTranslation) line.addClass("empty-line-after");
    return line;
  },
  setLineClass: function (div, group) {
    if (group.smallWritings) div.addClass("small-writings");
    if (group.practiceTitle) div.addClass("practice-title");
    if (group.header) div.addClass("header");
    if (group.centered || group.centeredTibetan || group.centeredTranslation)
      div.addClass("centered");
  },
  shouldStartNewPage: function (group, type) {
    if (group.newPage && $("." + type + "-page:last .line").length) return true;
    if (
      group.preferNewPage &&
      $("." + type + "-page:last .page-inner").height() >
        this.innerPageHeight() * goldenRatio
    )
      return true;
    return false;
  },
  maybeAddSpace: function (group, text) {
    if (group.addSpaceBetweenMerged)
      return '<span class="space"></span>' + text;
    else return " " + text;
  },
  addNextTibetanLine: function () {
    var group = pecha.groups[this.tibetanGroupIndex];
    if (group) {
      if (this.shouldStartNewPage(group, "tibetan")) {
        this.addNextTranslationLine();
        return;
      }
      var groupDiv, tibetanDiv;
      var addGroupDiv = () => {
        groupDiv = this.newGroupLine(group, this.tibetanGroupIndex);
        tibetanDiv = $('<div class="tibetan">');
        this.setLineClass(tibetanDiv, group);
        groupDiv.append(tibetanDiv);
        this.lastTibetanPage().append(groupDiv);
      };
      addGroupDiv();
      if (group.smallWritings) {
        var wordIndex = 0;
        var words = group.tibetan.split("་");
        var addNextWord = () => {
          var word = words[wordIndex];
          if (word) {
            tibetanDiv.append(
              "<span>" +
                word +
                ((words[wordIndex + 1] && "་") || "") +
                "</span>"
            );
            if (this.lastTibetanPage().height() > this.innerPageHeight()) {
              tibetanDiv.find("span:last").remove();
              if (!tibetanDiv.find("span:not(.space)").length)
                tibetanDiv.remove();
              addGroupDiv();
              var groupsWithSameId = pecha.groups.filter(
                (g) => g.id == group.id
              );
              var newGroup;
              if (groupsWithSameId.length > 1)
                newGroup = groupsWithSameId[groupsWithSameId.length - 1];
              else newGroup = JSON.parse(JSON.stringify(group));
              var remainingWords = words.slice(wordIndex).join("་");
              newGroup.tibetan = remainingWords;
              pecha.groups.insert(newGroup, this.tibetanGroupIndex + 1);
              this.tibetanGroupIndex++;
              this.addNextTranslationLine();
            } else {
              wordIndex++;
              // setTimeout(function() {
              addNextWord();
              // }, delay);
            }
          } else {
            this.tibetanGroupIndex++;
            this.addNextTranslationLine();
          }
        };
        addNextWord();
      } else {
        tibetanDiv.append(convertSmallMarkers(group.tibetan));
        this.lastTibetanPage().append(groupDiv);
      }
      if (group.mergeNext || group.mergeNextTibetan) {
        this.tibetanGroupIndex++;
        var nextGroup = pecha.groups[this.tibetanGroupIndex];
        var nextText = convertSmallMarkers(nextGroup.tibetan);
        if (nextGroup.emptyLineAfterTibetan)
          groupDiv.addClass("empty-line-after");
        if (nextGroup.smallWritings)
          nextText = '<span class="small-writings">' + nextText + "</span>";
        nextText = this.maybeAddSpace(nextGroup, nextText);
        tibetanDiv.append(nextText);
      }
      if (this.lastTibetanPage().height() > this.innerPageHeight()) {
        $(groupDiv).remove();
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
  addNextTranslationLine: function () {
    var group = pecha.groups[this.translationGroupIndex];
    if (group) {
      if (this.shouldStartNewPage(group, "translation")) {
        this.makePagesEven();
        this.addTwoPages();
        this.addNextTibetanLine();
        return;
      }
      var translation = (removeOptionalMarkers(group[selectedLanguage]) || "")
        .replace(/\n/g, "<br>")
        .replace(/\t/g, "&emsp;");
      if (group.smallWritings) {
        var groupDiv, translationDiv;
        var addGroupDiv = () => {
          groupDiv = this.newGroupLine(group, this.tibetanGroupIndex);
          if (group.linkInIndex) groupDiv.attr("id", this.linkId(group));
          translationDiv = $('<div class="translation">');
          this.setLineClass(translationDiv, group);
          groupDiv.append(translationDiv);
          this.lastTranslationPage().append(groupDiv);
        };
        addGroupDiv();
        var wordIndex = 0;
        var words = removeOptionalMarkers(translation).split(" ");
        var addNextWord = () => {
          var word = words[wordIndex];
          if (word) {
            translationDiv.append(
              "<span>" +
                word +
                ((words[wordIndex + 1] && " ") || "") +
                "</span>"
            );
            if (this.lastTranslationPage().height() > this.innerPageHeight()) {
              translationDiv.find("span:last").remove();
              if (!translationDiv.find("span:not(.space)").length)
                translationDiv.remove();
              addGroupDiv();
              var remainingWords = words.slice(wordIndex).join(" ");
              var groupsWithSameId = pecha.groups.filter(
                (g) => g.id == group.id
              );
              if (groupsWithSameId.length > 1) {
                var alreadyAddedGroup =
                  groupsWithSameId[groupsWithSameId.length - 1];
                alreadyAddedGroup[selectedLanguage] = remainingWords;
              } else {
                var newGroup = JSON.parse(JSON.stringify(group));
                newGroup[selectedLanguage] = remainingWords;
                pecha.groups.insert(newGroup, this.translationGroupIndex + 1);
              }
              this.translationGroupIndex++;
              this.makePagesEven();
              this.addTwoPages();
              this.addNextTibetanLine();
            } else {
              wordIndex++;
              // setTimeout(function() {
              addNextWord();
              // }, delay);
            }
          } else {
            this.translationGroupIndex++;
            this.addNextTibetanLine();
          }
        };
        addNextWord();
      } else {
        var groupDiv = this.newGroupLine(group, this.translationGroupIndex);
        var phoneticsDiv = $('<div class="phonetics">');
        var translationDiv = $('<div class="translation">');
        this.setLineClass(phoneticsDiv, group);
        this.setLineClass(translationDiv, group);
        phoneticsDiv.append(group.phonetics);
        translationDiv.append(translation);
        if (group.mergeNext || group.mergeNextTranslation) {
          this.translationGroupIndex++;
          var nextGroup = pecha.groups[this.translationGroupIndex];
          var nextTransliteration = nextGroup.phonetics;
          var nextTranslation = removeOptionalMarkers(
            nextGroup[selectedLanguage]
          );
          if (nextGroup.emptyLineAfterTranslation)
            groupDiv.addClass("empty-line-after");
          if (nextGroup.smallWritings) {
            nextTransliteration =
              '<span class="small-writings">' + nextTransliteration + "</span>";
            nextTranslation =
              '<span class="small-writings">' + nextTranslation + "</span>";
          }
          nextTransliteration = this.maybeAddSpace(
            nextGroup,
            nextTransliteration
          );
          nextTranslation = this.maybeAddSpace(nextGroup, nextTranslation);
          phoneticsDiv.append(nextTransliteration);
          translationDiv.append(nextTranslation);
        }
        if (group.phonetics) groupDiv.append(phoneticsDiv);
        if (group[selectedLanguage]) groupDiv.append(translationDiv);
        this.lastTranslationPage().append(groupDiv);
        if (this.lastTranslationPage().height() > this.innerPageHeight()) {
          $(groupDiv).remove();
          this.translationGroupIndex--;
          this.makePagesEven();
          this.addTwoPages();
          this.addNextTibetanLine();
        } else {
          this.translationGroupIndex++;
          this.addNextTranslationLine();
        }
      }
    } else {
      this.makePagesEven();
      if (pecha.groups[this.tibetanGroupIndex]) {
        // If there are still groups to add
        this.addTwoPages();
        this.addNextTibetanLine();
      } else {
        if (this.thereIsAnIndex()) this.addPagesToIndex();
        endGeneration();
      }
    }
  },
};

var generateSplitPages = function () {
  SplitPages.initialize();
};
