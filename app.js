// Ensure IMAGES_DATA is attached to window even if declared with const in imagesData.js
if (typeof IMAGES_DATA !== 'undefined') {
    window.IMAGES_DATA = IMAGES_DATA;
}

// Base64 of the original ABB logo
window.ABB_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAQgAAABjCAYAAABnsp7SAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFxEAABcRAcom8z8AABObSURBVHhe7V19tGVlWX8g8X6cvc8+d8aJSAiYRhJFFoZfKN+klUgr1ApI4w9BijTSIYVIVrnCZSEIraGUpBa2IowGy1IyllILnZYgDgiCiXwNzjBpE8xM83HvOWeffs+zn3PnzLl7Zs7Z+333fs/e72+t37ozd+37Pp/vb7/7mzw8PDw8PDw8qoMezZ7QpsZZMQWnHYhtmjozpvD1Ma2a4r+N6fCZBfl944y07YfJdmDvRDE8IYhp+ogYfnOcRZHt9WhqpboAH5rL+Pc9apw+lM/Tk+3DN85T63j8boX+iVNgv4rOofb0seoC7aKpVexDP3dLGZ6En6/oUdTSP/FoU/PNXQq39qjZG5Vdam6Mae4I/nXf8dSXp22ybUQ9/82SPaFocmAB0qHkV+50ejy1ynoJPqguc57elb5cQAsJ1+V9sdz/+/Vnwhg4FH8E4czpEqYA/55eRww6Fa9UFFqk1+/OhS1EMPzeDXwM/wzkE39ffGdYOmKQHoalu6metafEsSJG4UtbsRndmKvymMggavSt9sXW2jmqIPmvUicmABAIK5kv9PjsUXOU/M6dYEF4uz07YbJfvbJItN8CvVah5yf26PgJTpc4YAf55WRQwjEHeoC+3DjaD4M57D1OHL4z/h5akwU6nDVxw6aeSkC3zRa0voUgXhqUCDQfN30bfdFHiP623uIXiSOOA4IxBXj5cgERSA+oS6wQLwVeY7Tt90f9zQ7/v4+7EXfwzsGHbYwIJZfKyOHEIi/VxfYB+wMs/jQz2HEvf+VDkW/okNWG2i6c8ZPmAmB4ERHO3cPHB+6jMkWiEEuNjmW0I3jdOhCMNkCMUgR2i54E+9gdehqAk335fETZkYgkkSHq8URx1EdgehTmnwzDjneq8NbR3UEok+ZB0/zYYcOXy30aOooJGzj+AkzJxBYRTwuzjiO6gkEM4kHtfwEDjkOVjPWUD2BYMpYL6A2v6QmqgMk6+psyTK5gmhuw1L3THHIYVRTIPps9doUfhoi8WNqygoQSwUFIiHqsh31OUfNTD74bDYm+bpsyTIlEEwZ69PilMOotkAkhFB/QE1ZQZUFQmv1fGUONxYofGN6oKPQrEDgb78PHi2OOYrqC4TU4b8hEq9Sc8ZRbYFgyrxADpur1NzkoitLyqyJMikQTG7O4B3imKOowwpC6/qwrXslqi8QTOnlW4s4p2MNcP7FaIRnsyfKvEBgvHvLuDY/KuohEEyZUL+rJo2iHgIh5yM6fDu3mpw8IICLwPm04EajaYGQu/224eficweuoU4CgdpuiIi";

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
let addedArcFlashReports = [];
let hsePtwBuffer = null;
let hseAbraBuffer = null;
let hsePt5Buffer = null;
let hseReunionesBuffer = null;

if (fileUpload) {
    // Click is handled by native onclick in index.html to prevent blocking
    fileUpload.addEventListener('change', (e) => {
        console.log('📂 Archivo seleccionado:', e.target.files[0]?.name);
        if (e.target.files.length) {
            try {
                handleFile(e.target.files[0]);
            } catch (err) {
                console.error('Error handling file:', err);
                alert('Ocurrió un error al cargar el archivo.');
            }
        }
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

// --- HSE Document Uploads ---
function setupHseUpload(inputId, statusId, nameId, removeBtnId, bufferName) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                const file = e.target.files[0];
                window[bufferName] = await file.arrayBuffer();
                const status = document.getElementById(statusId);
                const nameEl = document.getElementById(nameId);
                if (status && nameEl) {
                    status.classList.remove('hidden');
                    nameEl.textContent = file.name;
                }
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }
    const removeBtn = document.getElementById(removeBtnId);
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            window[bufferName] = null;
            if (input) input.value = '';
            const status = document.getElementById(statusId);
            if (status) status.classList.add('hidden');
        });
    }
}

setupHseUpload('hsePtwUpload', 'hsePtwStatus', 'hsePtwFileName', 'btnRemoveHsePtw', 'hsePtwBuffer');
setupHseUpload('hseAbraUpload', 'hseAbraStatus', 'hseAbraFileName', 'btnRemoveHseAbra', 'hseAbraBuffer');
setupHseUpload('hsePt5Upload', 'hsePt5Status', 'hsePt5FileName', 'btnRemoveHsePt5', 'hsePt5Buffer');
setupHseUpload('hseReunionesUpload', 'hseReunionesStatus', 'hseReunionesFileName', 'btnRemoveHseReuniones', 'hseReunionesBuffer');

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
const canvasTooltip = document.getElementById('canvasTooltip');

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

// Keep document within viewport boundaries
function applyViewportConstraints() {
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
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
}

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
    
    // Strict Constraint: Keep document within bounds
    applyViewportConstraints();

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
        applyViewportConstraints();

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
});
// ---------- Cálculo Arc Flash ----------
class CalculationEngine {
    static parseInputs() {
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
        const getText = (id) => document.getElementById(id).value.trim();
        const getToggle = (group) => {
            const btn = document.querySelector(`button[data-group="${group}"].active-toggle`);
            return btn ? btn.dataset.val : null;
        };
        return {
            voltage: getVal('af_voltage'),            // V (voltios)
            breakerCurrent: getVal('af_breaker'),      // A
            isc: getVal('af_isc'),                    // kA
            eCap: getVal('af_ecap'),                  // kJ
            time: getVal('af_time'),                  // s
            config: getToggle('config'),              // "OpenAir" o "Enclosed"
            acdc: getToggle('acdc'),                  // "AC" o "DC"
            indoor: getToggle('indoor'),              // "Indoor" o "Outdoor"
            working: getToggle('working'),            // "Isolated" o "Live"
            equipId: getText('af_equipId'),
            device: getText('af_device'),
            date: document.getElementById('af_date').value
        };
    }

