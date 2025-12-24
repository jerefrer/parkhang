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
  $(window).scrollTop(0);
  print();
};

$(document).on("click", "#print-button", prepareAndPrint);

// Export functions for ES module usage
export { prepareAndPrint };
