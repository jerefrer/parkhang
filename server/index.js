#!/usr/bin/env node
/**
 * Parkhang API Server
 *
 * Express server providing:
 * - Project CRUD operations (PostgreSQL)
 * - PDF export via Playwright
 *
 * Usage:
 *   node server/index.js
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (default: postgresql://localhost:5432/parkhang)
 *   PORT - Server port (default: 3001)
 */

import cors from "cors";
import express from "express";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import db from "./db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ============================================
// PROJECT ENDPOINTS
// ============================================

// List all projects
app.get("/api/projects", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, layout, language, created_at, updated_at FROM projects ORDER BY updated_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error listing projects:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single project with its latest version
app.get("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectResult.rows[0];

    // Get all versions
    const versionsResult = await db.query(
      "SELECT id, version_number, tag, created_at, changes IS NOT NULL as has_changes, html_content IS NOT NULL as has_html FROM project_versions WHERE project_id = $1 ORDER BY version_number ASC",
      [id]
    );

    project.versions = versionsResult.rows;

    res.json(project);
  } catch (error) {
    console.error("Error getting project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific version's HTML (rebuilt from diffs if needed)
app.get("/api/projects/:id/versions/:versionNumber", async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    // Get all versions up to the requested one
    const versionsResult = await db.query(
      "SELECT * FROM project_versions WHERE project_id = $1 AND version_number <= $2 ORDER BY version_number ASC",
      [id, parseInt(versionNumber)]
    );

    if (versionsResult.rows.length === 0) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Rebuild HTML by finding nearest snapshot and applying diffs
    let html = null;
    let baseIndex = 0;

    // Find the nearest full HTML snapshot
    for (let i = versionsResult.rows.length - 1; i >= 0; i--) {
      if (versionsResult.rows[i].html_content) {
        html = versionsResult.rows[i].html_content;
        baseIndex = i;
        break;
      }
    }

    // Apply changes from baseIndex+1 to the end
    // Note: In a full implementation, you'd apply the diffs here
    // For now, we'll just return the snapshot or indicate changes need applying

    const version = versionsResult.rows[versionsResult.rows.length - 1];

    res.json({
      id: version.id,
      version_number: version.version_number,
      tag: version.tag,
      html_content: html,
      created_at: version.created_at,
    });
  } catch (error) {
    console.error("Error getting version:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
app.post("/api/projects", async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { name, layout, language, bodyClasses, pechaData, html } = req.body;

    // Create project
    const projectResult = await client.query(
      `INSERT INTO projects (name, layout, language, body_classes, pecha_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        layout,
        language,
        bodyClasses,
        pechaData ? JSON.stringify(pechaData) : null,
      ]
    );

    const project = projectResult.rows[0];

    // Create initial version with full HTML
    await client.query(
      `INSERT INTO project_versions (project_id, version_number, html_content, tag)
       VALUES ($1, 1, $2, 'Initial version')`,
      [project.id, html]
    );

    await client.query("COMMIT");

    res.status(201).json(project);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating project:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update a project (save new version)
app.post("/api/projects/:id/versions", async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { html, changes, tag, bodyClasses } = req.body;

    // Get current max version number
    const maxResult = await client.query(
      "SELECT COALESCE(MAX(version_number), 0) as max_version FROM project_versions WHERE project_id = $1",
      [id]
    );

    const newVersionNumber = maxResult.rows[0].max_version + 1;

    // Insert new version
    const versionResult = await client.query(
      `INSERT INTO project_versions (project_id, version_number, html_content, changes, tag)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        newVersionNumber,
        html,
        changes ? JSON.stringify(changes) : null,
        tag,
      ]
    );

    // Update project's body_classes and updated_at
    await client.query(
      "UPDATE projects SET body_classes = COALESCE($2, body_classes) WHERE id = $1",
      [id, bodyClasses]
    );

    await client.query("COMMIT");

    res.status(201).json(versionResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving version:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update project metadata
app.patch("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bodyClasses } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (bodyClasses !== undefined) {
      updates.push(`body_classes = $${paramIndex++}`);
      values.push(bodyClasses);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE projects SET ${updates.join(
        ", "
      )} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a project
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM projects WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Tag a version
app.patch("/api/projects/:id/versions/:versionNumber", async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const { tag } = req.body;

    const result = await db.query(
      "UPDATE project_versions SET tag = $1 WHERE project_id = $2 AND version_number = $3 RETURNING *",
      [tag, id, parseInt(versionNumber)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Version not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error tagging version:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PDF EXPORT ENDPOINT
// ============================================

// Collect all CSS files from the project
function getStylesheets() {
  const cssFiles = [
    "stylesheets/application.css",
    "stylesheets/scrollbar.css",
    "stylesheets/layouts/pecha/all.css",
    "stylesheets/layouts/pecha/A3/all.css",
    "stylesheets/layouts/pecha/A3/title.css",
    "stylesheets/layouts/pecha/A3/beginning.css",
    "stylesheets/layouts/pecha/A3/standard.css",
    "stylesheets/layouts/pecha/A4/all.css",
    "stylesheets/layouts/pecha/A4/title.css",
    "stylesheets/layouts/pecha/A4/beginning.css",
    "stylesheets/layouts/pecha/A4/standard.css",
    "stylesheets/layouts/pecha/screen/all.css",
    "stylesheets/layouts/pecha/screen/title.css",
    "stylesheets/layouts/pecha/screen/beginning.css",
    "stylesheets/layouts/pecha/screen/standard.css",
  ];

  let combinedCss = "";
  for (const file of cssFiles) {
    try {
      const cssPath = resolve(projectRoot, file);
      combinedCss += readFileSync(cssPath, "utf-8") + "\n";
    } catch (e) {
      console.warn(`Warning: Could not read ${file}`);
    }
  }
  return combinedCss;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================================
// MIGRATION ENDPOINT
// ============================================

// Migrate projects from localStorage (sent from browser)
app.post("/api/migrate", async (req, res) => {
  const { projects } = req.body;

  if (!projects || !Array.isArray(projects)) {
    return res.status(400).json({ error: "projects array is required" });
  }

  console.log(`📦 Migration requested for ${projects.length} projects`);

  const client = await db.connect();
  const results = { migrated: [], failed: [] };

  try {
    await client.query("BEGIN");

    for (const project of projects) {
      try {
        // Check if project already exists (by name) and add suffix if needed
        let projectName = project.name;
        const existingResult = await client.query(
          "SELECT name FROM projects WHERE name LIKE $1",
          [project.name + "%"]
        );

        if (existingResult.rows.length > 0) {
          // Find a unique name by adding a number suffix
          const existingNames = existingResult.rows.map((r) => r.name);
          let suffix = 2;
          while (existingNames.includes(projectName)) {
            projectName = project.name + " (" + suffix + ")";
            suffix++;
          }
          console.log(
            `   Renaming "${project.name}" to "${projectName}" (name already exists)`
          );
        }

        // Insert project
        const projectResult = await client.query(
          `INSERT INTO projects (name, layout, language, body_classes, pecha_data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            projectName,
            project.layout,
            project.language,
            project.bodyClasses,
            project.pecha ? JSON.stringify(project.pecha) : null,
            project.createdAt || new Date().toISOString(),
            project.updatedAt || new Date().toISOString(),
          ]
        );

        const projectId = projectResult.rows[0].id;

        // Insert versions
        if (project.versions && project.versions.length > 0) {
          for (let i = 0; i < project.versions.length; i++) {
            const version = project.versions[i];
            await client.query(
              `INSERT INTO project_versions (project_id, version_number, html_content, changes, tag, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                projectId,
                i + 1,
                version.html || null,
                version.changes ? JSON.stringify(version.changes) : null,
                version.tag || null,
                version.timestamp || new Date().toISOString(),
              ]
            );
          }
        }

        console.log(
          `   ✅ Migrated "${projectName}" with ${
            project.versions?.length || 0
          } versions`
        );
        results.migrated.push({ name: projectName, id: projectId });
      } catch (projectError) {
        console.error(
          `   ❌ Failed to migrate "${project.name}":`,
          projectError.message
        );
        results.failed.push({
          name: project.name,
          reason: projectError.message,
        });
      }
    }

    await client.query("COMMIT");

    console.log(
      `📦 Migration complete: ${results.migrated.length} migrated, ${results.failed.length} failed`
    );
    res.json(results);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Parkhang API Server running at http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - GET    /api/projects              - List projects`);
  console.log(`   - GET    /api/projects/:id          - Get project`);
  console.log(`   - POST   /api/projects              - Create project`);
  console.log(`   - PATCH  /api/projects/:id          - Update project`);
  console.log(`   - DELETE /api/projects/:id          - Delete project`);
  console.log(`   - POST   /api/projects/:id/versions - Save new version`);
  console.log(
    `   - POST   /api/migrate               - Migrate localStorage projects`
  );
});
