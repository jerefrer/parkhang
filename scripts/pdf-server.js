#!/usr/bin/env node
/**
 * PDF Export Server for Parkhang
 *
 * Runs an Express server that accepts requests to generate PDFs via Playwright.
 * The server can load a project by ID and generate a PDF with custom page dimensions.
 *
 * Usage:
 *   node scripts/pdf-server.js
 *
 * Then from the browser, request:
 *   GET /export-pdf?projectId=<id>&url=<vite-dev-url>
 */

import cors from "cors";
import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = 3001;

// Enable CORS for requests from the Vite dev server
app.use(cors());

// Page dimensions for each layout (in mm)
const PAGE_DIMENSIONS = {
  "pecha-a4": { width: 297, height: 78 },
  "pecha-a3": { width: 420, height: 99 },
  "pecha-screen": { width: 297, height: 148 },
};

app.get("/export-pdf", async (req, res) => {
  const { projectId, url = "http://localhost:5173" } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  console.log(`📄 PDF export requested for project: ${projectId}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
    });

    const page = await context.newPage();

    // Navigate to the app
    console.log(`   Loading ${url}...`);
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for the app to initialize
    await page.waitForSelector("#main", { timeout: 30000 });

    // Load the project by injecting a script that calls ProjectManager.loadProject
    console.log(`   Loading project ${projectId}...`);

    const loadResult = await page.evaluate((projId) => {
      // Check if ProjectManager exists
      if (typeof ProjectManager === "undefined") {
        return { success: false, error: "ProjectManager not found" };
      }

      // Check if project exists
      const project = ProjectManager.getProject(projId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }

      // Load the project
      const loaded = ProjectManager.loadProject(projId);
      if (!loaded) {
        return { success: false, error: "Failed to load project" };
      }

      return {
        success: true,
        projectName: project.name,
        layout: project.layout,
      };
    }, projectId);

    if (!loadResult.success) {
      throw new Error(loadResult.error);
    }

    console.log(`   Project loaded: ${loadResult.projectName}`);

    // Wait for rendering to complete
    await page.waitForTimeout(1000);

    // Wait for pages to be stable
    let previousCount = 0;
    let stableCount = 0;
    while (stableCount < 3) {
      await page.waitForTimeout(300);
      const currentCount = await page.locator(".pecha-page-container").count();
      if (currentCount === previousCount && currentCount > 0) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = currentCount;
      }
    }

    const pageCount = await page.locator(".pecha-page-container").count();
    console.log(`   Found ${pageCount} pages`);

    // Detect layout
    let layout = loadResult.layout;
    if (!layout) {
      const bodyClasses = await page.evaluate(() => document.body.className);
      if (bodyClasses.includes("pecha-a4")) layout = "pecha-a4";
      else if (bodyClasses.includes("pecha-a3")) layout = "pecha-a3";
      else if (bodyClasses.includes("pecha-screen")) layout = "pecha-screen";
      else layout = "pecha-a4";
    }

    console.log(`   Layout: ${layout}`);

    const dimensions = PAGE_DIMENSIONS[layout] || PAGE_DIMENSIONS["pecha-a4"];

    // Hide UI elements
    await page.evaluate(() => {
      const elementsToHide = [
        "#print-button",
        "#pdf-export-button",
        "#color-mode-button",
        "#inspect-td-button",
        "#loading-overlay",
        "#masking-overlay",
        "#project-controls",
        ".ui.sidebar",
        ".ui.dimmer",
        ".ui.modal",
      ];

      elementsToHide.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) el.style.display = "none";
      });

      document.body.style.background = "white";

      document.querySelectorAll(".pecha-page-container").forEach((el) => {
        el.style.border = "none";
        el.style.margin = "0";
      });
    });

    // Generate PDF
    console.log(
      `   Generating PDF (${dimensions.width}mm × ${dimensions.height}mm)...`
    );

    const pdfBuffer = await page.pdf({
      width: `${dimensions.width}mm`,
      height: `${dimensions.height}mm`,
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    // Send PDF as response
    const filename = `${loadResult.projectName.replace(
      /[^a-zA-Z0-9-_ ]/g,
      ""
    )}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    console.log(`✅ PDF generated successfully: ${filename}`);
  } catch (error) {
    console.error("❌ Error generating PDF:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// List available projects (reads from the request's localStorage via a page load)
app.get("/projects", async (req, res) => {
  const { url = "http://localhost:5173" } = req.query;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector("#main", { timeout: 30000 });

    const projects = await page.evaluate(() => {
      if (typeof ProjectManager === "undefined") {
        return [];
      }
      return ProjectManager.getProjectsList();
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PDF Export Server running at http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(
    `   - GET /export-pdf?projectId=<id>  - Generate and download PDF`
  );
  console.log(`   - GET /projects                   - List available projects`);
  console.log(`   - GET /health                     - Health check`);
});
