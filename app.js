// app.js

// Initialize Lucide Icons
function initIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}
initIcons();

// Elements
const dropzone = document.getElementById('dropzone');
const fileUpload = document.getElementById('fileUpload');
const btnUploadPets = document.getElementById('btnUploadPets');
const petsUpload = document.getElementById('petsUpload');
const toolsPanel = document.getElementById('toolsPanel');
const workspace = document.getElementById('workspace');
const canvasContainer = document.getElementById('canvasContainer');
const btnDelete = document.getElementById('btnDelete');

// --- Global State ---
let petsFileBuffer = null;
let ppePdfFileBuffer = null;

if (fileUpload) {
    // Click is handled by native onclick in index.html to prevent blocking
    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });
}

if (btnUploadPets && petsUpload) {
    petsUpload.addEventListener('change', async (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            petsFileBuffer = await file.arrayBuffer();
            const status = document.getElementById('petsStatus');
            const name = document.getElementById('petsFileName');
            if (status && name) {
                status.classList.remove('hidden');
                name.textContent = file.name;
            }
        }
    });
}

const btnRemovePets = document.getElementById('btnRemovePets');
if (btnRemovePets) {
    btnRemovePets.addEventListener('click', () => {
        petsFileBuffer = null;
        if(petsUpload) petsUpload.value = '';
        const status = document.getElementById('petsStatus');
        if (status) status.classList.add('hidden');
    });
}

const ppePdfUpload = document.getElementById('ppePdfUpload');
if (ppePdfUpload) {
    ppePdfUpload.addEventListener('change', async (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            ppePdfFileBuffer = await file.arrayBuffer();
            const status = document.getElementById('ppePdfStatus');
            const name = document.getElementById('ppePdfFileName');
            if (status && name) {
                status.classList.remove('hidden');
                name.textContent = file.name;
            }
        }
    });
}

const btnRemovePpePdf = document.getElementById('btnRemovePpePdf');
if (btnRemovePpePdf) {
    btnRemovePpePdf.addEventListener('click', () => {
        ppePdfFileBuffer = null;
        if(ppePdfUpload) ppePdfUpload.value = '';
        const status = document.getElementById('ppePdfStatus');
        if (status) status.classList.add('hidden');
    });
}

// Initialize Fabric Canvas
const canvas = new fabric.Canvas('fabricCanvas', {
    selection: true,
    preserveObjectStacking: true,
    fireRightClick: true,
    stopContextMenu: true,
    backgroundColor: '#ffffff', // White for better contrast with technical drawings
    enableRetinaScaling: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
});

// Extra CSS sharpness for browsers
canvas.getElement().style.imageRendering = 'pixelated';
canvas.getElement().style.imageRendering = 'crisp-edges';
canvas.getElement().style.imageRendering = '-webkit-optimize-contrast';

