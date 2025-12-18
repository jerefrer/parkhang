// Project Manager - Handles saving, loading, and versioning of generated HTML projects
// Uses diff-based storage with per-attribute debouncing for efficiency

var ProjectManager = (function () {
  var STORAGE_KEY_PREFIX = appName + ".projects";
  var PROJECTS_LIST_KEY = STORAGE_KEY_PREFIX + ".list";
  var ATTRIBUTE_DEBOUNCE_DELAY = 30000; // 30s window for same-attribute changes
  var SAVE_DEBOUNCE_DELAY = 500; // 500ms delay before committing pending changes
  var MAX_VERSIONS = 200; // Can store more versions since they're smaller now

  var currentProjectId = null;
  var currentVersionIndex = null;
  var isTrackingChanges = false;
  var mutationObserver = null;

  // Pending changes tracking - keyed by "selector|attribute"
  var pendingChanges = {};
  var pendingChangeTimers = {};
  var saveTimer = null;

  // Generate unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Get all projects list
  function getProjectsList() {
    var list = localStorage.getItem(PROJECTS_LIST_KEY);
    return list ? JSON.parse(list) : [];
  }

  // Save projects list
  function saveProjectsList(list) {
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list));
  }

  // Get project data
  function getProject(projectId) {
    var data = localStorage.getItem(STORAGE_KEY_PREFIX + "." + projectId);
    return data ? JSON.parse(data) : null;
  }

  // Save project data with quota handling
  function saveProjectData(projectId, data) {
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFIX + "." + projectId,
        JSON.stringify(data)
      );
    } catch (e) {
      if (e.name === "QuotaExceededError" || e.code === 22) {
        // Compact versions by merging consecutive small changes
        if (data.versions && data.versions.length > 20) {
          data.versions = compactVersions(data.versions);
          try {
            localStorage.setItem(
              STORAGE_KEY_PREFIX + "." + projectId,
              JSON.stringify(data)
            );
            console.warn("Storage quota exceeded. Compacted versions.");
            return;
          } catch (e2) {
            // Still failing
          }
        }
        console.error("Storage quota exceeded. Unable to save.");
        alert("Storage full. Please delete some projects to continue saving.");
      } else {
        throw e;
      }
    }
  }

  // Compact versions by rebuilding HTML at checkpoints
  function compactVersions(versions) {
    if (versions.length <= 10) return versions;

    // Keep first, every 10th, and last 5 versions
    var compacted = [versions[0]];
    for (var i = 10; i < versions.length - 5; i += 10) {
      // Rebuild full HTML at this checkpoint
      var html = rebuildHtmlAtVersion(versions, i);
      compacted.push({
        id: versions[i].id,
        timestamp: versions[i].timestamp,
        tag: versions[i].tag,
        html: html, // Full snapshot
        changes: null,
      });
    }
    // Keep last 5 as-is
    compacted = compacted.concat(versions.slice(-5));
    return compacted;
  }

  // Generate a unique selector for an element
  function getElementSelector(element) {
    if (!element || element.nodeType !== 1) return null;

    // Use data-cid if available (short cell ID)
    var cid = element.getAttribute("data-cid");
    if (cid) {
      return '[data-cid="' + cid + '"]';
    }

    // Try ID
    if (element.id) {
      return "#" + element.id;
    }

    // For elements without cid, build a minimal path
    var path = [];
    var current = element;
    while (current && current.nodeType === 1 && current.id !== "main") {
      // Check if current has data-cid
      var currentCid = current.getAttribute("data-cid");
      if (currentCid) {
        path.unshift('[data-cid="' + currentCid + '"]');
        break;
      }

      var selector = current.tagName.toLowerCase();
      // Add nth-of-type for uniqueness
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(
          parent.children,
          function (child) {
            return child.tagName === current.tagName;
          }
        );
        if (siblings.length > 1) {
          var index = siblings.indexOf(current) + 1;
          selector += ":nth-of-type(" + index + ")";
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  // Record a change with per-attribute debouncing
  function recordChange(selector, changeType, attribute, oldValue, newValue) {
    var changeKey = selector + "|" + changeType + "|" + (attribute || "");
    var now = Date.now();

    // Check if we have a pending change for this same attribute
    if (pendingChanges[changeKey]) {
      // Update the newValue but keep the original oldValue
      pendingChanges[changeKey].newValue = newValue;
      pendingChanges[changeKey].timestamp = now;

      // Reset the timer for this attribute
      if (pendingChangeTimers[changeKey]) {
        clearTimeout(pendingChangeTimers[changeKey]);
      }
    } else {
      // New change
      pendingChanges[changeKey] = {
        selector: selector,
        type: changeType,
        attribute: attribute,
        oldValue: oldValue,
        newValue: newValue,
        timestamp: now,
      };
    }

    // Set timer to finalize this change after 30s of no updates
    pendingChangeTimers[changeKey] = setTimeout(function () {
      finalizeChange(changeKey);
    }, ATTRIBUTE_DEBOUNCE_DELAY);

    // Also schedule a save after short delay
    scheduleSave();
  }

  // Finalize a pending change (move it to committed)
  function finalizeChange(changeKey) {
    delete pendingChangeTimers[changeKey];
    // Change stays in pendingChanges until save
  }

  // Schedule a save operation
  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(function () {
      commitPendingChanges();
      saveTimer = null;
    }, SAVE_DEBOUNCE_DELAY);
  }

  // Commit all pending changes as a new version
  function commitPendingChanges() {
    if (!currentProjectId) return;
    if (Object.keys(pendingChanges).length === 0) return;

    var project = getProject(currentProjectId);
    if (!project) return;

    // Convert pending changes to array
    var changes = Object.keys(pendingChanges).map(function (key) {
      var change = pendingChanges[key];
      return {
        selector: change.selector,
        type: change.type,
        attribute: change.attribute,
        oldValue: change.oldValue,
        newValue: change.newValue,
      };
    });

    // Clear pending
    pendingChanges = {};
    Object.keys(pendingChangeTimers).forEach(function (key) {
      clearTimeout(pendingChangeTimers[key]);
    });
    pendingChangeTimers = {};

    // If we're not at the latest version, truncate future versions (fork history)
    if (
      currentVersionIndex !== null &&
      currentVersionIndex < project.versions.length - 1
    ) {
      project.versions = project.versions.slice(0, currentVersionIndex + 1);
    }

    // Create new version with just the changes
    var version = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      tag: null,
      changes: changes,
    };

    project.versions.push(version);

    // Trim if needed
    if (project.versions.length > MAX_VERSIONS) {
      project.versions = compactVersions(project.versions);
    }

    project.updatedAt = new Date().toISOString();
    currentVersionIndex = project.versions.length - 1;

    saveProjectData(currentProjectId, project);
    updateProjectInList(currentProjectId, { updatedAt: project.updatedAt });

    // Update UI
    showProjectControls(project, currentVersionIndex);
  }

  // Rebuild HTML by applying changes up to a version index
  function rebuildHtmlAtVersion(versions, targetIndex) {
    // Find the nearest full HTML snapshot at or before targetIndex
    var baseIndex = 0;
    var baseHtml = versions[0].html;

    for (var i = targetIndex; i >= 0; i--) {
      if (versions[i].html) {
        baseIndex = i;
        baseHtml = versions[i].html;
        break;
      }
    }

    // Apply changes from baseIndex+1 to targetIndex
    var container = $("<div>").html(baseHtml);

    for (var j = baseIndex + 1; j <= targetIndex; j++) {
      var version = versions[j];
      if (version.changes) {
        version.changes.forEach(function (change) {
          applyChange(container, change);
        });
      }
    }

    return container.html();
  }

  // Apply a single change to a container
  function applyChange(container, change) {
    var elements = container.find(change.selector);
    if (elements.length === 0) return;

    var element = elements.first();

    switch (change.type) {
      case "attribute":
        if (change.attribute === "class") {
          element.attr("class", change.newValue);
        } else if (change.attribute.startsWith("style.")) {
          var styleProp = change.attribute.substring(6);
          element.css(styleProp, change.newValue);
        } else {
          element.attr(change.attribute, change.newValue);
        }
        break;
      case "text":
        element.text(change.newValue);
        break;
      case "html":
        element.html(change.newValue);
        break;
    }
  }

  // Create a new project from current generated HTML
  function saveAsProject(name) {
    var projectId = generateId();
    var html = $("#main").html();
    var bodyClasses = $("body").attr("class") || "";

    var project = {
      id: projectId,
      name: name || "Untitled Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layout: localStorage.getItem(appName + ".layout"),
      language: localStorage.getItem(appName + ".language"),
      bodyClasses: bodyClasses,
      pecha: pecha ? JSON.stringify(pecha) : null,
      versions: [
        {
          id: generateId(),
          html: html, // Full HTML only for initial version
          timestamp: new Date().toISOString(),
          tag: "Initial version",
          changes: null,
        },
      ],
    };

    // Add to projects list
    var list = getProjectsList();
    list.unshift({
      id: projectId,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      layout: project.layout,
    });
    saveProjectsList(list);

    // Save project data
    saveProjectData(projectId, project);

    currentProjectId = projectId;
    currentVersionIndex = 0;
    pendingChanges = {};

    return projectId;
  }

  // Save a manual version (with full HTML snapshot for safety)
  function saveVersion(tag) {
    if (!currentProjectId) return null;

    // First commit any pending changes
    commitPendingChanges();

    var project = getProject(currentProjectId);
    if (!project) return null;

    // For manual saves, store full HTML as a checkpoint
    var html = $("#main").html();
    var lastVersion = project.versions[project.versions.length - 1];

    // Don't save if nothing changed
    if (lastVersion && lastVersion.html === html && !tag) {
      return lastVersion.id;
    }

    var version = {
      id: generateId(),
      html: html, // Full snapshot for manual saves
      timestamp: new Date().toISOString(),
      tag: tag || null,
      changes: null,
    };

    project.versions.push(version);

    if (project.versions.length > MAX_VERSIONS) {
      project.versions = compactVersions(project.versions);
    }

    project.updatedAt = new Date().toISOString();
    project.bodyClasses = $("body").attr("class") || "";
    currentVersionIndex = project.versions.length - 1;

    saveProjectData(currentProjectId, project);
    updateProjectInList(currentProjectId, { updatedAt: project.updatedAt });

    return version.id;
  }

  // Update project metadata in list
  function updateProjectInList(projectId, updates) {
    var list = getProjectsList();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === projectId) {
        Object.assign(list[i], updates);
        break;
      }
    }
    saveProjectsList(list);
  }

  // Load a project at a specific version
  function loadProject(projectId, versionIndex) {
    var project = getProject(projectId);
    if (!project) return false;

    var versionIdx =
      typeof versionIndex === "number"
        ? versionIndex
        : project.versions.length - 1;

    if (versionIdx < 0 || versionIdx >= project.versions.length) return false;

    // Rebuild HTML at this version
    var html = rebuildHtmlAtVersion(project.versions, versionIdx);

    // Clear current state - preserve theme from localStorage
    var currentTheme = localStorage[appName + ".theme"] || "dark";
    $("body").removeClass().addClass(project.bodyClasses);
    // Restore theme from localStorage (user preference should persist)
    $("body")
      .removeClass("theme-dark theme-light theme-lapis")
      .addClass("theme-" + currentTheme);
    $("#main").html(html);
    $("#input-form").remove();
    $("#save-project-btn").remove();

    // Restore pecha data if available
    if (project.pecha) {
      try {
        pecha = JSON.parse(project.pecha);
      } catch (e) {
        console.error("Error parsing pecha data:", e);
      }
    }

    currentProjectId = projectId;
    currentVersionIndex = versionIdx;
    pendingChanges = {};

    // Show UI buttons
    $("#print-button").show();
    $("#color-mode-button").show();
    $("#inspect-td-button").show();
    $("#loading-overlay").fadeOut();

    // Start tracking changes
    startTrackingChanges();

    // Show project controls
    showProjectControls(project, versionIdx);

    return true;
  }

  // Rollback to a specific version
  function rollbackToVersion(versionIndex) {
    if (!currentProjectId) return false;
    return loadProject(currentProjectId, versionIndex);
  }

  // Undo - go to previous version
  function undo() {
    if (!currentProjectId || currentVersionIndex === null) return false;

    // First commit any pending changes
    if (Object.keys(pendingChanges).length > 0) {
      commitPendingChanges();
    }

    if (currentVersionIndex <= 0) return false;

    var newIndex = currentVersionIndex - 1;
    stopTrackingChanges();
    var result = loadProject(currentProjectId, newIndex);
    return result;
  }

  // Redo - go to next version
  function redo() {
    if (!currentProjectId || currentVersionIndex === null) return false;

    var project = getProject(currentProjectId);
    if (!project) return false;
    if (currentVersionIndex >= project.versions.length - 1) return false;

    var newIndex = currentVersionIndex + 1;
    stopTrackingChanges();
    var result = loadProject(currentProjectId, newIndex);
    return result;
  }

  // Check if undo is available
  function canUndo() {
    return (
      currentProjectId &&
      currentVersionIndex !== null &&
      currentVersionIndex > 0
    );
  }

  // Check if redo is available
  function canRedo() {
    if (!currentProjectId || currentVersionIndex === null) return false;
    var project = getProject(currentProjectId);
    return project && currentVersionIndex < project.versions.length - 1;
  }

  // Get current version index
  function getCurrentVersionIndex() {
    return currentVersionIndex;
  }

  // Delete a project
  function deleteProject(projectId) {
    var list = getProjectsList();
    list = list.filter(function (p) {
      return p.id !== projectId;
    });
    saveProjectsList(list);
    localStorage.removeItem(STORAGE_KEY_PREFIX + "." + projectId);

    if (currentProjectId === projectId) {
      currentProjectId = null;
      stopTrackingChanges();
    }
  }

  // Rename a project
  function renameProject(projectId, newName) {
    var project = getProject(projectId);
    if (!project) return false;

    project.name = newName;
    project.updatedAt = new Date().toISOString();
    saveProjectData(projectId, project);
    updateProjectInList(projectId, {
      name: newName,
      updatedAt: project.updatedAt,
    });

    return true;
  }

  // Tag a version
  function tagVersion(versionIndex, tag) {
    if (!currentProjectId) return false;

    var project = getProject(currentProjectId);
    if (!project || !project.versions[versionIndex]) return false;

    project.versions[versionIndex].tag = tag;
    project.updatedAt = new Date().toISOString();
    saveProjectData(currentProjectId, project);

    return true;
  }

  // Start tracking DOM changes
  function startTrackingChanges() {
    if (isTrackingChanges) return;

    var mainElement = document.getElementById("main");
    if (!mainElement) return;

    mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var target = mutation.target;

        // Ignore changes to project controls and UI elements
        if ($(target).closest("#project-controls").length > 0) return;
        if ($(target).closest("#version-history-modal").length > 0) return;
        if ($(target).closest(".ui.modal").length > 0) return;
        if ($(target).closest(".inspect-td-popup").length > 0) return;

        // Ignore if target itself is a UI element
        if ($(target).hasClass("inspect-td-popup")) return;
        if ($(target).hasClass("inspect-td-highlight")) return;

        var selector = getElementSelector(target);
        if (!selector) return;

        if (mutation.type === "attributes") {
          var attrName = mutation.attributeName;
          var oldValue = mutation.oldValue;
          var newValue = target.getAttribute(attrName);

          // Skip if values are the same (no actual change)
          if (oldValue === newValue) return;

          // Skip data-* attributes that are for internal tracking
          if (attrName.startsWith("data-")) return;

          // Filter out hover/focus/transient class changes
          if (attrName === "class") {
            var oldClasses = (oldValue || "")
              .split(/\s+/)
              .filter(Boolean)
              .sort();
            var newClasses = (newValue || "")
              .split(/\s+/)
              .filter(Boolean)
              .sort();

            // Filter out transient classes
            var transientClasses = [
              "hover",
              "active",
              "focus",
              "highlight",
              "highlighted",
              "inspected",
              "selected",
              "inspect-td",
              "dragging",
              "dragover",
            ];
            var filterTransient = function (classes) {
              return classes.filter(function (c) {
                return !transientClasses.some(function (t) {
                  return c === t || c.indexOf(t) !== -1;
                });
              });
            };

            var filteredOld = filterTransient(oldClasses);
            var filteredNew = filterTransient(newClasses);

            // If no meaningful change after filtering, skip
            if (filteredOld.join(" ") === filteredNew.join(" ")) return;
          }

          // For style changes, try to identify specific property
          if (attrName === "style") {
            // Record as generic style change
            recordChange(selector, "attribute", "style", oldValue, newValue);
          } else {
            recordChange(selector, "attribute", attrName, oldValue, newValue);
          }
        } else if (mutation.type === "characterData") {
          var parentSelector = getElementSelector(target.parentElement);
          if (parentSelector) {
            recordChange(
              parentSelector,
              "text",
              null,
              mutation.oldValue,
              target.textContent
            );
          }
        } else if (mutation.type === "childList") {
          // For structural changes, record the parent's innerHTML
          // This is less efficient but handles complex changes
          recordChange(selector, "html", null, null, target.innerHTML);
        }
      });
    });

    mutationObserver.observe(mainElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
    });

    isTrackingChanges = true;
  }

  // Stop tracking changes
  function stopTrackingChanges() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    // Clear pending change timers
    Object.keys(pendingChangeTimers).forEach(function (key) {
      clearTimeout(pendingChangeTimers[key]);
    });
    pendingChangeTimers = {};
    isTrackingChanges = false;
  }

  // Show project controls UI
  function showProjectControls(project, currentVersionIndex) {
    // Remove existing controls
    $("#project-controls").remove();

    var versionCount = project.versions.length;
    var currentVersion = project.versions[currentVersionIndex];

    var controls = $('<div id="project-controls">');
    controls.html(
      '\
      <div class="project-info">\
        <span class="project-name">' +
        escapeHtml(project.name) +
        '</span>\
        <span class="version-info">v' +
        (currentVersionIndex + 1) +
        "/" +
        versionCount +
        '</span>\
      </div>\
      <div class="project-buttons">\
        <button id="save-version-btn" class="circular ui black icon button" title="Save version">\
          <i class="save icon"></i>\
        </button>\
        <button id="version-history-btn" class="circular ui black icon button" title="Version history">\
          <i class="history icon"></i>\
        </button>\
        <button id="tag-version-btn" class="circular ui black icon button" title="Tag this version">\
          <i class="tag icon"></i>\
        </button>\
      </div>\
    '
    );

    $("body").append(controls);
  }

  // Show version history modal
  function showVersionHistoryModal() {
    if (!currentProjectId) return;

    var project = getProject(currentProjectId);
    if (!project) return;

    var versionsHtml = project.versions
      .map(function (version, index) {
        var date = new Date(version.timestamp);
        var dateStr =
          date.toLocaleDateString() + " " + date.toLocaleTimeString();
        var tagHtml = version.tag
          ? '<span class="version-tag">' + escapeHtml(version.tag) + "</span>"
          : "";

        // Build changes description
        var changesHtml = "";
        if (version.html && index === 0) {
          changesHtml =
            '<div class="version-changes"><em>Initial snapshot</em></div>';
        } else if (version.html) {
          changesHtml =
            '<div class="version-changes"><em>Full snapshot (checkpoint)</em></div>';
        } else if (version.changes && version.changes.length > 0) {
          var changesList = version.changes
            .slice(0, 5)
            .map(function (change) {
              var desc = formatChangeDescription(change);
              return (
                '<li><span class="change-type ' +
                change.type +
                '">' +
                change.type +
                "</span>" +
                escapeHtml(desc) +
                "</li>"
              );
            })
            .join("");
          var moreText =
            version.changes.length > 5
              ? "<li><em>...and " +
                (version.changes.length - 5) +
                " more</em></li>"
              : "";
          changesHtml =
            '<div class="version-changes"><ul>' +
            changesList +
            moreText +
            "</ul></div>";
        }

        return (
          '\
        <div class="version-item" data-index="' +
          index +
          '">\
          <div class="version-header">\
            <span class="version-number">Version ' +
          (index + 1) +
          "</span>\
            " +
          tagHtml +
          '\
          </div>\
          <div class="version-date">' +
          dateStr +
          "</div>" +
          changesHtml +
          '\
          <div class="version-actions">\
            <button class="ui mini button rollback-btn" data-index="' +
          index +
          '">Restore</button>\
            <button class="ui mini button tag-btn" data-index="' +
          index +
          '">Tag</button>\
          </div>\
        </div>\
      '
        );
      })
      .reverse()
      .join("");

    var modal = $(
      '\
      <div id="version-history-modal" class="ui modal">\
        <i class="close icon"></i>\
        <div class="header">Version History - ' +
        escapeHtml(project.name) +
        '</div>\
        <div class="scrolling content">\
          <div class="versions-list">' +
        versionsHtml +
        "</div>\
        </div>\
      </div>\
    "
    );

    $("body").append(modal);
    modal.modal("show");
  }

  // Show tag input modal
  function showTagModal(versionIndex) {
    var project = getProject(currentProjectId);
    var currentTag =
      project && project.versions[versionIndex]
        ? project.versions[versionIndex].tag || ""
        : "";

    var modal = $(
      '\
      <div id="tag-modal" class="ui mini modal">\
        <div class="header">Tag Version</div>\
        <div class="content">\
          <div class="ui input fluid">\
            <input type="text" id="version-tag-input" placeholder="Enter version name..." value="' +
        escapeHtml(currentTag) +
        '">\
          </div>\
        </div>\
        <div class="actions">\
          <button class="ui cancel button">Cancel</button>\
          <button class="ui primary approve button" id="save-tag-btn" data-index="' +
        versionIndex +
        '">Save</button>\
        </div>\
      </div>\
    '
    );

    $("body").append(modal);
    modal.modal("show");
    $("#version-tag-input").focus();
  }

  // Show save project modal
  function showSaveProjectModal() {
    var defaultName =
      pecha && pecha.title && pecha.title.english
        ? pecha.title.english.title
        : "Untitled Project";

    var modal = $(
      '\
      <div id="save-project-modal" class="ui mini modal">\
        <div class="header">Save as Project</div>\
        <div class="content">\
          <div class="ui input fluid">\
            <input type="text" id="project-name-input" placeholder="Enter project name..." value="' +
        escapeHtml(defaultName) +
        '">\
          </div>\
        </div>\
        <div class="actions">\
          <button class="ui cancel button">Cancel</button>\
          <button class="ui primary approve button" id="confirm-save-project-btn">Save</button>\
        </div>\
      </div>\
    '
    );

    $("body").append(modal);
    modal.modal("show");
    $("#project-name-input").focus().select();
  }

  // Format a change for display
  function formatChangeDescription(change) {
    var selector = change.selector || "";
    // Simplify selector for display
    var shortSelector = selector.split(" > ").pop() || selector;
    if (shortSelector.length > 30) {
      shortSelector = shortSelector.substring(0, 27) + "...";
    }

    switch (change.type) {
      case "attribute":
        if (change.attribute === "style") {
          return shortSelector + " style changed";
        } else if (change.attribute === "class") {
          return shortSelector + " class changed";
        } else {
          return shortSelector + " " + change.attribute + " changed";
        }
      case "text":
        var preview = (change.newValue || "").substring(0, 20);
        if ((change.newValue || "").length > 20) preview += "...";
        return shortSelector + ' text: "' + preview + '"';
      case "html":
        return shortSelector + " content modified";
      default:
        return shortSelector + " changed";
    }
  }

  // Escape HTML helper
  function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Get current project ID
  function getCurrentProjectId() {
    return currentProjectId;
  }

  // Set current project ID (for when loading)
  function setCurrentProjectId(id) {
    currentProjectId = id;
  }

  // Public API
  return {
    getProjectsList: getProjectsList,
    getProject: getProject,
    saveAsProject: saveAsProject,
    saveVersion: saveVersion,
    loadProject: loadProject,
    rollbackToVersion: rollbackToVersion,
    undo: undo,
    redo: redo,
    canUndo: canUndo,
    canRedo: canRedo,
    getCurrentVersionIndex: getCurrentVersionIndex,
    deleteProject: deleteProject,
    renameProject: renameProject,
    tagVersion: tagVersion,
    startTrackingChanges: startTrackingChanges,
    stopTrackingChanges: stopTrackingChanges,
    showProjectControls: showProjectControls,
    showVersionHistoryModal: showVersionHistoryModal,
    showTagModal: showTagModal,
    showSaveProjectModal: showSaveProjectModal,
    getCurrentProjectId: getCurrentProjectId,
    setCurrentProjectId: setCurrentProjectId,
  };
})();

