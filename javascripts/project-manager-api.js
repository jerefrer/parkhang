// Project Manager - Database-backed version
// Uses the API server for all project operations

var ProjectManager = (function () {
  var currentProjectId = null;
  var currentVersionIndex = null;
  var currentProject = null; // Cache of current project data
  var isTrackingChanges = false;
  var mutationObserver = null;
  var projectsCache = null; // Cache of projects list

  // Pending changes tracking
  var pendingChanges = {};
  var pendingChangeTimers = {};
  var saveTimer = null;
  var ATTRIBUTE_DEBOUNCE_DELAY = 30000;
  var SAVE_DEBOUNCE_DELAY = 500;

  // ============================================
  // API HELPERS
  // ============================================

  function apiRequest(endpoint, options) {
    options = options || {};
    var url = "http://localhost:3001" + endpoint;

    var fetchOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    return fetch(url, fetchOptions).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (err) {
          throw new Error(err.error || "Request failed");
        });
      }
      if (options.responseType === "blob") {
        return response.blob();
      }
      return response.json();
    });
  }

  // ============================================
  // PROJECT LIST OPERATIONS
  // ============================================

  // Get all projects list (async)
  function getProjectsList() {
    // Return cached if available, otherwise fetch
    if (projectsCache) {
      return Promise.resolve(projectsCache);
    }
    return apiRequest("/api/projects").then(function (projects) {
      projectsCache = projects;
      return projects;
    });
  }

  // Get all projects list (sync - returns cache or empty)
  function getProjectsListSync() {
    return projectsCache || [];
  }

  // Refresh projects cache
  function refreshProjectsList() {
    projectsCache = null;
    return getProjectsList();
  }

  // ============================================
  // PROJECT OPERATIONS
  // ============================================

  // Get project data (async)
  function getProject(projectId) {
    return apiRequest("/api/projects/" + projectId);
  }

  // Get project data (sync - only works for current project)
  function getProjectSync(projectId) {
    if (projectId === currentProjectId && currentProject) {
      return currentProject;
    }
    return null;
  }

  // Create a new project from current generated HTML
  function saveAsProject(name) {
    var html = $("#main").html();
    var bodyClasses = $("body").attr("class") || "";
    var layout = localStorage.getItem(appName + ".layout");
    var language = localStorage.getItem(appName + ".language");

    return apiRequest("/api/projects", {
      method: "POST",
      body: {
        name: name || "Untitled Project",
        layout: layout,
        language: language,
        bodyClasses: bodyClasses,
        pechaData: window.pecha || null,
        html: html,
      },
    }).then(function (project) {
      currentProjectId = project.id;
      currentVersionIndex = 0;
      currentProject = project;
      currentProject.versions = [{ version_number: 1, tag: "Initial version" }];
      pendingChanges = {};
      projectsCache = null; // Invalidate cache

      // Start tracking and show controls
      startTrackingChanges();
      showProjectControls(currentProject, currentVersionIndex);

      return project.id;
    });
  }

  // Save a manual version
  function saveVersion(tag) {
    if (!currentProjectId) return Promise.resolve(null);

    // First commit any pending changes
    return commitPendingChanges().then(function () {
      var html = $("#main").html();
      var bodyClasses = $("body").attr("class") || "";

      return apiRequest("/api/projects/" + currentProjectId + "/versions", {
        method: "POST",
        body: {
          html: html,
          tag: tag || null,
          bodyClasses: bodyClasses,
        },
      }).then(function (version) {
        if (currentProject && currentProject.versions) {
          currentProject.versions.push({
            version_number: version.version_number,
            tag: version.tag,
            created_at: version.created_at,
          });
          currentVersionIndex = currentProject.versions.length - 1;
        }
        showProjectControls(currentProject, currentVersionIndex);
        return version.id;
      });
    });
  }

  // Load a project at a specific version
  function loadProject(projectId, versionIndex) {
    return apiRequest("/api/projects/" + projectId).then(function (project) {
      var versionIdx =
        typeof versionIndex === "number"
          ? versionIndex
          : project.versions.length - 1;

      if (versionIdx < 0 || versionIdx >= project.versions.length) {
        throw new Error("Invalid version index");
      }

      var versionNumber = project.versions[versionIdx].version_number;

      return apiRequest(
        "/api/projects/" + projectId + "/versions/" + versionNumber
      ).then(function (versionData) {
        // Clear current state - preserve theme from localStorage
        var currentTheme = localStorage[appName + ".theme"] || "dark";
        $("body")
          .removeClass()
          .addClass(project.body_classes || "");
        $("body")
          .removeClass("theme-dark theme-light theme-lapis")
          .addClass("theme-" + currentTheme);
        $("#main").html(versionData.html_content || "");
        $("#input-form").remove();
        $("#save-project-btn").remove();

        // Restore pecha data if available
        if (project.pecha_data) {
          try {
            window.pecha =
              typeof project.pecha_data === "string"
                ? JSON.parse(project.pecha_data)
                : project.pecha_data;
          } catch (e) {
            console.error("Error parsing pecha data:", e);
          }
        }

        currentProjectId = projectId;
        currentVersionIndex = versionIdx;
        currentProject = project;
        pendingChanges = {};

        // Show UI buttons
        $("#print-button").show();
        $("#pdf-export-button").show();
        $("#color-mode-button").show();
        $("#inspect-td-button").show();
        $("#loading-overlay").fadeOut();

        // Start tracking changes
        startTrackingChanges();

        // Show project controls
        showProjectControls(project, versionIdx);

        return true;
      });
    });
  }

  // Delete a project
  function deleteProject(projectId) {
    return apiRequest("/api/projects/" + projectId, {
      method: "DELETE",
    }).then(function () {
      if (currentProjectId === projectId) {
        currentProjectId = null;
        currentProject = null;
        stopTrackingChanges();
      }
      projectsCache = null; // Invalidate cache
      return true;
    });
  }

  // Rename a project
  function renameProject(projectId, newName) {
    return apiRequest("/api/projects/" + projectId, {
      method: "PATCH",
      body: { name: newName },
    }).then(function (project) {
      if (currentProjectId === projectId && currentProject) {
        currentProject.name = newName;
      }
      projectsCache = null; // Invalidate cache
      return true;
    });
  }

  // Tag a version
  function tagVersion(versionIndex, tag) {
    if (!currentProjectId || !currentProject) return Promise.resolve(false);

    var versionNumber = currentProject.versions[versionIndex].version_number;

    return apiRequest(
      "/api/projects/" + currentProjectId + "/versions/" + versionNumber,
      {
        method: "PATCH",
        body: { tag: tag },
      }
    ).then(function () {
      if (currentProject.versions[versionIndex]) {
        currentProject.versions[versionIndex].tag = tag;
      }
      return true;
    });
  }

  // ============================================
  // VERSION NAVIGATION
  // ============================================

  function rollbackToVersion(versionIndex) {
    if (!currentProjectId) return Promise.resolve(false);
    return loadProject(currentProjectId, versionIndex);
  }

  function undo() {
    if (!currentProjectId || currentVersionIndex === null)
      return Promise.resolve(false);

    // First commit any pending changes
    var hasChanges = Object.keys(pendingChanges).length > 0;
    var commitPromise = hasChanges ? commitPendingChanges() : Promise.resolve();

    return commitPromise.then(function () {
      if (currentVersionIndex <= 0) return false;
      var newIndex = currentVersionIndex - 1;
      stopTrackingChanges();
      return loadProject(currentProjectId, newIndex);
    });
  }

  function redo() {
    if (!currentProjectId || currentVersionIndex === null)
      return Promise.resolve(false);
    if (
      !currentProject ||
      currentVersionIndex >= currentProject.versions.length - 1
    )
      return Promise.resolve(false);

    var newIndex = currentVersionIndex + 1;
    stopTrackingChanges();
    return loadProject(currentProjectId, newIndex);
  }

  function canUndo() {
    return (
      currentProjectId &&
      currentVersionIndex !== null &&
      currentVersionIndex > 0
    );
  }

  function canRedo() {
    if (!currentProjectId || currentVersionIndex === null) return false;
    return (
      currentProject && currentVersionIndex < currentProject.versions.length - 1
    );
  }

  function getCurrentVersionIndex() {
    return currentVersionIndex;
  }

  function getCurrentProjectId() {
    return currentProjectId;
  }

  function setCurrentProjectId(id) {
    currentProjectId = id;
  }

  // ============================================
  // CHANGE TRACKING
  // ============================================

  function getElementSelector(element) {
    if (!element || element.nodeType !== 1) return null;

    var cid = element.getAttribute("data-cid");
    if (cid) {
      return '[data-cid="' + cid + '"]';
    }

    if (element.id) {
      return "#" + element.id;
    }

    var path = [];
    var current = element;
    while (current && current.nodeType === 1 && current.id !== "main") {
      var currentCid = current.getAttribute("data-cid");
      if (currentCid) {
        path.unshift('[data-cid="' + currentCid + '"]');
        break;
      }

      var selector = current.tagName.toLowerCase();
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

  function recordChange(selector, changeType, attribute, oldValue, newValue) {
    var changeKey = selector + "|" + changeType + "|" + (attribute || "");
    var now = Date.now();

    if (pendingChanges[changeKey]) {
      pendingChanges[changeKey].newValue = newValue;
      pendingChanges[changeKey].timestamp = now;

      if (pendingChangeTimers[changeKey]) {
        clearTimeout(pendingChangeTimers[changeKey]);
      }
    } else {
      pendingChanges[changeKey] = {
        selector: selector,
        type: changeType,
        attribute: attribute,
        oldValue: oldValue,
        newValue: newValue,
        timestamp: now,
      };
    }

    pendingChangeTimers[changeKey] = setTimeout(function () {
      delete pendingChangeTimers[changeKey];
    }, ATTRIBUTE_DEBOUNCE_DELAY);

    scheduleSave();
  }

  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(function () {
      commitPendingChanges();
      saveTimer = null;
    }, SAVE_DEBOUNCE_DELAY);
  }

  function commitPendingChanges() {
    if (!currentProjectId) return Promise.resolve();
    if (Object.keys(pendingChanges).length === 0) return Promise.resolve();

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

    pendingChanges = {};
    Object.keys(pendingChangeTimers).forEach(function (key) {
      clearTimeout(pendingChangeTimers[key]);
    });
    pendingChangeTimers = {};

    var html = $("#main").html();
    var bodyClasses = $("body").attr("class") || "";

    return apiRequest("/api/projects/" + currentProjectId + "/versions", {
      method: "POST",
      body: {
        html: html,
        changes: changes,
        bodyClasses: bodyClasses,
      },
    })
      .then(function (version) {
        if (currentProject) {
          currentProject.versions.push({
            version_number: version.version_number,
            tag: version.tag,
            created_at: version.created_at,
            has_changes: true,
          });
          currentVersionIndex = currentProject.versions.length - 1;
        }
        showProjectControls(currentProject, currentVersionIndex);
      })
      .catch(function (error) {
        console.error("Error saving changes:", error);
      });
  }

  function startTrackingChanges() {
    if (isTrackingChanges) return;

    var mainElement = document.getElementById("main");
    if (!mainElement) return;

    mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var target = mutation.target;

        if ($(target).closest("#project-controls").length > 0) return;
        if ($(target).closest("#version-history-modal").length > 0) return;
        if ($(target).closest(".ui.modal").length > 0) return;
        if ($(target).closest(".inspect-td-popup").length > 0) return;
        if ($(target).hasClass("inspect-td-popup")) return;
        if ($(target).hasClass("inspect-td-highlight")) return;

        var selector = getElementSelector(target);
        if (!selector) return;

        if (mutation.type === "attributes") {
          var attrName = mutation.attributeName;
          var oldValue = mutation.oldValue;
          var newValue = target.getAttribute(attrName);

          if (oldValue === newValue) return;
          if (attrName.startsWith("data-")) return;

          if (attrName === "class") {
            var oldClasses = (oldValue || "")
              .split(/\s+/)
              .filter(Boolean)
              .sort();
            var newClasses = (newValue || "")
              .split(/\s+/)
              .filter(Boolean)
              .sort();

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

            if (filteredOld.join(" ") === filteredNew.join(" ")) return;
          }

          recordChange(selector, "attribute", attrName, oldValue, newValue);
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

  function stopTrackingChanges() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    Object.keys(pendingChangeTimers).forEach(function (key) {
      clearTimeout(pendingChangeTimers[key]);
    });
    pendingChangeTimers = {};
    isTrackingChanges = false;
  }

  // ============================================
  // UI FUNCTIONS
  // ============================================

  function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showProjectControls(project, versionIdx) {
    $("#project-controls").remove();

    if (!project) return;

    var versionCount = project.versions ? project.versions.length : 0;

    var controls = $('<div id="project-controls">');
    controls.html(
      '<div class="project-info">' +
        '<span class="project-name">' +
        escapeHtml(project.name) +
        "</span>" +
        '<span class="version-info">v' +
        (versionIdx + 1) +
        "/" +
        versionCount +
        "</span>" +
        "</div>" +
        '<div class="project-buttons">' +
        '<button id="save-version-btn" class="circular ui black icon button" title="Save version">' +
        '<i class="save icon"></i>' +
        "</button>" +
        '<button id="version-history-btn" class="circular ui black icon button" title="Version history">' +
        '<i class="history icon"></i>' +
        "</button>" +
        '<button id="tag-version-btn" class="circular ui black icon button" title="Tag this version">' +
        '<i class="tag icon"></i>' +
        "</button>" +
        "</div>"
    );

    $("body").append(controls);
  }

  function showVersionHistoryModal() {
    if (!currentProjectId || !currentProject) return;

    var versionsHtml = currentProject.versions
      .map(function (version, index) {
        var date = version.created_at
          ? new Date(version.created_at)
          : new Date();
        var dateStr =
          date.toLocaleDateString() + " " + date.toLocaleTimeString();
        var tagHtml = version.tag
          ? '<span class="version-tag">' + escapeHtml(version.tag) + "</span>"
          : "";

        return (
          '<div class="version-item" data-index="' +
          index +
          '">' +
          '<div class="version-header">' +
          '<span class="version-number">Version ' +
          (index + 1) +
          "</span>" +
          tagHtml +
          "</div>" +
          '<div class="version-date">' +
          dateStr +
          "</div>" +
          '<div class="version-actions">' +
          '<button class="ui mini button rollback-btn" data-index="' +
          index +
          '">Restore</button>' +
          '<button class="ui mini button tag-btn" data-index="' +
          index +
          '">Tag</button>' +
          "</div>" +
          "</div>"
        );
      })
      .reverse()
      .join("");

    var modal = $(
      '<div id="version-history-modal" class="ui modal">' +
        '<i class="close icon"></i>' +
        '<div class="header">Version History - ' +
        escapeHtml(currentProject.name) +
        "</div>" +
        '<div class="scrolling content">' +
        '<div class="versions-list">' +
        versionsHtml +
        "</div>" +
        "</div>" +
        "</div>"
    );

    $("body").append(modal);
    modal.modal("show");
  }

  function showTagModal(versionIndex) {
    var currentTag =
      currentProject && currentProject.versions[versionIndex]
        ? currentProject.versions[versionIndex].tag || ""
        : "";

    var modal = $(
      '<div id="tag-modal" class="ui mini modal">' +
        '<div class="header">Tag Version</div>' +
        '<div class="content">' +
        '<div class="ui input fluid">' +
        '<input type="text" id="version-tag-input" placeholder="Enter version name..." value="' +
        escapeHtml(currentTag) +
        '">' +
        "</div>" +
        "</div>" +
        '<div class="actions">' +
        '<button class="ui cancel button">Cancel</button>' +
        '<button class="ui primary approve button" id="save-tag-btn" data-index="' +
        versionIndex +
        '">Save</button>' +
        "</div>" +
        "</div>"
    );

    $("body").append(modal);
    modal.modal("show");
    $("#version-tag-input").focus();
  }

  function showSaveProjectModal() {
    var defaultName =
      window.pecha && window.pecha.title && window.pecha.title.english
        ? window.pecha.title.english.title
        : "Untitled Project";

    var modal = $(
      '<div id="save-project-modal" class="ui mini modal">' +
        '<div class="header">Save as Project</div>' +
        '<div class="content">' +
        '<div class="ui input fluid">' +
        '<input type="text" id="project-name-input" placeholder="Enter project name..." value="' +
        escapeHtml(defaultName) +
        '">' +
        "</div>" +
        "</div>" +
        '<div class="actions">' +
        '<button class="ui cancel button">Cancel</button>' +
        '<button class="ui primary approve button" id="confirm-save-project-btn">Save</button>' +
        "</div>" +
        "</div>"
    );

    $("body").append(modal);
    modal.modal("show");
    $("#project-name-input").focus().select();
  }

  // Public API
  return {
    getProjectsList: getProjectsList,
    getProjectsListSync: getProjectsListSync,
    refreshProjectsList: refreshProjectsList,
    getProject: getProject,
    getProjectSync: getProjectSync,
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

// ============================================
// EVENT HANDLERS
// ============================================

$(document).ready(function () {
  // Keyboard shortcuts for undo/redo
  $(document).on("keydown", function (e) {
    if (!ProjectManager.getCurrentProjectId()) return;
    if ($(e.target).is("input, textarea, [contenteditable]")) return;

    var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    var modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && !e.altKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (ProjectManager.canUndo()) {
          ProjectManager.undo();
        }
        return;
      }

      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (ProjectManager.canRedo()) {
          ProjectManager.redo();
        }
        return;
      }

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
      ProjectManager.saveVersion();
    } else {
      ProjectManager.showSaveProjectModal();
    }
  });

  // Confirm save project
  $(document).on("click", "#confirm-save-project-btn", function () {
    var name = $("#project-name-input").val().trim();
    if (name) {
      ProjectManager.saveAsProject(name).then(function () {
        $("#save-project-modal").modal("hide");
      });
    }
  });

  // Save version button
  $(document).on("click", "#save-version-btn", function () {
    ProjectManager.saveVersion();
  });

  // Version history button
  $(document).on("click", "#version-history-btn", function () {
    ProjectManager.showVersionHistoryModal();
  });

  // Tag version button
  $(document).on("click", "#tag-version-btn", function () {
    var currentIndex = ProjectManager.getCurrentVersionIndex();
    ProjectManager.showTagModal(currentIndex);
  });

  // Save tag
  $(document).on("click", "#save-tag-btn", function () {
    var index = parseInt($(this).data("index"), 10);
    var tag = $("#version-tag-input").val().trim();
    ProjectManager.tagVersion(index, tag).then(function () {
      $("#tag-modal").modal("hide");
    });
  });

  // Rollback to version
  $(document).on("click", ".rollback-btn", function () {
    var index = parseInt($(this).data("index"), 10);
    $("#version-history-modal").modal("hide");
    ProjectManager.rollbackToVersion(index);
  });

  // Tag from history
  $(document).on("click", ".tag-btn", function () {
    var index = parseInt($(this).data("index"), 10);
    $("#version-history-modal").modal("hide");
    ProjectManager.showTagModal(index);
  });

  // Load project from list
  $(document).on("click", ".project-card", function () {
    var projectId = $(this).data("id");
    $("#loading-overlay").show();
    ProjectManager.loadProject(projectId).catch(function (error) {
      console.error("Error loading project:", error);
      $("#loading-overlay").hide();
      alert("Failed to load project: " + error.message);
    });
  });

  // Delete project
  $(document).on("click", ".delete-project-btn", function (e) {
    e.stopPropagation();
    var $card = $(this).closest(".project-card");
    var projectId = $card.data("id");
    var projectName = $card.find(".project-card-name").text();

    if (
      confirm('Delete project "' + projectName + '"? This cannot be undone.')
    ) {
      ProjectManager.deleteProject(projectId)
        .then(function () {
          $card.fadeOut(function () {
            $(this).remove();
            if ($(".project-card").length === 0) {
              $("#saved-projects-sidebar").hide();
            }
          });
        })
        .catch(function (error) {
          console.error("Error deleting project:", error);
          alert("Failed to delete project: " + error.message);
        });
    }
  });

  // Enter key in project name input
  $(document).on("keypress", "#project-name-input", function (e) {
    if (e.which === 13) {
      $("#confirm-save-project-btn").click();
    }
  });
});

// Export for ES module usage
export { ProjectManager };
