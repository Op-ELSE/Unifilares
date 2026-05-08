// app.js

// Initialize Lucide Icons
lucide.createIcons();

// Elements
const dropzone = document.getElementById('dropzone');
const fileUpload = document.getElementById('fileUpload');
const toolsPanel = document.getElementById('toolsPanel');
const welcomeMessage = document.getElementById('welcomeMessage');
const workspace = document.getElementById('workspace');
const canvasContainer = document.getElementById('canvasContainer');
const btnDelete = document.getElementById('btnDelete');

// Initialize Fabric Canvas
const canvas = new fabric.Canvas('fabricCanvas', {
    selection: true,
    preserveObjectStacking: true,
    fireRightClick: true, // Allow right click if needed
    stopContextMenu: true,
});

// --- PDF Sharp Rendering State ---
let currentPdfPage   = null;   // PDF.js page reference for zoom re-renders
let pdfBaseScale     = 3.0;    // Render scale used for base canvas dimensions
let pdfBaseW         = 0;      // Canvas width  (fabric units) at base scale
let pdfBaseH         = 0;      // Canvas height (fabric units) at base scale
let pdfRerenderTimer = null;   // Debounce handle for zoom-triggered re-render

// --- Pan & Zoom ---
canvas.on('mouse:wheel', function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.1) zoom = 0.1;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();

    // Re-render PDF background at zoom-appropriate resolution for crispness
    clearTimeout(pdfRerenderTimer);
    if (currentPdfPage) {
        pdfRerenderTimer = setTimeout(() => {
            renderPDFBackground(currentPdfPage, canvas.getZoom());
        }, 250); // wait until user stops scrolling
    }
});

canvas.on('mouse:down', function (opt) {
    const evt = opt.e;
    // 3 in Fabric or 2 in native JS represents the right mouse button (anticlick)
    if (opt.button === 3 || evt.button === 2) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
    }
});

canvas.on('mouse:move', function (opt) {
    if (this.isDragging) {
        const e = opt.e;
        const vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    }
});

canvas.on('mouse:up', function (opt) {
    this.setViewportTransform(this.viewportTransform);
    this.isDragging = false;
    this.selection = true;
});

// Configure standard controls for ABB Look
fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: '#FF000F',
    cornerStrokeColor: '#FF000F',
    borderColor: '#FF000F',
    cornerSize: 10,
    padding: 5,
    cornerStyle: 'circle'
});

window.addEventListener('resize', () => {
    // Optionally resize fabric instance wrapper to fit container if needed, 
    // but the canvas itself stays fixed to image resolution
});

// --- File Handling (Drag & Drop + Click) ---
dropzone.addEventListener('click', () => fileUpload.click());
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-abbred', 'bg-red-50');
});
dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-abbred', 'bg-red-50');
});
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-abbred', 'bg-red-50');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});
fileUpload.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file) return;

    const fileType = file.type;

    // Unhide tools
    toolsPanel.classList.remove('opacity-30', 'pointer-events-none');
    welcomeMessage.style.display = 'none';

    if (fileType === 'application/pdf') {
        renderPDFToCanvas(file);
    } else if (fileType === 'text/html' || file.name.endsWith('.html')) {
        renderHTMLToCanvas(file);
    } else if (fileType.startsWith('image/')) {
        renderImageToCanvas(file);
    } else {
        alert('Formato no soportado. Por favor sube un PDF, HTML editable, o una imagen JPG/PNG.');
    }
}

// --- PETS Handling ---
let petsFileBuffer = null;
const btnUploadPets = document.getElementById('btnUploadPets');
const petsUpload = document.getElementById('petsUpload');
const petsStatus = document.getElementById('petsStatus');
const petsFileName = document.getElementById('petsFileName');
const btnRemovePets = document.getElementById('btnRemovePets');

btnUploadPets.addEventListener('click', () => petsUpload.click());

petsUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = function (evt) {
            petsFileBuffer = evt.target.result;
            petsFileName.textContent = file.name;
            petsStatus.classList.remove('hidden');
            btnUploadPets.classList.add('hidden');
        };
        reader.readAsArrayBuffer(file);
    } else if (file) {
        alert("El documento PETS debe ser estrictamente un archivo PDF.");
    }
});

