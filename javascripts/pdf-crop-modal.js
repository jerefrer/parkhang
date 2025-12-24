import { PDFDocument } from "pdf-lib";

const PAGE_DIMENSIONS = {
  "pecha-a4": { width: 297, height: 78 },
  "pecha-a3": { width: 420, height: 99 },
  "pecha-screen": { width: 297, height: 148 },
};

// Convert mm to PDF points (1 inch = 72 points, 1 inch = 25.4 mm)
const mmToPoints = (mm) => (mm / 25.4) * 72;

async function cropPdf(pdfBytes, layout = "pecha-a4") {
  const dimensions = PAGE_DIMENSIONS[layout];
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const cropWidth = mmToPoints(dimensions.width);
  const cropHeight = mmToPoints(dimensions.height);

  for (const page of pages) {
    const { height } = page.getSize();
    // Crop from top-left: set MediaBox to custom dimensions
    // PDF coordinates start from bottom-left, so we crop from top
    page.setMediaBox(0, height - cropHeight, cropWidth, cropHeight);
    page.setCropBox(0, height - cropHeight, cropWidth, cropHeight);
  }

  return await pdfDoc.save();
}

function showPdfCropModal() {
  // Remove any existing modal first
  $("#pdf-crop-modal").remove();

  // Detect current layout
  let layout = "pecha-a4";
  const bodyClasses = $("body").attr("class") || "";
  if (bodyClasses.includes("pecha-a3")) layout = "pecha-a3";
  else if (bodyClasses.includes("pecha-screen")) layout = "pecha-screen";

  const dimensions = PAGE_DIMENSIONS[layout];

  const modal = $(`
    <div class="ui small modal" id="pdf-crop-modal">
      <div class="header">
        <i class="crop icon"></i> Crop PDF to ${layout.toUpperCase()} (${
    dimensions.width
  }mm × ${dimensions.height}mm)
      </div>
      <div class="content">
        <div id="pdf-drop-zone" style="
          border: 3px dashed #ccc;
          border-radius: 8px;
          padding: 60px 20px;
          text-align: center;
          background: #f9f9f9;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <i class="file pdf outline icon" style="font-size: 48px; color: #999; margin-bottom: 10px;"></i>
          <p style="font-size: 16px; color: #666; margin: 10px 0;">
            Drop your A4 landscape PDF here<br>
            <span style="font-size: 14px; color: #999;">or click to browse</span>
          </p>
          <input type="file" id="pdf-file-input" accept=".pdf" style="display: none;">
        </div>

        <div id="pdf-crop-progress" style="display: none; margin-top: 20px;">
          <div class="ui active centered inline loader"></div>
          <p style="text-align: center; margin-top: 10px;">Cropping PDF...</p>
        </div>

        <div id="pdf-crop-success" style="display: none; margin-top: 20px;">
          <div class="ui success message">
            <i class="check circle icon"></i>
            PDF cropped successfully! Download should start automatically.
          </div>
        </div>

        <div id="pdf-crop-error" style="display: none; margin-top: 20px;">
          <div class="ui error message">
            <i class="exclamation triangle icon"></i>
            <div id="pdf-crop-error-message"></div>
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="ui cancel button">Close</div>
      </div>
    </div>
  `);

  $("body").append(modal);

  const $dropZone = modal.find("#pdf-drop-zone");
  const $fileInput = modal.find("#pdf-file-input");
  const $progress = modal.find("#pdf-crop-progress");
  const $success = modal.find("#pdf-crop-success");
  const $error = modal.find("#pdf-crop-error");
  const $errorMessage = modal.find("#pdf-crop-error-message");

  // Handle file selection
  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      $error.show();
      $errorMessage.text("Please select a valid PDF file.");
      return;
    }

    $dropZone.hide();
    $error.hide();
    $success.hide();
    $progress.show();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const croppedPdfBytes = await cropPdf(
        new Uint8Array(arrayBuffer),
        layout
      );

      // Create download
      const blob = new Blob([croppedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", `-cropped-${layout}.pdf`);
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();

      $progress.hide();
      $success.show();

      // Auto-close after 2 seconds
      setTimeout(() => {
        modal.modal("hide");
      }, 2000);
    } catch (error) {
      console.error("PDF crop error:", error);
      $progress.hide();
      $error.show();
      $errorMessage.text(`Error cropping PDF: ${error.message}`);
      $dropZone.show();
    }
  }

  // Click to browse
  $dropZone.on("click", () => {
    $fileInput.click();
  });

  $fileInput.on("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  // Drag and drop
  $dropZone.on("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropZone.css({
      "border-color": "#2185d0",
      background: "#f0f8ff",
    });
  });

  $dropZone.on("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropZone.css({
      "border-color": "#ccc",
      background: "#f9f9f9",
    });
  });

  $dropZone.on("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropZone.css({
      "border-color": "#ccc",
      background: "#f9f9f9",
    });

    const file = e.originalEvent.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Use setTimeout to ensure modal initialization happens after DOM is fully ready
  // This prevents the saved.slice error from focus management
  setTimeout(() => {
    modal
      .modal({
        autofocus: false,
        observeChanges: false,
        restoreFocus: false,
        onShow: () => {
          // Blur any focused element to prevent focus restoration issues
          if (document.activeElement) {
            document.activeElement.blur();
          }
        },
        onHidden: () => {
          modal.remove();
        },
      })
      .modal("show");
  }, 100);
}

// Show modal after print dialog closes
let afterPrintHandler = null;

window.addEventListener("beforeprint", () => {
  // Remove any existing handler to prevent duplicates
  if (afterPrintHandler) {
    window.removeEventListener("afterprint", afterPrintHandler);
  }

  // Create new handler
  afterPrintHandler = () => {
    showPdfCropModal();
    window.removeEventListener("afterprint", afterPrintHandler);
    afterPrintHandler = null;
  };

  window.addEventListener("afterprint", afterPrintHandler);
});

export { showPdfCropModal };
