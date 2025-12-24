#!/usr/bin/env node

/**
 * Crop PDF from A4 landscape (297mm x 210mm) to custom pecha dimensions
 *
 * Usage:
 *   node scripts/crop-pdf.js input.pdf output.pdf [layout]
 *
 * Layouts:
 *   pecha-a4 (default): 297mm x 78mm
 *   pecha-a3: 420mm x 99mm
 *   pecha-screen: 297mm x 148mm
 */

import { readFileSync, writeFileSync } from "fs";
import { PDFDocument } from "pdf-lib";

const PAGE_DIMENSIONS = {
  "pecha-a4": { width: 297, height: 78 },
  "pecha-a3": { width: 420, height: 99 },
  "pecha-screen": { width: 297, height: 148 },
};

// Convert mm to PDF points (1 inch = 72 points, 1 inch = 25.4 mm)
const mmToPoints = (mm) => (mm / 25.4) * 72;

async function cropPdf(inputPath, outputPath, layout = "pecha-a4") {
  const dimensions = PAGE_DIMENSIONS[layout];
  if (!dimensions) {
    console.error(`Unknown layout: ${layout}`);
    console.error(
      `Available layouts: ${Object.keys(PAGE_DIMENSIONS).join(", ")}`
    );
    process.exit(1);
  }

  console.log(
    `📄 Cropping PDF to ${layout} (${dimensions.width}mm x ${dimensions.height}mm)`
  );

  const pdfBytes = readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const cropWidth = mmToPoints(dimensions.width);
  const cropHeight = mmToPoints(dimensions.height);

  console.log(`   Processing ${pages.length} page(s)...`);

  for (const page of pages) {
    const { height } = page.getSize();
    // Crop from top-left: set MediaBox to custom dimensions
    // PDF coordinates start from bottom-left, so we crop from top
    page.setMediaBox(0, height - cropHeight, cropWidth, cropHeight);
    page.setCropBox(0, height - cropHeight, cropWidth, cropHeight);
  }

  const croppedPdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, croppedPdfBytes);

  console.log(`✅ Saved cropped PDF to: ${outputPath}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    "Usage: node scripts/crop-pdf.js <input.pdf> <output.pdf> [layout]"
  );
  console.log("");
  console.log("Layouts:");
  console.log("  pecha-a4 (default): 297mm x 78mm");
  console.log("  pecha-a3: 420mm x 99mm");
  console.log("  pecha-screen: 297mm x 148mm");
  console.log("");
  console.log("Example:");
  console.log("  node scripts/crop-pdf.js input.pdf output.pdf pecha-a4");
  process.exit(1);
}

const [inputPath, outputPath, layout] = args;

cropPdf(inputPath, outputPath, layout).catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
