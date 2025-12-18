// Unified theme system - cycles through dark -> light -> lapis
// This uses body classes instead of dynamically loaded CSS files

var appName = "parkhang";
var themeIcons = { dark: "moon", light: "sun", lapis: "gem" };

// Update the color-mode button icon based on current theme
var updateColorModeIcon = function () {
  var $body = $("body");
  var $icon = $("#color-mode-button i");
  var currentTheme = "dark";

  if ($body.hasClass("theme-light")) currentTheme = "light";
  else if ($body.hasClass("theme-lapis")) currentTheme = "lapis";

  $icon.removeClass("moon sun gem").addClass(themeIcons[currentTheme]);
};

// Initialize icon on page load
$(document).ready(function () {
  updateColorModeIcon();
});

$(document).on("click", "#color-mode-button", function () {
  var $body = $("body");
  var $icon = $(this).find("i");
  var themes = ["dark", "light", "lapis"];

  // Find current theme
  var currentTheme = "dark";
  for (var i = 0; i < themes.length; i++) {
    if ($body.hasClass("theme-" + themes[i])) {
      currentTheme = themes[i];
      break;
    }
  }

  // Get next theme
  var currentIndex = themes.indexOf(currentTheme);
  var nextIndex = (currentIndex + 1) % themes.length;
  var nextTheme = themes[nextIndex];

  // Update body class
  $body
    .removeClass("theme-dark theme-light theme-lapis")
    .addClass("theme-" + nextTheme);

  // Update icon with rotation animation
  $icon.css("transform", "rotate(360deg)");
  setTimeout(function () {
    $icon.removeClass("moon sun gem").addClass(themeIcons[nextTheme]);
    $icon.css("transform", "rotate(0deg)");
  }, 150);

  // Save to localStorage
  localStorage[appName + ".theme"] = nextTheme;
});

// Export for ES module usage
export {};
