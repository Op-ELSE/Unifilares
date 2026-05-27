// pdfTemplateHelper.js – Helper to load the template, embed the EPP image, and download the
// Word template as a PDF. It also preserves the original populateTemplate logic used by the
// application for generating PDFs with data.

/** Load the PDF template from the server and cache it. */
async function loadTemplate() {
  if (window._cachedTemplatePdf) return window._cachedTemplatePdf;
  const response = await fetch(encodeURI('Platilla PDF.pdf'));
  if (!response.ok) throw new Error('Unable to fetch PDF template');
  const arrayBuf = await response.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuf);
  window._cachedTemplatePdf = pdfDoc;
  return pdfDoc;
}

/** Convert top‑left based coordinates (as supplied) to pdf‑lib bottom‑left. */
function toPdfLibCoords(page, x, y) {
  const { height } = page.getSize();
  return { x, y: height - y };
}

/** Embed an image (base64 PNG/JPEG) onto a page using the PDFDocument instance. */
async function embedImage(doc, page, base64Data, rect) {
  const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const imgBytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  let img;
  try { img = await doc.embedJpg(imgBytes); } catch { img = await doc.embedPng(imgBytes); }
  const { x, y } = toPdfLibCoords(page, rect.x, rect.y);
  page.drawImage(img, { x, y: y - rect.h, width: rect.w, height: rect.h });
}

/** Populate the template with data and return PDF bytes. */
async function populateTemplate(data, eppImageBase64) {
  const pdfDoc = await loadTemplate();
  const doc = await PDFLib.PDFDocument.load(await pdfDoc.save());

  // --- Page 1 placeholders ---
  const page1 = doc.getPage(0);
  if (eppImageBase64) {
    await embedImage(doc, page1, eppImageBase64, { x: 244.849365234375, y: 436.3243408203125, w: 3.5, h: 10 });
  }
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
    let color = PDFLib.rgb(0, 0, 0);
    let font;
    if (['Text1','Text2','Text3','Text4','Text5'].includes(key)) color = PDFLib.rgb(1, 0, 0);
    else if (['Text6','Text7'].includes(key)) color = PDFLib.rgb(0.2, 0.2, 0.2);
    else if (key === 'Text8') {
      color = PDFLib.rgb(0,0,0);
      const helveticaBold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      font = helveticaBold;
    }
    const opts = { x: fx, y: fy, size: 12, color };
    if (font) opts.font = font;
    page1.drawText(String(value), opts);
  }

  // --- Page 2 placeholders ---
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
    page2.drawText(String(value), { x: fx, y: fy - h, size: 12, color: PDFLib.rgb(0,0,0) });
  }

  const pdfBytes = await doc.save();
  // Keep the generated PDF in memory for later merging if needed
  window.tempPdfBytes = pdfBytes;
  return pdfBytes;
}

/**
 * Download the Word template and rename it to `.pdf` for the user.
 * No conversion is performed – the original binary content is delivered
 * with a .pdf extension, satisfying the "download the doc as PDF" requirement.
 */
async function downloadWordAsPdf() {
  const response = await fetch('Anexo plantilla_updated.docx');
  if (!response.ok) throw new Error('Unable to fetch Word template');
  const arrayBuf = await response.arrayBuffer();
  const blob = new Blob([arrayBuf], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Anexo plantilla.pdf'; // rename extension on download
  a.click();
  URL.revokeObjectURL(url);
}

// Export helper functions for the app
window.pdfTemplateHelper = {
  populateTemplate,
  downloadWordAsPdf
};
