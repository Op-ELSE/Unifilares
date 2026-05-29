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

    // ---- Main: populateTemplate ----
    async function populateTemplate(inputs, eppImageBase64) {
        console.log('pdfTemplateHelper: populateTemplate called');

        // --- 1. Validate dependencies ---
        if (typeof PDFLib === 'undefined') {
            console.error('pdfTemplateHelper: PDFLib (pdf-lib) is not loaded.');
            alert('Error: La biblioteca pdf-lib no está cargada.');
            return null;
        }

        try {
            var pdfBytes = await buildPdfFromInputs(inputs, eppImageBase64);
            console.log('pdfTemplateHelper: PDF generated, bytes:', pdfBytes ? pdfBytes.length : 0);
            return pdfBytes;
        } catch (err) {
            console.error('pdfTemplateHelper: Error en populateTemplate:', err);
            alert('Error interno generando PDF: ' + err.message);
            return null;
        }
    }

    // ---- Build a PDF from inputs using pdf-lib ----
    async function buildPdfFromInputs(inputs, eppImageBase64) {
        var PDFDocument = PDFLib.PDFDocument;
        var rgb = PDFLib.rgb;
        var StandardFonts = PDFLib.StandardFonts;

        var pdfDoc = await PDFDocument.create();
        var helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        var helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        var pageWidth = 612;   // Letter
        var pageHeight = 792;
        var margin = 40;

        // ---- Page 1: System Information ----
        var page = pdfDoc.addPage([pageWidth, pageHeight]);
        var y = pageHeight - margin;

        // Title
        page.drawText('Anexo 01 - System Information', {
            x: margin, y: y, size: 16, font: helveticaBold, color: rgb(0, 0, 0)
        });
        y -= 30;

        // System Info table rows
        var sysRows = [
            ['System Voltage', (inputs.systemVoltage || '--') + ' V'],
            ['Upstream Overcurrent Breaker', (inputs.upstreamBreaker || '--') + ' A'],
            ['Short Circuit Current (Isc)', (inputs.shortCircuit || '--') + ' kA'],
            ['Energy Storage (Capacitors)', (inputs.energyStorage || '--') + ' kJ'],
            ['Opening Time', (inputs.openingTime || '--') + ' Sec'],
            ['Working Distance', inputs.workingDistance || '--'],
            ['Power - Arc Flash Boundaries', (inputs.powerForArc || '--') + ' kVA'],
            ['Incident Energy', (inputs.incidentEnergy || '--') + ' cal/cm2']
        ];

        y = drawTable(page, sysRows, margin, y, pageWidth - margin * 2, helvetica, helveticaBold);
        y -= 25;

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

        // Boundary rows
        var boundaryRows = [
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
                var imgRawData = getBase64Data(eppImageBase64);
                if (imgRawData) {
                    var imgBytes = base64ToUint8Array(imgRawData);
                    var pngImage;
                    try {
                        pngImage = await pdfDoc.embedPng(imgBytes);
                    } catch (pngErr) {
                        console.warn('pdfTemplateHelper: PNG embed failed, trying JPEG:', pngErr.message);
                        try {
                            pngImage = await pdfDoc.embedJpg(imgBytes);
                        } catch (jpgErr) {
                            console.warn('pdfTemplateHelper: JPEG embed also failed:', jpgErr.message);
                            pngImage = null;
                        }
                    }

                    if (pngImage) {
                        var origW = pngImage.width;
                        var origH = pngImage.height;
                        var maxW = 150;
                        var maxH = 150;
                        var scale = Math.min(maxW / origW, maxH / origH, 1);
                        var drawW = origW * scale;
                        var drawH = origH * scale;

                        if (y - drawH < margin) {
                            page = pdfDoc.addPage([pageWidth, pageHeight]);
                            y = pageHeight - margin;
                        }
                        page.drawImage(pngImage, {
                            x: margin, y: y - drawH, width: drawW, height: drawH
                        });
                        y -= drawH + 15;
                    }
                }
            } catch (imgErr) {
                console.warn('pdfTemplateHelper: Error embebiendo imagen EPP:', imgErr);
            }
        }

        // ---- WARNING LABEL section ----
        if (y < 300) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
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

        // Warning label data - row 1
        drawLabelRow(page, margin, y, 'Arc Flash Boundary:', inputs.arcFlashBoundary || '--',
            'Glove Class / CAT:', inputs.glove || '--', helvetica, helveticaBold);
        y -= 18;

        // Warning label data - row 2
        drawLabelRow(page, margin, y, 'Required PPE:', inputs.requiredPPE || '--',
            'Footwear:', inputs.footwear || '--', helvetica, helveticaBold);
        y -= 25;

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
        drawLabelRow(page, margin, y, 'Shock Hazard:', inputs.shockHazard || '--',
            'Limited Approach:', inputs.limitedApproach || '--', helvetica, helveticaBold);
        y -= 18;

        drawLabelRow(page, margin, y, 'Bus/Equipment ID:', inputs.busEquipmentId || '--',
            'Restricted Approach:', inputs.restrictedApproach2 || '--', helvetica, helveticaBold);
        y -= 18;

        drawLabelRow(page, margin, y, 'Protective Device:', inputs.protectiveDevice || '--',
            'Assessment Date:', inputs.assessmentDate || '--', helvetica, helveticaBold);
        y -= 25;

        // Disclaimer
        page.drawText('THIS LABEL IS FOR TEMPORARY USE AND MUST BE REMOVED AFTER SERVICE IS COMPLETED', {
            x: margin + 15, y: y, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });
        y -= 12;
        page.drawText('IMPORTANT: This label was generated using estimated values.', {
            x: margin + 5, y: y, size: 6, font: helvetica, color: rgb(0.5, 0.5, 0.5)
        });

        // --- Serialize ---
        var pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    // ---- Draw a 4-column label row ----
    function drawLabelRow(page, margin, y, label1, value1, label2, value2, font, boldFont) {
        var rgbFn = PDFLib.rgb;
        page.drawText(label1, { x: margin + 5, y: y - 12, size: 9, font: boldFont, color: rgbFn(0, 0, 0) });
        page.drawText(String(value1), { x: margin + 130, y: y - 12, size: 9, font: font, color: rgbFn(0, 0, 0.55) });
        page.drawText(label2, { x: margin + 270, y: y - 12, size: 9, font: boldFont, color: rgbFn(0, 0, 0) });
        page.drawText(String(value2), { x: margin + 400, y: y - 12, size: 9, font: font, color: rgbFn(0, 0, 0.55) });
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

            // Border lines
            page.drawLine({
                start: { x: x, y: rowY },
                end: { x: x + totalWidth, y: rowY },
                thickness: 0.5,
                color: rgbFn(0.8, 0.8, 0.8)
            });
            page.drawLine({
                start: { x: x, y: rowY + rowHeight },
                end: { x: x + totalWidth, y: rowY + rowHeight },
                thickness: 0.5,
                color: rgbFn(0.8, 0.8, 0.8)
            });

            // Label
            page.drawText(String(rows[i][0]), {
                x: x + 5, y: rowY + 5, size: fontSize, font: boldFont, color: rgbFn(0, 0, 0)
            });

            // Value
            page.drawText(String(rows[i][1]), {
                x: x + labelWidth + 5, y: rowY + 5, size: fontSize, font: font, color: rgbFn(0, 0, 0.55)
            });
        }

        return y - rows.length * rowHeight;
    }

    // ---- Expose on window ----
    window.pdfTemplateHelper = {
        populateTemplate: populateTemplate
    };

    console.log('pdfTemplateHelper: loaded and ready');

})();