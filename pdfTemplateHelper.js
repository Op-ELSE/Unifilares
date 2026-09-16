/**
 * pdfTemplateHelper.js (v4)
 *
 * Takes the DOCX template (window.DOCX_TEMPLATE_DATA – base64 string),
 * fills the placeholders with the values supplied by `populateTemplate(inputs, eppImgBase64)`
 * using **docx-preview** to render the DOCX to HTML, then captures the rendered HTML
 * with **html2canvas** and finally creates a PDF with **jsPDF**.
 *
 * This approach guarantees that the generated PDF looks *exactly* like the Word
 * document because we are re‑using the same layout engine that the browser uses to
 * display the template.
 */

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Helper: extract base64 part from a data‑URI (e.g. "data:image/png;base64,...")
    // ---------------------------------------------------------------------
    function getBase64Data(dataUri) {
        if (!dataUri) return null;
        return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
    }

    // ---------------------------------------------------------------------
    // Helper: replace all occurrences of a placeholder inside an element's
    // textContent recursively. This works on the HTML produced by docx‑preview.
    // ---------------------------------------------------------------------
    function replacePlaceholders(root, map) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            let txt = node.nodeValue;
            let changed = false;
            for (const [ph, value] of Object.entries(map)) {
                if (txt.includes(ph)) {
                    txt = txt.split(ph).join(value);
                    changed = true;
                }
            }
            if (changed) node.nodeValue = txt;
        }
    }

    // ---------------------------------------------------------------------
    // Main API expected by app.js
    // ---------------------------------------------------------------------
    async function populateTemplate(inputs, eppImageBase64) {
        console.log('pdfTemplateHelper v4: populateTemplate called');

        // ---------------------------------------------------------------
        // 1️⃣ Ensure required libraries are present
        // ---------------------------------------------------------------
        if (!window.jspdf) {
            console.error('pdfTemplateHelper: jsPDF not loaded');
            return null;
        }
        if (!window.docx) {
            console.error('pdfTemplateHelper: docx‑preview not loaded');
            return null;
        }
        if (!window.html2canvas) {
            console.error('pdfTemplateHelper: html2canvas not loaded');
            return null;
        }

        // ---------------------------------------------------------------
        // 2️⃣ Decode the DOCX template (base64) into a Uint8Array
        // ---------------------------------------------------------------
        if (!window.DOCX_TEMPLATE_DATA) {
            console.error('pdfTemplateHelper: DOCX_TEMPLATE_DATA missing');
            return null;
        }
        const docxBase64 = getBase64Data(window.DOCX_TEMPLATE_DATA);
        const docxBytes = Uint8Array.from(atob(docxBase64), c => c.charCodeAt(0));

        // ---------------------------------------------------------------
        // 3️⃣ Render DOCX to a hidden container using docx‑preview
        // ---------------------------------------------------------------
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '210mm';   // A4 width, close to Letter
        container.style.minHeight = '297mm';
        document.body.appendChild(container);

        try {
            await window.docx.renderAsync(docxBytes, container, {
                // No special options needed – default rendering is fine
            });
        } catch (e) {
            console.error('pdfTemplateHelper: docx‑preview render error', e);
            document.body.removeChild(container);
            return null;
        }

        // ---------------------------------------------------------------
        // 4️⃣ Build a map of the placeholders used in the Word template
        // ---------------------------------------------------------------
        const ph = {
            '{{systemVoltage}}': inputs.systemVoltage || '--',
            '{{upstreamBreaker}}': inputs.upstreamBreaker || '--',
            '{{shortCircuit}}': inputs.shortCircuit || '--',
            '{{energyStorage}}': inputs.energyStorage || '--',
            '{{openingTime}}': inputs.openingTime || '--',
            '{{workingDistance}}': inputs.workingDistance || '--',
            '{{powerForArc}}': inputs.powerForArc || '--',
            '{{incidentEnergy}}': inputs.incidentEnergy || '--',
            '{{arcFlashBoundary}}': inputs.arcFlashBoundary || '--',
            '{{limitedApproach}}': inputs.limitedApproach || '--',
            '{{restrictedApproach2}}': inputs.restrictedApproach2 || '--',
            '{{exposedMovable}}': inputs.exposedMovable || '--',
            '{{glove}}': inputs.glove || '--',
            '{{requiredPPE}}': inputs.requiredPPE || '--',
            '{{footwear}}': inputs.footwear || '--',
            '{{shockHazard}}': inputs.shockHazard || '--',
            '{{busEquipmentId}}': inputs.busEquipmentId || '--',
            '{{protectiveDevice}}': inputs.protectiveDevice || '--',
            '{{assessmentDate}}': inputs.assessmentDate || '--',
            '{{catLetter}}': (inputs.catLetter || '').toUpperCase()
        };

        // ---------------------------------------------------------------
        // 5️⃣ Replace placeholders inside the rendered HTML
        // ---------------------------------------------------------------
        replacePlaceholders(container, ph);

        // ---------------------------------------------------------------
        // 6️⃣ If an EPP image is provided, inject it in the place where the
        //    template contains the token "(imagen PPE)" (the same token used in the
        //    DOCX generation code). We replace the token text node with an <img>.
        // ---------------------------------------------------------------
        if (eppImageBase64) {
            const imgBase64 = getBase64Data(eppImageBase64);
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${imgBase64}`;
            img.style.maxWidth = '100%';
            // Find the token text node
            const tokenNode = Array.from(container.querySelectorAll('*')).find(el =>
                el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && el.textContent.includes('(imagen PPE)')
            );
            if (tokenNode) {
                tokenNode.textContent = tokenNode.textContent.replace('(imagen PPE)', '').trim();
                tokenNode.appendChild(img);
            }
        }

        // ---------------------------------------------------------------
        // 7️⃣ Capture the whole container as a canvas using html2canvas
        // ---------------------------------------------------------------
        let canvas;
        try {
            canvas = await window.html2canvas(container, {scale: 2, useCORS: true});
        } catch (e) {
            console.error('pdfTemplateHelper: html2canvas error', e);
            document.body.removeChild(container);
            return null;
        }

        // ---------------------------------------------------------------
        // 8️⃣ Create a PDF with jsPDF and add the captured image
        // ---------------------------------------------------------------
        const jsPDF = window.jspdf.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'letter');
        const imgData = canvas.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // Calculate image dimensions keeping aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        let imgWidth = pageWidth - 20; // 10 mm margins each side
        let imgHeight = imgWidth / imgRatio;
        if (imgHeight > pageHeight - 20) {
            imgHeight = pageHeight - 20;
            imgWidth = imgHeight * imgRatio;
        }
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 10, imgWidth, imgHeight);

        // ---------------------------------------------------------------
        // 9️⃣ Clean up the temporary container
        // ---------------------------------------------------------------
        document.body.removeChild(container);

        console.log('pdfTemplateHelper v4: PDF generated');
        return pdf.output('arraybuffer');
    }

    // ---------------------------------------------------------------------
    // Expose the public API
    // ---------------------------------------------------------------------
    window.pdfTemplateHelper = {populateTemplate};
    console.log('pdfTemplateHelper: loaded and ready (v4)');
})();