    static calculateArcFlash(params) {
        const V = params.voltage;
        const I_breaker = params.breakerCurrent;
        const I_sc = params.isc;
        const t = params.time;
        const E_cap = params.eCap;
        const isAC = params.acdc !== 'DC'; // default to AC if toggle missing
        const isOpenAir = params.config !== 'Enclosed'; // default to Open Air if toggle missing
        const isLive = params.working === 'Live';

        const warnings = [];

        // S10: Exceeded Limits
        if (V > 36000 || I_breaker > 6300 || I_sc > 100 || E_cap > 300) {
            warnings.push(" Not compatible or exceeding the limits of the Calculator.");
        }

        // S11: DC Boundary
        if (V > 1000 && !isAC) {
            warnings.push(" DC Calculation is only available in LV (Up to 1kV).");
        }

        // S12: Enclosed Box Boundary
        if (V > 1000 && !isOpenAir) {
            warnings.push("Enclosed box Calculation is only available in LV (Up to 1kV).");
        }

        // S13: Live Working Boundary
        if (V > 1000 && isLive) {
            warnings.push(" Live Working is only allowed in LV (Up to 1kV).");
        }

        if (warnings.length > 0) {
            return {
                incidentEnergy: '--',
                arcBoundary: '--',
                ppeCategory: '--',
                ppeDesc: 'Calculation not applicable.',
                gloveClass: '--',
                footwear: '--',
                limited: '--',
                limitedMovable: '--',
                restricted: '--',
                shockV: `${V} V${isAC ? 'AC' : 'DC'}`,
                warnings: warnings,
                params
            };
        }

        // 1. Working Distance (D) in mm
        const D = V <= 600 ? 455 : 910;
        const D_inches = D / 25.4;

        // 2. Calculate Incident Energy (E_inc)
        let E_inc = 0;
        if (isAC) {
            if (isOpenAir) {
                if (V <= 600) {
                    // F25
                    const F25 = 5271 * Math.pow(D_inches, -1.9593) * t * (0.0016 * Math.pow(I_sc, 2) - 0.0076 * I_sc + 0.8938);
                    if (I_sc <= 1) {
                        E_inc = F25 * I_sc;
                    } else {
                        E_inc = F25;
                    }
                } else {
                    // I26 (V > 600)
                    E_inc = 793 * Math.pow(D_inches, -2) * (V / 1000) * I_sc * t;
                }
            } else {
                // Enclosed Box (only valid typically for V <= 1000V)
                const F36 = 1038 * Math.pow(D_inches, -1.4738) * t * (0.0093 * Math.pow(I_sc, 2) - 0.3453 * I_sc + 5.9675);
                if (I_sc >= 22) {
                    E_inc = F36;
                } else {
                    E_inc = F36 * (I_sc / 22);
                }
            }
        } else {
            // DC
            const F46 = (0.01 * V * ((I_sc * 1000) / 2) * t) / (D / 10);
            if (I_sc >= 22) {
                E_inc = F46;
            } else {
                E_inc = F46 * (I_sc / 22);
            }
        }

        // S14: Incident Energy Limit
        if (E_inc > 40) {
            warnings.push(" Local operation over 40 cal/cm2 is not allowed. A different alternative must be considered.");
            return {
                incidentEnergy: '--',
                arcBoundary: '--',
                ppeCategory: '--',
                ppeDesc: 'Calculation not applicable.',
                gloveClass: '--',
                footwear: '--',
                limited: '--',
                limitedMovable: '--',
                restricted: '--',
                shockV: `${V} V${isAC ? 'AC' : 'DC'}`,
                warnings: warnings,
                params
            };
        }

        // 3. PPE Category Logic
        let ppeCategory = '--';
        let gloveClass = '--';
        let footwear = '--';
        let ppeDesc = '--';

        // Penalty: if any parameter exceeds absolute limits, no PPE is assignable
        const penalized = (V > 36000 || I_breaker > 6500 || I_sc > 150 || E_cap > 300);

        if (!penalized) {
            // Evaluate category from most restrictive (A) to least (F)
            // Each category has hard upper bounds on ALL parameters simultaneously
            if (V <= 30 && I_breaker <= 16 && I_sc <= 1 && E_inc <= 8 && E_cap === 0) {
                ppeCategory = 'A';
            } else if (V <= 480 && I_breaker <= 16 && I_sc <= 1 && E_inc <= 8 && E_cap <= 10) {
                ppeCategory = 'B';
            } else if (V <= 480 && I_breaker <= 63 && I_sc <= 7 && E_inc <= 8 && E_cap <= 10) {
                ppeCategory = 'C';
            } else if (V <= 1000 && I_breaker <= 200 && I_sc <= 15 && E_inc <= 25 && E_cap <= 150) {
                ppeCategory = 'D';
            } else if (V <= 7000 && E_inc <= 30 && E_cap <= 300) {
                ppeCategory = 'E';
            } else if (V <= 36000 && E_inc <= 40 && E_cap <= 300) {
                ppeCategory = 'F';
            }
        }

        // Set descriptions based on category
        // Indoor = always Electrical Hazard (EH) footwear for ALL categories (A-F)
        // Outdoor = category-specific boots per Excel workbook logic
        const isIndoor = params.indoor !== 'Outdoor'; // default to Indoor when toggle not set

        switch(ppeCategory) {
            case 'A':
                ppeDesc = "ABB's minimum arc flash workwear ATPV >= 8 Cal/cm2 Cat. 2 (NFPA 70E) + Dielectric Goggles";
                gloveClass = "Arc Grip Glove >= 8 Cal/cm2";
                footwear = 'Electrical Hazard Footwear "EH"';
                break;
            case 'B':
                ppeDesc = "One layer ATPV >= 8 Cal/cm2 Cat. 2 (NFPA 70E) + Dielectric Goggles or CAT 2 Face Shield";
                gloveClass = "Class 00 >= 500V + CAT 2 Leather";
                footwear = isIndoor ? 'Electrical Hazard Footwear "EH"' : 'Dielectric Safety Boots - Class 0 (Outdoor)';
                break;
            case 'C':
                ppeDesc = "One layer ATPV >= 8 Cal/cm2 Cat. 2 (NFPA 70E) + Ear Prot + CAT 2 Face Shield / Balaclava";
                gloveClass = "Class 00 >= 500V + CAT 2 Leather";
                footwear = isIndoor ? 'Electrical Hazard Footwear "EH"' : 'Dielectric Safety Boots - Class 0 (Outdoor)';
                break;
            case 'D':
                ppeDesc = "One Layer / Multi-layer ATPV >= 25 Cal/cm2 or 2 x ATPV >= 8 Cal/cm2 + Ear Prot. + CAT 3 Complete Hood";
                gloveClass = "Class 0 >= 1000V + CAT 3 Leather";
                footwear = isIndoor ? 'Electrical Hazard Footwear "EH"' : 'Dielectric Safety Boots - Class 0 (Outdoor)';
                break;
            case 'E':
                ppeDesc = "Multi-layer mandatory ATPV >= 8 Cal/cm2 and ATPV >= 25 Cal/cm2 + Ear Prot. + CAT 3 Complete Hood";
                gloveClass = "Class 1 >= 7.5kV + CAT 3 Leather";
                footwear = isIndoor ? 'Electrical Hazard Footwear "EH"' : 'Dielectric Safety Boots - Class 2 (Outdoor)';
                break;
            case 'F':
                ppeDesc = "Multi-layer mandatory ATPV >= 8 Cal/cm2 and ATPV >= 40 Cal/cm2 Full Suite + Ear Prot. + CAT 4 Complete Hood";
                gloveClass = "Class 4 + Arc rated >= 40 Cal/cm2";
                footwear = isIndoor ? 'Electrical Hazard Footwear "EH"' : 'EH Safety Shoe + Overboot Class 3 (Outdoor)';
                break;
            default:
                ppeDesc = "No valid PPE category found (Limits exceeded).";
                break;
        }

        // 4. Arc Flash Boundary
        let arcBoundary = '--';
        if (V >= 50 && I_breaker > 0 && t > 0) {
            const mva = (1.732 * V * I_breaker) / 1000000;
            const arcBoundaryMeters = Math.sqrt(53 * mva * t) / 3.28084;
            arcBoundary = arcBoundaryMeters.toFixed(2) + ' m';
        }

        // 5. Shock Boundaries
        let limited = '--';
        let limitedMovable = '--';
        let restricted = '--';

        if (isAC) {
            if (V >= 50 && V <= 150) { limited = '1.0 m'; limitedMovable = '3.0 m'; restricted = '0.3 m'; }
            else if (V > 150 && V <= 750) { limited = '1.0 m'; limitedMovable = '3.0 m'; restricted = '0.3 m'; }
            else if (V > 750 && V <= 15000) { limited = '1.5 m'; limitedMovable = '3.0 m'; restricted = '0.7 m'; }
            else if (V > 15000 && V <= 36000) { limited = '1.8 m'; limitedMovable = '3.0 m'; restricted = '0.8 m'; }
            else if (V > 36000 && V <= 40000) { limited = '2.5 m'; limitedMovable = '3.0 m'; restricted = '0.8 m'; }
        } else {
            if (V >= 50 && V <= 300) { limited = '3.0 m'; limitedMovable = '3.0 m'; restricted = '0.3 m'; }
            else if (V > 300 && V <= 1000) { limited = '3.0 m'; limitedMovable = '3.0 m'; restricted = '0.3 m'; }
        }

        return {
            incidentEnergy: E_inc.toFixed(2),
            arcBoundary,
            ppeCategory,
            ppeDesc,
            gloveClass,
            footwear,
            limited,
            limitedMovable,
            restricted,
            shockV: `${V} V${isAC ? 'AC' : 'DC'}`,
            warnings: [],
            params
        };
    }

    static updateUI(results) {
        document.getElementById('lbl_energy').textContent = results.incidentEnergy + ' cal/cm²';
        document.getElementById('lbl_arcBoundary').textContent = results.arcBoundary;
        
        document.getElementById('lbl_ppe').textContent = results.ppeDesc;
        document.getElementById('lbl_gloves').textContent = results.gloveClass;
        document.getElementById('lbl_footwear').textContent = results.footwear;

        document.getElementById('lbl_shockV').textContent = results.shockV;
        document.getElementById('lbl_limited').textContent = results.limited;
        const mov = document.getElementById('lbl_limitedMovable');
        if (mov) mov.textContent = results.limitedMovable;
        document.getElementById('lbl_restricted').textContent = results.restricted;

        document.getElementById('lbl_equipId').textContent = results.params.equipId || '--';
        document.getElementById('lbl_device').textContent = results.params.device || '--';
        document.getElementById('lbl_date').textContent = results.params.date || '--';
        
        const catElem = document.getElementById('lbl_cat');
        if (catElem) catElem.textContent = 'CAT ' + results.ppeCategory;
    }
}

function calculateArcFlash() {
    const inputs = CalculationEngine.parseInputs();
    const results = CalculationEngine.calculateArcFlash(inputs);
    
    const warningsDiv = document.getElementById('af_warnings');
    const warnText = document.getElementById('af_warnText');
    
    if (results.warnings && results.warnings.length > 0) {
        if (warningsDiv && warnText) {
            warnText.innerHTML = results.warnings.map(w => `• ${w}`).join('<br>');
            warningsDiv.classList.remove('hidden');
        }
        
        // Hide results panels and show placeholder
        document.getElementById('af_placeholder').classList.remove('hidden');
        document.getElementById('af_labelContainer').classList.add('hidden');
        const banner = document.getElementById('af_energyBanner');
        if (banner) banner.classList.add('hidden');
        const catPanel = document.getElementById('af_categoryPanel');
        if (catPanel) catPanel.classList.add('hidden');
        
        // Update labels to show empty/dashed state
        CalculationEngine.updateUI(results);
    } else {
        if (warningsDiv) {
            warningsDiv.classList.add('hidden');
        }
        
        CalculationEngine.updateUI(results);
        
        const banner = document.getElementById('af_energyBanner');
        if (banner) {
            banner.classList.remove('hidden');
            document.getElementById('af_energyValue').textContent = results.incidentEnergy + ' cal/cm²';
            document.getElementById('af_arcBoundaryBanner').textContent = 'Boundary: ' + results.arcBoundary;
            
            // Set method description
            const methodElem = document.getElementById('af_energyMethod');
            if (methodElem) {
                let method = "IEEE 1584 AC Open Air";
                if (inputs.acdc === 'DC') method = "DC LV Method";
                else if (inputs.config === 'Enclosed') method = "IEEE 1584 AC Enclosed Box";
                methodElem.textContent = "Método: " + method;
            }
            
            // Set working distance
            const workDistElem = document.getElementById('af_workDist');
            if (workDistElem) {
                const D = inputs.voltage <= 600 ? "455 mm (18 in)" : "910 mm (36 in)";
                workDistElem.textContent = D;
            }
        }
        
        document.getElementById('af_placeholder').classList.add('hidden');
        document.getElementById('af_labelContainer').classList.remove('hidden');
        
        const catPanel = document.getElementById('af_categoryPanel');
        if (catPanel) catPanel.classList.remove('hidden');
    }
}

