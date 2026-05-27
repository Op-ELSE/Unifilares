# PowerShell script to resize the EPP image in the Word template and adjust spacing
# ---------------------------------------------------------------
# This script:
#   1. Extracts `Anexo plantilla.docx` (a zip archive) to a temp folder.
#   2. Modifies the image extents in `word/document.xml` so the picture
#      size becomes 3.5 cm × 10 cm (EMU units: 1 cm = 360 000).
#   3. Inserts two line‑breaks after the paragraph that contains the image
#      (equivalent to two <Enter> presses).
#   4. Re‑zips the contents into `Anexo plantilla_updated.docx`.
#
$docxPath = "Anexo plantilla.docx"
$outputPath = "Anexo plantilla_updated.docx"

# Create a temporary folder
$tempDir = Join-Path $env:TEMP "docx_temp_$(Get-Random)"
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Unzip the .docx file
Expand-Archive -Path $docxPath -DestinationPath $tempDir -Force

$xmlPath = Join-Path $tempDir "word\document.xml"
[xml]$xml = Get-Content $xmlPath

# XML namespaces
$ns = New-Object System.Xml.XmlNamespaceManager $xml.NameTable
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$ns.AddNamespace('wp','http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')

# ---------------------------------------------------------------------
# 1️⃣ Resize every <wp:extent> element (the picture dimensions)
#    3.5 cm = 1 260 000 EMU, 10 cm = 3 600 000 EMU
# ---------------------------------------------------------------------
$extents = $xml.SelectNodes('//wp:extent',$ns)
foreach($e in $extents){
    $e.cx = '1260000'   # width
    $e.cy = '3600000'   # height
}

# ---------------------------------------------------------------------
# 2️⃣ Insert two line‑breaks (two <Enter>) after the paragraph that contains the image
# ---------------------------------------------------------------------
$paragraphs = $xml.SelectNodes('//w:p',$ns)
for($i = 0; $i -lt $paragraphs.Count; $i++){
    $p = $paragraphs[$i]
    if($p.InnerXml -match '<wp:extent'){
        $next = $paragraphs[$i+1]
        if($next){
            # Create two <w:r><w:br/></w:r> nodes
            $br = $xml.CreateElement('w:br',$ns.LookupNamespace('w'))
            $r  = $xml.CreateElement('w:r',$ns.LookupNamespace('w'))
            $r.AppendChild($br) | Out-Null
            $r2 = $r.Clone()
            $next.InsertBefore($r,$next.FirstChild) | Out-Null
            $next.InsertBefore($r2,$next.FirstChild) | Out-Null
        }
    }
}

# Save the modified XML
$xml.Save($xmlPath)

# ---------------------------------------------------------------------
# 3️⃣ Re‑zip the folder into a new .docx file
# ---------------------------------------------------------------------
if(Test-Path $outputPath){ Remove-Item $outputPath -Force }
Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $outputPath -Force

Write-Host "Updated Word template created: $outputPath"

# Clean up temporary folder
Remove-Item -Recurse -Force $tempDir
