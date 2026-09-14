$ErrorActionPreference = 'Stop'
$port = 4173
$url = "http://localhost:$port/index.html"

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) { $python = Get-Command py -ErrorAction SilentlyContinue }
  if (-not $python) {
    Write-Host 'No se encontro Python. Ejecuta npm install y despues npm run dev.' -ForegroundColor Red
    Read-Host 'Pulsa Enter para cerrar'
    exit 1
  }
  Start-Process -FilePath $python.Source -ArgumentList '-m http.server 4173 --bind 127.0.0.1' -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
}

Start-Process $url
Write-Host "Horizonte 55 abierto en $url" -ForegroundColor Green
