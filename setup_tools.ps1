# setup_tools.ps1 — Automatización de descarga e instalación local de Node.js y LibreOffice

$ErrorActionPreference = "Stop"

# Directorios de trabajo
$workspace = Get-Location
$toolsDir = Join-Path $workspace "tools"
$downloadsDir = Join-Path $toolsDir "downloads"
$nodeDest = Join-Path $toolsDir "node"
$loDest = Join-Path $toolsDir "libreoffice"

# URLs oficiales de descarga
$nodeUrl = "https://nodejs.org/dist/v20.15.0/node-v20.15.0-win-x64.zip"
$loUrl = "https://download.documentfoundation.org/libreoffice/portable/24.8.7/LibreOfficePortablePrevious_24.8.7_MultilingualStandard.paf.exe"

# Asegurar directorios de base
if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }
if (-not (Test-Path $downloadsDir)) { New-Item -ItemType Directory -Path $downloadsDir | Out-Null }

function Download-File {
    param (
        [string]$url,
        [string]$outputPath
    )
    Write-Host "Descargando desde $url..."
    if (Test-Path $outputPath) {
        Write-Host "El archivo ya existe en $outputPath. Saltando descarga."
        return
    }

    try {
        Write-Host "Intentando descarga rápida con BITS..."
        Start-BitsTransfer -Source $url -Destination $outputPath -ErrorAction Stop
        Write-Host "Descargado con éxito vía BITS."
    } catch {
        Write-Host "BITS falló o no está disponible. Usando fallback con Invoke-WebRequest..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
        Write-Host "Descargado con éxito vía WebRequest."
    }
}

# ------------------------------------------------------------------------------
# 1. INSTALAR NODE.JS PORTABLE
# ------------------------------------------------------------------------------
$nodeZip = Join-Path $downloadsDir "node.zip"

Write-Host "=== [1/5] Preparando Node.js ==="
if (-not (Test-Path (Join-Path $nodeDest "node.exe"))) {
    Download-File -url $nodeUrl -outputPath $nodeZip

    Write-Host "Extrayendo Node.js portable..."
    $nodeTemp = Join-Path $toolsDir "node_temp"
    if (Test-Path $nodeTemp) { Remove-Item -Recurse -Force $nodeTemp }
    New-Item -ItemType Directory -Path $nodeTemp | Out-Null
    
    Expand-Archive -Path $nodeZip -DestinationPath $nodeTemp -Force
    
    # Mover el contenido de la carpeta interna a tools/node
    $extractedFolder = Get-ChildItem $nodeTemp | Select-Object -First 1
    if ($extractedFolder) {
        if (Test-Path $nodeDest) { Remove-Item -Recurse -Force $nodeDest }
        Move-Item -Path $extractedFolder.FullName -Destination $nodeDest
    }
    
    # Limpieza
    Remove-Item -Recurse -Force $nodeTemp
    Remove-Item -Force $nodeZip
    Write-Host "Node.js configurado correctamente en: $nodeDest"
} else {
    Write-Host "Node.js ya está instalado en $nodeDest. Saltando paso."
}

# ------------------------------------------------------------------------------
# 2. INSTALAR LIBREOFFICE (EXTRACCIÓN LOCAL SIN ADMIN)
# ------------------------------------------------------------------------------
$loPaf = Join-Path $downloadsDir "libreoffice_portable.paf.exe"

Write-Host "`n=== [2/5] Preparando LibreOffice Portable ==="
$sofficePath = Join-Path $loDest "App\libreoffice\program\soffice.exe"
if (-not (Test-Path $sofficePath)) {
    Download-File -url $loUrl -outputPath $loPaf

    Write-Host "Extrayendo LibreOffice Portable silenciosamente (sin requerir Administrador)..."
    if (Test-Path $loDest) { Remove-Item -Recurse -Force $loDest }
    New-Item -ItemType Directory -Path $loDest | Out-Null
    
    # Ejecutar el instalador PAF de PortableApps en modo silencioso (/S)
    # y configurar el directorio de destino (/D=...)
    $process = Start-Process -FilePath $loPaf -ArgumentList "/S", "/D=$loDest" -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -ne 0) {
        Write-Warning "El extractor de PortableApps devolvió un código de error: $($process.ExitCode)"
    }

    # Limpiar instalador temporal
    if (Test-Path $loPaf) { 
        try { Remove-Item -Force $loPaf -ErrorAction Stop } catch { Write-Warning "No se pudo borrar $loPaf. Posiblemente en uso." }
    }
} else {
    Write-Host "LibreOffice Portable ya está extraído en $loDest. Saltando paso."
}

# ------------------------------------------------------------------------------
# 3. VERIFICAR INSTALACIÓN DE HERRAMIENTAS
# ------------------------------------------------------------------------------
Write-Host "`n=== [3/5] Verificando ejecutables ==="

$nodeExe = Join-Path $nodeDest "node.exe"
if (Test-Path $nodeExe) {
    $nodeVer = & $nodeExe -v
    Write-Host "Node.js funcionando: $nodeVer"
} else {
    Write-Error "No se encontró node.exe en $nodeDest"
}

$sofficeExe = Join-Path $loDest "App\libreoffice\program\soffice.exe"
if (-not (Test-Path $sofficeExe)) {
    $sofficeExe = Join-Path $loDest "program\soffice.exe"
}
if (-not (Test-Path $sofficeExe)) {
    $sofficeExe = Join-Path $loDest "LibreOffice\program\soffice.exe"
}

if (Test-Path $sofficeExe) {
    Write-Host "LibreOffice funcionando. Ejecutable en: $sofficeExe"
} else {
    Write-Error "No se encontró soffice.exe en $loDest ni en sus subcarpetas."
}

# ------------------------------------------------------------------------------
# 4. INSTALAR DEPENDENCIAS DEL BACKEND
# ------------------------------------------------------------------------------
Write-Host "`n=== [4/5] Instalando dependencias de Node.js ==="
$npmCmd = Join-Path $nodeDest "npm.cmd"
if (Test-Path $npmCmd) {
    Write-Host "Ejecutando npm install..."
    & $npmCmd install
    Write-Host "Dependencias instaladas con éxito."
} else {
    Write-Error "No se encontró npm.cmd en $nodeDest"
}

# Limpiar carpeta de descargas temporales si todo está correcto
if (Test-Path $downloadsDir) { 
    try { Remove-Item -Recurse -Force $downloadsDir -ErrorAction Stop } catch { Write-Warning "No se pudo borrar $downloadsDir por completo." }
}

Write-Host "`n=== [5/5] Instalación Completada con Éxito ==="
Write-Host "Para iniciar el servidor ejecuta:"
Write-Host "  .\tools\node\node.exe server.js"
Write-Host "-------------------------------------------------------"