function resizeCanvas() {
    canvas.setDimensions({
        width: workspace.clientWidth,
        height: workspace.clientHeight
    });
    canvas.renderAll();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- PDF Sharp Rendering State ---
let currentPdfPage   = null;   // PDF.js page reference for zoom re-renders
let pdfBaseScale     = 4.0;    // Render scale used for base canvas dimensions
let pdfBaseW         = 0;      // Canvas width  (fabric units) at base scale
let pdfBaseH         = 0;      // Canvas height (fabric units) at base scale
let pdfRerenderTimer = null;   // Debounce handle for zoom-triggered re-render
let pdfCropCoords    = null;   // Stores {x, y, w, h} in PDF points for lossless crop

// --- Pan & Zoom ---
canvas.on('mouse:wheel', function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    
    // Restrict zoom: allow seeing the full document (min 20% of fit)
    const fitScale = Math.min(canvas.width / pdfBaseW, canvas.height / pdfBaseH);
    const minZoom = fitScale * 0.2; 
    if (zoom > 50) zoom = 50;
    if (zoom < minZoom) zoom = minZoom;
    
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    
    // Strict Constraint: Keep document within bounds (Google Maps style)
    const vpt = canvas.viewportTransform;
    // Use current background bounds if available, otherwise base dimensions
    const bg = canvas.backgroundImage;
    const curW = (bg ? bg.width * bg.scaleX : pdfBaseW) || canvas.width;
    const curH = (bg ? bg.height * bg.scaleY : pdfBaseH) || canvas.height;
    const offX = bg ? bg.left : 0;
    const offY = bg ? bg.top : 0;

    const docW = curW * zoom;
    const docH = curH * zoom;
    
    // Horizontal constraints
    if (docW <= canvas.width) {
        vpt[4] = (canvas.width - docW) / 2 + offX * zoom;
    } else {
        if (vpt[4] > offX * zoom) vpt[4] = offX * zoom;
        if (vpt[4] < canvas.width - docW + offX * zoom) vpt[4] = canvas.width - docW + offX * zoom;
    }
    
    // Vertical constraints
    if (docH <= canvas.height) {
        vpt[5] = (canvas.height - docH) / 2 + offY * zoom;
    } else {
        if (vpt[5] > offY * zoom) vpt[5] = offY * zoom;
        if (vpt[5] < canvas.height - docH + offY * zoom) vpt[5] = canvas.height - docH + offY * zoom;
    }

    opt.e.preventDefault();
    opt.e.stopPropagation();

    // Re-render PDF background at zoom-appropriate resolution for crispness
    clearTimeout(pdfRerenderTimer);
    // Only re-render if we haven't cropped (which turns currentPdfPage into null/handled static)
    if (currentPdfPage) {
        pdfRerenderTimer = setTimeout(() => {
            renderPDFBackground(currentPdfPage, canvas.getZoom());
        }, 50); // Near-instant clarity
    }
});

function zoomToFit() {
    if (!currentPdfPage && !canvas.backgroundImage) return;
    
    const padding = 60;
    const wsW = canvas.width - padding;
    const wsH = canvas.height - padding;
    
    const docW = pdfBaseW || (canvas.backgroundImage ? canvas.backgroundImage.width : canvas.width);
    const docH = pdfBaseH || (canvas.backgroundImage ? canvas.backgroundImage.height : canvas.height);

    const scaleX = wsW / docW;
    const scaleY = wsH / docH;
    const scale = Math.min(scaleX, scaleY, 1.0);
    
    canvas.setZoom(scale);
    
    // Center the document area
    const vpt = canvas.viewportTransform;
    vpt[4] = (canvas.width - docW * scale) / 2;
    vpt[5] = (canvas.height - docH * scale) / 2;
    canvas.requestRenderAll();
}

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

document.getElementById('btnZoomToFit').addEventListener('click', zoomToFit);