btnRemovePets.addEventListener('click', () => {
    petsFileBuffer = null;
    petsUpload.value = '';
    petsStatus.classList.add('hidden');
    btnUploadPets.classList.remove('hidden');
});

function resetCanvasSize(width, height) {
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.clear();
}

function renderImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function (f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function (img) {
            // Set canvas size to image size
            resetCanvasSize(img.width, img.height);
            // Set background with center origin for easy rotation
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                originX: 'center',
                originY: 'center',
                left: img.width / 2,
                top: img.height / 2,
            });
        });
    };
    reader.readAsDataURL(file);
}

function renderHTMLToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function (f) {
        const text = f.target.result;

        // Use Regex to extract the JSON to bypass any strict DOM parsing dropping the data
        const match = text.match(/<script id="unifilar-data" type="application\/json">([\s\S]*?)<\/script>/);

        if (match && match[1]) {
            const json = match[1];
            canvas.loadFromJSON(json, function () {
                canvas.renderAll();
                const bg = canvas.backgroundImage;
                if (bg) {
                    resetCanvasSize(bg.width * bg.scaleX, bg.height * bg.scaleY);
                } else if (canvas.width === 0) {
                    // Fallback just in case
                    resetCanvasSize(800, 600);
                }
            });
        } else {
            alert('El archivo HTML aportado no fue generado por esta plataforma o no contiene los datos del lienzo editables.');
        }
    };
    reader.readAsText(file);
}

// PDF.js rendering to Fabric.js Canvas — with smart scale + zoom re-render
async function renderPDFToCanvas(file) {
    try {
        const fileURL = URL.createObjectURL(file);
        const pdf = await pdfjsLib.getDocument(fileURL).promise;
        const page = await pdf.getPage(1);
        currentPdfPage = page;

        // Calculate base render scale: target ~4000px on longest side
        // (min 2.5, max 6.0 to keep memory reasonable for huge plans)
        const rawVP   = page.getViewport({ scale: 1.0 });
        const maxDim  = Math.max(rawVP.width, rawVP.height);
        pdfBaseScale  = Math.min(6.0, Math.max(2.5, 4000 / maxDim));
        pdfBaseW      = Math.round(rawVP.width  * pdfBaseScale);
        pdfBaseH      = Math.round(rawVP.height * pdfBaseScale);

        // Set canvas size once (clears canvas — normal on first load)
        resetCanvasSize(pdfBaseW, pdfBaseH);

        // Render initial background at base quality (zoom = 1)
        await renderPDFBackground(page, 1.0);

    } catch (e) {
        console.error(e);
        alert('Error al leer el PDF.');
    }
}

/**
 * Renders the stored PDF page at a resolution appropriate for the current
 * zoom level and updates the Fabric background — without clearing the canvas.
 * zoomFactor: current fabric zoom value (1.0 = no zoom)
 */
async function renderPDFBackground(page, zoomFactor) {
    // Cap effective zoom between 1x and 5x to avoid excessive memory use
    const ez = Math.max(1.0, Math.min(5.0, zoomFactor));

    // Render the PDF at (baseScale × zoom) so each screen pixel maps 1:1
    const renderScale = pdfBaseScale * ez;
    const viewport    = page.getViewport({ scale: renderScale });

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width  = viewport.width;
    tmpCanvas.height = viewport.height;
    await page.render({ canvasContext: tmpCanvas.getContext('2d'), viewport }).promise;

    return new Promise(resolve => {
        // Use PNG — zero compression artifacts
        fabric.Image.fromURL(tmpCanvas.toDataURL('image/png'), function (img) {
            // Scale image DOWN by 1/ez so it still fills the same fabric canvas area
            // When the viewport is zoomed by ez, each image pixel = 1 screen pixel → crisp
            img.set({
                scaleX:  1 / ez,
                scaleY:  1 / ez,
                originX: 'center',
                originY: 'center',
                left:    pdfBaseW / 2,
                top:     pdfBaseH / 2,
            });
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
            resolve();
        });
    });
}

