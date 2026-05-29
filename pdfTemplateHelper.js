/**
 * pdfTemplateHelper.js
 *
 * Provides window.pdfTemplateHelper.populateTemplate(inputs, eppImageBase64)
 *
 * Generates an Arc Flash report PDF using pdf-lib from the calculated inputs.
 * Returns a Uint8Array with the PDF bytes.
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
        var bin = atob(b64);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    }

    // ---- Utility: sanitize text for pdf-lib standard fonts ----
    // Standard fonts (Helvetica, etc.) only support WinAnsi encoding.
    // Replace unsupported characters to avoid encoding errors.
    function sanitize(text) {
        if (text === null || text === undefined) return '--';
        var s = String(text);
        // Replace common problematic characters
        s = s.replace(/\u00B2/g, '2');      // ² → 2
        s = s.replace(/\u2013/g, '-');       // – (en-dash) → -
        s = s.replace(/\u2014/g, '-');       // — (em-dash) → -
        s = s.replace(/\u2018/g, "'");       // ' → '
        s = s.replace(/\u2019/g, "'");       // ' → '
        s = s.replace(/\u201C/g, '"');       // " → "
        s = s.replace(/\u201D/g, '"');       // " → "
        s = s.replace(/\u2026/g, '...');     // … → ...
        s = s.replace(/\u00E1/g, 'a');       // á → a
        s = s.replace(/\u00E9/g, 'e');       // é → e
        s = s.replace(/\u00ED/g, 'i');       // í → i
        s = s.replace(/\u00F3/g, 'o');       // ó → o
        s = s.replace(/\u00FA/g, 'u');       // ú → u
        s = s.replace(/\u00F1/g, 'n');       // ñ → n
        s = s.replace(/\u00C1/g, 'A');       // Á → A
        s = s.replace(/\u00C9/g, 'E');       // É → E
        s = s.replace(/\u00CD/g, 'I');       // Í → I
        s = s.replace(/\u00D3/g, 'O');       // Ó → O
        s = s.replace(/\u00DA/g, 'U');       // Ú → U
        s = s.replace(/\u00D1/g, 'N');       // Ñ → N
        s = s.replace(/\u00FC/g, 'u');       // ü → u
        s = s.replace(/\u00DC/g, 'U');       // Ü → U
        s = s.replace(/\u26A0/g, '!');       // ⚠ → !
        // Remove any remaining non-WinAnsi characters (keep basic latin + latin-1 supplement)
        s = s.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
        return s || '--';
    }

    // ---- Main: populateTemplate ----
    async function populateTemplate(inputs, eppImageBase64) {
        console.log('pdfTemplateHelper: populateTemplate called with inputs:', Object.keys(inputs || {}));

        // --- 1. Validate dependencies ---
        if (typeof PDFLib === 'undefined') {
            console.error('pdfTemplateHelper: PDFLib (pdf-lib) is not loaded.');
            return null;
        }

        try {
            var pdfBytes = await buildPdfFromInputs(inputs || {}, eppImageBase64);
            console.log('pdfTemplateHelper: PDF generated successfully, bytes:', pdfBytes ? pdfBytes.length : 0);
            return pdfBytes;
        } catch (err) {
            console.error('pdfTemplateHelper: FULL ERROR:', err);
            console.error('pdfTemplateHelper: Error message:', err.message);
            console.error('pdfTemplateHelper: Error stack:', err.stack);
            return null;
        }
    }

    // ---- Build a PDF from inputs using pdf-lib ----
    async function buildPdfFromInputs(inputs, eppImageBase64) {
        console.log('pdfTemplateHelper: buildPdfFromInputs starting...');

        var PDFDocument = PDFLib.PDFDocument;
        var rgb = PDFLib.rgb;
        var StandardFonts = PDFLib.StandardFonts;

        var pdfDoc = await PDFDocument.create();
        console.log('pdfTemplateHelper: PDFDocument created');

        var helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        var helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        console.log('pdfTemplateHelper: Fonts embedded');

        var pageWidth = 612;   // Letter
        var pageHeight = 792;
        var margin = 40;

        // ---- Page 1: System Information ----
        var page = pdfDoc.addPage([pageWidth, pageHeight]);
        var y = pageHeight - margin;
        console.log('pdfTemplateHelper: Page 1 created');

        // Title
        page.drawText('Anexo 01 - System Information', {
            x: margin, y: y, size: 16, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 30;
        console.log('pdfTemplateHelper: Title drawn');

        // System Info table rows
        var sysRows = [
            ['System Voltage', sanitize(inputs.systemVoltage) + ' V'],
            ['Upstream Overcurrent Breaker', sanitize(inputs.upstreamBreaker) + ' A'],
            ['Short Circuit Current (Isc)', sanitize(inputs.shortCircuit) + ' kA'],
            ['Energy Storage (Capacitors)', sanitize(inputs.energyStorage) + ' kJ'],
            ['Opening Time', sanitize(inputs.openingTime) + ' Sec'],
            ['Working Distance', sanitize(inputs.workingDistance)],
            ['Power - Arc Flash Boundaries', sanitize(inputs.powerForArc) + ' kVA'],
            ['Incident Energy', sanitize(inputs.incidentEnergy) + ' cal/cm2']
        ];

        y = drawTable(page, sysRows, margin, y, pageWidth - margin * 2, helvetica, helveticaBold);
        y -= 25;
        console.log('pdfTemplateHelper: System info table drawn');

        // Section heading
        page.drawText('Analisis de seguridad electrica', {
            x: margin, y: y, size: 14, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 15;
        page.drawText('Frontera de proteccion de arco y choque electrico', {
            x: margin, y: y, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3)
        });
        y -= 12;
        page.drawText('According to NFPA70E: Table 130.4(E)(a)', {
            x: margin, y: y, size: 8, font: helvetica, color: rgb(0.4, 0.4, 0.4)
        });
        y -= 25;
        console.log('pdfTemplateHelper: Headings drawn');

        // Boundary rows
        var boundaryRows = [
            ['Arc Flash Boundary', sanitize(inputs.arcFlashBoundary)],
            ['Limited Approach', sanitize(inputs.limitedApproach)],
            ['Restricted Approach', sanitize(inputs.restrictedApproach2)],
            ['Arc Flash Approach', sanitize(inputs.arcFlashApproach)]
        ];
        y = drawTable(page, boundaryRows, margin, y, pageWidth - margin * 2, helvetica, helveticaBold);
        y -= 20;
        console.log('pdfTemplateHelper: Boundary table drawn');

        // ---- EPP Image (if available) ----
        if (eppImageBase64) {
            console.log('pdfTemplateHelper: Attempting to embed EPP image...');
            try {
                var imgRawData = getBase64Data(eppImageBase64);
                if (imgRawData) {
                    var imgBytes = base64ToUint8Array(imgRawData);
                    var embeddedImage = null;
                    try {
                        embeddedImage = await pdfDoc.embedPng(imgBytes);
                        console.log('pdfTemplateHelper: Image embedded as PNG');
                    } catch (pngErr) {
                        console.warn('pdfTemplateHelper: PNG failed, trying JPEG:', pngErr.message);
                        try {
                            embeddedImage = await pdfDoc.embedJpg(imgBytes);
                            console.log('pdfTemplateHelper: Image embedded as JPEG');
                        } catch (jpgErr) {
                            console.warn('pdfTemplateHelper: JPEG also failed:', jpgErr.message);
                        }
                    }

                    if (embeddedImage) {
                        var origW = embeddedImage.width;
                        var origH = embeddedImage.height;
                        var maxW = 150;
                        var maxH = 150;
                        var scale = Math.min(maxW / origW, maxH / origH, 1);
                        var drawW = origW * scale;
                        var drawH = origH * scale;

                        if (y - drawH < margin) {
                            page = pdfDoc.addPage([pageWidth, pageHeight]);
                            y = pageHeight - margin;
                        }
                        page.drawImage(embeddedImage, {
                            x: margin, y: y - drawH, width: drawW, height: drawH
                        });
                        y -= drawH + 15;
                        console.log('pdfTemplateHelper: Image placed on page');
                    }
                }
            } catch (imgErr) {
                console.warn('pdfTemplateHelper: Image embedding skipped due to error:', imgErr.message);
            }
        } else {
            console.log('pdfTemplateHelper: No EPP image provided');
        }

        // ---- WARNING LABEL section ----
        if (y < 300) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
            console.log('pdfTemplateHelper: Added page 2 for warning label');
        }

        // Warning banner (orange)
        var bannerH = 30;
        var contentW = pageWidth - margin * 2;
        page.drawRectangle({
            x: margin, y: y - bannerH, width: contentW, height: bannerH,
            color: rgb(0.93, 0.55, 0)
        });
        page.drawText('WARNING', {
            x: pageWidth / 2 - 40, y: y - 22, size: 18, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= bannerH + 5;

        page.drawText('Arc Flash & Shock Hazard - Appropriate PPE Required', {
            x: margin + 10, y: y - 12, size: 11, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 25;
        console.log('pdfTemplateHelper: Warning banner drawn');

        // Dark header bar
        var darkBarH = 18;
        page.drawRectangle({
            x: margin, y: y - darkBarH, width: contentW, height: darkBarH,
            color: rgb(0.16, 0.16, 0.16)
        });
        page.drawText('ARC FLASH PROTECTION BOUNDARY AND REQUIRED PPE - ABB ES Calculator V1.6a', {
            x: margin + 5, y: y - 13, size: 7, font: helveticaBold, color: rgb(1, 1, 1)
        });
        y -= darkBarH + 5;

        // Warning label data
        drawLabelRow(page, margin, y, 'Arc Flash Boundary:', sanitize(inputs.arcFlashBoundary),
            'Glove Class / CAT:', sanitize(inputs.glove), helvetica, helveticaBold);
        y -= 18;

        drawLabelRow(page, margin, y, 'Required PPE:', sanitize(inputs.requiredPPE),
            'Footwear:', sanitize(inputs.footwear), helvetica, helveticaBold);
        y -= 25;
        console.log('pdfTemplateHelper: PPE rows drawn');

        // Shock section dark bar
        page.drawRectangle({
            x: margin, y: y - darkBarH, width: contentW, height: darkBarH,
            color: rgb(0.16, 0.16, 0.16)
        });
        page.drawText('SHOCK HAZARD PROTECTION BOUNDARIES', {
            x: margin + 5, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1)
        });
        y -= darkBarH + 5;

        // Shock rows
        drawLabelRow(page, margin, y, 'Shock Hazard:', sanitize(inputs.shockHazard),
            'Limited Approach:', sanitize(inputs.limitedApproach), helvetica, helveticaBold);
        y -= 18;

        drawLabelRow(page, margin, y, 'Bus/Equipment ID:', sanitize(inputs.busEquipmentId),
            'Restricted Approach:', sanitize(inputs.restrictedApproach2), helvetica, helveticaBold);
        y -= 18;

        drawLabelRow(page, margin, y, 'Protective Device:', sanitize(inputs.protectiveDevice),
            'Assessment Date:', sanitize(inputs.assessmentDate), helvetica, helveticaBold);
        y -= 25;
        console.log('pdfTemplateHelper: Shock rows drawn');

        // Disclaimer
        page.drawText('THIS LABEL IS FOR TEMPORARY USE AND MUST BE REMOVED AFTER SERVICE IS COMPLETED', {
            x: margin + 15, y: y, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });
        y -= 12;
        page.drawText('IMPORTANT: This label was generated using estimated values.', {
            x: margin + 5, y: y, size: 6, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });
        console.log('pdfTemplateHelper: Disclaimer drawn');

        // --- Serialize ---
        console.log('pdfTemplateHelper: Saving PDF...');
        var pdfBytes = await pdfDoc.save();
        console.log('pdfTemplateHelper: PDF saved, bytes:', pdfBytes.length);
        return pdfBytes;
    }

    // ---- Draw a 4-column label row ----
    function drawLabelRow(page, margin, y, label1, value1, label2, value2, font, boldFont) {
        var rgbFn = PDFLib.rgb;
        page.drawText(sanitize(label1), { x: margin + 5, y: y - 12, size: 9, font: boldFont, color: rgbFn(0, 0, 0) });
        page.drawText(sanitize(value1), { x: margin + 130, y: y - 12, size: 9, font: font, color: rgbFn(0, 0, 0.55) });
        page.drawText(sanitize(label2), { x: margin + 270, y: y - 12, size: 9, font: boldFont, color: rgbFn(0, 0, 0) });
        page.drawText(sanitize(value2), { x: margin + 400, y: y - 12, size: 9, font: font, color: rgbFn(0, 0, 0.55) });
    }

    // ---- Draw a simple two-column table ----
    function drawTable(page, rows, x, y, totalWidth, font, boldFont) {
        var rowHeight = 18;
        var labelWidth = totalWidth * 0.55;
        var fontSize = 9;
        var rgbFn = PDFLib.rgb;

        for (var i = 0; i < rows.length; i++) {
            var rowY = y - (i + 1) * rowHeight;

            // Alternating background
            if (i % 2 === 0) {
                page.drawRectangle({
                    x: x, y: rowY, width: totalWidth, height: rowHeight,
                    color: rgbFn(0.96, 0.96, 0.96)
                });
            }

            // Border lines (top and bottom of each row)
            page.drawLine({
                start: { x: x, y: rowY },
                end: { x: x + totalWidth, y: rowY },
                thickness: 0.5,
                color: rgbFn(0.8, 0.8, 0.8)
            });

            // Label
            page.drawText(sanitize(rows[i][0]), {
                x: x + 5, y: rowY + 5, size: fontSize, font: boldFont, color: rgbFn(0, 0, 0)
            });

            // Value
            page.drawText(sanitize(rows[i][1]), {
                x: x + labelWidth + 5, y: rowY + 5, size: fontSize, font: font, color: rgbFn(0, 0, 0.55)
            });
        }

        return y - rows.length * rowHeight;
    }

    // ---- Expose on window ----
    window.pdfTemplateHelper = {
        populateTemplate: populateTemplate
    };

    console.log('pdfTemplateHelper: loaded and ready (v2)');

})();