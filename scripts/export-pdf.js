#!/usr/bin/env node
/**
 * PDF Export Script for Parkhang
 *
 * Uses Playwright to generate PDFs with exact custom page dimensions,
 * bypassing browser print engine limitations.
 *
 * Usage:
 *   node scripts/export-pdf.js [options]
 *
 * Options:
 *   --url <url>       URL of the page to export (default: http://localhost:5173)
 *   --output <path>   Output PDF path (default: output.pdf)
 *   --layout <type>   Layout type: pecha-a4, pecha-a3, pecha-screen (auto-detected from page)
 *   --wait <ms>       Additional wait time after generation completes (default: 1000)
 */

import { dirname } from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Page dimensions for each layout (in mm)
const PAGE_DIMENSIONS = {
  "pecha-a4": { width: 297, height: 78 }, // 842.04pt × 198.5pt ≈ 297mm × 70mm + margins
  "pecha-a3": { width: 420, height: 99 }, // 1048.92pt × 210.36pt ≈ 370mm × 74mm + margins
  "pecha-screen": { width: 297, height: 148 }, // For screen layout, use A5-ish
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: "http://localhost:5173",
    output: "output.pdf",
    layout: null, // auto-detect
    wait: 1000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--url":
        options.url = args[++i];
        break;
      case "--output":
        options.output = args[++i];
        break;
      case "--layout":
        options.layout = args[++i];
        break;
      case "--wait":
        options.wait = parseInt(args[++i], 10);
        break;
      case "--help":
        console.log(`
PDF Export Script for Parkhang

Usage:
  node scripts/export-pdf.js [options]

Options:
  --url <url>       URL of the page to export (default: http://localhost:5173)
  --output <path>   Output PDF path (default: output.pdf)
  --layout <type>   Layout type: pecha-a4, pecha-a3, pecha-screen (auto-detected from page)
  --wait <ms>       Additional wait time after generation completes (default: 1000)

Examples:
  node scripts/export-pdf.js --output my-prayer.pdf
  node scripts/export-pdf.js --url http://localhost:5173 --output prayer.pdf --layout pecha-a4
        `);
        process.exit(0);
    }
  }

  return options;
}

async function exportPDF(options) {
  console.log("🚀 Starting PDF export...");
  console.log(`   URL: ${options.url}`);
  console.log(`   Output: ${options.output}`);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      // Set a wide viewport to match pecha layout
      viewport: { width: 1200, height: 800 },
    });

    const page = await context.newPage();

    // Navigate to the page
    console.log("📄 Loading page...");
    await page.goto(options.url, { waitUntil: "networkidle" });

    // Wait for the app to initialize
    await page.waitForSelector("#main", { timeout: 30000 });

    // Check if generation has already completed (look for pecha pages)
    const hasPages = await page.locator(".pecha-page-container").count();

    if (hasPages === 0) {
      console.log("⏳ Waiting for text generation to complete...");
      console.log(
        "   (Make sure you have generated the text in the browser first)"
      );

      // Wait for at least one page to appear
      await page.waitForSelector(".pecha-page-container", { timeout: 120000 });
    }

    // Wait for generation to fully complete by checking if new pages stop appearing
    console.log("⏳ Waiting for generation to stabilize...");
    let previousCount = 0;
    let stableCount = 0;

    while (stableCount < 3) {
      await page.waitForTimeout(500);
      const currentCount = await page.locator(".pecha-page-container").count();

      if (currentCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = currentCount;
      }
    }

    const pageCount = await page.locator(".pecha-page-container").count();
    console.log(`   Found ${pageCount} pages`);

    // Additional wait for any final rendering
    await page.waitForTimeout(options.wait);

    // Detect layout if not specified
    let layout = options.layout;
    if (!layout) {
      const bodyClasses = await page.evaluate(() => document.body.className);
      if (bodyClasses.includes("pecha-a4")) {
        layout = "pecha-a4";
      } else if (bodyClasses.includes("pecha-a3")) {
        layout = "pecha-a3";
      } else if (bodyClasses.includes("pecha-screen")) {
        layout = "pecha-screen";
      } else {
        console.log("⚠️  Could not detect layout, defaulting to pecha-a4");
        layout = "pecha-a4";
      }
    }

    console.log(`   Layout: ${layout}`);

    const dimensions = PAGE_DIMENSIONS[layout];
    if (!dimensions) {
      throw new Error(
        `Unknown layout: ${layout}. Use one of: ${Object.keys(
          PAGE_DIMENSIONS
        ).join(", ")}`
      );
    }

    // Hide UI elements before PDF generation
    await page.evaluate(() => {
      const elementsToHide = [
        "#print-button",
        "#color-mode-button",
        "#inspect-td-button",
        "#loading-overlay",
        "#masking-overlay",
        ".ui.sidebar",
        ".ui.dimmer",
      ];

      elementsToHide.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) el.style.display = "none";
      });

      // Set white background
      document.body.style.background = "white";

      // Remove borders from page containers for cleaner PDF
      document.querySelectorAll(".pecha-page-container").forEach((el) => {
        el.style.border = "none";
        el.style.margin = "0";
      });
    });

    // Generate PDF with exact dimensions
    console.log(
      `📝 Generating PDF (${dimensions.width}mm × ${dimensions.height}mm per page)...`
    );

    await page.pdf({
      path: options.output,
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

    console.log(`✅ PDF exported successfully: ${options.output}`);
    console.log(`   Pages: ${pageCount}`);
  } catch (error) {
    console.error("❌ Error exporting PDF:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the export
const options = parseArgs();
exportPDF(options);
