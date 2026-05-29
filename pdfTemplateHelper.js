/**
 * pdfTemplateHelper.js
 *
 * Helper que reutiliza la lógica de `docxTemplateData.js` para generar
 * archivos de plantilla, pero guarda el resultado con la extensión **.pdf**.
 *
 * Nota: la generación real de PDF depende de la biblioteca que maneje
 * la conversión del documento (por ejemplo, `docx-pdf` o `pdf-lib`). En este
 * ejemplo se usa la misma función de generación de documento y se
 * renombra el archivo resultante como .pdf; si en el futuro se incorpora
 * una librería de conversión, basta con ajustarla aquí.
 */

import { generateDocument, downloadDocument } from "./docxTemplateData";

/**
 * Genera un documento a partir de los datos y la plantilla proporcionados.
 *
 * @param {Object} data          – Objeto con los valores a interpolar en la plantilla.
 * @param {string} templatePath  – Ruta absoluta al archivo de plantilla (DOCX).
 *
 * @returns {Blob} Blob del documento generado.
 */
export function generatePdfDocument(data, templatePath) {
  // Re‑utilizamos la generación DOCX existente.
  // En caso de que se necesite una conversión real a PDF, este es el punto
  // donde se insertaría la lógica (por ejemplo, usando `docx-pdf` o `pdf-lib`).
  const docBlob = generateDocument(data, templatePath);
  return docBlob;
}

/**
 * Descarga el documento generado como archivo PDF.
 *
 * @param {Object} data          – Objeto con los valores a interpolar en la plantilla.
 * @param {string} templatePath  – Ruta absoluta al archivo de plantilla (DOCX).
 * @param {string} [fileName]    – Nombre deseado para el archivo sin extensión.
 */
export function downloadPdfDocument(data, templatePath, fileName = "generated") {
  const pdfBlob = generatePdfDocument(data, templatePath);
  // Cambiamos la extensión a .pdf para la descarga.
  const pdfFileName = `${fileName}.pdf`;
  downloadDocument(pdfBlob, pdfFileName);
}

/**
 * Exporta un PDF como base64 (útil para envío a APIs o almacenamiento).
 *
 * @param {Object} data          – Objeto con los valores a interpolar en la plantilla.
 * @param {string} templatePath  – Ruta absoluta al archivo de plantilla (DOCX).
 *
 * @returns {Promise<string>} Promise que resuelve con la cadena base64 del PDF.
 */
export async function getPdfBase64(data, templatePath) {
  const pdfBlob = generatePdfDocument(data, templatePath);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]); // solo la parte base64
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });
}

/* -------------------------------------------------------------------------
 * Si en el futuro deseas convertir el DOCX generado a PDF de forma real,
 * reemplaza `generatePdfDocument` con una llamada a una librería de conversión,
 * por ejemplo:
 *
 *   import { docxToPdf } from "docx-pdf";
 *   const pdfBlob = await docxToPdf(docBlob);
 *
 * y mantiene la misma API pública.
 * ------------------------------------------------------------------------- */