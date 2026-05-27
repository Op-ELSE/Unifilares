// pdfTemplateHelper.js – Helper to populate the PDF template (Platilla PDF.pdf) with Arc Flash data
// Requires pdf-lib (already loaded via CDN in index.html)

/**
 * Load the PDF template from the server and cache it.
 * @returns {Promise<PDFDocument>}
 */
async function loadTemplate() {
  if (window._cachedTemplatePdf) return window._cachedTemplatePdf;
  try {
    const response = await fetch(encodeURI('Platilla PDF.pdf'));
    if (!response.ok) throw new Error('Unable to fetch PDF template');
    const arrayBuf = await response.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuf);
    window._cachedTemplatePdf = pdfDoc;
    return pdfDoc;
  } catch (e) {
    console.error('Error loading PDF template:', e);
    throw e;
  }
}

/**
 * Convert top‑left based coordinates (as supplied) to pdf‑lib bottom‑left.
 * @param {PDFPage} page
 * @param {number} x
 * @param {number} y  // top‑left Y
 * @returns {{x:number, y:number}}
 */
function toPdfLibCoords(page, x, y) {
  const { height } = page.getSize();
  // Convert from top‑left to bottom‑left (pdf-lib origin is bottom‑left)
  return { x, y: height - y };
}

/**
 * Embed an image (base64 PNG/JPEG) onto a page using the PDFDocument instance.
 * @param {PDFDocument} doc
 * @param {PDFPage} page
 * @param {string} base64Data   // data URI or raw base64 string
 * @param {{x:number,y:number,w:number,h:number}} rect
 */
async function embedImage(doc, page, base64Data, rect) {
  // Strip possible data URI prefix
  const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const imgBytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  let img;
  try {
    img = await doc.embedJpg(imgBytes);
  } catch {
    img = await doc.embedPng(imgBytes);
  }
  const { x, y } = toPdfLibCoords(page, rect.x, rect.y);
  // pdf-lib draws images from bottom-left, so adjust y by height
  page.drawImage(img, { x, y: y - rect.h, width: rect.w, height: rect.h });
}

/**
 * Populate the template with data and return PDF bytes.
 * @param {Object} data  // keys: energy, arcBoundary, gloves, footwear, etc.
 * @param {string|null} eppImageBase64  // optional image for Image1 placeholder
 * @returns {Promise<Uint8Array>}
 */
