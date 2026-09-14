$ErrorActionPreference = 'Stop'
$port = 4173

$lanAddress = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $lanAddress) {
  $lanAddress = '127.0.0.1'
}

$portInUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Host "El puerto $port ya esta en uso. Cierra el servidor actual o elige otro puerto." -ForegroundColor Yellow
  exit 1
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
  Write-Host 'No se encontro Python. Instala Python 3 o inicia el servidor con npm run dev.' -ForegroundColor Red
  exit 1
}

Push-Location $PSScriptRoot
try {
  Write-Host ''
  Write-Host 'Horizonte 55 esta disponible en la red local:' -ForegroundColor Green
  Write-Host "  Este equipo: http://localhost:$port" -ForegroundColor Cyan
  Write-Host "  Otros equipos: http://${lanAddress}:$port" -ForegroundColor Cyan
  Write-Host ''
  Write-Host 'Todos los dispositivos deben estar conectados a la misma red Wi-Fi.' -ForegroundColor DarkGray
  Write-Host 'Pulsa Ctrl+C para detener el lanzador.' -ForegroundColor DarkGray
  Write-Host ''
  & $python.Source -m http.server $port --bind 0.0.0.0
}
finally {
  Pop-Location
}
