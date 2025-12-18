var languageIndexes = {
  tibetan: 0,
  phonetics: 1,
  english: 2,
  englishPechaSpecific: 3,
  french: 4,
  frenchPechaSpecific: 5,
};
var optionsColIndex = 6;

var translationIndexFor = function (language) {
  return languageIndexes[language];
};

var parameterize = function (text) {
  return text.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
};

var pecha = {
  title: {
    tibetan: {
      full: "",
      short: "",
    },
  },
  groups: [],
};

var importFile = function (shouldGenerate) {
  var fileInput = $("#hidden-file-input")[0];
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    alert("Please select a file to import.");
    return;
  }
  var file = fileInput.files[0];
  var reader = new FileReader();
  var parts = file.name.split(".");
  var extension = parts[parts.length - 1].toLowerCase();
  if (extension == "json") importJSON(reader, file, shouldGenerate);
  else if (extension == "xlsx") importXLSX(reader, file, shouldGenerate);
  else if (extension == "docx") importDOCX(reader, file, shouldGenerate);
  else {
    alert("Unsupported file format. Please use JSON, XLSX, or DOCX files.");
  }
};

var persistPecha = function (pecha) {
  try {
    var texts =
      (localStorage[appName + ".texts"] &&
        JSON.parse(localStorage[appName + ".texts"])) ||
      {};
    texts[pecha.id] = pecha.shortName;
    localStorage[appName + ".texts"] = JSON.stringify(texts);
    localStorage[appName + ".texts." + pecha.id] = JSON.stringify(pecha);
    localStorage[appName + ".textId"] = pecha.id;
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      alert(
        "Storage quota exceeded. Please clear some saved texts from localStorage."
      );
    } else {
      alert("Error saving text: " + e.message);
    }
    throw e;
  }
};

var importJSON = function (reader, file, shouldGenerate) {
  reader.onload = function () {
    pecha = JSON.parse(reader.result);
    window.pecha = pecha; // Update global reference
    persistPecha(pecha);
    // Refresh the text selection UI
    if (typeof refreshTextSelection === "function") {
      refreshTextSelection();
    }
    if (typeof updatePrayersSection === "function") {
      updatePrayersSection();
    }
    if (shouldGenerate !== false) {
      beginGeneration();
    }
  };
  setTimeout(function () {
    reader.readAsText(file);
  }, 100);
};

var importXLSX = function (reader, file, shouldGenerate) {
  var lines = [];
  var line_buffer = { words: [] };
  var lineIndex = 0;
  var titlePage = false;
  reader.onload = function () {
    // Reset pecha.groups to avoid duplicating content on re-import
    pecha.groups = [];

    var xlsx = XLSX.read(reader.result, { type: "binary" });

    var sheet = xlsx.Sheets[xlsx.SheetNames[0]];
    var rowIndex = 0;

    var cell = function (row, col) {
      var c = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      return (c && c.v) || undefined;
    };

    var fillForAllTranslations = function (key, rowIndex) {
      _(languageIndexes).each(function (index, language) {
        if (!pecha.title[language]) pecha.title[language] = {};
        pecha.title[language][key] = cell(rowIndex, index);
      });
    };

    var isEmptyRow = function (row) {
      return !_.some([cell(row, 0), cell(row, 1), cell(row, 2), cell(row, 3)]);
    };

    while (!isEmptyRow(rowIndex)) {
      if (rowIndex == 0) {
        pecha.id = parameterize(cell(rowIndex, 1));
        pecha.shortName = cell(rowIndex, 1);
      }
      if (rowIndex == 1 && cell(rowIndex, 0) == "Tibetan title")
        titlePage = true;
      if (titlePage) {
        switch (rowIndex) {
          case 1:
            pecha.title.tibetan.full = cell(rowIndex, 1);
            break;
          case 2:
            pecha.title.tibetan.short = cell(rowIndex, 1);
            break;
          case 3:
            fillForAllTranslations("title", rowIndex);
            break;
          case 4:
            fillForAllTranslations("subtitle", rowIndex);
            break;
        }
      }
      if (rowIndex != 0 && (!titlePage || rowIndex > 5)) {
        var group = {};
        var options = cell(rowIndex, optionsColIndex);
        if (options) {
          _(options.split(" ")).each(function (option) {
            group[option] = true;
          });
        }
        _(languageIndexes).each(function (index, language) {
          group[language] = cell(rowIndex, index);
        });
        pecha.groups.push(group);
      }
      rowIndex++;
    }

    window.pecha = pecha; // Update global reference
    persistPecha(pecha);
    // Refresh the text selection UI
    if (typeof refreshTextSelection === "function") {
      refreshTextSelection();
    }
    if (typeof updatePrayersSection === "function") {
      updatePrayersSection();
    }
    if (shouldGenerate !== false) {
      beginGeneration();
    }
  };
  setTimeout(function () {
    reader.readAsBinaryString(file);
  }, 100);
};

