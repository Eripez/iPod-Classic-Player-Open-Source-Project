# setup.ps1
Write-Host "Configurando iPod Classic Player..." -ForegroundColor Green

# Crear carpeta renderer si no existe
if (-not (Test-Path "renderer")) {
    New-Item -ItemType Directory -Path "renderer" -Force
    Write-Host "Carpeta renderer creada" -ForegroundColor Yellow
}

# Lista de archivos que deben estar en renderer
$rendererFiles = @(
    "index.html",
    "style.css",
    "renderer.js",
    "config.js"
)

# Mover archivos a renderer si existen en la raíz
foreach ($file in $rendererFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "renderer\" -Force
        Write-Host "Movido: $file a renderer\" -ForegroundColor Green
    } else {
        Write-Host "Archivo no encontrado en raíz: $file" -ForegroundColor Red
    }
}

# Verificar archivos principales
$mainFiles = @(
    "main.js",
    "preload.js",
    "package.json"
)

foreach ($file in $mainFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "ERROR: Archivo faltante: $file" -ForegroundColor Red
    } else {
        Write-Host "OK: $file" -ForegroundColor Green
    }
}

Write-Host "`nVerifica que todos los archivos estén en su lugar:"
Write-Host "Archivos en raíz:" -ForegroundColor Cyan
dir *.js *.json

Write-Host "`nArchivos en renderer:" -ForegroundColor Cyan
dir renderer\*.*

Write-Host "`nPara ejecutar: npm start" -ForegroundColor Yellow