// Handle Panning (Right Click Drag)
    canvas.on('mouse:move', function (opt) {
        if (this.isDragging) {
            const e = opt.e;
            const vpt = this.viewportTransform;
            vpt[4] += e.clientX - this.lastPosX;
            vpt[5] += e.clientY - this.lastPosY;
            
            // Apply the same strict constraints during panning
            const zoom = this.getZoom();
            const bg = canvas.backgroundImage;
            const curW = (bg ? bg.width * bg.scaleX : pdfBaseW) || canvas.width;
            const curH = (bg ? bg.height * bg.scaleY : pdfBaseH) || canvas.height;
            const offX = bg ? bg.left : 0;
            const offY = bg ? bg.top : 0;

            const docW = curW * zoom;
            const docH = curH * zoom;

            if (docW <= this.width) {
                vpt[4] = (this.width - docW) / 2 + offX * zoom;
            } else {
                if (vpt[4] > offX * zoom) vpt[4] = offX * zoom;
                if (vpt[4] < this.width - docW + offX * zoom) vpt[4] = this.width - docW + offX * zoom;
            }

            if (docH <= this.height) {
                vpt[5] = (this.height - docH) / 2 + offY * zoom;
            } else {
                if (vpt[5] > offY * zoom) vpt[5] = offY * zoom;
                if (vpt[5] < this.height - docH + offY * zoom) vpt[5] = this.height - docH + offY * zoom;
            }

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



function handleFile(file) {
    if (!file) return;

    const fileType = file.type;
    pdfCropCoords = null; // Clear any previous crop coordinates for the new file

    // Unhide tools
    if (toolsPanel) toolsPanel.classList.remove('opacity-30', 'pointer-events-none');

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
const petsStatus = document.getElementById('petsStatus');
const petsFileName = document.getElementById('petsFileName');


function resetCanvasSize(width, height) {
    // In the new model, we don't resize the canvas element to the document size.
    // We just clear objects and reset the background state.
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    pdfBaseW = width;
    pdfBaseH = height;
}

function renderImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function (f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function (img) {
            resetCanvasSize(img.width, img.height);
            canvas.setBackgroundImage(img, () => {
                zoomToFit();
                canvas.renderAll();
            }, {
                originX: 'left',
                originY: 'top',
                left: 0,
                top: 0,
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
                zoomToFit();
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

        // Maximize quality: target ~16000px (stable browser limit)
        const rawVP   = page.getViewport({ scale: 1.0 });
        const maxDim  = Math.max(rawVP.width, rawVP.height);
        pdfBaseScale  = Math.min(20.0, Math.max(4.0, 16000 / maxDim));
        
        let targetW = Math.round(rawVP.width  * pdfBaseScale);
        let targetH = Math.round(rawVP.height * pdfBaseScale);

        if (targetW > 16000 || targetH > 16000) {
            const ratio = 16000 / Math.max(targetW, targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
            pdfBaseScale *= ratio;
        }

        // Store the original buffer for lossless overlay export later
        const arrayBuffer = await file.arrayBuffer();
        window.originalUnifilarBuffer = arrayBuffer;

        pdfBaseW = targetW;
        pdfBaseH = targetH;

        // Set canvas size once (clears canvas — normal on first load)
        resetCanvasSize(pdfBaseW, pdfBaseH);

        // Render initial background at base quality (zoom = 1)
        await renderPDFBackground(page, 1.0);
        
        zoomToFit();

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
    // Cap effective zoom and force a minimum high-DPI density
    const ez = Math.max(1.0, Math.min(10.0, zoomFactor));
    const dpr = Math.max(2.0, window.devicePixelRatio || 1); 
    let renderScale = pdfBaseScale * ez * dpr;
    
    const rawVP = page.getViewport({ scale: 1.0 });
    const maxRenderDim = 16384; // Safe browser limit for high-res canvases
    if (rawVP.width * renderScale > maxRenderDim || rawVP.height * renderScale > maxRenderDim) {
        renderScale = maxRenderDim / Math.max(rawVP.width, rawVP.height);
    }
    
    const viewport = page.getViewport({ scale: renderScale });

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width  = viewport.width;
    tmpCanvas.height = viewport.height;
    const ctx = tmpCanvas.getContext('2d');
    
    // For technical drawings, we want SHARP edges, not blurry smoothing
    ctx.imageSmoothingEnabled = false;
    
    await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;

    const img = new fabric.Image(tmpCanvas);
    img.set({
        scaleX:  pdfBaseW / tmpCanvas.width,
        scaleY:  pdfBaseH / tmpCanvas.height,
        originX: 'left',
        originY: 'top',
        left:    0,
        top:     0,
        imageSmoothing: false // Keep text sharp, not blurry
    });

    canvas.setBackgroundImage(img, () => {
        canvas.renderAll();
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

    // Calculate final rectangle bounds considering object scaling AND canvas zoom
    // We need the coordinates in the "natural" canvas space (unzoomed)
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    
    // Convert screen coordinates of the cropRect to raw canvas coordinates
    const rect = cropRect.getBoundingRect();
    const cropX = (rect.left - vpt[4]) / zoom;
    const cropY = (rect.top - vpt[5]) / zoom;
    const cropW = rect.width / zoom;
    const cropH = rect.height / zoom;

    // Hide all foreground objects including the cropRect, so only the background remains
    const objects = canvas.getObjects();
    const visibilityMap = new Map();
    objects.forEach(o => {
        visibilityMap.set(o, o.visible);
        o.set('visible', false);
    });

    // Deselect everything
    canvas.discardActiveObject();
    
    // Temporarily reset zoom to capture full resolution of the background
    const oldZoom = canvas.getZoom();
    const oldVpt = [...canvas.viewportTransform];
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // High-Res Crop: Capture the cropped region at ultra-high resolution (target 10000px)
    const cropMaxDim = Math.max(cropW, cropH);
    const cropMultiplier = Math.max(1.0, 10000 / cropMaxDim);

    const croppedDataURL = canvas.toDataURL({
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH,
        format: 'png',
        multiplier: cropMultiplier
    });

    // Restore viewport for the rest of the logic
    canvas.setViewportTransform(oldVpt);

    // Restore objects visibility
    objects.forEach(o => o.set('visible', visibilityMap.get(o)));
    canvas.remove(cropRect);
    cropRect = null;

    // Load as new background
    fabric.Image.fromURL(croppedDataURL, function (img) {
        resetCanvasSize(img.width, img.height);
        
        // CRITICAL: Update base dimensions so zoom/export know the NEW size
        pdfBaseW = img.width;
        pdfBaseH = img.height;
        currentPdfPage = null; // Stop PDF auto-rerender since we are now in "Crop Mode"

        img.set({
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        // Store crop coordinates in PDF space for lossless export
        if (currentPdfPage) {
            const viewport = currentPdfPage.getViewport({ scale: 1.0 });
            // Convert canvas crop coordinates (based on pdfBaseScale) back to PDF points
            pdfCropCoords = {
                x: cropX / pdfBaseScale,
                y: (pdfBaseH - cropY - cropH) / pdfBaseScale, // PDF coordinates are bottom-up
                w: cropW / pdfBaseScale,
                h: cropH / pdfBaseScale
            };
        }

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
// Helper to create symbols at specific coordinates
function createSymbolAt(type, left, top) {
    let iconGroup;
    let defaultText = '';

    // Create vector equivalents using Fabric.js primitives
    if (type === 'aterramiento') {
        defaultText = 'Tierra';
        const line = new fabric.Line([20, 0, 20, 30], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
        const p1 = new fabric.Line([0, 30, 40, 30], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
        const p2 = new fabric.Line([8, 38, 32, 38], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
        const p3 = new fabric.Line([16, 46, 24, 46], { fill: '#b45309', stroke: '#b45309', strokeWidth: 3 });
        iconGroup = new fabric.Group([line, p1, p2, p3], { left, top });
    }
    else if (type === 'aislamiento') {
        defaultText = 'Aislamiento';
        const line1 = new fabric.Line([0, 20, 15, 20], { stroke: '#3b82f6', strokeWidth: 3 });
        const line2 = new fabric.Line([35, 20, 50, 20], { stroke: '#3b82f6', strokeWidth: 3 });
        const arm = new fabric.Line([15, 20, 30, 5], { stroke: '#3b82f6', strokeWidth: 3 });
        const perpline = new fabric.Line([27, 2, 33, 8], { stroke: '#3b82f6', strokeWidth: 3 });
        iconGroup = new fabric.Group([line1, line2, arm, perpline], { left, top });
    }
    else if (type === 'aislamiento_int') {
        defaultText = 'Int-Desconec.';
        const line1 = new fabric.Line([0, 20, 15, 20], { stroke: '#3b82f6', strokeWidth: 3 });
        const line2 = new fabric.Line([35, 20, 50, 20], { stroke: '#3b82f6', strokeWidth: 3 });
        const pivot = new fabric.Circle({ left: 12, top: 17, radius: 3, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 3 });
        const arm = new fabric.Line([16, 17, 30, 5], { stroke: '#3b82f6', strokeWidth: 3 });
        const perpline = new fabric.Line([27, 2, 33, 8], { stroke: '#3b82f6', strokeWidth: 3 });
        iconGroup = new fabric.Group([line1, line2, pivot, arm, perpline], { left, top });
    }
    else if (type === 'bloqueo') {
        defaultText = 'Bloqueo LOTO';
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
        iconGroup = new fabric.Group([shackle, lockBody, keyhole, keyholeLine], { left, top });
    }
    else if (type === 'retorno') {
        defaultText = 'Retorno';
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
        iconGroup = new fabric.Group([arrowLine, arrowHead], { left, top });
    }
    else if (type === 'verificacion_tension') {
        defaultText = 'Verif. Tensión';
        const circle = new fabric.Circle({ left: 10, top: 10, radius: 15, fill: 'transparent', stroke: '#a855f7', strokeWidth: 3 });
        const vLine1 = new fabric.Line([18, 18, 25, 32], { stroke: '#a855f7', strokeWidth: 3 });
        const vLine2 = new fabric.Line([25, 32, 32, 18], { stroke: '#a855f7', strokeWidth: 3 });
        const topLines = new fabric.Line([25, 0, 25, 10], { stroke: '#a855f7', strokeWidth: 3 });
        iconGroup = new fabric.Group([circle, vLine1, vLine2, topLines], { left, top });
    }
    else if (type === 'interconexion_corto') {
        defaultText = 'Cortocircuito';
        const lineIn = new fabric.Line([25, 0, 25, 15], { stroke: '#f97316', strokeWidth: 3 });
        const pivot = new fabric.Circle({ left: 22, top: 15, radius: 3, fill: 'transparent', stroke: '#f97316', strokeWidth: 3 });
        const lineOut1 = new fabric.Line([5, 35, 15, 35], { stroke: '#f97316', strokeWidth: 3 });
        const lineOut2 = new fabric.Line([35, 35, 45, 35], { stroke: '#f97316', strokeWidth: 3 });
        const arm1 = new fabric.Line([23, 18, 10, 30], { stroke: '#f97316', strokeWidth: 3 });
        const arm2 = new fabric.Line([27, 18, 40, 30], { stroke: '#f97316', strokeWidth: 3 });
        iconGroup = new fabric.Group([lineIn, pivot, lineOut1, lineOut2, arm1, arm2], { left, top });
    }
    else if (type === 'aterrizaje_temporal') {
        defaultText = 'Tierra Temp.';
        const line = new fabric.Line([20, 10, 20, 30], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
        const p1 = new fabric.Line([0, 30, 40, 30], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
        const p2 = new fabric.Line([8, 38, 32, 38], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
        const p3 = new fabric.Line([16, 46, 24, 46], { fill: '#d97706', stroke: '#d97706', strokeWidth: 3 });
        const hook = new fabric.Path('M 15 10 A 5 5 0 0 1 25 10 L 25 5', { fill: 'transparent', stroke: '#d97706', strokeWidth: 3 });
        iconGroup = new fabric.Group([line, p1, p2, p3, hook], { left, top });
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
            left,
            top,
            isSymbolGroup: true,
            tooltipText: defaultText,
            symbolType: type,
            baseName: defaultText
        });

        canvas.add(realGroup);
        canvas.setActiveObject(realGroup);
    }
}

// Drag & Drop Implementation
document.querySelectorAll('.add-symbol').forEach(btn => {
    btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('symbolType', btn.getAttribute('data-type'));
    });

    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        createSymbolAt(type, canvas.width / 2, canvas.height / 2);
    });
});

workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const symbolType = e.dataTransfer.getData('symbolType');
    if (!symbolType) return;

    // Convert mouse coordinates to Fabric coordinates
    const pointer = canvas.getPointer(e);
    createSymbolAt(symbolType, pointer.x, pointer.y);
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
const propSymbolDesc = document.getElementById('propSymbolDesc');
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
        propSymbolDesc.value = activeObj.itemDescription || '';
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
        propSymbolDesc.value = activeObj.itemDescription || '';
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
            tooltipText: propSymbolText.value,
            itemDescription: propSymbolDesc.value,
            fontSize: parseInt(propFontSize.value, 10),
            fill: propFillColor.value
        });
        canvas.renderAll();
    } else if (activeObj && activeObj.isSymbolGroup) {
        activeObj.set('tooltipText', propSymbolText.value);
        activeObj.set('itemDescription', propSymbolDesc.value);
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
propSymbolDesc.addEventListener('input', applyProperties);
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
    const btn = document.getElementById('btnExport');
    const originalContent = btn.innerHTML;

    if (canvas.getObjects().length === 0 && !canvas.backgroundImage) {
        alert('No hay documento para descargar.');
        return;
    }
    try {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Procesando alta resolución...`;
        lucide.createIcons();

        const format = document.getElementById('exportFormat').value;

        // Deselect so handles don't appear
        canvas.discardActiveObject();
        canvas.renderAll();

        // Document natural dimensions (independent of current zoom/pan)
        const bg   = canvas.backgroundImage;
        const docW = bg ? bg.width  * bg.scaleX : (pdfBaseW || canvas.width);
        const docH = bg ? bg.height * bg.scaleY : (pdfBaseH || canvas.height);

        // Target 8000 px on longest side; cap at 16384 px (browser limit)
        let multiplier = Math.max(1.0, 8000 / Math.max(docW, docH));
        if (docW * multiplier > 16384 || docH * multiplier > 16384) {
            multiplier = 16384 / Math.max(docW, docH);
        }

        // ── Save current viewport state ──────────────────────────────────────
        const savedVpt    = [...canvas.viewportTransform];
        const savedWidth  = canvas.width;
        const savedHeight = canvas.height;

        // ── Reset to document space ──────────────────────────────────────────
        // With identity viewport: Fabric object coords = document coords.
        // toDataURL's left/top/width/height crops the exact document region
        // regardless of what zoom the user had when placing icons.
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        if (bg) bg.set('opacity', 1);
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();

        // Capture EVERYTHING (background + icons) in one single call
        const compositeDataURL = canvas.toDataURL({
            format:              'png',
            left:                0,
            top:                 0,
            width:               docW,
            height:              docH,
            multiplier:          multiplier,
            enableRetinaScaling: false
        });

        // ── Restore view ─────────────────────────────────────────────────────
        canvas.setDimensions({ width: savedWidth, height: savedHeight });
        canvas.setViewportTransform(savedVpt);
        canvas.renderAll();

        if (format === 'png') {
            const link = document.createElement('a');
            link.download = 'Diagrama_Unifilar_ABB_Alta_Res.png';
            link.href = compositeDataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } else {
            // Convert dataURL → Uint8Array for pdf-lib
            const b64 = compositeDataURL.split(',')[1];
            const bin = atob(b64);
            const buf = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            await handlePDFExport(buf, docW, docH, false);
        }

        btn.disabled = false;
        btn.innerHTML = originalContent;
        lucide.createIcons();

    } catch (err) {
        console.error(err);
        alert('Error en la exportación: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalContent;
        lucide.createIcons();
    }
});

/**
 * Handles the PDF generation using the provided high-res dataURL.
 * If useOverlay is true, it embeds the image on top of the original PDF page.
 */
async function handlePDFExport(imageBuffer, docW, docH, useOverlay = false) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    // 1. PETS pages first
    if (petsFileBuffer) {
        try {
            const petsDoc  = await PDFDocument.load(petsFileBuffer);
            const petsPages = await pdfDoc.copyPages(petsDoc, petsDoc.getPageIndices());
            petsPages.forEach(p => pdfDoc.addPage(p));
        } catch (e) { console.error('Error consolidando PETS:', e); }
    }

    // 2. PPE annex pages
    if (ppePdfFileBuffer) {
        try {
            const ppeDoc   = await PDFDocument.load(ppePdfFileBuffer);
            const ppePages = await pdfDoc.copyPages(ppeDoc, ppeDoc.getPageIndices());
            ppePages.forEach(p => pdfDoc.addPage(p));
        } catch (e) { console.error('Error consolidando PPE PDF:', e); }
    }

    // 3. Unifilar page — preserve the composite's aspect ratio so nothing
    //    gets stretched. If the user cropped, docW/docH reflects the crop.
    const aspectRatio = docW / docH;

    // Default: scale to a reasonable PDF size (A3 landscape ~ 1190 x 842 pts)
    let pageW, pageH;

    const unifilarBuffer = window.originalUnifilarBuffer;
    if (unifilarBuffer) {
        try {
            const srcDoc  = await PDFDocument.load(unifilarBuffer);
            const srcPage = srcDoc.getPage(0);
            const sz      = srcPage.getSize();
            // Use the longest original dimension, but apply the composite's
            // aspect ratio so proportions are never distorted.
            const maxDim = Math.max(sz.width, sz.height);
            if (aspectRatio >= 1) {          // landscape or square
                pageW = maxDim;
                pageH = maxDim / aspectRatio;
            } else {                         // portrait
                pageH = maxDim;
                pageW = maxDim * aspectRatio;
            }
        } catch (e) {
            console.error('Could not read original PDF size:', e);
            pageW = docW;
            pageH = docH;
        }
    } else {
        pageW = docW;
        pageH = docH;
    }

    const mainPage = pdfDoc.addPage([pageW, pageH]);

    // Embed composite (background + icons already merged) and fill the page
    const pngImage = await pdfDoc.embedPng(imageBuffer);
    mainPage.drawImage(pngImage, {
        x:      0,
        y:      0,
        width:  pageW,
        height: pageH,
    });

    await injectSummaryTable(pdfDoc);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'Unifilar_Consolidado_ABB_HQ.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function injectSummaryTable(pdfDoc) {
    const { StandardFonts, rgb } = PDFLib;
    
    // Robust detection: capture everything with a label or tooltip
    const symbols = canvas.getObjects().filter(o => 
        o.isSymbolGroup === true || (o.tooltipText && o.tooltipText.length > 0)
    );

    if (symbols.length === 0) return;

    // Group symbols by their base category (e.g., all "Bloqueo LOTO" together)
    const groupedSymbols = {};
    symbols.forEach(sym => {
        // For symbols, use baseName. For plain text, use a generic "Textos" category.
        const groupKey = sym.baseName || (sym.type === 'i-text' ? 'Anotaciones y Texto' : 'Otros');
        if (!groupedSymbols[groupKey]) {
            groupedSymbols[groupKey] = [];
        }
        groupedSymbols[groupKey].push(sym);
    });

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageW = 595.28;
    const pageH = 841.89;
    const margin = 50;
    const tableWidth = pageW - margin * 2;

    const col = {
        num:  { x: margin,       w: 30 },
        name: { x: margin + 30,  w: 150 },
        desc: { x: margin + 180, w: tableWidth - 180 },
    };
    const rowH = 18;
    const headerH = 22;

    function drawHLine(page, y) {
        page.drawLine({
            start: { x: margin, y },
            end:   { x: margin + tableWidth, y },
            thickness: 0.5,
            color: rgb(0.6, 0.6, 0.6),
        });
    }

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

    function drawVLines(page, yTop, yBottom) {
        [margin, col.name.x, col.desc.x, margin + tableWidth].forEach(x => {
            page.drawLine({
                start: { x, y: yTop },
                end:   { x, y: yBottom },
                thickness: 0.5,
                color: rgb(0.6, 0.6, 0.6),
            });
        });
    }

    function drawRowBg(page, y, height, r, g, b) {
        page.drawRectangle({
            x: margin, y: y, width: tableWidth, height: height, color: rgb(r, g, b),
        });
    }

    let summaryPage = pdfDoc.addPage([pageW, pageH]);
    let yOffset = pageH - 55;

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
    summaryPage.drawLine({
        start: { x: margin, y: yOffset },
        end:   { x: margin + tableWidth, y: yOffset },
        thickness: 2,
        color: rgb(0.8, 0, 0.05),
    });
    yOffset -= 35;

    const drawTableHeader = (page, y) => {
        page.drawRectangle({
            x: margin, y: y, width: tableWidth, height: headerH, color: rgb(0.85, 0, 0.06),
        });
        page.drawText('N°', { x: col.num.x + 4, y: y + 6, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('Etiqueta', { x: col.name.x + 4, y: y + 6, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('Descripción / Notas', { x: col.desc.x + 4, y: y + 6, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });
        
        [col.name.x, col.desc.x].forEach(x => {
            page.drawLine({
                start: { x, y: y },
                end:   { x, y: y + headerH },
                thickness: 0.5,
                color: rgb(1, 1, 1),
            });
        });
        return y + headerH;
    };

    drawTableHeader(summaryPage, yOffset);
    yOffset -= 5;

    Object.keys(groupedSymbols).forEach(groupName => {
        const group = groupedSymbols[groupName];
        const subHeaderH = 16;
        if (yOffset - subHeaderH < 50) {
            summaryPage = pdfDoc.addPage([pageW, pageH]);
            yOffset = pageH - 55;
            drawTableHeader(summaryPage, yOffset);
            yOffset -= 5;
        }

        summaryPage.drawRectangle({
            x: margin, y: yOffset - subHeaderH, width: tableWidth, height: subHeaderH, color: rgb(0.98, 0.91, 0.91),
        });
        const subText = `${groupName}`;
        const subTextWidth = helveticaBold.widthOfTextAtSize(subText, 9);
        summaryPage.drawText(subText, {
            x: margin + (tableWidth - subTextWidth) / 2,
            y: yOffset - subHeaderH + 4,
            size: 9, font: helveticaBold, color: rgb(0.6, 0, 0),
        });
        drawHLine(summaryPage, yOffset);
        drawHLine(summaryPage, yOffset - subHeaderH);
        drawOuterVLines(summaryPage, yOffset, yOffset - subHeaderH);
        yOffset -= subHeaderH;

        group.forEach((sym, index) => {
            if (yOffset - rowH < 50) {
                summaryPage = pdfDoc.addPage([pageW, pageH]);
                yOffset = pageH - 55;
                drawTableHeader(summaryPage, yOffset);
                yOffset -= 5;
            }

            drawRowBg(summaryPage, yOffset - rowH, rowH, 1, 1, 1);
            summaryPage.drawText(`${index + 1}`, { x: col.num.x + 4, y: yOffset - rowH + 5, size: 9, font: helveticaFont, color: rgb(0.15, 0.15, 0.15) });
            summaryPage.drawText(`${sym.tooltipText || sym.text || groupName}`, { x: col.name.x + 4, y: yOffset - rowH + 5, size: 9, font: helveticaFont, color: rgb(0.15, 0.15, 0.15) });
            
            const descText = sym.itemDescription || '-';
            let finalDesc = descText;
            const maxChars = Math.floor(col.desc.w / 5.5); // Very rough estimate for Helvetica size 9
            if (finalDesc.length > maxChars) {
                finalDesc = finalDesc.substring(0, maxChars - 3) + '...';
            }
            summaryPage.drawText(finalDesc, { x: col.desc.x + 4, y: yOffset - rowH + 5, size: 9, font: helveticaFont, color: rgb(0.15, 0.15, 0.15) });
            drawHLine(summaryPage, yOffset);
            drawHLine(summaryPage, yOffset - rowH);
            drawVLines(summaryPage, yOffset, yOffset - rowH);
            yOffset -= rowH;
        });
        yOffset -= 10;
        // We will merge the uploaded PPE PDF in the handlePDFExport instead of calculating here
    });
}


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
