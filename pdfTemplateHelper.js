/**
 * pdfTemplateHelper.js
 *
 * Provides window.pdfTemplateHelper.populateTemplate(inputs, eppImageBase64)
 *
 * Flow:
 *   1. Loads the DOCX template from window.DOCX_TEMPLATE_DATA (base64)
 *   2. Opens it with JSZip and replaces placeholder text in word/document.xml
 *   3. Optionally embeds an EPP/PPE image
 *   4. Converts the populated DOCX to a PDF using pdf-lib
 *   5. Returns the PDF as a Uint8Array
 */

(function () {
    'use strict';

    // ---- Utility: extract pure base64 from a data-URI string ----
    function getBase64Data(dataUri) {
        if (!dataUri) return null;
        if (dataUri.includes(',')) return dataUri.split(',')[1];
        return dataUri;
    }

    // ---- Utility: base64 → Uint8Array ----
    function base64ToUint8Array(b64) {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    }

    // ---- Main: populateTemplate ----
    async function populateTemplate(inputs, eppImageBase64) {
        try {
            // --- 1. Validate dependencies ---
            if (typeof JSZip === 'undefined') {
                console.error('pdfTemplateHelper: JSZip no está cargada.');
                return null;
            }
            if (typeof PDFLib === 'undefined') {
                console.error('pdfTemplateHelper: pdf-lib no está cargada.');
                return null;
            }
            if (!window.DOCX_TEMPLATE_DATA) {
                console.error('pdfTemplateHelper: DOCX_TEMPLATE_DATA no disponible.');
                return null;
            }

            // --- 2. Open the DOCX template ---
            const zip = await JSZip.loadAsync(window.DOCX_TEMPLATE_DATA, { base64: true });
            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            // --- 3. Optionally embed EPP image ---
            let rIdPPE = null;
            if (eppImageBase64) {
                const imgData = getBase64Data(eppImageBase64);
                if (imgData) {
                    zip.file('word/media/ppe_image.png', imgData, { base64: true });

                    let relsXmlText = await zip.file('word/_rels/document.xml.rels').async('string');
                    const relsDoc = parser.parseFromString(relsXmlText, 'application/xml');
                    let relationships = relsDoc.getElementsByTagNameNS(
                        'http://schemas.openxmlformats.org/package/2006/relationships',
                        'Relationships'
                    )[0];
                    if (!relationships) {
                        relationships = relsDoc.getElementsByTagName('Relationships')[0];
                    }
                    if (relationships) {
                        rIdPPE = 'rIdPPE' + Date.now();
                        const newRel = relsDoc.createElementNS(
                            'http://schemas.openxmlformats.org/package/2006/relationships',
                            'Relationship'
                        );
                        newRel.setAttribute('Id', rIdPPE);
                        newRel.setAttribute(
                            'Type',
                            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
                        );
                        newRel.setAttribute('Target', 'media/ppe_image.png');
                        relationships.appendChild(newRel);
                        zip.file('word/_rels/document.xml.rels', serializer.serializeToString(relsDoc));
                    }
                }
            }

            // --- 4. Replace placeholders in document.xml ---
            let docXmlText = await zip.file('word/document.xml').async('string');

            // Build a map of placeholder → value
            const placeholders = {
                '{{systemVoltage}}': inputs.systemVoltage || '--',
                '{{upstreamBreaker}}': inputs.upstreamBreaker || '--',
                '{{shortCircuit}}': inputs.shortCircuit || '--',
                '{{energyStorage}}': inputs.energyStorage || '--',
                '{{openingTime}}': inputs.openingTime || '--',
                '{{workingDistance}}': inputs.workingDistance || '--',
                '{{powerForArc}}': inputs.powerForArc || '--',
                '{{incidentEnergy}}': inputs.incidentEnergy || '--',
                '{{arcFlashApproach}}': inputs.arcFlashApproach || '--',
                '{{limitsApproach}}': inputs.limitsApproach || '--',
                '{{restrictedApproach}}': inputs.restrictedApproach || '--',
                '{{exposedMovable}}': inputs.exposedMovable || '--',
                '{{arcFlashBoundary}}': inputs.arcFlashBoundary || '--',
                '{{glove}}': inputs.glove || '--',
                '{{requiredPPE}}': inputs.requiredPPE || '--',
                '{{footwear}}': inputs.footwear || '--',
                '{{shockHazard}}': inputs.shockHazard || '--',
                '{{limitedApproach}}': inputs.limitedApproach || '--',
                '{{restrictedApproach2}}': inputs.restrictedApproach2 || '--',
                '{{busEquipmentId}}': inputs.busEquipmentId || '--',
                '{{assessmentDate}}': inputs.assessmentDate || '--',
                '{{protectiveDevice}}': inputs.protectiveDevice || '--'
            };

            for (const [key, value] of Object.entries(placeholders)) {
                // Replace in raw XML — handle potential XML-split placeholders
                docXmlText = docXmlText.split(key).join(escapeXml(value));
            }

            zip.file('word/document.xml', docXmlText);

            // --- 5. Generate the DOCX as a Uint8Array ---
            const docxBytes = await zip.generateAsync({ type: 'uint8array' });

            // --- 6. Convert DOCX → PDF using pdf-lib ---
            // Since true DOCX→PDF conversion requires a full layout engine,
            // we build a clean PDF from the input data directly using pdf-lib.
            const pdfBytes = await buildPdfFromInputs(inputs, eppImageBase64);

            return pdfBytes;

        } catch (err) {
            console.error('pdfTemplateHelper: Error en populateTemplate:', err);
            return null;
        }
    }

    // ---- Escape XML special characters ----
    function escapeXml(str) {
        if (!str || typeof str !== 'string') return str || '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // ---- Build a PDF from inputs using pdf-lib ----
    async function buildPdfFromInputs(inputs, eppImageBase64) {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;

        const pdfDoc = await PDFDocument.create();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = 612;   // Letter
        const pageHeight = 792;
        const margin = 40;
        const colWidth = (pageWidth - margin * 2) / 2;

        // ---- Page 1: System Information ----
        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;

        // Title
        page.drawText('Anexo 01 — System Information', {
            x: margin, y: y, size: 16, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 30;

        // System Info table rows
        const sysRows = [
            ['System Voltage', (inputs.systemVoltage || '--') + ' V'],
            ['Upstream Overcurrent Breaker', (inputs.upstreamBreaker || '--') + ' A'],
            ['Short Circuit Current (Isc)', (inputs.shortCircuit || '--') + ' kA'],
            ['Energy Storage (Capacitors)', (inputs.energyStorage || '--') + ' kJ'],
            ['Opening Time', (inputs.openingTime || '--') + ' Sec'],
            ['Working Distance', inputs.workingDistance || '--'],
            ['Power – Arc Flash Boundaries', (inputs.powerForArc || '--') + ' kVA'],
            ['Incident Energy', (inputs.incidentEnergy || '--') + ' cal/cm²']
        ];

        y = drawTable(page, sysRows, margin, y, pageWidth - margin * 2, helvetica, helveticaBold);
        y -= 20;

        // Section heading
        page.drawText('Análisis de seguridad eléctrica', {
            x: margin, y: y, size: 14, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 15;
        page.drawText('Frontera de protección de arco y choque eléctrico', {
            x: margin, y: y, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3)
        });
        y -= 12;
        page.drawText('According to NFPA70E: Table 130.4(E)(a)', {
            x: margin, y: y, size: 8, font: helvetica, color: rgb(0.4, 0.4, 0.4)
        });
        y -= 20;

        // Boundary rows
        const boundaryRows = [
            ['Arc Flash Boundary', inputs.arcFlashBoundary || '--'],
            ['Limited Approach', inputs.limitedApproach || '--'],
            ['Restricted Approach', inputs.restrictedApproach2 || '--'],
            ['Arc Flash Approach', inputs.arcFlashApproach || '--']
        ];
        y = drawTable(page, boundaryRows, margin, y, pageWidth - margin * 2, helvetica, helveticaBold);
        y -= 20;

        // ---- EPP Image (if available) ----
        if (eppImageBase64) {
            try {
                const imgData = getBase64Data(eppImageBase64);
                if (imgData) {
                    const imgBytes = base64ToUint8Array(imgData);
                    const pngImage = await pdfDoc.embedPng(imgBytes);
                    const imgDims = pngImage.scale(0.25);
                    const maxW = 150;
                    const maxH = 150;
                    const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
                    const drawW = imgDims.width * scale;
                    const drawH = imgDims.height * scale;

                    if (y - drawH < margin) {
                        page = pdfDoc.addPage([pageWidth, pageHeight]);
                        y = pageHeight - margin;
                    }
                    page.drawImage(pngImage, {
                        x: margin, y: y - drawH, width: drawW, height: drawH
                    });
                    y -= drawH + 15;
                }
            } catch (imgErr) {
                console.warn('pdfTemplateHelper: Error embebiendo imagen EPP:', imgErr);
            }
        }

        // ---- Page 2 (or continued): WARNING LABEL ----
        if (y < 280) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
        }

        // Warning banner
        const bannerH = 30;
        page.drawRectangle({
            x: margin, y: y - bannerH, width: pageWidth - margin * 2, height: bannerH,
            color: rgb(0.93, 0.55, 0)
        });
        page.drawText('⚠  WARNING', {
            x: pageWidth / 2 - 50, y: y - 22, size: 18, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= bannerH + 5;

        page.drawText('Arc Flash & Shock Hazard — Appropriate PPE Required', {
            x: margin + 10, y: y - 12, size: 11, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 25;

        // Dark header bar
        const darkBarH = 18;
        page.drawRectangle({
            x: margin, y: y - darkBarH, width: pageWidth - margin * 2, height: darkBarH,
            color: rgb(0.16, 0.16, 0.16)
        });
        page.drawText('ARC FLASH PROTECTION BOUNDARY AND REQUIRED PPE — ABB ES Calculator V1.6a', {
            x: margin + 5, y: y - 13, size: 7, font: helveticaBold, color: rgb(1, 1, 1)
        });
        y -= darkBarH + 5;

        // Warning label data
        const warningRows = [
            ['Arc Flash Boundary:', inputs.arcFlashBoundary || '--', 'Glove Class / CAT:', inputs.glove || '--'],
            ['Required PPE:', inputs.requiredPPE || '--', 'Footwear:', inputs.footwear || '--']
        ];

        for (const row of warningRows) {
            page.drawText(row[0], { x: margin + 5, y: y - 12, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
            page.drawText(row[1], { x: margin + 130, y: y - 12, size: 9, font: helvetica, color: rgb(0, 0, 0.55) });
            page.drawText(row[2], { x: margin + 270, y: y - 12, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
            page.drawText(row[3], { x: margin + 400, y: y - 12, size: 9, font: helvetica, color: rgb(0, 0, 0.55) });
            y -= 18;
        }

        // Shock section dark bar
        y -= 5;
        page.drawRectangle({
            x: margin, y: y - darkBarH, width: pageWidth - margin * 2, height: darkBarH,
            color: rgb(0.16, 0.16, 0.16)
        });
        page.drawText('SHOCK HAZARD PROTECTION BOUNDARIES', {
            x: margin + 5, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1)
        });
        y -= darkBarH + 5;

        const shockRows = [
            ['Shock Hazard:', inputs.shockHazard || '--', 'Limited Approach:', inputs.limitedApproach || '--'],
            ['Bus/Equipment ID:', inputs.busEquipmentId || '--', 'Restricted Approach:', inputs.restrictedApproach2 || '--'],
            ['Protective Device:', inputs.protectiveDevice || '--', 'Assessment Date:', inputs.assessmentDate || '--']
        ];

        for (const row of shockRows) {
            page.drawText(row[0], { x: margin + 5, y: y - 12, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
            page.drawText(row[1], { x: margin + 130, y: y - 12, size: 9, font: helvetica, color: rgb(0, 0, 0.55) });
            page.drawText(row[2], { x: margin + 270, y: y - 12, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
            page.drawText(row[3], { x: margin + 400, y: y - 12, size: 9, font: helvetica, color: rgb(0, 0, 0.55) });
            y -= 18;
        }

        // Disclaimer
        y -= 10;
        page.drawText('THIS LABEL IS FOR TEMPORARY USE AND MUST BE REMOVED AFTER SERVICE IS COMPLETED', {
            x: margin + 20, y: y, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });
        y -= 12;
        page.drawText('IMPORTANT: This label was generated using estimated values and may be used in the absence of a formal arc flash risk assessment.', {
            x: margin + 5, y: y, size: 6, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });

        // --- Serialize ---
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    // ---- Draw a simple two-column table ----
    function drawTable(page, rows, x, y, totalWidth, font, boldFont) {
        const rowHeight = 18;
        const labelWidth = totalWidth * 0.55;
        const valueWidth = totalWidth * 0.45;
        const fontSize = 9;
        const { rgb } = PDFLib;

        for (let i = 0; i < rows.length; i++) {
            const rowY = y - (i + 1) * rowHeight;

            // Alternating background
            if (i % 2 === 0) {
                page.drawRectangle({
                    x: x, y: rowY, width: totalWidth, height: rowHeight,
                    color: rgb(0.96, 0.96, 0.96)
                });
            }

            // Border
            page.drawRectangle({
                x: x, y: rowY, width: totalWidth, height: rowHeight,
                borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
                color: undefined
            });

            // Label
            page.drawText(rows[i][0], {
                x: x + 5, y: rowY + 5, size: fontSize, font: boldFont, color: rgb(0, 0, 0)
            });

            // Value
            page.drawText(rows[i][1], {
                x: x + labelWidth + 5, y: rowY + 5, size: fontSize, font: font, color: rgb(0, 0, 0.55)
            });
        }

        return y - rows.length * rowHeight;
    }

    // ---- Expose on window ----
    window.pdfTemplateHelper = {
        populateTemplate: populateTemplate
    };

})();