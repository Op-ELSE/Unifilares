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
  return { x, y: height - y }; // pdf-lib origin is bottom‑left
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
      w: 349.2558898925781,
      h: 147.46484375
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
        y: fy - 12,
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
    Text9: { x: 165.48031616210938, y: 517.4935302734375 },
    Text10: { x: 245.09637451171875, y: 518.2935791015625 },
    Text11: { x: 327.4173889160156, y: 519.0936279296875 },
    Text12: { x: 244.85006713867188, y: 499.0577697753906 },
    Text13: { x: 194.6862030029297, y: 249.48080444335938 },
    Text14: { x: 393.126220703125, y: 249.88082885742188 },
    Text15: { x: 145.22998046875, y: 231.8450927734375 },
    Text16: { x: 393.2799377441406, y: 230.64503479003906 },
    Text17: { x: 180.28329467773438, y: 185.87779235839844 },
    Text18: { x: 180.28329467773438, y: 171.07708740234375 },
    Text19: { x: 391.9259338378906, y: 172.27716064453125 },
    Text20: { x: 180.28329467773438, y: 157.07643127441406 },
    Text21: { x: 391.92596435546875, y: 157.07644653320312 },
    Text22: { x: 180.28329467773438, y: 145.0758514404297 }
  };
  for (const [key, value] of Object.entries(page2Map)) {
    if (value == null) continue;
    const { x, y } = page2Coords[key];
    const { x: fx, y: fy } = toPdfLibCoords(page2, x, y);
    page2.drawText(String(value), {
      x: fx,
      y: fy - 12,
      size: 12,
      color: PDFLib.rgb(0, 0, 0)
    });
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

// Export for use in app.js (module pattern – we are in a script tag, so attach to window)
window.pdfTemplateHelper = {
  populateTemplate
};
