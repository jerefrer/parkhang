// Setup global libraries BEFORE any other code runs
// This file must be imported first and sets up window globals

import ClipboardJS from "clipboard";
import { Howl, Howler } from "howler";
import $ from "jquery";
import _ from "lodash";
import mammoth from "mammoth";
import moment from "moment";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import Sugar from "sugar";
import * as XLSX from "xlsx";

// Make jQuery available globally FIRST
window.$ = $;
window.jQuery = $;

// Make other libraries available globally
window._ = _;
window.nanoid = nanoid;
window.XLSX = XLSX;
window.mammoth = mammoth;
window.moment = moment;
window.Papa = Papa;
window.ClipboardJS = ClipboardJS;
window.Howl = Howl;
window.Howler = Howler;
window.Sugar = Sugar;

// App configuration
window.appName = "parkhang";
window.delay = 10;

// Global utility functions (from globals.js)
window.goldenRatio = 0.5 * (Math.sqrt(5) - 1);

window.tibetanNumber = function (number) {
  if (typeof number == "number") {
    var digits = number.toString().split("");
    return _.chain(digits).map(window.tibetanNumber).join("").value();
  } else {
    switch (number) {
      case "0":
        return "༠";
      case "1":
        return "༡";
      case "2":
        return "༢";
      case "3":
        return "༣";
      case "4":
        return "༤";
      case "5":
        return "༥";
      case "6":
        return "༦";
      case "7":
        return "༧";
      case "8":
        return "༨";
      case "9":
        return "༩";
    }
  }
};

window.cmToPixel = function (value) {
  return value * 39.36970389412549; // 100dpi
};

// Export for use in main.js
export { $ };
