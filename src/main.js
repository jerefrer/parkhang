// Main entry point for Parkhang app
// Setup globals first (this sets window.$, window._, etc.)
import { $ } from "./setup-globals.js";

// Import Fomantic UI CSS
import "fomantic-ui-css/semantic.min.css";

// Load jQuery plugins dynamically (they need window.jQuery to exist first)
await import("jquery.scrollto");
await import("fomantic-ui-css/semantic.min.js");

// Import prayer loader
import {
  buildPrayerRegistry,
  getAvailablePrayers,
  getBeginningPrayers,
  getConclusionPrayers,
  getInsertionPointsFromPrayer,
  getPrayerById,
  getPrayersForCategory,
  getPrayersForMarker,
} from "./prayers/loader.js";

// Build prayer registry for backward compatibility
const { registry, names } = buildPrayerRegistry();

// Import app modules and expose their exports globally
const inputForm = await import("../javascripts/input-form.js");
window.renderInputForm = inputForm.renderInputForm;
window.isAPecha = inputForm.isAPecha;
window.isAPage = inputForm.isAPage;
window.isPageA4 = inputForm.isPageA4;
window.isPageA5 = inputForm.isPageA5;
window.isPageScreen = inputForm.isPageScreen;
window.isAClassicPage = inputForm.isAClassicPage;
window.isASplitPage = inputForm.isASplitPage;
window.layouts = inputForm.layouts;
window.languages = inputForm.languages;
window.getDefaultLanguage = inputForm.getDefaultLanguage;

const generate = await import("../javascripts/generate.js");
window.beginGeneration = generate.beginGeneration;
window.continueGeneration = generate.continueGeneration;
window.endGeneration = generate.endGeneration;

const navigation = await import("../javascripts/navigation.js");
window.textHasBeenRendered = navigation.textHasBeenRendered;
window.scrollToElement = navigation.scrollToElement;

const importFileModule = await import("../javascripts/import-file.js");
window.importFile = importFileModule.importFile;
window.persistPecha = importFileModule.persistPecha;
window.downloadPechaAsJSON = importFileModule.downloadPechaAsJSON;
window.pecha = importFileModule.pecha;

const prayers = await import("../javascripts/prayers.js");
window.availablePrayers = prayers.availablePrayers;
window.selectedPrayers = prayers.selectedPrayers;
window.markerPrayers = prayers.markerPrayers;
window.loadPrayers = prayers.loadPrayers;
window.insertPrayersAtMarkers = prayers.insertPrayersAtMarkers;

const generatePecha = await import("../javascripts/generate-pecha.js");
window.addNextPechaPage = generatePecha.addNextPechaPage;
window.addNextGroup = generatePecha.addNextGroup;
window.addNextTranslation = generatePecha.addNextTranslation;
window.addPechaTitlePage = generatePecha.addPechaTitlePage;
window.addPageTitlePage = generatePecha.addPageTitlePage;

const generateClassic = await import(
  "../javascripts/generate-classic-pages.js"
);
window.generateClassicPages = generateClassic.generateClassicPages;

const generateSplit = await import("../javascripts/generate-split-pages.js");
window.generateSplitPages = generateSplit.generateSplitPages;

const printing = await import("../javascripts/printing.js");
window.prepareAndPrint = printing.prepareAndPrint;

const projectManager = await import("../javascripts/project-manager.js");
window.ProjectManager = projectManager.ProjectManager;

// Import remaining modules (they just set up event handlers)
await import("../javascripts/color-mode.js");
await import("../javascripts/fading-buttons.js");
await import("../javascripts/tibetan-page-numbers.js");

// Set up global prayer data access
window.prayerDataRegistry = {};
window.prayerNames = names;

// Make prayer data available globally (backward compatibility)
for (const [id, prayer] of Object.entries(registry)) {
  // Create global variable name from id
  const varName =
    "prayerData_" + id.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  window[varName] = prayer;
  window.prayerDataRegistry[id] = varName;
}

// Global function to get prayer data
window.getPrayerData = function (prayerId) {
  return getPrayerById(prayerId);
};

// Set up beginning prayers in localStorage (for extra texts / introduction prayers)
const beginningPrayers = getBeginningPrayers();
if (beginningPrayers.length > 0) {
  const extraTextsList = beginningPrayers.map((p) => ({
    id: p.id,
    name: p.shortName || p.title?.english?.title || p.id,
  }));
  localStorage[window.appName + ".extra-texts"] =
    JSON.stringify(extraTextsList);

  // Store each prayer's data
  for (const prayer of beginningPrayers) {
    localStorage[window.appName + ".extra-texts." + prayer.id] =
      JSON.stringify(prayer);
  }
}

// Set up available prayers for marker insertion
window.availablePrayers = getAvailablePrayers().map((p) => ({
  id: p.id,
  name: p.shortName || p.title?.english?.title || p.id,
}));

// Set up conclusion prayers list (only prayers from conclusion folder)
window.conclusionPrayersList = getConclusionPrayers().map((p) => ({
  id: p.id,
  name: p.shortName || p.title?.english?.title || p.id,
}));

// Expose getPrayersForMarker globally for marker-specific prayer lists
window.getPrayersForMarker = getPrayersForMarker;

// Expose new functions for insertion points
window.getInsertionPointsFromPrayer = getInsertionPointsFromPrayer;
window.getPrayersForCategory = getPrayersForCategory;

// Import all JavaScript modules dynamically
// Using await import() ensures globals are set up first (static imports are hoisted)
await import("../javascripts/color-mode.js");
await import("../javascripts/fading-buttons.js");
await import("../javascripts/generate-classic-pages.js");
await import("../javascripts/generate-pecha.js");
await import("../javascripts/generate-split-pages.js");
await import("../javascripts/generate.js");
await import("../javascripts/import-file.js");
await import("../javascripts/input-form.js");
await import("../javascripts/navigation.js");
await import("../javascripts/prayers.js");
await import("../javascripts/printing.js");
await import("../javascripts/project-manager.js");
await import("../javascripts/tibetan-page-numbers.js");

console.log("Parkhang app initialized");
console.log("Loaded prayers:", {
  beginning: beginningPrayers.length,
  conclusion: getConclusionPrayers().length,
  available: window.availablePrayers.length,
});

// Initialize the app when DOM is ready
$(function () {
  var autoloadPreviousPecha = false;

  if (autoloadPreviousPecha) {
    $("body").addClass(localStorage[appName + ".layout"]);
    var textId = JSON.parse(localStorage[appName + ".textId"]);
    var language = localStorage[appName + ".language"];
    if (textId) {
      pecha = localStorage[appName + ".texts." + textId];
      $("#file-input").remove();
      beginGeneration();
    }
  } else {
    renderInputForm();
    $("#loading-overlay").fadeOut();
  }
});
