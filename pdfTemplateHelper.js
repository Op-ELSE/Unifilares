/**
 * pdfTemplateHelper.js  (v3)
 *
 * Provides window.pdfTemplateHelper.populateTemplate(inputs, eppImageBase64)
 *
 * Uses jsPDF + jspdf-autotable to generate a PDF that matches the
 * Word (DOCX) template layout: System Information table, Shock Boundaries
 * table with EPP image, and the WARNING label table.
 *
 * Returns an ArrayBuffer with the PDF bytes.
 */

(function () {
    'use strict';

    // ---- Utility: extract pure base64 from a data-URI string ----
    function getBase64Data(dataUri) {
        if (!dataUri) return null;
        if (dataUri.includes(',')) return dataUri.split(',')[1];
        return dataUri;
    }

    // ---- Main: populateTemplate ----
    async function populateTemplate(inputs, eppImageBase64) {
        console.log('pdfTemplateHelper v3: populateTemplate called');

        if (!window.jspdf) {
            console.error('pdfTemplateHelper: jsPDF is not loaded.');
            return null;
        }

        try {
            var pdfBytes = buildPdfFromInputs(inputs || {}, eppImageBase64);
            console.log('pdfTemplateHelper v3: PDF generated, bytes:', pdfBytes ? pdfBytes.byteLength : 0);
            return pdfBytes;
        } catch (err) {
            console.error('pdfTemplateHelper v3: FULL ERROR:', err);
            console.error('pdfTemplateHelper v3: Error message:', err.message);
            console.error('pdfTemplateHelper v3: Error stack:', err.stack);
            return null;
        }
    }

    // ---- Build a PDF matching the Word template layout ----
    function buildPdfFromInputs(inputs, eppImageBase64) {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF('p', 'mm', 'letter');

        // ---- Collect values with fallback ----
        var voltage       = inputs.systemVoltage || '--';
        var breaker       = inputs.upstreamBreaker || '--';
        var isc           = inputs.shortCircuit || '--';
        var ecap          = inputs.energyStorage || '--';
        var time          = inputs.openingTime || '--';
        var workDist      = inputs.workingDistance || '--';
        var power         = inputs.powerForArc || '--';
        var energy        = inputs.incidentEnergy || '--';
        var arcBoundary   = inputs.arcFlashBoundary || inputs.arcFlashApproach || '--';
        var limited       = inputs.limitedApproach || '--';
        var restricted    = inputs.restrictedApproach || inputs.restrictedApproach2 || '--';
        var exposed       = inputs.exposedMovable || inputs.limitsApproach || '--';
        var gloves        = inputs.glove || '--';
        var ppe           = inputs.requiredPPE || '--';
        var footwear      = inputs.footwear || '--';
        var shockV        = inputs.shockHazard || '--';
        var equipId       = inputs.busEquipmentId || '--';
        var device        = inputs.protectiveDevice || '--';
        var dateVal       = inputs.assessmentDate || '--';

        // =====================================================
        //  TABLE 1: System Information
        // =====================================================
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Anexo 01  System Information', 15, 20);

        doc.autoTable({
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [0, 0, 0] },
            head: [[{ content: 'System Information', colSpan: 4, styles: { halign: 'center' } }]],
            body: [
                ['System Voltage', voltage, 'V', ''],
                ['Upstream Overcurrent Breaker (device)', breaker, 'A', ''],
                ['Short Circuit Current (Isc)', parseFloat(isc).toFixed(1), 'kA', ''],
                ['Energy Storage (e.g. Capacitors)', parseFloat(ecap).toFixed(1), 'kJ', ''],
                ['Opening Time', parseFloat(time).toFixed(2), 'Sec', ''],
                ['Working Distance (From the arc source)', workDist, '(*)', ''],
                ['Power - For Arc Flash prot. Boundaries', power, 'kVA (*)', ''],
                ['Incident Energy', energy, 'cal/cm\u00B2', '']
            ],
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 35, fontStyle: 'bold', halign: 'right' },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 }
            }
        });

        // =====================================================
        //  Section: Electrical Safety Analysis
        // =====================================================
        var headingY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('An\u00E1lisis de seguridad el\u00E9ctrica', 15, headingY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Frontera de protecci\u00F3n de arco y choque el\u00E9ctrico Distancias para instalaci\u00F3n de barricada', 15, headingY + 6);
        doc.text('durante verificaci\u00F3n de Seven Steps y se\u00F1alizaci\u00F3n perimetral', 15, headingY + 11);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('According to NFPA70E: Table 130.4(E)(a)', 15, headingY + 17);

        // =====================================================
        //  EPP (PPE) Image — left side
        // =====================================================
        var eppImgW = 3.5;
        var eppImgH = 10;
        if (eppImageBase64) {
            try {
                var imgData = getBase64Data(eppImageBase64);
                if (imgData) {
                    doc.addImage(imgData, 'PNG', 15, headingY + 22, eppImgW, eppImgH);
                }
            } catch (e) {
                console.warn('pdfTemplateHelper: EPP img add failed:', e);
            }
        }

        // =====================================================
        //  TABLE 2: Shock Boundaries (right of EPP image)
        // =====================================================
        doc.autoTable({
            startY: headingY + 22,
            margin: { left: 60 },
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [['Shock Protection Approach Boundaries and Arc Flash Boundary', '', '']],
            body: [
                ['Arc Flash Boundary', 'Limited Approach Boundary', 'Restricted Approach Boundary'],
                [arcBoundary, limited, restricted],
                [exposed, '', '']
            ]
        });

        // Shock diagram image (if available)
        var shockImgData = (window.IMAGES_DATA && window.IMAGES_DATA['shock']) ? window.IMAGES_DATA['shock'] : null;
        if (shockImgData) {
            try {
                var sImgData = getBase64Data(shockImgData);
                var imgW = 141;
                var imgH = imgW * (585 / 1201);
                doc.addImage(sImgData, 'PNG', 60, doc.lastAutoTable.finalY + 5, imgW, imgH);

                var nextY = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + imgH + 10);
                doc.autoTable({ startY: nextY, body: [] });
            } catch (e) {
                console.warn('pdfTemplateHelper: Shock img failed:', e);
                var nextY2 = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + 10);
                doc.autoTable({ startY: nextY2, body: [] });
            }
        } else {
            var nextY3 = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + 10);
            doc.autoTable({ startY: nextY3, body: [] });
        }

        // =====================================================
        //  TABLE 3: WARNING LABEL
        // =====================================================
        var lblY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
        if (lblY > 230) {
            doc.addPage();
        }

        doc.autoTable({
            startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 20,
            theme: 'grid',
            headStyles: {
                fillColor: [237, 139, 0],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 16,
                halign: 'center'
            },
            bodyStyles: { textColor: [0, 0, 0], fontSize: 10 },
            head: [[{ content: '\u26A0 WARNING', colSpan: 4 }]],
            body: [
                [{ content: 'Arc Flash & Shock Hazard\nAppropriate PPE Required', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 14 } }],
                [{ content: 'ARC FLASH PROTECTION BOUNDARY AND REQUIRED PPE ABB Electrical Safety Calculator V1.6a Jan. 2024', colSpan: 4, styles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } }],
                ['Arc Flash boundary:', arcBoundary, 'Glove Class/ CAT:', ': ' + gloves],
                ['Required PPE:', ppe, 'Footwear:', ': ' + footwear],
                [{ content: 'SHOCK HAZARD PROTECTION BOUNDARIES', colSpan: 4, styles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } }],
                ['Shock Hazard:', shockV, 'Limited Approach:', limited],
                ['Bus/Equipment ID:', equipId, 'Restricted Approach:', restricted],
                ['Protective Device (Upstream):', device, 'Assessment Date:', dateVal],
                [{ content: 'THIS LABEL IS FOR TEMPORARY USE AND MUST BE REMOVED AFTER SERVICE IS COMPLETED', colSpan: 4, styles: { halign: 'center', fontStyle: 'italic', fontSize: 8, textColor: [120, 120, 120] } }],
                [{ content: 'IMPORTANT: This label was generated using estimated values and may be used in the absence of a formal arc flash risk assessment.', colSpan: 4, styles: { halign: 'center', fontSize: 8, textColor: [120, 120, 120] } }]
            ],
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 48 },
                1: { textColor: [0, 0, 139], fontStyle: 'bold' },
                2: { fontStyle: 'bold', cellWidth: 48 },
                3: { textColor: [0, 0, 139], fontStyle: 'bold' }
            }
        });

        console.log('pdfTemplateHelper v3: All tables drawn, generating output...');
        return doc.output('arraybuffer');
    }

    // ---- Expose on window ----
    window.pdfTemplateHelper = {
        populateTemplate: populateTemplate
    };

    console.log('pdfTemplateHelper: loaded and ready (v3)');

})();