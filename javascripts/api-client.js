/**
 * API Client for Parkhang
 * Handles all communication with the backend server
 */

var API_URL = "http://localhost:3001";

var ApiClient = (function () {
  // Helper for fetch with error handling
  async function request(endpoint, options) {
    options = options || {};
    var url = API_URL + endpoint;

    var fetchOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    var response = await fetch(url, fetchOptions);

    if (!response.ok) {
      var errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: "Request failed with status " + response.status };
      }
      throw new Error(errorData.error || "Request failed");
    }

    // Handle blob responses (for PDF)
    if (options.responseType === "blob") {
      return response.blob();
    }

    return response.json();
  }

  // ============================================
  // PROJECT OPERATIONS
  // ============================================

  // List all projects
  async function listProjects() {
    return request("/api/projects");
  }

  // Get a single project with versions
  async function getProject(projectId) {
    return request("/api/projects/" + projectId);
  }

  // Get a specific version's HTML
  async function getProjectVersion(projectId, versionNumber) {
    return request("/api/projects/" + projectId + "/versions/" + versionNumber);
  }

  // Create a new project
  async function createProject(data) {
    return request("/api/projects", {
      method: "POST",
      body: {
        name: data.name,
        layout: data.layout,
        language: data.language,
        bodyClasses: data.bodyClasses,
        pechaData: data.pechaData,
        html: data.html,
      },
    });
  }

  // Save a new version
  async function saveVersion(projectId, data) {
    return request("/api/projects/" + projectId + "/versions", {
      method: "POST",
      body: {
        html: data.html,
        changes: data.changes,
        tag: data.tag,
        bodyClasses: data.bodyClasses,
      },
    });
  }

  // Update project metadata
  async function updateProject(projectId, data) {
    return request("/api/projects/" + projectId, {
      method: "PATCH",
      body: data,
    });
  }

  // Delete a project
  async function deleteProject(projectId) {
    return request("/api/projects/" + projectId, {
      method: "DELETE",
    });
  }

  // Tag a version
  async function tagVersion(projectId, versionNumber, tag) {
    return request(
      "/api/projects/" + projectId + "/versions/" + versionNumber,
      {
        method: "PATCH",
        body: { tag: tag },
      }
    );
  }

  // ============================================
  // PDF EXPORT
  // ============================================

  // Export project as PDF
  async function exportProjectPdf(projectId, versionNumber) {
    return request("/api/projects/" + projectId + "/export-pdf", {
      method: "POST",
      body: { versionNumber: versionNumber },
      responseType: "blob",
    });
  }

  // Export current page as PDF (without saving to database)
  async function exportPdf(html, bodyClasses, title) {
    return request("/api/export-pdf", {
      method: "POST",
      body: {
        html: html,
        bodyClasses: bodyClasses,
        title: title,
      },
      responseType: "blob",
    });
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async function healthCheck() {
    try {
      var result = await request("/api/health");
      return result.status === "ok";
    } catch (e) {
      return false;
    }
  }

  // Public API
  return {
    listProjects: listProjects,
    getProject: getProject,
    getProjectVersion: getProjectVersion,
    createProject: createProject,
    saveVersion: saveVersion,
    updateProject: updateProject,
    deleteProject: deleteProject,
    tagVersion: tagVersion,
    exportProjectPdf: exportProjectPdf,
    exportPdf: exportPdf,
    healthCheck: healthCheck,
  };
})();

// Expose globally
window.ApiClient = ApiClient;

// Export for ES module usage
export { ApiClient };