// --- Tools: File Adjustments (Rotate, Flip, Crop) ---
document.getElementById('btnRotateLeft').addEventListener('click', () => rotateBackground(-90));
document.getElementById('btnRotateRight').addEventListener('click', () => rotateBackground(90));
document.getElementById('btnFlipH').addEventListener('click', () => {
    let bg = canvas.backgroundImage;
    if (!bg) return;
    bg.set('flipX', !bg.flipX);
    canvas.renderAll();
});
document.getElementById('btnFlipV').addEventListener('click', () => {
    let bg = canvas.backgroundImage;
    if (!bg) return;
    bg.set('flipY', !bg.flipY);
    canvas.renderAll();
});

function rotateBackground(angleDeg) {
    let bg = canvas.backgroundImage;
    if (!bg) return;

    // Calculate new angle
    let newAngle = (bg.angle + angleDeg) % 360;

    // Swap canvas dimensions
    let oldW = canvas.width;
    let oldH = canvas.height;
    canvas.setWidth(oldH);
    canvas.setHeight(oldW);

    // Update background image position and angle
    bg.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        angle: newAngle
    });

    canvas.renderAll();
}

// Crop Logic
let cropRect = null;
const btnStartCrop = document.getElementById('btnStartCrop');
const cropControls = document.getElementById('cropControls');
const btnApplyCrop = document.getElementById('btnApplyCrop');
const btnCancelCrop = document.getElementById('btnCancelCrop');

btnStartCrop.addEventListener('click', () => {
    if (!canvas.backgroundImage) return;

    // Hide start button, show controls
    btnStartCrop.classList.add('hidden');
    cropControls.classList.remove('hidden');
    cropControls.classList.add('flex');

    // Initial crop rect
    const w = canvas.width;
    const h = canvas.height;

    cropRect = new fabric.Rect({
        left: w * 0.1,
        top: h * 0.1,
        width: w * 0.8,
        height: h * 0.8,
        fill: 'rgba(0,0,0,0.4)',
        cornerColor: '#22C55E',
        borderColor: '#22C55E',
        cornerSize: 12,
        transparentCorners: false,
        lockRotation: true,
        hasRotatingPoint: false
    });

    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
});

btnCancelCrop.addEventListener('click', () => {
    if (cropRect) {
        canvas.remove(cropRect);
        cropRect = null;
    }
    btnStartCrop.classList.remove('hidden');
    cropControls.classList.remove('flex');
    cropControls.classList.add('hidden');
});

