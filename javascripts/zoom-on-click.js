var firstTime = true;

var groupFor = function (origin) {
  if (origin.data("group"))
    return $(".zoom-on-click[data-group=" + origin.data("group") + "]");
  else return $([origin]);
};

$(document).on("mouseenter", ".zoom-on-click", function (event) {
  var originalTextShadows = [];
  syllablesInGroup = groupFor($(event.currentTarget));
  syllablesInGroup.each(function () {
    if (firstTime) originalTextShadows.push($(this).css("text-shadow"));
    $(this).css({
      "text-shadow": "0 0 3px, 0 0 6px",
    });
  });
  $(document).on("mouseleave", ".zoom-on-click", function () {
    syllablesInGroup.each(function (index) {
      $(this).css({
        "text-shadow": originalTextShadows[index],
      });
    });
  });
  firstTime = false;
});

$(document).on("click", ".zoom-on-click", function (event) {
  var origin = $(event.currentTarget);
  var syllables = groupFor(origin);
  _(syllables).each(function (span) {
    var span = $(span);
    var fixedDiv = span.clone();
    if (span.data("text")) fixedDiv.html(span.data("text"));
    fixedDiv.removeClass("zoom-on-click");
    fixedDiv.addClass("zoomed-syllable");
    fixedDiv.css({
      position: "fixed",
      top: span.offset().top - $(window).scrollTop() + 8,
      left: span.offset().left,
      width: "300px",
      "font-size": span.css("font-size"),
      "font-family": span.css("font-family"),
      "text-align": "center",
      opacity: 0,
      "z-index": 999999999,
    });
    $("body").append(fixedDiv);
  });
  $("#masking-overlay").fadeIn();
  $("body").addClass("no-pointer");
  fadeButtons();
  _($(".zoomed-syllable")).each(function (syllable) {
    syllable = $(syllable);
    syllable.animate({
      top:
        ($(".zoomed-syllable").length == 1 && "50vh") ||
        syllable.data("offset-top") + "vh",
      left: $(window).width() / 2 - 150 + "px",
      "margin-left":
        (syllable.data("offset-left") && syllable.data("offset-left") + "vh") ||
        null,
      "font-size": syllable.data("font-size") || "20vh",
      opacity: 1,
    });
  });
  $("body").on("click", function () {
    $(".zoomed-syllable").animate({ opacity: 0 });
    $("#masking-overlay").fadeOut();
    $("body").removeClass("no-pointer");
    $("body").unbind("click");
    setTimeout(function () {
      $(".zoomed-syllable").remove();
    }, 500);
  });
});
