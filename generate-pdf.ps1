# Script para compilar el Cronograma Oficial a formato PDF usando Google Chrome o Microsoft Edge en modo Headless

$ErrorActionPreference = "Stop"

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$browser = if (Test-Path $chromePath) { $chromePath } elseif (Test-Path $edgePath) { $edgePath } else {
    Write-Error "No se encontró ni Google Chrome ni Microsoft Edge en las rutas estándar."
}

$htmlFile = Join-Path $PSScriptRoot "cronograma-oficial-48h.html"
$pdfDocs = Join-Path $PSScriptRoot "docs\cronograma-oficial-48h.pdf"
$pdfRoot = Join-Path $PSScriptRoot "cronograma-oficial-48h.pdf"

if (-not (Test-Path $htmlFile)) {
    Write-Error "No se encontró el archivo origen: $htmlFile"
}

Write-Host "Generando PDF con $browser..." -ForegroundColor Cyan

& $browser --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw "--print-to-pdf=$pdfDocs" "$htmlFile"

Start-Sleep -Seconds 2

if (Test-Path $pdfDocs) {
    Copy-Item $pdfDocs $pdfRoot -Force
    $size = (Get-Item $pdfDocs).Length
    Write-Host "¡PDF generado con éxito en:" -ForegroundColor Green
    Write-Host "  1. $pdfDocs ($([Math]::Round($size/1KB, 1)) KB)" -ForegroundColor White
    Write-Host "  2. $pdfRoot ($([Math]::Round($size/1KB, 1)) KB)" -ForegroundColor White
} else {
    Write-Error "Falló la generación del archivo PDF."
}
