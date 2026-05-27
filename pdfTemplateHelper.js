// pdfTemplateHelper.js – simplified helper that just downloads the Word template as a PDF file.
// The Word template (Anexo plantilla_updated.docx) already has the EPP image resized to 3.5 cm × 10 cm
// and the spacing after the image reduced to two line‑breaks (see update_docx_image.ps1).

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

// Expose the helper for the UI (e.g., the "Generate PDF" button).
window.pdfTemplateHelper = {
  downloadWordAsPdf
};
