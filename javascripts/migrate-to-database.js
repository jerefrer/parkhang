/**
 * Migration script to move localStorage projects to PostgreSQL database
 *
 * Usage:
 *   1. Make sure the API server is running: pnpm run server
 *   2. Open the app in the browser
 *   3. Open browser console and run: migrateProjectsToDatabase()
 *
 * Or import and call from code:
 *   import { migrateProjectsToDatabase } from './migrate-to-database.js';
 *   await migrateProjectsToDatabase();
 */

var API_URL = "http://localhost:3001";

// Get all projects from localStorage with their full data
var getLocalStorageProjects = function () {
  var STORAGE_KEY_PREFIX = window.appName + ".projects";
  var PROJECTS_LIST_KEY = STORAGE_KEY_PREFIX + ".list";

  var listJson = localStorage.getItem(PROJECTS_LIST_KEY);
  if (!listJson) {
    console.log("No projects found in localStorage");
    return [];
  }

  var projectsList = JSON.parse(listJson);
  var fullProjects = [];

  for (var i = 0; i < projectsList.length; i++) {
    var projectMeta = projectsList[i];
    var projectDataJson = localStorage.getItem(
      STORAGE_KEY_PREFIX + "." + projectMeta.id
    );

    if (projectDataJson) {
      try {
        var projectData = JSON.parse(projectDataJson);
        fullProjects.push({
          name: projectData.name,
          layout: projectData.layout,
          language: projectData.language,
          bodyClasses: projectData.bodyClasses,
          pecha: projectData.pecha ? JSON.parse(projectData.pecha) : null,
          createdAt: projectData.createdAt,
          updatedAt: projectData.updatedAt,
          versions: projectData.versions || [],
        });
      } catch (e) {
        console.error("Error parsing project " + projectMeta.id + ":", e);
      }
    }
  }

  return fullProjects;
};

// Migrate all localStorage projects to the database
var migrateProjectsToDatabase = async function () {
  console.log("🚀 Starting migration from localStorage to database...");

  var projects = getLocalStorageProjects();

  if (projects.length === 0) {
    console.log("No projects to migrate.");
    return { migrated: [], failed: [] };
  }

  console.log("Found " + projects.length + " projects to migrate");

  try {
    var response = await fetch(API_URL + "/api/migrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projects: projects }),
    });

    if (!response.ok) {
      var errorData = await response.json();
      throw new Error(errorData.error || "Migration failed");
    }

    var results = await response.json();

    console.log("\n📦 Migration Results:");
    console.log("   ✅ Migrated: " + results.migrated.length);
    console.log("   ❌ Failed: " + results.failed.length);

    if (results.migrated.length > 0) {
      console.log("\n   Migrated projects:");
      results.migrated.forEach(function (p) {
        console.log("      - " + p.name + " (id: " + p.id + ")");
      });
    }

    if (results.failed.length > 0) {
      console.log("\n   Failed projects:");
      results.failed.forEach(function (p) {
        console.log("      - " + p.name + ": " + p.reason);
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    console.log("\nMake sure the API server is running: pnpm run server");
    throw error;
  }
};

// Clear localStorage projects after successful migration (optional)
var clearLocalStorageProjects = function () {
  var STORAGE_KEY_PREFIX = window.appName + ".projects";
  var PROJECTS_LIST_KEY = STORAGE_KEY_PREFIX + ".list";

  var listJson = localStorage.getItem(PROJECTS_LIST_KEY);
  if (!listJson) {
    console.log("No projects in localStorage to clear");
    return;
  }

  var projectsList = JSON.parse(listJson);

  // Remove each project's data
  for (var i = 0; i < projectsList.length; i++) {
    localStorage.removeItem(STORAGE_KEY_PREFIX + "." + projectsList[i].id);
  }

  // Remove the list
  localStorage.removeItem(PROJECTS_LIST_KEY);

  console.log(
    "✅ Cleared " + projectsList.length + " projects from localStorage"
  );
};

// Expose globally for console usage
window.migrateProjectsToDatabase = migrateProjectsToDatabase;
window.getLocalStorageProjects = getLocalStorageProjects;
window.clearLocalStorageProjects = clearLocalStorageProjects;

// Export for ES module usage
export {
  clearLocalStorageProjects,
  getLocalStorageProjects,
  migrateProjectsToDatabase,
};