btnApplyCrop.addEventListener('click', () => {
    if (!cropRect || !canvas.backgroundImage) return;

    // Calculate final rectangle bounds considering object scaling
    // rect coords might be scaled if user resized the rectangle via corners
    const rect = cropRect.getBoundingRect();

    // Ensure we don't go outside the canvas bounds
    const cropX = Math.max(0, rect.left);
    const cropY = Math.max(0, rect.top);
    const cropW = Math.min(canvas.width - cropX, rect.width);
    const cropH = Math.min(canvas.height - cropY, rect.height);

    // Hide all foreground objects including the cropRect, so only the background remains
    const objects = canvas.getObjects();
    const visibilityMap = new Map();
    objects.forEach(o => {
        visibilityMap.set(o, o.visible);
        o.set('visible', false);
    });

    // Deselect everything
    canvas.discardActiveObject();
    canvas.renderAll();

    // Extract the cropped region of the canvas
    const croppedDataURL = canvas.toDataURL({
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH,
        format: 'jpeg',
        quality: 1
    });

    // Restore objects visibility
    objects.forEach(o => o.set('visible', visibilityMap.get(o)));
    canvas.remove(cropRect);
    cropRect = null;

    // Load as new background
    fabric.Image.fromURL(croppedDataURL, function (img) {
        resetCanvasSize(img.width, img.height);

        img.set({
            originX: 'center',
            originY: 'center',
            left: img.width / 2,
            top: img.height / 2,
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        // Shift all drawn objects so they stay in relative position
        canvas.getObjects().forEach(o => {
            o.set({
                left: o.left - cropX,
                top: o.top - cropY
            });
            o.setCoords();
        });
        canvas.renderAll();

        // Hide controls
        btnStartCrop.classList.remove('hidden');
        cropControls.classList.remove('flex');
        cropControls.classList.add('hidden');
    });
});

// --- Tools: Add Text ---
document.getElementById('addText').addEventListener('click', () => {
    const text = new fabric.IText('Nuevo Texto', {
        left: canvas.width / 2 - 50 || 100,
        top: canvas.height / 2 - 20 || 100,
        fontFamily: '"ABBvoice", "ABB Voice", "Helvetica", Arial, sans-serif',
        fill: '#FF000F',
        fontSize: 24,
        fontWeight: 'bold',
        hasControls: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
});

// --- Tools: Add Symbols ---
// Since we don't have SVGs yet, we generate vector icons for the user inside the canvas
document.querySelectorAll('.add-symbol').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        let iconGroup;
        let defaultText = '';

        // Create vector equivalents using Fabric.js primitives
        if (type === 'aterramiento') {
            defaultText = 'Tierra';
            // Earth/Ground symbol
            const line = new fabric.Line([20, 0, 20, 30], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
            const p1 = new fabric.Line([0, 30, 40, 30], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
            const p2 = new fabric.Line([8, 38, 32, 38], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
            const p3 = new fabric.Line([16, 46, 24, 46], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });

            iconGroup = new fabric.Group([line, p1, p2, p3], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'aislamiento') {
            defaultText = 'Aislamiento';
            // 07-13-02 Disconnector (Isolator)
            const line1 = new fabric.Line([0, 20, 15, 20], { stroke: '#3b82f6', strokeWidth: 3 });
            const line2 = new fabric.Line([35, 20, 50, 20], { stroke: '#3b82f6', strokeWidth: 3 });
            const arm = new fabric.Line([15, 20, 30, 5], { stroke: '#3b82f6', strokeWidth: 3 });
            const perpline = new fabric.Line([27, 2, 33, 8], { stroke: '#3b82f6', strokeWidth: 3 });

            iconGroup = new fabric.Group([line1, line2, arm, perpline], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'aislamiento_int') {
            defaultText = 'Int-Desconec.';
            // 07-13-08 Switch-disconnector
            const line1 = new fabric.Line([0, 20, 15, 20], { stroke: '#3b82f6', strokeWidth: 3 });
            const line2 = new fabric.Line([35, 20, 50, 20], { stroke: '#3b82f6', strokeWidth: 3 });
            const pivot = new fabric.Circle({ left: 12, top: 17, radius: 3, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 3 });
            const arm = new fabric.Line([16, 17, 30, 5], { stroke: '#3b82f6', strokeWidth: 3 });
            const perpline = new fabric.Line([27, 2, 33, 8], { stroke: '#3b82f6', strokeWidth: 3 });

            iconGroup = new fabric.Group([line1, line2, pivot, arm, perpline], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'bloqueo') {
            defaultText = 'Bloqueo LOTO';
            // LOTO Lock symbol
            const lockBody = new fabric.Rect({
                left: 10, top: 20, width: 30, height: 30, rx: 3, ry: 3,
                fill: '#FF000F'
            });
            const shackle = new fabric.Path('M 15 20 L 15 10 A 10 10 0 0 1 35 10 L 35 20', {
                fill: 'transparent', stroke: '#71717a', strokeWidth: 4
            });
            const keyhole = new fabric.Circle({
                radius: 3, fill: 'white', left: 22, top: 28
            });
            const keyholeLine = new fabric.Line([25, 33, 25, 40], {
                stroke: 'white', strokeWidth: 2
            });

            iconGroup = new fabric.Group([shackle, lockBody, keyhole, keyholeLine], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'retorno') {
            defaultText = 'Retorno';
            // Símbolo de retorno (flecha en U)
            const arrowLine = new fabric.Path('M 30 10 L 20 10 A 10 10 0 0 0 20 30 L 35 30', {
                fill: 'transparent', stroke: '#10b981', strokeWidth: 3, strokeLineCap: 'round', strokeLineJoin: 'round'
            });
            const arrowHead = new fabric.Polyline([
                { x: 28, y: 23 },
                { x: 35, y: 30 },
                { x: 28, y: 37 }
            ], {
                fill: 'transparent', stroke: '#10b981', strokeWidth: 3, strokeLineCap: 'round', strokeLineJoin: 'round'
            });
            iconGroup = new fabric.Group([arrowLine, arrowHead], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'verificacion_tension') {
            defaultText = 'Verif. Tensión';
            // 07-14-04 Voltage Indicator Capacitive
            const circle = new fabric.Circle({ left: 10, top: 10, radius: 15, fill: 'transparent', stroke: '#a855f7', strokeWidth: 3 });
            const vLine1 = new fabric.Line([18, 18, 25, 32], { stroke: '#a855f7', strokeWidth: 3 });
            const vLine2 = new fabric.Line([25, 32, 32, 18], { stroke: '#a855f7', strokeWidth: 3 });
            const topLines = new fabric.Line([25, 0, 25, 10], { stroke: '#a855f7', strokeWidth: 3 });
            iconGroup = new fabric.Group([circle, vLine1, vLine2, topLines], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'interconexion_corto') {
            defaultText = 'Cortocircuito';
            // 07-13-03 Two-way disconnector
            const lineIn = new fabric.Line([25, 0, 25, 15], { stroke: '#f97316', strokeWidth: 3 });
            const pivot = new fabric.Circle({ left: 22, top: 15, radius: 3, fill: 'transparent', stroke: '#f97316', strokeWidth: 3 });
            const lineOut1 = new fabric.Line([5, 35, 15, 35], { stroke: '#f97316', strokeWidth: 3 });
            const lineOut2 = new fabric.Line([35, 35, 45, 35], { stroke: '#f97316', strokeWidth: 3 });
            const arm1 = new fabric.Line([23, 18, 10, 30], { stroke: '#f97316', strokeWidth: 3 });
            const arm2 = new fabric.Line([27, 18, 40, 30], { stroke: '#f97316', strokeWidth: 3 });
            iconGroup = new fabric.Group([lineIn, pivot, lineOut1, lineOut2, arm1, arm2], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }
        else if (type === 'aterrizaje_temporal') {
            defaultText = 'Tierra Temp.';
            // Earthing symbol with temporal indication (hook)
            const line = new fabric.Line([20, 10, 20, 30], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
            const p1 = new fabric.Line([0, 30, 40, 30], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
            const p2 = new fabric.Line([8, 38, 32, 38], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
            const p3 = new fabric.Line([16, 46, 24, 46], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
            const hook = new fabric.Path('M 15 10 A 5 5 0 0 1 25 10 L 25 5', { fill: 'transparent', stroke: '#d97706', strokeWidth: 3 });
            iconGroup = new fabric.Group([line, p1, p2, p3, hook], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
            });
        }

        if (iconGroup) {
            const groupCenter = iconGroup.getCenterPoint();
            const textObj = new fabric.Text(defaultText, {
                fontSize: 16,
                fill: '#000000',
                fontFamily: '"ABBvoice", "ABB Voice", "Helvetica", Arial, sans-serif',
                originX: 'center',
                originY: 'top',
                left: groupCenter.x,
                top: groupCenter.y + (iconGroup.height / 2) + 5,
                id: 'symbolLabel'
            });

            const realGroup = new fabric.Group([iconGroup, textObj], {
                left: canvas.width / 2 || 100,
                top: canvas.height / 2 || 100,
                isSymbolGroup: true,
                tooltipText: defaultText,
                symbolType: type,
                baseName: defaultText
            });

            canvas.add(realGroup);
            canvas.setActiveObject(realGroup);
        }
    });
});

// --- Delete Selected ---
// Manage delete button state
canvas.on('selection:created', handleSelection);
canvas.on('selection:updated', handleSelection);
canvas.on('selection:cleared', () => {
    btnDelete.disabled = true;
    propertiesPanel.classList.add('hidden');
});

function handleSelection() {
    btnDelete.disabled = false;
    updatePropertiesPanel();
}

// --- Properties Panel (Text & Symbols) ---
const propertiesPanel = document.getElementById('propertiesPanel');
const textOnlyProps = document.getElementById('textOnlyProps');
const propSymbolText = document.getElementById('propSymbolText');
const propFontSize = document.getElementById('propFontSize');
const propFillColor = document.getElementById('propFillColor');

function updatePropertiesPanel() {
    const activeObj = canvas.getActiveObject();

    if (activeObj && activeObj.type === 'i-text') {
        // Plain text properties
        propertiesPanel.classList.remove('hidden');
        propertiesPanel.classList.add('block');
        textOnlyProps.classList.remove('hidden');
        textOnlyProps.classList.add('flex');

        propSymbolText.value = activeObj.text || '';
        propFontSize.value = activeObj.fontSize;

        // Match color strictly to dropdown
        let color = activeObj.fill.toUpperCase();
        propFillColor.value = color;
        // Fallback if not primary
        if (propFillColor.selectedIndex === -1) propFillColor.selectedIndex = 0;

    } else if (activeObj && activeObj.isSymbolGroup) {
        // Symbol with tooltip text and visible text
        propertiesPanel.classList.remove('hidden');
        propertiesPanel.classList.add('block');
        textOnlyProps.classList.add('hidden');
        textOnlyProps.classList.remove('flex');

        propSymbolText.value = activeObj.tooltipText || '';
        const textObj = activeObj.getObjects().find(o => o.id === 'symbolLabel');
        if (textObj) {
            let color = textObj.fill.toUpperCase();
            propFillColor.value = color;
            if (propFillColor.selectedIndex === -1) propFillColor.selectedIndex = 0;
        } else {
            propFillColor.value = '#000000';
        }
    } else {
        propertiesPanel.classList.add('hidden');
        propertiesPanel.classList.remove('block');
    }
}

function applyProperties() {
    const activeObj = canvas.getActiveObject();

    if (activeObj && activeObj.type === 'i-text') {
        activeObj.set({
            text: propSymbolText.value,
            fontSize: parseInt(propFontSize.value, 10),
            fill: propFillColor.value
        });
        canvas.renderAll();
    } else if (activeObj && activeObj.isSymbolGroup) {
        activeObj.set('tooltipText', propSymbolText.value);
        const textObj = activeObj.getObjects().find(o => o.id === 'symbolLabel');
        if (textObj) {
            textObj.set({
                text: propSymbolText.value,
                fill: propFillColor.value
            });
            activeObj.addWithUpdate(); // Recalculate group bounding box since text changed
            canvas.renderAll();
        }
    }
}

propSymbolText.addEventListener('input', applyProperties);
propFontSize.addEventListener('input', applyProperties);
propFillColor.addEventListener('change', applyProperties);

btnDelete.addEventListener('click', () => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        canvas.discardActiveObject();
        activeObjects.forEach(function (object) {
            canvas.remove(object);
        });
    }
});

// Bind Delete key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if typing inside text
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            btnDelete.click();
        }
    }
});

// --- Export/Download ---
document.getElementById('btnExport').addEventListener('click', async () => {
    if (canvas.getObjects().length === 0 && !canvas.backgroundImage) {
        alert('No hay documento para descargar.');
        return;
    }

    const format = document.getElementById('exportFormat').value;

    // Deselect objects so selection handles aren't exported
    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 3 // Aumenta la resolución 3x para evitar pixelado al descargar
    });

    if (format === 'png') {
        const link = document.createElement('a');
        link.download = 'Diagrama_Unifilar_ABB_Editado.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    else if (format === 'pdf') {
        // Use PDFLib to merge PETS text and Canvas
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        let pdfDoc;

        if (petsFileBuffer) {
            try {
                pdfDoc = await PDFDocument.load(petsFileBuffer);
            } catch (e) {
                alert("Error al leer el PETS adjunto. Creando PDF estándar.");
                pdfDoc = await PDFDocument.create();

            }
        } else {
            pdfDoc = await PDFDocument.create();
        }

        // Convert base64 DataURL to Uint8Array for PDFLib
        const base64Data = dataURL.split(',')[1];
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const pngImage = await pdfDoc.embedPng(bytes);

        // Add a new page exactly the size of the canvas at the END
        const page = pdfDoc.addPage([canvas.width, canvas.height]);
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
        });
        // --- Build Summary Page (Table Format) ---
        const symbols = canvas.getObjects().filter(o => o.isSymbolGroup);
        if (symbols.length > 0) {
            // Group symbols by baseName
            const groupedSymbols = {};
            symbols.forEach(sym => {
                const typeName = sym.baseName || sym.tooltipText || 'Elemento';
                if (!groupedSymbols[typeName]) {
                    groupedSymbols[typeName] = [];
                }
                groupedSymbols[typeName].push(sym);
            });

            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Page dimensions (A4 portrait)
            const pageW = 595.28;
            const pageH = 841.89;
            const margin = 50;
            const tableWidth = pageW - margin * 2;

            // Column definitions — only 2 columns: N° and Descripción
            const col = {
                num:  { x: margin,       w: 35 },
                desc: { x: margin + 35,  w: tableWidth - 35 },
            };
            const rowH = 18;
            const headerH = 22;

            // Helper: draw a single horizontal line across the full table
            function drawHLine(page, y) {
                page.drawLine({
                    start: { x: margin, y },
                    end:   { x: margin + tableWidth, y },
                    thickness: 0.5,
                    color: rgb(0.6, 0.6, 0.6),
                });
            }

            // Helper: draw only the outer left/right vertical borders (merged-cell look)
            function drawOuterVLines(page, yTop, yBottom) {
                [margin, margin + tableWidth].forEach(x => {
                    page.drawLine({
                        start: { x, y: yTop },
                        end:   { x, y: yBottom },
                        thickness: 0.5,
                        color: rgb(0.6, 0.6, 0.6),
                    });
                });
            }

            // Helper: draw inner column separator (between N° and Descripción)
            function drawVLines(page, yTop, yBottom) {
                [margin, col.desc.x, margin + tableWidth].forEach(x => {
                    page.drawLine({
                        start: { x, y: yTop },
                        end:   { x, y: yBottom },
                        thickness: 0.5,
                        color: rgb(0.6, 0.6, 0.6),
                    });
                });
            }

            // Helper: draw filled rectangle (row background)
            function drawRowBg(page, y, height, r, g, b) {
                page.drawRectangle({
                    x: margin,
                    y: y,
                    width: tableWidth,
                    height: height,
                    color: rgb(r, g, b),
                });
            }

            // ---- Start page ----
            let summaryPage = pdfDoc.addPage([pageW, pageH]);
            let yOffset = pageH - 55;

            // === Page Title ===
            const titleText = 'RESUMEN DE ELEMENTOS DEL DIAGRAMA UNIFILAR';
            const titleSize = 14;
            const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleSize);
            summaryPage.drawText(titleText, {
                x: margin + (tableWidth - titleWidth) / 2,
                y: yOffset,
                size: titleSize,
                font: helveticaBold,
                color: rgb(0.8, 0, 0.05),
            });
            yOffset -= 8;
            // Red underline
            summaryPage.drawLine({
                start: { x: margin, y: yOffset },
                end:   { x: margin + tableWidth, y: yOffset },
                thickness: 2,
                color: rgb(0.8, 0, 0.05),
            });
            yOffset -= 35;  // more space between title and table

            // === Global table header ===
            const drawTableHeader = (page, y) => {
                // Header background (ABB red)
                page.drawRectangle({
                    x: margin,
                    y: y,
                    width: tableWidth,
                    height: headerH,
                    color: rgb(0.85, 0, 0.06),
                });
                // Header texts (white) — 2 columns only
                page.drawText('N°', {
                    x: col.num.x + 4, y: y + 6,
                    size: 10, font: helveticaBold, color: rgb(1, 1, 1),
                });
                page.drawText('Descripción / Etiqueta', {
                    x: col.desc.x + 4, y: y + 6,
                    size: 10, font: helveticaBold, color: rgb(1, 1, 1),
                });
                // Single vertical separator between N° and Descripción
                page.drawLine({
                    start: { x: col.desc.x, y: y },
                    end:   { x: col.desc.x, y: y + headerH },
                    thickness: 0.5,
                    color: rgb(1, 1, 1),
                });
                return y + headerH; // top of header
            };

            // Global row counter
            let globalRow = 0;

            Object.keys(groupedSymbols).forEach(groupName => {
                const group = groupedSymbols[groupName];

                // ---- Group sub-header ----
                const subHeaderH = 16;
                if (yOffset - subHeaderH < 50) {
                    summaryPage = pdfDoc.addPage([pageW, pageH]);
                    yOffset = pageH - 55;
                    globalRow = 0;
                }

                // Sub-header background (light red/pink)
                summaryPage.drawRectangle({
                    x: margin,
                    y: yOffset - subHeaderH,
                    width: tableWidth,
                    height: subHeaderH,
                    color: rgb(0.98, 0.91, 0.91),
                });
                // Sub-header text — only group name, centered, no totals
                const subText = `${groupName}`;
                const subTextWidth = helveticaBold.widthOfTextAtSize(subText, 9);
                summaryPage.drawText(subText, {
                    x: margin + (tableWidth - subTextWidth) / 2,
                    y: yOffset - subHeaderH + 4,
                    size: 9,
                    font: helveticaBold,
                    color: rgb(0.6, 0, 0),
                });
                // Border: top + bottom thin lines + outer verticals (same style as all other lines)
                drawHLine(summaryPage, yOffset);
                drawHLine(summaryPage, yOffset - subHeaderH);
                drawOuterVLines(summaryPage, yOffset, yOffset - subHeaderH);
                yOffset -= subHeaderH;

                // ---- Data rows ----
                group.forEach((sym, index) => {
                    if (yOffset - rowH < 50) {
                        summaryPage = pdfDoc.addPage([pageW, pageH]);
                        yOffset = pageH - 55;
                        globalRow = 0;
                    }

                    // White background for all rows (no alternating shade)
                    drawRowBg(summaryPage, yOffset - rowH, rowH, 1, 1, 1);

                    // Cell texts — 2 columns only
                    summaryPage.drawText(`${index + 1}`, {
                        x: col.num.x + 4, y: yOffset - rowH + 5,
                        size: 9, font: helveticaFont, color: rgb(0.15, 0.15, 0.15),
                    });
                    summaryPage.drawText(`${sym.tooltipText || groupName}`, {
                        x: col.desc.x + 4, y: yOffset - rowH + 5,
                        size: 9, font: helveticaFont, color: rgb(0.15, 0.15, 0.15),
                    });

                    // Row borders (includes inner column separator)
                    drawHLine(summaryPage, yOffset);
                    drawHLine(summaryPage, yOffset - rowH);
                    drawVLines(summaryPage, yOffset, yOffset - rowH);

                    yOffset -= rowH;
                    globalRow++;
                });

                yOffset -= 10; // extra gap between groups
            });

            // (Totals footer removed per user request)
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Unifilar_Consolidado_ABB.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

});

// --- Tooltips for Canvas Objects ---
const canvasTooltip = document.createElement('div');
canvasTooltip.className = 'absolute bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 transition-opacity z-50';
document.body.appendChild(canvasTooltip);

canvas.on('mouse:over', function (e) {
    if (e.target && e.target.tooltipText) {
        canvasTooltip.innerHTML = e.target.tooltipText;
        canvasTooltip.style.opacity = '1';
    }
});

canvas.on('mouse:out', function (e) {
    canvasTooltip.style.opacity = '0';
});

canvas.on('mouse:move', function (e) {
    if (canvasTooltip.style.opacity === '1') {
        canvasTooltip.style.left = (e.e.clientX + 15) + 'px';
        canvasTooltip.style.top = (e.e.clientY + 15) + 'px';
    }
});

// --- Tabs Logic ---
const tabPrincipales = document.getElementById('tabPrincipales');
const tabOtros = document.getElementById('tabOtros');
const gridPrincipales = document.getElementById('gridPrincipales');
const gridOtros = document.getElementById('gridOtros');

if (tabPrincipales && tabOtros) {
    tabPrincipales.addEventListener('click', () => {
        gridPrincipales.classList.remove('hidden');
        gridOtros.classList.add('hidden');
        tabPrincipales.classList.add('border-abbred', 'text-abbred');
        tabPrincipales.classList.remove('border-transparent', 'text-gray-500');
        tabOtros.classList.remove('border-abbred', 'text-abbred');
        tabOtros.classList.add('border-transparent', 'text-gray-500');
    });

    tabOtros.addEventListener('click', () => {
        gridOtros.classList.remove('hidden');
        gridPrincipales.classList.add('hidden');
        tabOtros.classList.add('border-abbred', 'text-abbred');
        tabOtros.classList.remove('border-transparent', 'text-gray-500');
        tabPrincipales.classList.remove('border-abbred', 'text-abbred');
        tabPrincipales.classList.add('border-transparent', 'text-gray-500');
    });
}