// Event handlers for project management
$(document).ready(function () {
  // Keyboard shortcuts for undo/redo
  $(document).on("keydown", function (e) {
    // Only handle if we have an active project
    if (!ProjectManager.getCurrentProjectId()) return;

    // Don't intercept if user is typing in an input field
    if ($(e.target).is("input, textarea, [contenteditable]")) return;

    var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    var modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && !e.altKey) {
      // CMD/CTRL + Z = Undo
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (ProjectManager.canUndo()) {
          ProjectManager.undo();
        }
        return;
      }

      // CMD/CTRL + SHIFT + Z = Redo (Mac style)
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (ProjectManager.canRedo()) {
          ProjectManager.redo();
        }
        return;
      }

      // CMD/CTRL + Y = Redo (Windows style)
      if (e.key === "y") {
        e.preventDefault();
        if (ProjectManager.canRedo()) {
          ProjectManager.redo();
        }
        return;
      }
    }
  });

  // Save project button click
  $(document).on("click", "#save-project-btn", function () {
    if (ProjectManager.getCurrentProjectId()) {
      // Already a project, just save new version
      ProjectManager.saveVersion();
      // Update UI
      var project = ProjectManager.getProject(
        ProjectManager.getCurrentProjectId()
      );
      if (project) {
        ProjectManager.showProjectControls(
          project,
          project.versions.length - 1
        );
      }
    } else {
      ProjectManager.showSaveProjectModal();
    }
  });

  // Confirm save project
  $(document).on("click", "#confirm-save-project-btn", function () {
    var name = $("#project-name-input").val().trim();
    if (name) {
      var projectId = ProjectManager.saveAsProject(name);
      var project = ProjectManager.getProject(projectId);
      ProjectManager.startTrackingChanges();
      ProjectManager.showProjectControls(project, 0);
      $("#save-project-modal").modal("hide").remove();
    }
  });

  // Save version button
  $(document).on("click", "#save-version-btn", function () {
    ProjectManager.saveVersion();
    var project = ProjectManager.getProject(
      ProjectManager.getCurrentProjectId()
    );
    if (project) {
      ProjectManager.showProjectControls(project, project.versions.length - 1);
    }
  });

  // Version history button
  $(document).on("click", "#version-history-btn", function () {
    ProjectManager.showVersionHistoryModal();
  });

  // Tag version button (current version)
  $(document).on("click", "#tag-version-btn", function () {
    var project = ProjectManager.getProject(
      ProjectManager.getCurrentProjectId()
    );
    if (project) {
      ProjectManager.showTagModal(project.versions.length - 1);
    }
  });

  // Rollback button in history
  $(document).on("click", ".rollback-btn", function () {
    var index = parseInt($(this).data("index"));
    $("#version-history-modal").modal("hide").remove();
    ProjectManager.rollbackToVersion(index);
  });

  // Tag button in history
  $(document).on("click", ".tag-btn", function () {
    var index = parseInt($(this).data("index"));
    $("#version-history-modal").modal("hide").remove();
    ProjectManager.showTagModal(index);
  });

  // Save tag
  $(document).on("click", "#save-tag-btn", function () {
    var index = parseInt($(this).data("index"));
    var tag = $("#version-tag-input").val().trim();
    ProjectManager.tagVersion(index, tag);
    $("#tag-modal").modal("hide").remove();

    // Update controls if tagging current version
    var project = ProjectManager.getProject(
      ProjectManager.getCurrentProjectId()
    );
    if (project) {
      ProjectManager.showProjectControls(project, project.versions.length - 1);
    }
  });

  // Enter key in tag input
  $(document).on("keypress", "#version-tag-input", function (e) {
    if (e.which === 13) {
      $("#save-tag-btn").click();
    }
  });

  // Enter key in project name input
  $(document).on("keypress", "#project-name-input", function (e) {
    if (e.which === 13) {
      $("#confirm-save-project-btn").click();
    }
  });

  // Load project from list
  $(document).on("click", ".project-card", function () {
    var projectId = $(this).data("id");
    $("#loading-overlay").show();
    setTimeout(function () {
      ProjectManager.loadProject(projectId);
    }, 100);
  });

  // Delete project
  $(document).on("click", ".delete-project-btn", function (e) {
    e.stopPropagation();
    var projectId = $(this).closest(".project-card").data("id");
    var projectName = $(this)
      .closest(".project-card")
      .find(".project-card-name")
      .text();

    if (
      confirm('Delete project "' + projectName + '"? This cannot be undone.')
    ) {
      ProjectManager.deleteProject(projectId);
      $(this)
        .closest(".project-card")
        .fadeOut(function () {
          $(this).remove();
          // Check if no projects left
          if ($(".project-card").length === 0) {
            $("#saved-projects-section").hide();
          }
        });
    }
  });
});

// Export for ES module usage
export { ProjectManager };
