/**
 * server.js — Backend de conversión DOCX → PDF usando LibreOffice
 * 
 * Uso:
 *   node server.js
 *
 * Endpoints:
 *   POST /convert   multipart/form-data  campo "file" = archivo .docx
 *                   → devuelve el PDF resultante
 */

const express    = require('express');
const multer     = require('multer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const { execFile } = require('child_process');

const app  = express();
const PORT = 3000;

// ─── CORS: permite peticiones desde cualquier origen (tu frontend local) ──────
app.use(cors());

// ─── Multer: guarda el DOCX subido en una carpeta temporal ───────────────────
const upload = multer({ dest: path.join(__dirname, 'tmp_uploads') });

// ─── Ruta de LibreOffice según el sistema operativo ──────────────────────────
function getLibreOfficePath() {
    // Windows: intenta primero la ruta de extracción local, luego la ruta por defecto del instalador oficial
    const winPaths = [
        path.join(__dirname, 'tools', 'libreoffice', 'App', 'libreoffice', 'program', 'soffice.exe'),
        path.join(__dirname, 'tools', 'libreoffice', 'program', 'soffice.exe'),
        path.join(__dirname, 'tools', 'libreoffice', 'LibreOffice', 'program', 'soffice.exe'),
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    for (const p of winPaths) {
        if (fs.existsSync(p)) return p;
    }
    // Linux / macOS (disponible en PATH)
    return 'libreoffice';
}

// ─── POST /convert ────────────────────────────────────────────────────────────
app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const inputPath  = req.file.path;                          // ruta temporal del DOCX
    const outputDir  = path.join(__dirname, 'tmp_uploads');    // misma carpeta de salida
    const loPath     = getLibreOfficePath();

    console.log(`[convert] Archivo recibido: ${req.file.originalname}`);
    console.log(`[convert] Usando LibreOffice: ${loPath}`);

    // LibreOffice convierte el DOCX a PDF y lo deja en outputDir
    execFile(loPath, [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
        inputPath
    ], (err, stdout, stderr) => {

        // Limpiar el DOCX temporal pase lo que pase
        fs.unlink(inputPath, () => {});

        if (err) {
            console.error('[convert] Error LibreOffice:', stderr || err.message);
            return res.status(500).json({ error: 'Error al convertir: ' + (stderr || err.message) });
        }

        // LibreOffice genera el PDF con el mismo nombre base pero extensión .pdf
        const baseName  = path.basename(inputPath);          // e.g. "abc123"
        const pdfPath   = path.join(outputDir, baseName + '.pdf');

        if (!fs.existsSync(pdfPath)) {
            return res.status(500).json({ error: 'LibreOffice no generó el PDF esperado.' });
        }

        console.log(`[convert] PDF generado: ${pdfPath}`);

        // Enviar el PDF al cliente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');

        const stream = fs.createReadStream(pdfPath);
        stream.pipe(res);

        // Borrar el PDF temporal después de enviarlo
        stream.on('end', () => fs.unlink(pdfPath, () => {}));
    });
});

// ─── Health-check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor de conversión DOCX→PDF activo.' });
});

// ─── Crear carpeta temporal si no existe ─────────────────────────────────────
if (!fs.existsSync(path.join(__dirname, 'tmp_uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'tmp_uploads'));
}

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   LibreOffice path: ${getLibreOfficePath()}`);
});