const btnOpenArcFlash = document.getElementById('btnOpenArcFlash');
if (btnOpenArcFlash) {
        btnOpenArcFlash.addEventListener('click', () => {
            console.log('🔧 Botón Arc Flash pulsado');
            const modal = document.getElementById('arcFlashModal');
            if (modal) modal.classList.remove('hidden');
        });
}

const btnCalcArcFlash = document.getElementById('btnCalcArcFlash');
if (btnCalcArcFlash) {
    btnCalcArcFlash.addEventListener('click', calculateArcFlash);
}

// Logic for custom toggle buttons (af-toggle)
const afToggles = document.querySelectorAll('.af-toggle');
afToggles.forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        // Deselect all buttons in the same group
        document.querySelectorAll(`.af-toggle[data-group="${group}"]`).forEach(b => {
            b.classList.remove('active-toggle', 'border-orange-500', 'bg-orange-500', 'text-white');
            b.classList.add('border-gray-200', 'bg-white', 'text-gray-500');
        });
        // Select the clicked button
        btn.classList.add('active-toggle', 'border-orange-500', 'bg-orange-500', 'text-white');
        btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-500');
    });
});

const btnCloseArcFlashModal = document.getElementById('closeArcFlashModal');
if (btnCloseArcFlashModal) {
    btnCloseArcFlashModal.addEventListener('click', () => {
        const modal = document.getElementById('arcFlashModal');
        if (modal) modal.classList.add('hidden');
    });
}

