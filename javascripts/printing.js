var isEven = function (page, index) {
  return index % 2 == 1;
};

var isOdd = function (page, index) {
  return index % 2 == 0;
};

var addPageOrPlaceholder = function (page) {
  if (!page) page = $('<div class="pecha-page-container">');
  $("#main").append(page);
};

var prepareAndPrint = function () {
  var pagesPerSheet = 4;
  var pages = $(".pecha-page-container");
  var evenPages = _(pages).filter(isEven);
  var oddPages = _(pages).filter(isOdd);
  $(".pecha-page-container").remove();
  while (evenPages.length && oddPages.length) {
    _(pagesPerSheet).times(function () {
      addPageOrPlaceholder(oddPages.shift());
    });
    _(pagesPerSheet).times(function () {
      var page = $(evenPages.shift());
      addPageOrPlaceholder(page);
      page.css({ transform: "rotate(180deg)" });
    });
  }
  $(window).scrollTop(0);
  print();
};

$(document).on("click", "#print-button", prepareAndPrint);
