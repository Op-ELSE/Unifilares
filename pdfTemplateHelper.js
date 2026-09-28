/**
 * pdfTemplateHelper.js (v5)
 *
 * Takes the DOCX template (window.DOCX_TEMPLATE_DATA – base64 string),
 * fills the placeholders with the values supplied by
 *   populateTemplate(inputs, eppImgBase64, shockImgBase64)
 * using **docx-preview** to render the DOCX to HTML, then captures the
 * rendered HTML with **html2canvas** and finally creates a PDF with **jsPDF**.
 *
 * The generated PDF looks *exactly* like the Word document because we
 * re-use the same layout engine that the browser uses to display the template.
 * No LibreOffice or remote server required.
 */

(function () {
    'use strict';

    // -----------------------------------------------------------------------
    // Helper: extract base64 part from a data-URI ("data:image/png;base64,...")
    // -----------------------------------------------------------------------
    function getBase64Data(dataUri) {
        if (!dataUri) return null;
        return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
    }

    // -----------------------------------------------------------------------
    // Helper: replace all occurrences of a placeholder inside an element's
    // textContent recursively. Works on HTML produced by docx-preview.
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Helper: find the first element whose direct text content contains the token
    // -----------------------------------------------------------------------
    function findTokenNode(root, token) {
        return Array.from(root.querySelectorAll('*')).find(el => {
            // Only match leaf-like nodes that directly contain the token text
            for (const child of el.childNodes) {
                if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes(token)) {
                    return true;
                }
            }
            return false;
        });
    }

    // -----------------------------------------------------------------------
    // Main API expected by app.js
    // populateTemplate(inputs, eppImageBase64, shockImageBase64)
    //   inputs          – object with placeholder keys (see below)
    //   eppImageBase64  – base64 PNG of the EPP category image (A/B/C/D)
    //   shockImageBase64– base64 PNG of the footwear/shock index image (1-7)
    // Returns: ArrayBuffer of the final PDF, or null on error.
    // -----------------------------------------------------------------------
    async function populateTemplate(inputs, eppImageBase64, shockImageBase64) {
        console.log('pdfTemplateHelper v5: populateTemplate called');

        // -------------------------------------------------------------------
        // 1. Ensure required libraries are present
        // -------------------------------------------------------------------
        if (!window.jspdf) {
            console.error('pdfTemplateHelper: jsPDF not loaded'); return null;
        }
        if (!window.docx) {
            console.error('pdfTemplateHelper: docx-preview not loaded'); return null;
        }
        if (!window.html2canvas) {
            console.error('pdfTemplateHelper: html2canvas not loaded'); return null;
        }

        // -------------------------------------------------------------------
        // 2. Decode the DOCX template (base64) into a Uint8Array
        // -------------------------------------------------------------------
        if (!window.DOCX_TEMPLATE_DATA) {
            console.error('pdfTemplateHelper: DOCX_TEMPLATE_DATA missing'); return null;
        }
        const docxBase64 = getBase64Data(window.DOCX_TEMPLATE_DATA);
        const docxBytes  = Uint8Array.from(atob(docxBase64), c => c.charCodeAt(0));

        // -------------------------------------------------------------------
        // 3. Render DOCX to a hidden container using docx-preview
        // -------------------------------------------------------------------
        const container = document.createElement('div');
        container.style.cssText = [
            'position:absolute',
            'left:-9999px',
            'top:-9999px',
            'width:216mm',      // US Letter width
            'min-height:279mm', // US Letter height
            'background:white',
            'font-size:10pt',
        ].join(';');
        document.body.appendChild(container);

        try {
            await window.docx.renderAsync(docxBytes, container, {
                ignoreWidth: false,
                ignoreHeight: false,
            });
        } catch (e) {
            console.error('pdfTemplateHelper: docx-preview render error', e);
            document.body.removeChild(container);
            return null;
        }

        // -------------------------------------------------------------------
        // 4. Build placeholder map and replace text in the rendered HTML
        // -------------------------------------------------------------------
        const ph = {
            '{{systemVoltage}}':      inputs.systemVoltage      || '--',
            '{{upstreamBreaker}}':    inputs.upstreamBreaker    || '--',
            '{{shortCircuit}}':       inputs.shortCircuit       || '--',
            '{{energyStorage}}':      inputs.energyStorage      || '--',
            '{{openingTime}}':        inputs.openingTime        || '--',
            '{{workingDistance}}':    inputs.workingDistance    || '--',
            '{{powerForArc}}':        inputs.powerForArc        || '--',
            '{{incidentEnergy}}':     inputs.incidentEnergy     || '--',
            '{{arcFlashBoundary}}':   inputs.arcFlashBoundary   || '--',
            '{{limitedApproach}}':    inputs.limitedApproach    || '--',
            '{{restrictedApproach2}}':inputs.restrictedApproach2|| '--',
            '{{exposedMovable}}':     inputs.exposedMovable     || '--',
            '{{glove}}':              inputs.glove              || '--',
            '{{requiredPPE}}':        inputs.requiredPPE        || '--',
            '{{footwear}}':           inputs.footwear           || '--',
            '{{shockHazard}}':        inputs.shockHazard        || '--',
            '{{busEquipmentId}}':     inputs.busEquipmentId     || '--',
            '{{protectiveDevice}}':   inputs.protectiveDevice   || '--',
            '{{assessmentDate}}':     inputs.assessmentDate     || '--',
            '{{catLetter}}':          (inputs.catLetter || '').toUpperCase(),
        };
        replacePlaceholders(container, ph);

        // -------------------------------------------------------------------
        // 5. Inject EPP image in the "(imagen PPE)" token slot
        // -------------------------------------------------------------------
        if (eppImageBase64) {
            const imgBase64 = getBase64Data(eppImageBase64);
            const tokenNode = findTokenNode(container, '(imagen PPE)');
            if (tokenNode) {
                // Remove the token text
                for (const child of Array.from(tokenNode.childNodes)) {
                    if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes('(imagen PPE)')) {
                        child.nodeValue = child.nodeValue.replace('(imagen PPE)', '').trim();
                    }
                }
                // Build a wrapper div so EPP + shock stack vertically
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';

                const eppImg = document.createElement('img');
                eppImg.src   = `data:image/png;base64,${imgBase64}`;
                eppImg.style.cssText = 'max-width:90px;height:auto;display:block;';
                eppImg.crossOrigin = 'anonymous';
                wrapper.appendChild(eppImg);

                // 6. Inject shock/footwear image below EPP (if provided)
                if (shockImageBase64) {
                    const shockBase64 = getBase64Data(shockImageBase64);
                    const shockImg    = document.createElement('img');
                    shockImg.src      = `data:image/png;base64,${shockBase64}`;
                    shockImg.style.cssText = 'max-width:90px;height:auto;display:block;';
                    shockImg.crossOrigin   = 'anonymous';
                    wrapper.appendChild(shockImg);
                }

                tokenNode.appendChild(wrapper);
            }
        }

        // -------------------------------------------------------------------
        // 7. Capture the rendered container with html2canvas (scale 2 for HiDPI)
        // -------------------------------------------------------------------
        // Wait one tick so images finish loading
        await new Promise(r => setTimeout(r, 300));

        let captureCanvas;
        try {
            captureCanvas = await window.html2canvas(container, {
                scale:      2,
                useCORS:    true,
                allowTaint: false,
                logging:    false,
            });
        } catch (e) {
            console.error('pdfTemplateHelper: html2canvas error', e);
            document.body.removeChild(container);
            return null;
        }

        // -------------------------------------------------------------------
        // 8. Build PDF — split into pages if content is taller than one page
        // -------------------------------------------------------------------
        const jsPDF     = window.jspdf.jsPDF;
        const pdf       = new jsPDF('p', 'mm', 'letter');
        const pageW     = pdf.internal.pageSize.getWidth();   // 215.9 mm
        const pageH     = pdf.internal.pageSize.getHeight();  // 279.4 mm
        const marginMm  = 10; // 10 mm margin on each side
        const printW    = pageW - marginMm * 2;

        const imgData   = captureCanvas.toDataURL('image/png');
        const imgProps  = pdf.getImageProperties(imgData);
        // Scale factor: convert canvas pixels → mm on the page
        const scale     = printW / imgProps.width;
        const totalH    = imgProps.height * scale; // total rendered height in mm

        if (totalH <= pageH - marginMm * 2) {
            // Fits on one page
            pdf.addImage(imgData, 'PNG', marginMm, marginMm, printW, totalH);
        } else {
            // Multi-page: slice the canvas image per page
            const sliceHpx = (pageH - marginMm * 2) / scale; // pixels per page-slice
            let offsetPx   = 0;
            let pageIndex  = 0;

            while (offsetPx < imgProps.height) {
                if (pageIndex > 0) pdf.addPage();

                // Create an off-screen canvas for this slice
                const sliceCanvas  = document.createElement('canvas');
                const sliceActualH = Math.min(sliceHpx, imgProps.height - offsetPx);
                sliceCanvas.width  = imgProps.width;
                sliceCanvas.height = sliceActualH;
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(captureCanvas, 0, -offsetPx);

                const sliceData = sliceCanvas.toDataURL('image/png');
                pdf.addImage(sliceData, 'PNG', marginMm, marginMm, printW, sliceActualH * scale);

                offsetPx  += sliceHpx;
                pageIndex += 1;
            }
        }

        // -------------------------------------------------------------------
        // 9. Clean up the temporary DOM container
        // -------------------------------------------------------------------
        document.body.removeChild(container);

        console.log('pdfTemplateHelper v5: PDF generated successfully');
        return pdf.output('arraybuffer');
    }

    // -----------------------------------------------------------------------
    // Expose the public API
    // -----------------------------------------------------------------------
    window.pdfTemplateHelper = { populateTemplate };
    console.log('pdfTemplateHelper: loaded and ready (v5)');
})();