var importDOCX = function (reader, file, shouldGenerate) {
  reader.onload = function () {
    var arrayBuffer = reader.result;

    // Style map to convert DOCX styles to custom HTML classes
    var styleMap = [
      "p[style-name='short title tibetan'] => p.short-title-tibetan:fresh",
      "p[style-name='short title translation'] => p.short-title-translation:fresh",
      "p[style-name='heading 1 tibetan'] => p.heading-1-tibetan:fresh",
      "p[style-name='heading 1 translation'] => p.heading-1-translation:fresh",
      "p[style-name='heading 2 tibetan'] => p.heading-2-tibetan:fresh",
      "p[style-name='heading 2 translation'] => p.heading-2-translation:fresh",
      "p[style-name='yigchung tibetan'] => p.yigchung-tibetan:fresh",
      "p[style-name='yigchung translation'] => p.yigchung-translation:fresh",
      "p[style-name='verse tibetan'] => p.tibetan:fresh",
      "p[style-name='verse phonetics'] => p.phonetics:fresh",
      "p[style-name='verse translation'] => p.translation:fresh",
    ];

    mammoth
      .convertToHtml({ arrayBuffer: arrayBuffer }, { styleMap: styleMap })
      .then(function (result) {
        var html = result.value;
        console.log("DOCX HTML output:", html);
        console.log("DOCX messages:", result.messages);
        parseDOCXHtml(html, file.name, shouldGenerate);
      })
      .catch(function (error) {
        console.error("Error converting DOCX:", error);
        alert("Error importing DOCX file: " + error.message);
      });
  };

  setTimeout(function () {
    reader.readAsArrayBuffer(file);
  }, 100);
};

