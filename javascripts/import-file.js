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
  var extension = parts[parts.length - 1];
  if (extension == "json") importJSON(reader, file, shouldGenerate);
  else if (extension == "xlsx") importXLSX(reader, file, shouldGenerate);
  else {
    alert("Unsupported file format. Please use JSON or XLSX files.");
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
    persistPecha(pecha);
    // Update prayers section if the function exists (when staying on form)
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
      return !_.any([cell(row, 0), cell(row, 1), cell(row, 2), cell(row, 3)]);
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

    persistPecha(pecha);
    // Update prayers section if the function exists (when staying on form)
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