async function populateTemplate(data, eppImageBase64) {
  const pdfDoc = await loadTemplate();
  // Clone to avoid mutating cached version
  const doc = await PDFLib.PDFDocument.load(await pdfDoc.save());

  // --- Page 1 placeholders ---
  const page1 = doc.getPage(0);
  // Image1
  if (eppImageBase64) {
    await embedImage(doc, page1, eppImageBase64, {
      x: 244.849365234375,
      y: 436.3243408203125,
      w: 3.5,
      h: 10
    });
  }
  // Text fields (example for a few; add the rest similarly)
  const textMap = {
    Text1: data.systemVoltage,
    Text2: data.upstreamBreaker,
    Text3: data.shortCircuit,
    Text4: data.energyStorage,
    Text5: data.openingTime,
    Text6: data.workingDistance,
    Text7: data.powerForArc,
    Text8: data.incidentEnergy
  };
  // Coordinates for Text1‑8 (top‑left origin)
  const coords = {
    Text1: { x: 328.4669189453125, y: 674.2319946289062 },
    Text2: { x: 328.4668884277344, y: 656.231201171875 },
    Text3: { x: 328.4669189453125, y: 637.2302856445312 },
    Text4: { x: 328.4668884277344, y: 618.0293579101562 },
    Text5: { x: 328.4668884277344, y: 599.0284423828125 },
    Text6: { x: 328.4668884277344, y: 576.6963500976562 },
    Text7: { x: 328.4668884277344, y: 561.8607788085938 },
    Text8: { x: 328.146484375, y: 519.2461547851562 }
  };
    for (const [key, value] of Object.entries(textMap)) {
      if (value == null) continue;
      const { x, y } = coords[key];
      const { x: fx, y: fy } = toPdfLibCoords(page1, x, y);
      // determinar estilo de color y fuente
      let color = PDFLib.rgb(0, 0, 0);
      let font = undefined; // usar fuente por defecto
      if (['Text1','Text2','Text3','Text4','Text5'].includes(key)) {
        color = PDFLib.rgb(1, 0, 0); // rojo
      } else if (['Text6','Text7'].includes(key)) {
        color = PDFLib.rgb(0.2, 0.2, 0.2); // gris 25% oscuro
      } else if (key === 'Text8') {
        color = PDFLib.rgb(0, 0, 0); // negro
        // usar fuente negrita para Incident Energy
        const helveticaBold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        font = helveticaBold;
      }
      const drawOptions = {
        x: fx,
        y: fy,
        size: 12,
        color,
      };
      if (font) drawOptions.font = font;
      page1.drawText(String(value), drawOptions);
    }

  // --- Page 2 placeholders (Text9‑22) ---
  const page2 = doc.getPage(1);
  const page2Map = {
    Text9: data.arcFlashApproach,
    Text10: data.limitsApproach,
    Text11: data.restrictedApproach,
    Text12: data.exposedMovable,
    Text13: data.arcFlashBoundary,
    Text14: data.glove,
    Text15: data.requiredPPE,
    Text16: data.footwear,
    Text17: data.shockHazard,
    Text18: data.limitedApproach,
    Text19: data.restrictedApproach2,
    Text20: data.busEquipmentId,
    Text21: data.assessmentDate,
    Text22: data.protectiveDevice
  };
  const page2Coords = {
    Text9: { x: 141.09205627441406, y: 513.2625732421875, w: 97.34170532226562, h: 18.7845458984375 },
    Text10: { x: 239.57510375976562, y: 514.0664672851562, w: 97.34170532226562, h: 18.7845458984375 },
    Text11: { x: 327.4173889160156, y: 519.0936279296875, w: 97.34170532226562, h: 18.7845458984375 },
    Text12: { x: 241.1829833984375, y: 497.58740234375, w: 97.34170532226562, h: 18.7845458984375 },
    Text13: { x: 153.95513916015625, y: 249.5975341796875, w: 150, h: 13.55950927734375 },
    Text14: { x: 395.13812255859375, y: 248.39173889160156, w: 150, h: 13.55950927734375 },
    Text15: { x: 153.15118408203125, y: 233.11846923828125, w: 150, h: 13.55950927734375 },
    Text16: { x: 393.93218994140625, y: 231.51075744628906, w: 113.42059326171875, h: 12 },
    Text17: { x: 182.8970947265625, y: 182.47549438476562, w: 105.78311157226562, h: 13.55950927734375 },
    Text18: { x: 182.8970947265625, y: 168.8099365234375, w: 105.78311157226562, h: 13.55950927734375 },
    Text19: { x: 336.0483093261719, y: 513.66455078125, w: 82.18634033203125, h: 13.19842529296875 },
    Text20: { x: 182.8970947265625, y: 158.76171875, w: 105.78311157226562, h: 13.55950927734375 },
    Text21: { x: 371.8237609863281, y: 158.76171875, w: 105.78311157226562, h: 13.55950927734375 },
    Text22: { x: 183.299072265625, y: 146.30194091796875, w: 105.78311157226562, h: 13.55950927734375 }
  };
  for (const [key, value] of Object.entries(page2Map)) {
    if (value == null) continue;
    const { x, y, h } = page2Coords[key];
    const { x: fx, y: fy } = toPdfLibCoords(page2, x, y);
    page2.drawText(String(value), {
      x: fx,
      y: fy - h / 2,
      size: 12,
      color: PDFLib.rgb(0, 0, 0)
    });
  }

  const pdfBytes = await doc.save();
  // Keep the generated PDF in memory so the app can later merge it with PETS or Unifilar PDFs
  window.tempPdfBytes = pdfBytes;
  return pdfBytes;
}

  /**
   * Load the original template, embed only the EPP image (size 3.5 × 10) and trigger a download.
   * This produces a PDF that is visually identical to the source DOC (template) but saved as .pdf.
   * @param {string|null} eppImageBase64 - base64 data URI of the EPP image (optional).
   */
  async function downloadTemplateWithEpp(eppImageBase64) {
    const pdfDoc = await loadTemplate();
    const doc = await PDFLib.PDFDocument.load(await pdfDoc.save()); // clone
    const page1 = doc.getPage(0);
    if (eppImageBase64) {
      // Image1 placeholder – already has the correct size (3.5 × 10)
      await embedImage(doc, page1, eppImageBase64, {
        x: 244.849365234375,
        y: 436.3243408203125,
        w: 3.5,
        h: 10
      });
    }
    const pdfBytes = await doc.save();
    // Trigger download – keep the original filename (replace possible .doc extension)
    const filename = 'Platilla PDF.pdf';
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export helper functions for the app
  window.pdfTemplateHelper = {
    populateTemplate,
    /**
     * Merge the temporary PDF (with EPP image) with optional PETS and Unifilar PDFs
     * and trigger a download of the final document.
     * @param {Uint8Array|ArrayBuffer|null} petsPdf   // PDF bytes for PETS (can be null)
     * @param {Uint8Array|ArrayBuffer|null} unifilarPdf // PDF bytes for Unifilar (can be null)
     * @param {string} filename   // Desired file name for the final download
     */
    async mergeAndDownload(petsPdf, unifilarPdf, filename = 'Resultado_Final.pdf') {
      // Load the base PDF that was generated earlier (stored in window.tempPdfBytes)
      const baseBytes = window.tempPdfBytes;
      if (!baseBytes) {
        console.error('No temporary PDF generated yet. Call populateTemplate first.');
        return;
      }
      const baseDoc = await PDFLib.PDFDocument.load(baseBytes);
      // Helper to embed another PDF as pages
      async function embedPdf(sourceBytes) {
        if (!sourceBytes) return;
        const srcDoc = await PDFLib.PDFDocument.load(sourceBytes);
        const copiedPages = await baseDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => baseDoc.addPage(page));
      }
      await embedPdf(petsPdf);
      await embedPdf(unifilarPdf);
      const finalBytes = await baseDoc.save();
      // Trigger download
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