var parseDOCXHtml = function (html, fileName, shouldGenerate) {
  // Parse the HTML
  var $html = $("<div>").html(html);

  // Initialize pecha structure
  pecha = {
    id: parameterize(fileName.replace(/\.docx$/i, "")),
    shortName: fileName.replace(/\.docx$/i, ""),
    title: {
      tibetan: { full: "", short: "" },
      english: { title: "", subtitle: "" },
      french: { title: "", subtitle: "" },
    },
    groups: [],
  };

  // Track current state for pairing tibetan/phonetics/translation
  var pendingTibetan = null;
  var pendingPhonetics = null;
  var pendingType = null;

  $html.children().each(function () {
    var $el = $(this);
    var text = $el.text().trim();
    if (!text) return;

    var className = $el.attr("class") || "";

    // Handle short title
    if (className === "short-title-tibetan") {
      pecha.title.tibetan.short = text;
      return;
    }
    if (className === "short-title-translation") {
      pecha.shortName = text;
      pecha.title.english.short = text;
      return;
    }

    // Handle heading 1 (full title)
    if (className === "heading-1-tibetan") {
      pecha.title.tibetan.full = text;
      return;
    }
    if (className === "heading-1-translation") {
      pecha.title.english.title = text;
      return;
    }

    // Handle heading 2 (subtitle)
    if (className === "heading-2-tibetan") {
      // heading 2 tibetan not typically used, but handle it
      return;
    }
    if (className === "heading-2-translation") {
      pecha.title.english.subtitle = text;
      return;
    }

    // Handle title 1 (prayer-title) - legacy support
    if (className === "title-1-tibetan") {
      // If there's a pending tibetan, flush it first
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          type: pendingType,
          translations: { english: "", french: "" },
        });
      }
      pendingTibetan = text;
      pendingType = "prayer-title";
      return;
    }
    if (className === "title-1-translation") {
      if (pendingType === "prayer-title") {
        pecha.groups.push({
          tibetan: pendingTibetan || "",
          type: "prayer-title",
          translations: { english: text, french: "" },
        });
        pendingTibetan = null;
        pendingType = null;
      }
      return;
    }

    // Handle title 2 (prayer-subtitle)
    if (className === "title-2-tibetan") {
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          type: pendingType,
          translations: { english: "", french: "" },
        });
      }
      pendingTibetan = text;
      pendingType = "prayer-subtitle";
      return;
    }
    if (className === "title-2-translation") {
      if (pendingType === "prayer-subtitle") {
        pecha.groups.push({
          tibetan: pendingTibetan || "",
          type: "prayer-subtitle",
          translations: { english: text, french: "" },
        });
        pendingTibetan = null;
        pendingType = null;
      }
      return;
    }

    // Handle yigchung (instructions)
    if (className === "yigchung-tibetan") {
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          type: pendingType,
          translations: { english: "", french: "" },
        });
      }
      pendingTibetan = text;
      pendingType = "instructions";
      return;
    }
    if (className === "yigchung-translation") {
      if (pendingType === "instructions") {
        pecha.groups.push({
          tibetan: pendingTibetan || "",
          type: "instructions",
          translations: { english: text, french: "" },
        });
        pendingTibetan = null;
        pendingType = null;
      }
      return;
    }

    // Handle regular tibetan (verse)
    if (className === "tibetan") {
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          phonetics: { english: pendingPhonetics || "" },
          type: pendingType || "verse",
          translations: { english: "", french: "" },
        });
      }
      pendingTibetan = text;
      pendingPhonetics = null;
      pendingType = "verse";
      return;
    }

    // Handle phonetics (comes after tibetan, before translation)
    if (className === "phonetics") {
      pendingPhonetics = text;
      return;
    }

    // Handle translation (completes the group)
    if (className === "translation") {
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          phonetics: { english: pendingPhonetics || "" },
          type: pendingType || "verse",
          translations: { english: text, french: "" },
        });
        pendingTibetan = null;
        pendingPhonetics = null;
        pendingType = null;
      }
      return;
    }

    // Fallback: detect tibetan vs translation by script
    // Tibetan Unicode range: U+0F00 to U+0FFF
    var hasTibetan = /[\u0F00-\u0FFF]/.test(text);
    if (hasTibetan) {
      // This is tibetan text
      if (pendingTibetan !== null) {
        pecha.groups.push({
          tibetan: pendingTibetan,
          phonetics: { english: pendingPhonetics || "" },
          type: pendingType || "verse",
          translations: { english: "", french: "" },
        });
      }
      pendingTibetan = text;
      pendingPhonetics = null;
      pendingType = "verse";
    } else if (pendingTibetan !== null) {
      // Could be phonetics or translation - check if we already have phonetics
      if (pendingPhonetics === null) {
        // This might be phonetics (non-Tibetan text after Tibetan, before translation)
        pendingPhonetics = text;
      } else {
        // This is translation text
        pecha.groups.push({
          tibetan: pendingTibetan,
          phonetics: { english: pendingPhonetics },
          type: pendingType || "verse",
          translations: { english: text, french: "" },
        });
        pendingTibetan = null;
        pendingPhonetics = null;
        pendingType = null;
      }
    }
  });

  // Flush any remaining pending tibetan
  if (pendingTibetan !== null) {
    pecha.groups.push({
      tibetan: pendingTibetan,
      phonetics: { english: pendingPhonetics || "" },
      type: pendingType || "verse",
      translations: { english: "", french: "" },
    });
  }

  // Add title and subtitle as groups at the beginning
  var titleGroups = [];
  if (pecha.title.tibetan.full || pecha.title.english.title) {
    titleGroups.push({
      tibetan: pecha.title.tibetan.full || "",
      phonetics: { english: "" },
      type: "title",
      translations: {
        english: pecha.title.english.title || "",
        french: pecha.title.french.title || "",
      },
    });
  }
  if (pecha.title.english.subtitle) {
    titleGroups.push({
      tibetan: "",
      phonetics: { english: "" },
      type: "subtitle",
      translations: {
        english: pecha.title.english.subtitle || "",
        french: pecha.title.french.subtitle || "",
      },
    });
  }
  if (titleGroups.length > 0) {
    pecha.groups = titleGroups.concat(pecha.groups);
  }

  window.pecha = pecha; // Update global reference
  persistPecha(pecha);

  // Refresh the text selection UI
  if (typeof refreshTextSelection === "function") {
    refreshTextSelection();
  }
  if (typeof updatePrayersSection === "function") {
    updatePrayersSection();
  }
  if (shouldGenerate !== false) {
    beginGeneration();
  }
};

var downloadPechaAsJSON = function (pechaData) {
  pechaData = pechaData || pecha;
  if (!pechaData || !pechaData.id) {
    alert("No pecha data to download.");
    return;
  }

  var json = JSON.stringify(pechaData, null, 2);
  var blob = new Blob([json], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = (pechaData.id || "pecha") + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Export functions for ES module usage
export { downloadPechaAsJSON, importFile, pecha, persistPecha };