// Append Arc Flash report to consolidated PDF button
const btnAppendArcFlashToPdf = document.getElementById('btnAppendArcFlashToPdf');
if (btnAppendArcFlashToPdf) {
    btnAppendArcFlashToPdf.addEventListener('click', async () => {
        const originalContent = btnAppendArcFlashToPdf.innerHTML;
        btnAppendArcFlashToPdf.disabled = true;
        btnAppendArcFlashToPdf.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Añadiendo...`;
        if (window.lucide) window.lucide.createIcons();

        const pdfBytes = await window.pdfTemplateHelper.populateTemplate({
            systemVoltage: document.getElementById('af_voltage')?.value || '--',
            upstreamBreaker: document.getElementById('af_breaker')?.value || '--',
            shortCircuit: document.getElementById('af_isc')?.value || '--',
            energyStorage: document.getElementById('af_ecap')?.value || '--',
            openingTime: document.getElementById('af_time')?.value || '--',
            workingDistance: (parseFloat(document.getElementById('af_voltage')?.value) <= 600 ? '455 mm (18 in)' : '910 mm (36 in)'),
            powerForArc: (() => {
                const v = parseFloat(document.getElementById('af_voltage')?.value) || 0;
                const i = parseFloat(document.getElementById('af_breaker')?.value) || 0;
                return ((v * Math.sqrt(3) * i) / 1000).toFixed(1);
            })(),
            incidentEnergy: document.getElementById('lbl_energy')?.textContent.replace(' cal/cm²', '').trim() || '--',
            arcFlashApproach: document.getElementById('lbl_arcBoundary')?.textContent || '--',
            limitsApproach: '--',
            restrictedApproach: '--',
            exposedMovable: '--',
            arcFlashBoundary: document.getElementById('lbl_arcBoundary')?.textContent || '--',
            glove: document.getElementById('lbl_gloves')?.textContent || '--',
            requiredPPE: document.getElementById('lbl_ppe')?.textContent || '--',
            footwear: document.getElementById('lbl_footwear')?.textContent || '--',
            shockHazard: document.getElementById('lbl_shockV')?.textContent || '--',
            limitedApproach: document.getElementById('lbl_limited')?.textContent || '--',
            restrictedApproach2: document.getElementById('lbl_restricted')?.textContent || '--',
            busEquipmentId: document.getElementById('lbl_equipId')?.textContent || '--',
            assessmentDate: document.getElementById('lbl_date')?.textContent || '--',
            protectiveDevice: document.getElementById('lbl_device')?.textContent || '--'
        }, (window.IMAGES_DATA && window.IMAGES_DATA.shock) ? window.IMAGES_DATA.shock : null);
            if (pdfBytes) {
            addedArcFlashReports.push(pdfBytes);
            alert('Reporte de Arc Flash añadido con éxito. Se incluirá al final del PDF consolidado al hacer clic en "Descargar".');
            
            // Close modal
            const modal = document.getElementById('arcFlashModal');
            if (modal) modal.classList.add('hidden');
        } else {
            alert('Error al generar el reporte.');
        }

        btnAppendArcFlashToPdf.disabled = false;
        btnAppendArcFlashToPdf.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
    });
}

// Export label to DOCX button
const btnExportArcDocx = document.getElementById('btnExportArcDocx');
if (btnExportArcDocx) {
    btnExportArcDocx.addEventListener('click', exportLabelToDocx);
}

// Export label to PDF button — envía el DOCX al backend Node.js → LibreOffice → PDF real
const BACKEND_URL = 'http://localhost:3000/convert';

const btnExportArcPdf = document.getElementById('btnExportArcPdf');
if (btnExportArcPdf) {
    btnExportArcPdf.addEventListener('click', async () => {
        const originalContent = btnExportArcPdf.innerHTML;
        btnExportArcPdf.disabled = true;
        btnExportArcPdf.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Generando PDF...`;
        if (window.lucide) window.lucide.createIcons();

        try {
            // 1. Generar el DOCX con los datos actuales de la UI
            const blobContent = await buildArcFlashDocxBlob();

            // 2. Crear FormData con el DOCX
            const formData = new FormData();
            formData.append('file', blobContent, 'reporte.docx');

            // 3. Enviar al backend Node.js/LibreOffice
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error || `Error del servidor: ${response.status}`);
            }

            // 4. Descargar el PDF resultante
            const pdfBlob = await response.blob();
            const url     = URL.createObjectURL(pdfBlob);
            const link    = document.createElement('a');

            const equipId     = document.getElementById('lbl_equipId')?.textContent || 'report';
            const cleanEquipId = equipId.replace(/[^a-zA-Z0-9]/g, '_') || 'report';

            link.href     = url;
            link.download = `Anexo_Calculadora_Arc_Flash_${cleanEquipId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('[PDF Export]', err);
            alert('Error generando PDF:\n' + err.message + '\n\n¿Está corriendo el servidor?\n  node server.js');
        }

        btnExportArcPdf.disabled = false;
        btnExportArcPdf.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
    });
}

// Helper to extract base64 data from a data URI
function getBase64Data(dataUri) {
    if (!dataUri) return null;
    if (dataUri.includes(',')) return dataUri.split(',')[1];
    return dataUri;
}



async function generateArcFlashPDFBytes() {
    try {
        if (!window.jspdf) {
            alert('La biblioteca jsPDF no está cargada.');
            return null;
        }

        const { jsPDF } = window.jspdf;

        // ---- Collect all calculated values from the UI ----
        const energy      = document.getElementById('lbl_energy')?.textContent || '--';
        const arcBoundary = document.getElementById('lbl_arcBoundary')?.textContent || '--';
        const ppe         = document.getElementById('lbl_ppe')?.textContent || '--';
        const gloves      = document.getElementById('lbl_gloves')?.textContent || '--';
        const footwear    = document.getElementById('lbl_footwear')?.textContent || '--';
        const shockV      = document.getElementById('lbl_shockV')?.textContent || '--';
        const limited     = document.getElementById('lbl_limited')?.textContent || '--';
        const restricted  = document.getElementById('lbl_restricted')?.textContent || '--';
        const limitedMov  = document.getElementById('lbl_limitedMovable')?.textContent || '--';
        const equipId     = document.getElementById('lbl_equipId')?.textContent || '--';
        const device      = document.getElementById('lbl_device')?.textContent || '--';
        const dateVal     = document.getElementById('lbl_date')?.textContent || '--';
        const category    = document.getElementById('lbl_cat')?.textContent || '--';
        const catLetter   = category.replace('CAT ', '').trim();

        const voltage = document.getElementById('af_voltage')?.value || '--';
        const breaker = document.getElementById('af_breaker')?.value || '--';
        const isc     = document.getElementById('af_isc')?.value || '--';
        const ecap    = document.getElementById('af_ecap')?.value || '--';
        const time    = document.getElementById('af_time')?.value || '--';

        const vNum = parseFloat(voltage) || 0;
        const bNum = parseFloat(breaker) || 0;
        const powerVal = ((vNum * Math.sqrt(3) * bNum) / 1000).toFixed(1);
        const workingDistStr = vNum <= 600 ? "455mm (18 in)" : "910mm (36 in)";
        const cleanEnergyStr = energy.replace(' cal/cm²', '').trim();

        const doc = new jsPDF('p', 'mm', 'letter');
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Anexo 01  System Information', 15, 20);
        
        // TABLE 1: System Information
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
                ['Working Distance (From the arc source)', workingDistStr, '(*)', ''],
                ['Power - For Arc Flash prot. Boundaries', powerVal, 'kVA (*)', ''],
                ['Incident Energy', cleanEnergyStr, 'cal/cm2', '']
            ],
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 35, fontStyle: 'bold', halign: 'right' },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 }
            }
        });

        // Add section headings matching the Word document layout
        const headingY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Análisis de seguridad eléctrica', 15, headingY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Frontera de protección de arco y choque eléctrico Distancias para instalación de barricada', 15, headingY + 6);
        doc.text('durante verificación de Seven Steps y señalización perimetral', 15, headingY + 11);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('According to NFPA70E: Table 130.4(E)(a)', 15, headingY + 17);

        // EPP (PPE) Image on the left side
        const eppImgData = window.IMAGES_DATA ? window.IMAGES_DATA[catLetter] : null;
        const eppImgW = 3.5;
        const eppImgH = 10;
        if (eppImgData) {
            try {
                doc.addImage(getBase64Data(eppImgData), 'PNG', 15, headingY + 22, eppImgW, eppImgH);
            } catch(e) { console.warn('EPP img add failed in PDF:', e); }
        }

        // TABLE 2: Shock Boundaries (placed on the right side of the EPP image)
        doc.autoTable({
            startY: headingY + 22,
            margin: { left: 60 },
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            head: [['Shock Protection Approach Boundaries and Arc Flash Boundary', '', '']],
            body: [
                ['Arc Flash Boundary', 'Limited Approach Boundary', 'Restricted Approach Boundary'],
                [arcBoundary, limited, restricted],
                [limitedMov, '', '']
            ]
        });

        const shockImgData = window.IMAGES_DATA ? window.IMAGES_DATA['shock'] : null;
        if (shockImgData) {
            try {
                const imgW = 141; // 216 - 60 - 15 = 141mm
                const imgH = imgW * (585 / 1201);
                doc.addImage(getBase64Data(shockImgData), 'PNG', 60, doc.lastAutoTable.finalY + 5, imgW, imgH);
                
                // Set the dummy table below both the EPP image and the diagram
                const nextY = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + imgH + 10);
                doc.autoTable({
                    startY: nextY,
                    body: []
                });
            } catch(e) {
                console.warn('Shock img add failed');
                const nextY = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + 10);
                doc.autoTable({
                    startY: nextY,
                    body: []
                });
            }
        } else {
            const nextY = Math.max(headingY + 22 + eppImgH, doc.lastAutoTable.finalY + 10);
            doc.autoTable({
                startY: nextY,
                body: []
            });
        }

        // TABLE 3: WARNING LABEL (The Warning Label styled like Word)
        const lblY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
        if (lblY > 230) {
            doc.addPage();
        }
        
        doc.autoTable({
            startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 20,
            theme: 'grid',
            headStyles: { fillColor: [237, 139, 0], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 16, halign: 'center' },
            bodyStyles: { textColor: [0, 0, 0], fontSize: 10 },
            head: [[{ content: '⚠ WARNING', colSpan: 4 }]],
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
                [{ content: 'IMPORTANT: This label was generated using estimated values ​​and may be used in the absence of a formal arc flash risk assessment.', colSpan: 4, styles: { halign: 'center', fontSize: 8, textColor: [120, 120, 120] } }]
            ],
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 48 },
                1: { textColor: [0, 0, 139], fontStyle: 'bold' },
                2: { fontStyle: 'bold', cellWidth: 48 },
                3: { textColor: [0, 0, 139], fontStyle: 'bold' }
            }
        });

        // EPP image has been placed side-by-side with Table 2 above.

        return doc.output('arraybuffer');
    } catch(err) {
        console.error('Error generating PDF bytes:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Función reutilizable: genera y devuelve el Blob DOCX con datos de la UI
// ─────────────────────────────────────────────────────────────────────────────
async function buildArcFlashDocxBlob() {
    if (typeof JSZip === 'undefined') throw new Error('JSZip no está cargado.');
    if (!window.DOCX_TEMPLATE_DATA) throw new Error('La plantilla DOCX no está disponible.');

    const energy      = document.getElementById('lbl_energy')?.textContent || '--';
    const arcBoundary = document.getElementById('lbl_arcBoundary')?.textContent || '--';
    const ppe         = document.getElementById('lbl_ppe')?.textContent || '--';
    const gloves      = document.getElementById('lbl_gloves')?.textContent || '--';
    const footwear    = document.getElementById('lbl_footwear')?.textContent || '--';
    const shockV      = document.getElementById('lbl_shockV')?.textContent || '--';
    const limited     = document.getElementById('lbl_limited')?.textContent || '--';
    const restricted  = document.getElementById('lbl_restricted')?.textContent || '--';
    const limitedMov  = document.getElementById('lbl_limitedMovable')?.textContent || '--';
    const equipId     = document.getElementById('lbl_equipId')?.textContent || '--';
    const device      = document.getElementById('lbl_device')?.textContent || '--';
    const dateVal     = document.getElementById('lbl_date')?.textContent || '--';
    const category    = document.getElementById('lbl_cat')?.textContent || '--';
    const catLetter   = category.replace('CAT ', '').trim();

    const voltage = document.getElementById('af_voltage')?.value || '--';
    const breaker = document.getElementById('af_breaker')?.value || '--';
    const isc     = document.getElementById('af_isc')?.value || '--';
    const ecap    = document.getElementById('af_ecap')?.value || '--';
    const time    = document.getElementById('af_time')?.value || '--';

    const vNum = parseFloat(voltage) || 0;
    const bNum = parseFloat(breaker) || 0;
    const powerVal = ((vNum * Math.sqrt(3) * bNum) / 1000).toFixed(1);

    const zip = await JSZip.loadAsync(window.DOCX_TEMPLATE_DATA, { base64: true });
    const parser = new DOMParser();
    const serializer = new XMLSerializer();

    const eppImgData = window.IMAGES_DATA ? window.IMAGES_DATA[catLetter] : null;
    let rIdPPE = null;
    if (eppImgData) {
        const base64Data = getBase64Data(eppImgData);
        zip.file('word/media/ppe_image.png', base64Data, { base64: true });

        let relsXmlText = await zip.file('word/_rels/document.xml.rels').async('string');
        const relsDoc = parser.parseFromString(relsXmlText, 'application/xml');
        let relationships = relsDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/package/2006/relationships', 'Relationships')[0];
        if (!relationships) relationships = relsDoc.getElementsByTagName('Relationships')[0];
        if (relationships) {
            rIdPPE = 'rIdPPE' + Date.now();
            const newRel = relsDoc.createElementNS('http://schemas.openxmlformats.org/package/2006/relationships', 'Relationship');
            newRel.setAttribute('Id', rIdPPE);
            newRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
            newRel.setAttribute('Target', 'media/ppe_image.png');
            relationships.appendChild(newRel);
            zip.file('word/_rels/document.xml.rels', serializer.serializeToString(relsDoc));
        }
    }

    let docXmlText = await zip.file('word/document.xml').async('string');
    const xmlDoc = parser.parseFromString(docXmlText, 'application/xml');

    function getElementsByTagNameNSOrLocal(element, localName) {
        let list = element.getElementsByTagName('w:' + localName);
        if (list.length === 0) list = element.getElementsByTagName(localName);
        return Array.from(list);
    }

    function replaceCellText(cellNode, newText) {
        if (!cellNode) return;
        const pNodes = getElementsByTagNameNSOrLocal(cellNode, 'p');
        if (pNodes.length === 0) return;
        const pNode = pNodes[0];
        const rNodes = getElementsByTagNameNSOrLocal(pNode, 'r');
        if (rNodes.length === 0) return;
        const firstR = rNodes[0];
        const tNodes = getElementsByTagNameNSOrLocal(firstR, 't');
        let targetT;
        if (tNodes.length === 0) {
            targetT = cellNode.ownerDocument.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
            firstR.appendChild(targetT);
        } else {
            targetT = tNodes[0];
        }
        targetT.textContent = newText;
        for (let i = 1; i < rNodes.length; i++) pNode.removeChild(rNodes[i]);
        for (let i = 1; i < pNodes.length; i++) cellNode.removeChild(pNodes[i]);
    }

    function getCell(table, rowIndex, colIndex) {
        if (!table) return null;
        const rows = getElementsByTagNameNSOrLocal(table, 'tr');
        if (rowIndex >= rows.length) return null;
        const row = rows[rowIndex];
        const cells = getElementsByTagNameNSOrLocal(row, 'tc');
        if (colIndex >= cells.length) return null;
        return cells[colIndex];
    }

    const tables = getElementsByTagNameNSOrLocal(xmlDoc, 'tbl');
    if (tables.length >= 3) {
        // Table 0: System Information
        replaceCellText(getCell(tables[0], 1, 4), voltage);
        replaceCellText(getCell(tables[0], 2, 4), breaker);
        replaceCellText(getCell(tables[0], 3, 4), parseFloat(isc).toFixed(1));
        replaceCellText(getCell(tables[0], 4, 4), parseFloat(ecap).toFixed(1));
        replaceCellText(getCell(tables[0], 5, 4), parseFloat(time).toFixed(2));
        const workingDistStr = vNum <= 600 ? '455mm (18 in)' : '910mm (36 in)';
        replaceCellText(getCell(tables[0], 6, 4), workingDistStr);
        replaceCellText(getCell(tables[0], 7, 4), powerVal);
        const cleanEnergyStr = energy.replace(' cal/cm²', '').trim();
        replaceCellText(getCell(tables[0], 10, 4), cleanEnergyStr);

        // Table 1: Shock boundaries
        replaceCellText(getCell(tables[1], 2, 3), arcBoundary);
        replaceCellText(getCell(tables[1], 2, 5), limited);
        replaceCellText(getCell(tables[1], 2, 6), restricted);
        replaceCellText(getCell(tables[1], 3, 5), limitedMov);

        // Table 2: Warning Label
        replaceCellText(getCell(tables[2], 4, 3), arcBoundary);
        replaceCellText(getCell(tables[2], 4, 6), ': ' + gloves);
        replaceCellText(getCell(tables[2], 5, 3), ppe);
        replaceCellText(getCell(tables[2], 5, 6), ': ' + footwear);
        replaceCellText(getCell(tables[2], 7, 3), shockV);
        replaceCellText(getCell(tables[2], 8, 3), limited);
        replaceCellText(getCell(tables[2], 8, 6), restricted);
        replaceCellText(getCell(tables[2], 9, 3), equipId);
        replaceCellText(getCell(tables[2], 9, 6), dateVal);
        replaceCellText(getCell(tables[2], 10, 2), device);
    }

    let newXmlText = serializer.serializeToString(xmlDoc);

    // Fix yellow color
    newXmlText = newXmlText.replace(/w:val="FFFF00"/gi, 'w:val="000000"');

    // Replace (imagen PPE) placeholder
    if (rIdPPE) {
        const cx = 1008000;
        const cy = 2880000;
        const drawingXml = `</w:t></w:r><w:r><w:drawing xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <wp:inline distT="0" distB="0" distL="0" distR="0">
    <wp:extent cx="${cx}" cy="${cy}"/>
    <wp:effectExtent l="0" t="0" r="0" b="0"/>
    <wp:docPr id="2" name="Imagen PPE" descr="PPE Image"/>
    <wp:cNvGraphicsFramePr>
      <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
    </wp:cNvGraphicsFramePr>
    <a:graphic>
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:nvPicPr>
            <pic:cNvPr id="2" name="Imagen PPE"/>
            <pic:cNvPicPr/>
          </pic:nvPicPr>
          <pic:blipFill>
            <a:blip r:embed="${rIdPPE}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
            <a:stretch><a:fillRect/></a:stretch>
          </pic:blipFill>
          <pic:spPr>
            <a:xfrm>
              <a:off x="0" y="0"/>
              <a:ext cx="${cx}" cy="${cy}"/>
            </a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </pic:spPr>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing></w:r><w:r><w:t>`;
        newXmlText = newXmlText.replace(/\(imagen PPE\)/g, drawingXml);
    } else {
        newXmlText = newXmlText.replace(/\(imagen PPE\)/g, 'Imagen EPP no disponible');
    }

    zip.file('word/document.xml', newXmlText);

    return await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Descarga el DOCX generado con los datos de la UI
// ─────────────────────────────────────────────────────────────────────────────
async function exportLabelToDocx() {
    try {
        const blobContent = await buildArcFlashDocxBlob();
        const url = URL.createObjectURL(blobContent);
        const link = document.createElement('a');
        const equipId = document.getElementById('lbl_equipId')?.textContent || 'report';
        const cleanEquipId = equipId.replace(/[^a-zA-Z0-9]/g, '_') || 'report';
        link.href = url;
        link.download = `Anexo_Calculadora_Arc_Flash_${cleanEquipId}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Error generating DOCX:', e);
        alert('Error al generar el reporte en formato Word: ' + e.message);
    }
}


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
                if (typeof restartRadarAnimations === 'function') {
                    restartRadarAnimations();
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

    const dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.85);

    await new Promise((resolve) => {
        fabric.Image.fromURL(dataUrl, function(img) {
            img.set({
                scaleX:  pdfBaseW / viewport.width,
                scaleY:  pdfBaseH / viewport.height,
                originX: 'left',
                originY: 'top',
                left:    0,
                top:     0,
                imageSmoothing: false // Keep text sharp, not blurry
            });

            canvas.setBackgroundImage(img, () => {
                canvas.renderAll();
                resolve();
            });
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
});

// --- Tools: Add Symbols ---
// Helper to create symbols at specific coordinates
function createSymbolAt(type, left, top) {
    let iconGroup;
    let defaultText = '';

    // Create vector equivalents using Fabric.js primitives
    if (type === 'aterramiento') {
        defaultText = 'Tierra';
        const line = new fabric.Line([20, 0, 20, 30], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p1 = new fabric.Line([0, 30, 40, 30], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p2 = new fabric.Line([8, 38, 32, 38], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p3 = new fabric.Line([16, 46, 24, 46], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([line, p1, p2, p3], { left, top });
    }
    else if (type === 'aislamiento') {
        defaultText = 'Aislamiento';
        const line1 = new fabric.Line([0, 20, 15, 20], { stroke: 'white', strokeWidth: 3 });
        const line2 = new fabric.Line([35, 20, 50, 20], { stroke: 'white', strokeWidth: 3 });
        const arm = new fabric.Line([15, 20, 30, 5], { stroke: 'white', strokeWidth: 3 });
        const perpline = new fabric.Line([27, 2, 33, 8], { stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([line1, line2, arm, perpline], { left, top });
    }
    else if (type === 'aislamiento_int') {
        defaultText = 'Int-Desconec.';
        const line1 = new fabric.Line([0, 20, 15, 20], { stroke: 'white', strokeWidth: 3 });
        const line2 = new fabric.Line([35, 20, 50, 20], { stroke: 'white', strokeWidth: 3 });
        const pivot = new fabric.Circle({ left: 12, top: 17, radius: 3, fill: 'transparent', stroke: 'white', strokeWidth: 3 });
        const arm = new fabric.Line([16, 17, 30, 5], { stroke: 'white', strokeWidth: 3 });
        const perpline = new fabric.Line([27, 2, 33, 8], { stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([line1, line2, pivot, arm, perpline], { left, top });
    }
    else if (type === 'bloqueo') {
        defaultText = 'Bloqueo LOTO';
        const lockBody = new fabric.Rect({
            left: 10, top: 20, width: 30, height: 30, rx: 3, ry: 3,
            fill: 'rgba(255,255,255,0.3)'
        });
        const shackle = new fabric.Path('M 15 20 L 15 10 A 10 10 0 0 1 35 10 L 35 20', {
            fill: 'transparent', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 4
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
            fill: 'transparent', stroke: 'white', strokeWidth: 3, strokeLineCap: 'round', strokeLineJoin: 'round'
        });
        const arrowHead = new fabric.Polyline([
            { x: 28, y: 23 },
            { x: 35, y: 30 },
            { x: 28, y: 37 }
        ], {
            fill: 'transparent', stroke: 'white', strokeWidth: 3, strokeLineCap: 'round', strokeLineJoin: 'round'
        });
        iconGroup = new fabric.Group([arrowLine, arrowHead], { left, top });
    }
    else if (type === 'verificacion_tension') {
        defaultText = 'Verif. Tensión';
        const circle = new fabric.Circle({ left: 10, top: 10, radius: 15, fill: 'transparent', stroke: 'white', strokeWidth: 3 });
        const vLine1 = new fabric.Line([18, 18, 25, 32], { stroke: 'white', strokeWidth: 3 });
        const vLine2 = new fabric.Line([25, 32, 32, 18], { stroke: 'white', strokeWidth: 3 });
        const topLines = new fabric.Line([25, 0, 25, 10], { stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([circle, vLine1, vLine2, topLines], { left, top });
    }
    else if (type === 'interconexion_corto') {
        defaultText = 'Cortocircuito';
        const lineIn = new fabric.Line([25, 0, 25, 15], { stroke: 'white', strokeWidth: 3 });
        const pivot = new fabric.Circle({ left: 22, top: 15, radius: 3, fill: 'transparent', stroke: 'white', strokeWidth: 3 });
        const lineOut1 = new fabric.Line([5, 35, 15, 35], { stroke: 'white', strokeWidth: 3 });
        const lineOut2 = new fabric.Line([35, 35, 45, 35], { stroke: 'white', strokeWidth: 3 });
        const arm1 = new fabric.Line([23, 18, 10, 30], { stroke: 'white', strokeWidth: 3 });
        const arm2 = new fabric.Line([27, 18, 40, 30], { stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([lineIn, pivot, lineOut1, lineOut2, arm1, arm2], { left, top });
    }
    else if (type === 'aterrizaje_temporal') {
        defaultText = 'Aterrizaje Temporal';
        const line = new fabric.Line([20, 10, 20, 30], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p1 = new fabric.Line([0, 30, 40, 30], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p2 = new fabric.Line([8, 38, 32, 38], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const p3 = new fabric.Line([16, 46, 24, 46], { fill: 'white', stroke: 'white', strokeWidth: 3 });
        const hook = new fabric.Path('M 15 10 A 5 5 0 0 1 25 10 L 25 5', { fill: 'transparent', stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([line, p1, p2, p3, hook], { left, top });
    }
    else if (type === 'maniobras') {
        defaultText = 'Maniobras';
        const line1 = new fabric.Line([0, 20, 15, 20], { stroke: 'white', strokeWidth: 3 });
        const line2 = new fabric.Line([35, 20, 50, 20], { stroke: 'white', strokeWidth: 3 });
        const arm = new fabric.Line([15, 20, 30, 5], { stroke: 'white', strokeWidth: 3 });
        const perpline = new fabric.Line([27, 2, 33, 8], { stroke: 'white', strokeWidth: 3 });
        iconGroup = new fabric.Group([line1, line2, arm, perpline], { left, top });
    }

    if (iconGroup) {
        // --- Circle background color per symbol type ---
        const circleColorMap = {
            'bloqueo':             '#e3000b',
            'aterramiento':        '#b45309',
            'retorno':             '#059669',
            'aterrizaje_temporal': '#d97706',
            'maniobras':           '#1d4ed8',
            'verificacion_tension':'#7c3aed',
            'interconexion_corto': '#ea580c',
            'aislamiento':         '#2563eb',
            'aislamiento_int':     '#2563eb',
        };
        const circleColor = circleColorMap[type] || '#334155';
        const circleRadius = 34;

        // Center icon within circle
        iconGroup.set({
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        // Scale icon to fit inside the circle (60% of diameter)
        const iconMax = Math.max(iconGroup.width, iconGroup.height);
        const iconScale = (circleRadius * 1.15) / iconMax;
        iconGroup.scale(iconScale);

        // Outer radar ring (most transparent)
        const ring2 = new fabric.Circle({
            radius: circleRadius + 16,
            fill: 'transparent',
            stroke: circleColor,
            strokeWidth: 1.5,
            opacity: 0.20,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        // Inner radar ring
        const ring1 = new fabric.Circle({
            radius: circleRadius + 7,
            fill: 'transparent',
            stroke: circleColor,
            strokeWidth: 2,
            opacity: 0.40,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        // Solid core circle
        const bgCircle = new fabric.Circle({
            radius: circleRadius,
            fill: circleColor,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        // Combine rings + circle + icon as radar badge
        const badgeGroup = new fabric.Group([ring2, ring1, bgCircle, iconGroup], {
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        const textObj = new fabric.Text(defaultText, {
            fontSize: 15,
            fill: '#111827',
            fontFamily: '"ABBvoice", "ABB Voice", "Helvetica", Arial, sans-serif',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'top',
            left: 0,
            top: circleRadius + 20,
            id: 'symbolLabel'
        });

        const realGroup = new fabric.Group([badgeGroup, textObj], {
            left,
            top,
            isSymbolGroup: true,
            tooltipText: defaultText,
            symbolType: type,
            baseName: defaultText,
            symbolId: 'sym_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        });

        canvas.add(realGroup);
        canvas.setActiveObject(realGroup);
        refreshItemsList();

        // Infinite pulsing animation for radar rings
        function pulseRing(r, initialRadius, targetRadius, delay) {
            setTimeout(() => {
                if (!r || !canvas.getObjects().includes(realGroup)) return; // stop if deleted
                
                r.animate('radius', targetRadius, {
                    duration: 2000,
                    onChange: () => canvas.requestRenderAll(),
                    onComplete: () => {
                        r.set({
                            radius: initialRadius,
                            opacity: r === ring1 ? 0.40 : 0.20
                        });
                        pulseRing(r, initialRadius, targetRadius, 0);
                    },
                    easing: fabric.util.ease.easeOutQuad
                });

                r.animate('opacity', 0, {
                    duration: 2000,
                    easing: fabric.util.ease.easeOutQuad
                });
            }, delay);
        }

        pulseRing(ring1, circleRadius + 7, circleRadius + 22, 0);
        pulseRing(ring2, circleRadius + 16, circleRadius + 38, 1000);
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
    const pointer = canvas.getPointer(e);
    createSymbolAt(symbolType, pointer.x, pointer.y);
});

// ============================================================
// ITEMS LIST PANEL — lateral derecho
// ============================================================
function refreshItemsList() {
    const panel = document.getElementById('itemsListPanel');
    const container = document.getElementById('itemsListContainer');
    const countEl = document.getElementById('itemsListCount');
    if (!panel || !container) return;

    const symbols = canvas.getObjects().filter(o => o.isSymbolGroup);

    if (countEl) countEl.textContent = symbols.length;

    if (symbols.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-300 gap-3">
                <svg class="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke-width="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p class="text-xs text-center text-gray-400">Sin símbolos en el lienzo.<br/>Añade uno desde el panel.</p>
            </div>`;
        return;
    }

    const colorMap = {
        'bloqueo':             '#e3000b',
        'aterramiento':        '#b45309',
        'retorno':             '#059669',
        'aterrizaje_temporal': '#d97706',
        'maniobras':           '#1d4ed8',
        'verificacion_tension':'#7c3aed',
        'interconexion_corto': '#ea580c',
        'aislamiento':         '#2563eb',
        'aislamiento_int':     '#2563eb',
    };

    container.innerHTML = '';
    symbols.forEach((sym, idx) => {
        const name = sym.tooltipText || sym.baseName || 'Símbolo';
        const desc = sym.itemDescription || '';
        const color = colorMap[sym.symbolType] || '#334155';

        const item = document.createElement('div');
        item.className = 'items-list-entry group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150';
        item.innerHTML = `
            <div class="shrink-0 mt-0.5 relative" style="width:32px; height:32px;">
                <svg viewBox="0 0 32 32" width="32" height="32" style="overflow: visible; position: absolute; left: 0; top: 0;">
                    <circle cx="16" cy="16" r="14" fill="${color}" class="radar-ring-2" />
                    <circle cx="16" cy="16" r="9" fill="${color}" class="radar-ring-1" />
                    <circle cx="16" cy="16" r="5" fill="${color}"/>
                </svg>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-gray-800 truncate">${idx + 1}. ${name}</p>
                ${desc ? `<p class="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-2">${desc}</p>` : `<p class="text-[11px] text-gray-400 italic">Sin descripción</p>`}
            </div>
            <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>
        `;

        item.addEventListener('click', () => {
            navigateToSymbol(sym);
        });

        container.appendChild(item);
    });
}

function navigateToSymbol(sym) {
    canvas.setActiveObject(sym);

    // Get center of the symbol in canvas coords
    const center = sym.getCenterPoint();
    const zoom = 2.0; // zoom in level when navigating

    // Clamp zoom
    const clampedZoom = Math.min(Math.max(zoom, 0.2), 10);
    canvas.setZoom(clampedZoom);

    // Center viewport on the symbol
    const vpt = canvas.viewportTransform;
    vpt[4] = canvas.width / 2 - center.x * clampedZoom;
    vpt[5] = canvas.height / 2 - center.y * clampedZoom;
    
    // Apply strict bounds constraints
    applyViewportConstraints();
    
    canvas.requestRenderAll();

    // Flash highlight: brief selection pulse
    sym.set({ opacity: 0.5 });
    canvas.renderAll();
    setTimeout(() => {
        sym.set({ opacity: 1 });
        canvas.renderAll();
    }, 220);

    updatePropertiesPanel();
}

// Refresh list on canvas events
canvas.on('object:added', () => setTimeout(refreshItemsList, 50));
canvas.on('object:removed', () => setTimeout(refreshItemsList, 50));
canvas.on('object:modified', () => setTimeout(refreshItemsList, 50));

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

// ============================================================
// ÁREAS SOMBREADAS
// ============================================================

// State
let selectedShadedShape = 'rectangle';
let selectedShadedColor = '#FF000F';

// Helper: hex + alpha → rgba string
function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// Shape selector buttons
const shadedShapeRect   = document.getElementById('shadedShapeRect');
const shadedShapeCircle = document.getElementById('shadedShapeCircle');

function updateShapeButtons() {
    const isRect = selectedShadedShape === 'rectangle';
    shadedShapeRect.className   = `flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-[10px] font-bold transition hover:shadow ${
        isRect ? 'border-abbred bg-red-50 text-gray-700' : 'border-gray-200 bg-white text-gray-400'
    }`;
    shadedShapeCircle.className = `flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-[10px] font-bold transition hover:shadow ${
        !isRect ? 'border-abbred bg-red-50 text-gray-700' : 'border-gray-200 bg-white text-gray-400'
    }`;
    // update icon colors
    const ri = shadedShapeRect.querySelector('i');
    const ci = shadedShapeCircle.querySelector('i');
    if (ri) ri.className   = `w-5 h-5 ${isRect  ? 'text-abbred' : ''}`;
    if (ci) ci.className   = `w-5 h-5 ${!isRect ? 'text-abbred' : ''}`;
}

if (shadedShapeRect) {
    shadedShapeRect.addEventListener('click', () => {
        selectedShadedShape = 'rectangle';
        updateShapeButtons();
    });
}
if (shadedShapeCircle) {
    shadedShapeCircle.addEventListener('click', () => {
        selectedShadedShape = 'circle';
        updateShapeButtons();
    });
}

// Color palette buttons
function updateColorPalette() {
    document.querySelectorAll('.shaded-color-btn').forEach(btn => {
        const active = btn.dataset.color === selectedShadedColor;
        btn.style.border = active ? '4px solid #111827' : '4px solid transparent';
        btn.style.boxShadow = active ? '0 0 0 3px rgba(0,0,0,0.18)' : 'none';
        btn.style.transform = active ? 'scale(1.15)' : '';
    });
}

document.querySelectorAll('.shaded-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedShadedColor = btn.dataset.color;
        updateColorPalette();
    });
});

// Initialise palette state on load
updateColorPalette();

// Add shaded area to canvas
function addShadedArea() {
    const alpha   = 0.25;
    const fillRgba = hexToRgba(selectedShadedColor, alpha);
    const stroke  = selectedShadedColor;
    const center  = canvas.getVpCenter();

    const commonProps = {
        left: center.x - 100,
        top:  center.y - 70,
        fill: fillRgba,
        stroke: stroke,
        strokeWidth: 2,
        strokeDashArray: [8, 5],
        opacity: 1,
        isShadedArea: true,
        shadedShapeType: selectedShadedShape,
        shadedColor: selectedShadedColor,
        cornerColor: '#FF000F',
        cornerStrokeColor: '#ffffff',
        borderColor: '#FF000F',
        transparentCorners: false,
        cornerStyle: 'circle',
        cornerSize: 10,
    };

    let shape;
    if (selectedShadedShape === 'circle') {
        shape = new fabric.Ellipse({
            ...commonProps,
            rx: 100,
            ry: 70,
            originX: 'left',
            originY: 'top',
        });
    } else {
        shape = new fabric.Rect({
            ...commonProps,
            width: 200,
            height: 140,
            rx: 8,
            ry: 8,
        });
    }

    canvas.add(shape);
    canvas.sendToBack(shape);   // Shaded areas sit BEHIND symbols
    // Keep the background image at the very bottom
    if (canvas.backgroundImage) canvas.sendToBack(canvas.backgroundImage);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    updatePropertiesPanel();
}

const btnAddShadedArea = document.getElementById('btnAddShadedArea');
if (btnAddShadedArea) {
    btnAddShadedArea.addEventListener('click', addShadedArea);
}

// --- Properties Panel (Text & Symbols) ---
const propertiesPanel   = document.getElementById('propertiesPanel');
const standardProps     = document.getElementById('standardProps');
const shadedAreaProps   = document.getElementById('shadedAreaProps');
const shadedAreaColorDot = document.getElementById('shadedAreaColorDot');
const textOnlyProps     = document.getElementById('textOnlyProps');
const propSymbolText    = document.getElementById('propSymbolText');
const propSymbolDesc    = document.getElementById('propSymbolDesc');
const propFontSize      = document.getElementById('propFontSize');
const propFillColor     = document.getElementById('propFillColor');
const propShadeColor    = document.getElementById('propShadeColor');
const propShadeOpacity  = document.getElementById('propShadeOpacity');
const opacityVal        = document.getElementById('opacityVal');

function updatePropertiesPanel() {
    const activeObj = canvas.getActiveObject();

    // --- Shaded area ---
    if (activeObj && activeObj.isShadedArea) {
        propertiesPanel.classList.remove('hidden');
        propertiesPanel.classList.add('block');
        // Hide standard props, show shaded props
        if (standardProps)  standardProps.classList.add('hidden');
        if (shadedAreaProps) {
            shadedAreaProps.classList.remove('hidden');
            shadedAreaProps.classList.add('flex');
        }
        // Sync controls with object
        const currentColor = activeObj.shadedColor || '#FF000F';
        if (propShadeColor)   propShadeColor.value = currentColor;
        if (shadedAreaColorDot) shadedAreaColorDot.style.background = currentColor;
        // Parse current opacity from fill rgba string
        const fillStr = activeObj.fill || '';
        const alphaMatch = fillStr.match(/rgba\(\d+,\d+,\d+,([\d.]+)\)/);
        const currentAlpha = alphaMatch ? Math.round(parseFloat(alphaMatch[1]) * 100) : 25;
        if (propShadeOpacity) propShadeOpacity.value = currentAlpha;
        if (opacityVal) opacityVal.textContent = currentAlpha + '%';
        return;
    }

    // Hide shaded props when not a shaded area
    if (shadedAreaProps) {
        shadedAreaProps.classList.add('hidden');
        shadedAreaProps.classList.remove('flex');
    }
    if (standardProps) standardProps.classList.remove('hidden');

    if (activeObj && activeObj.type === 'i-text') {
        // Plain text properties
        propertiesPanel.classList.remove('hidden');
        propertiesPanel.classList.add('block');
        textOnlyProps.classList.remove('hidden');
        textOnlyProps.classList.add('flex');

        propSymbolText.value = activeObj.text || '';
        propSymbolDesc.value = activeObj.itemDescription || '';
        propFontSize.value = activeObj.fontSize;

        let color = (activeObj.fill || '#000000').toUpperCase();
        propFillColor.value = color;
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

    // --- Shaded area real-time updates ---
    if (activeObj && activeObj.isShadedArea) {
        if (propShadeColor && propShadeOpacity) {
            const newColor   = propShadeColor.value;
            const newAlpha   = parseInt(propShadeOpacity.value, 10) / 100;
            const newFill    = hexToRgba(newColor, newAlpha);
            activeObj.set({
                fill:        newFill,
                stroke:      newColor,
                shadedColor: newColor,
            });
            if (shadedAreaColorDot) shadedAreaColorDot.style.background = newColor;
            if (opacityVal) opacityVal.textContent = propShadeOpacity.value + '%';
            canvas.renderAll();
        }
        return;
    }

    if (activeObj && activeObj.type === 'i-text') {
        activeObj.set({
            text: propSymbolText.value,
            tooltipText: propSymbolText.value,
            itemDescription: propSymbolDesc.value,
            fontSize: parseInt(propFontSize.value, 10),
            fill: propFillColor.value
        });
        canvas.renderAll();
        refreshItemsList();
    } else if (activeObj && activeObj.isSymbolGroup) {
        activeObj.set('tooltipText', propSymbolText.value);
        activeObj.set('itemDescription', propSymbolDesc.value);
        const textObj = activeObj.getObjects().find(o => o.id === 'symbolLabel');
        if (textObj) {
            textObj.set({
                text: propSymbolText.value,
                fill: propFillColor.value
            });
            activeObj.addWithUpdate();
            canvas.renderAll();
            refreshItemsList();
        }
    }
}

propSymbolText.addEventListener('input', applyProperties);
propSymbolDesc.addEventListener('input', applyProperties);
propFontSize.addEventListener('input', applyProperties);
propFillColor.addEventListener('change', applyProperties);

// Shaded area property listeners
if (propShadeColor)   propShadeColor.addEventListener('change', applyProperties);
if (propShadeOpacity) {
    propShadeOpacity.addEventListener('input', () => {
        if (opacityVal) opacityVal.textContent = propShadeOpacity.value + '%';
        applyProperties();
    });
}

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

    // 2. Unifilar page — preserve the composite's aspect ratio so nothing
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

    // 3. EPPs (Ref. PPE PDF annex pages + Added Arc Flash reports)
    if (ppePdfFileBuffer) {
        try {
            const ppeDoc   = await PDFDocument.load(ppePdfFileBuffer);
            const ppePages = await pdfDoc.copyPages(ppeDoc, ppeDoc.getPageIndices());
            ppePages.forEach(p => pdfDoc.addPage(p));
        } catch (e) { console.error('Error consolidando PPE PDF:', e); }
    }

    if (addedArcFlashReports && addedArcFlashReports.length > 0) {
        for (const arcFlashBytes of addedArcFlashReports) {
            try {
                const arcDoc = await PDFDocument.load(arcFlashBytes);
                const arcPages = await pdfDoc.copyPages(arcDoc, arcDoc.getPageIndices());
                arcPages.forEach(p => pdfDoc.addPage(p));
            } catch (e) {
                console.error('Error consolidating added Arc Flash report:', e);
            }
        }
    }

    // 4. Documentos HSE: PTW Electrical Safety, ABRA, PT 5, Reuniones de seguridad
    const hseDocs = [
        { buffer: window.hsePtwBuffer, name: 'PTW Electrical Safety' },
        { buffer: window.hseAbraBuffer, name: 'ABRA' },
        { buffer: window.hsePt5Buffer, name: 'PT 5' },
        { buffer: window.hseReunionesBuffer, name: 'Reuniones de seguridad' }
    ];

    for (const doc of hseDocs) {
        if (doc.buffer) {
            try {
                const hseDoc = await PDFDocument.load(doc.buffer);
                const hsePages = await pdfDoc.copyPages(hseDoc, hseDoc.getPageIndices());
                hsePages.forEach(p => pdfDoc.addPage(p));
            } catch (e) {
                console.error(`Error consolidando Documento HSE (${doc.name}):`, e);
            }
        }
    }

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

// --- Tab logic removed as tabs were simplified to a single clean grid ---

// --- Auto-load HSE Documents from local workspace folder ---
async function autoLoadHseDocuments() {
    const docs = [
        { path: '06. PTW Electrical Safety.pdf', bufferName: 'hsePtwBuffer', statusId: 'hsePtwStatus', nameId: 'hsePtwFileName', displayName: '06. PTW Electrical Safety.pdf' },
        { path: '01. ABRA.pdf', bufferName: 'hseAbraBuffer', statusId: 'hseAbraStatus', nameId: 'hseAbraFileName', displayName: '01. ABRA.pdf' },
        { path: '04 Pare Tome 5.pdf', bufferName: 'hsePt5Buffer', statusId: 'hsePt5Status', nameId: 'hsePt5FileName', displayName: '04 Pare Tome 5.pdf' },
        { path: '05. Formato de Capacitación.pdf', bufferName: 'hseReunionesBuffer', statusId: 'hseReunionesStatus', nameId: 'hseReunionesFileName', displayName: '05. Formato de Capacitación.pdf' }
    ];

    for (const doc of docs) {
        try {
            const response = await fetch(encodeURI(doc.path));
            if (response.ok) {
                const arrayBuf = await response.arrayBuffer();
                window[doc.bufferName] = arrayBuf;
                const statusEl = document.getElementById(doc.statusId);
                const nameEl = document.getElementById(doc.nameId);
                if (statusEl && nameEl) {
                    statusEl.classList.remove('hidden');
                    nameEl.textContent = doc.displayName + ' (Autocargado)';
                }
                console.log(`Autocargado exitoso: ${doc.displayName}`);
            } else {
                console.warn(`No se pudo autocargar: ${doc.path} (Status: ${response.status})`);
            }
        } catch (e) {
            console.warn(`Error al intentar autocargar ${doc.path}:`, e);
        }
    }
    if (window.lucide) window.lucide.createIcons();
}

autoLoadHseDocuments();

// ============================================================
// DRAFTS / ATTEMPTS HISTORY SYSTEM
// ============================================================

// Elements
const tabItems = document.getElementById('tabItems');
const tabHistory = document.getElementById('tabHistory');
const itemsTabContent = document.getElementById('itemsTabContent');
const historyTabContent = document.getElementById('historyTabContent');

const btnShowSaveForm = document.getElementById('btnShowSaveForm');
const saveAttemptForm = document.getElementById('saveAttemptForm');
const btnCancelSaveAttempt = document.getElementById('btnCancelSaveAttempt');
const btnSubmitSaveAttempt = document.getElementById('btnSubmitSaveAttempt');
const attemptEvaluator = document.getElementById('attemptEvaluator');
const attemptTitle = document.getElementById('attemptTitle');

const attemptsListContainer = document.getElementById('attemptsListContainer');
const attemptsListCount = document.getElementById('attemptsListCount');
const attemptJsonUpload = document.getElementById('attemptJsonUpload');

// Tab Switching logic
if (tabItems && tabHistory && itemsTabContent && historyTabContent) {
    tabItems.addEventListener('click', () => {
        // Active styles to Items tab
        tabItems.classList.add('border-b-2', 'border-abbred', 'bg-white', 'text-gray-700');
        tabItems.classList.remove('border-transparent', 'text-gray-400');
        
        // Inactive styles to History tab
        tabHistory.classList.remove('border-b-2', 'border-abbred', 'bg-white', 'text-gray-700');
        tabHistory.classList.add('border-transparent', 'text-gray-400');
        
        // Show/Hide containers
        itemsTabContent.classList.remove('hidden');
        historyTabContent.classList.add('hidden');
    });

    tabHistory.addEventListener('click', () => {
        // Active styles to History tab
        tabHistory.classList.add('border-b-2', 'border-abbred', 'bg-white', 'text-gray-700');
        tabHistory.classList.remove('border-transparent', 'text-gray-400');
        
        // Inactive styles to Items tab
        tabItems.classList.remove('border-b-2', 'border-abbred', 'bg-white', 'text-gray-700');
        tabItems.classList.add('border-transparent', 'text-gray-400');
        
        // Show/Hide containers
        historyTabContent.classList.remove('hidden');
        itemsTabContent.classList.add('hidden');
        
        // Refresh list
        refreshAttemptsHistory();
    });
}

// Form toggling
if (btnShowSaveForm && saveAttemptForm) {
    btnShowSaveForm.addEventListener('click', () => {
        saveAttemptForm.classList.toggle('hidden');
        // pre-fill evaluator name if possible
        const lastEvaluator = localStorage.getItem('abb_last_evaluator') || '';
        if (attemptEvaluator && !attemptEvaluator.value) {
            attemptEvaluator.value = lastEvaluator;
        }
    });
}

if (btnCancelSaveAttempt && saveAttemptForm) {
    btnCancelSaveAttempt.addEventListener('click', () => {
        saveAttemptForm.classList.add('hidden');
        attemptTitle.value = '';
    });
}

// Save current attempt
if (btnSubmitSaveAttempt) {
    btnSubmitSaveAttempt.addEventListener('click', () => {
        const evaluator = attemptEvaluator.value.trim();
        const title = attemptTitle.value.trim();

        if (!evaluator || !title) {
            alert('Por favor completa el nombre del evaluador y el título del intento.');
            return;
        }

        // Save last evaluator for convenience
        localStorage.setItem('abb_last_evaluator', evaluator);

        // Serialize canvas
        const canvasJson = canvas.toJSON(['isSymbolGroup', 'tooltipText', 'symbolType', 'baseName', 'symbolId', 'itemDescription', 'isShadedArea', 'shadedShapeType', 'shadedColor']);

        const attemptData = {
            id: 'att_' + Date.now(),
            evaluator: evaluator,
            title: title,
            date: new Date().toLocaleString('es-ES', { 
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
            canvasData: canvasJson,
            pdfBaseScale: pdfBaseScale,
            pdfBaseW: pdfBaseW,
            pdfBaseH: pdfBaseH,
            pdfCropCoords: pdfCropCoords
        };

        const attempts = JSON.parse(localStorage.getItem('abb_unifilar_attempts') || '[]');
        attempts.unshift(attemptData); // Add to beginning

        try {
            localStorage.setItem('abb_unifilar_attempts', JSON.stringify(attempts));
            saveAttemptForm.classList.add('hidden');
            attemptTitle.value = '';
            refreshAttemptsHistory();
            alert('¡Intento guardado con éxito en el historial!');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            // Limit exceeded (most likely due to large background image)
            const confirmDownload = confirm(
                'El tamaño del diagrama (incluyendo la imagen de fondo de alta resolución) supera la capacidad del almacenamiento del navegador.\n\n' +
                '¿Deseas descargar este intento como un archivo de borrador (.json) en tu computadora para poder cargarlo y editarlo cuando quieras?'
            );
            if (confirmDownload) {
                exportAttemptToFile(attemptData);
            }
        }
    });
}

// Refresh attempts history list in UI
function refreshAttemptsHistory() {
    if (!attemptsListContainer) return;

    const attempts = JSON.parse(localStorage.getItem('abb_unifilar_attempts') || '[]');
    
    if (attemptsListCount) {
        attemptsListCount.textContent = attempts.length;
        if (attempts.length > 0) {
            attemptsListCount.classList.remove('bg-gray-400');
            attemptsListCount.classList.add('bg-abbred');
        } else {
            attemptsListCount.classList.remove('bg-abbred');
            attemptsListCount.classList.add('bg-gray-400');
        }
    }

    if (attempts.length === 0) {
        attemptsListContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-300 gap-3">
                <i data-lucide="archive" class="w-10 h-10 opacity-40"></i>
                <p class="text-xs text-center text-gray-400">Sin intentos guardados.<br/>Guarda el estado actual.</p>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    attemptsListContainer.innerHTML = '';
    attempts.forEach((att) => {
        const item = document.createElement('div');
        item.className = 'border border-gray-150 rounded-xl p-3 bg-gray-50 flex flex-col gap-2.5 shadow-sm hover:border-gray-350 hover:shadow transition';
        item.innerHTML = `
            <div class="flex flex-col">
                <p class="text-xs font-bold text-gray-800 leading-tight">${att.title}</p>
                <p class="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <i data-lucide="user" class="w-3 h-3 text-abbred"></i> Evaluador: <b>${att.evaluator}</b>
                </p>
                <p class="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3 h-3"></i> ${att.date}
                </p>
            </div>
            <div class="flex gap-1.5 border-t border-gray-150 pt-2.5">
                <button class="btn-load-attempt flex-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold py-1.5 px-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-1" data-id="${att.id}">
                    <i data-lucide="folder-open" class="w-3 h-3 text-abbred"></i> Cargar
                </button>
                <button class="btn-export-attempt bg-white border border-gray-200 text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Exportar a Archivo JSON" data-id="${att.id}">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                </button>
                <button class="btn-delete-attempt bg-white border border-gray-200 text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-55 transition" title="Eliminar Intento" data-id="${att.id}">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;

        // Bind Load button
        item.querySelector('.btn-load-attempt').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseas cargar el intento "${att.title}"?\nEsto reemplazará todo el contenido actual del lienzo.`)) {
                loadAttempt(att);
            }
        });

        // Bind Export button
        item.querySelector('.btn-export-attempt').addEventListener('click', () => {
            exportAttemptToFile(att);
        });

        // Bind Delete button
        item.querySelector('.btn-delete-attempt').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseas eliminar el intento "${att.title}" del historial?`)) {
                deleteAttempt(att.id);
            }
        });

        attemptsListContainer.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}

// Restart radar pulse animations for loaded symbols
function restartRadarAnimations() {
    const circleRadius = 34;
    canvas.getObjects().forEach(obj => {
        if (obj && obj.isSymbolGroup) {
            const badgeGroup = obj.item(0);
            if (badgeGroup && typeof badgeGroup.item === 'function') {
                const ring2 = badgeGroup.item(0);
                const ring1 = badgeGroup.item(1);

                if (ring1 && ring2) {
                    ring1.set({ radius: circleRadius + 7, opacity: 0.40 });
                    ring2.set({ radius: circleRadius + 16, opacity: 0.20 });

                    function pulseRing(r, initialRadius, targetRadius, delay) {
                        setTimeout(() => {
                            if (!r || !canvas.getObjects().includes(obj)) return;
                            
                            r.animate('radius', targetRadius, {
                                duration: 2000,
                                onChange: () => canvas.requestRenderAll(),
                                onComplete: () => {
                                    r.set({
                                        radius: initialRadius,
                                        opacity: r === ring1 ? 0.40 : 0.20
                                    });
                                    pulseRing(r, initialRadius, targetRadius, 0);
                                },
                                easing: fabric.util.ease.easeOutQuad
                            });

                            r.animate('opacity', 0, {
                                duration: 2000,
                                easing: fabric.util.ease.easeOutQuad
                            });
                        }, delay);
                    }

                    pulseRing(ring1, circleRadius + 7, circleRadius + 22, 0);
                    pulseRing(ring2, circleRadius + 16, circleRadius + 38, 1000);
                }
            }
        }
    });
    canvas.requestRenderAll();
}

// Load a saved attempt
function loadAttempt(att) {
    if (!att || !att.canvasData) return;

    // Reset crop & scale states
    pdfBaseScale = att.pdfBaseScale || 4.0;
    pdfBaseW = att.pdfBaseW || 0;
    pdfBaseH = att.pdfBaseH || 0;
    pdfCropCoords = att.pdfCropCoords || null;
    currentPdfPage = null; // Prevent PDF page dynamic zoom rendering

    // Enable sidebar tools
    if (toolsPanel) toolsPanel.classList.remove('opacity-30', 'pointer-events-none');

    // Load canvas
    canvas.loadFromJSON(att.canvasData, function () {
        canvas.renderAll();
        
        // Restore background size and constraints
        const bg = canvas.backgroundImage;
        if (bg) {
            pdfBaseW = bg.width * bg.scaleX;
            pdfBaseH = bg.height * bg.scaleY;
        }
        
        zoomToFit();
        refreshItemsList();
        restartRadarAnimations();
        
        // Show success alert
        alert(`¡Intento "${att.title}" cargado correctamente! El lienzo está listo para ser editado.`);
        
        // Open Items list panel tab so user sees the new items
        if (tabItems) tabItems.click();
    });
}

// Export single attempt to JSON file
function exportAttemptToFile(att) {
    if (!att) return;
    const jsonStr = JSON.stringify(att, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = att.title.replace(/[^a-zA-Z0-9]/g, '_') || 'intento';
    link.download = `ABB_Borrador_Unifilar_${cleanTitle}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Delete attempt
function deleteAttempt(id) {
    let attempts = JSON.parse(localStorage.getItem('abb_unifilar_attempts') || '[]');
    attempts = attempts.filter(att => att.id !== id);
    localStorage.setItem('abb_unifilar_attempts', JSON.stringify(attempts));
    refreshAttemptsHistory();
}

// Import JSON file logic
if (attemptJsonUpload) {
    attemptJsonUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function (f) {
                try {
                    const att = JSON.parse(f.target.result);
                    if (!att.canvasData || !att.title) {
                        throw new Error('El archivo no contiene un formato de borrador válido de la plataforma.');
                    }
                    
                    const confirmLoad = confirm(
                        `Se ha leído el borrador:\n` +
                        `• Título: ${att.title}\n` +
                        `• Evaluador: ${att.evaluator || 'Desconocido'}\n` +
                        `• Fecha: ${att.date || 'Desconocida'}\n\n` +
                        `¿Deseas cargarlo e importarlo en el historial local para editarlo ahora?`
                    );

                    if (confirmLoad) {
                        // Load onto canvas
                        loadAttempt(att);
                        
                        // Import into history list
                        const attempts = JSON.parse(localStorage.getItem('abb_unifilar_attempts') || '[]');
                        // Check if it already exists to avoid duplicates
                        if (!attempts.some(a => a.id === att.id)) {
                            attempts.unshift(att);
                            localStorage.setItem('abb_unifilar_attempts', JSON.stringify(attempts));
                        }
                        refreshAttemptsHistory();
                    }
                } catch (err) {
                    console.error('Error parsing JSON draft file:', err);
                    alert('Error al leer el archivo JSON: ' + err.message);
                }
            };
            reader.readAsText(file);
            attemptJsonUpload.value = ''; // clear input
        }
    });
}

// Auto-run on load
refreshAttemptsHistory();
