$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$venvPath = Join-Path $projectRoot '.chroma-venv'
$python = Join-Path $venvPath 'Scripts\\python.exe'

if (-not (Test-Path $python)) {
  python -m venv $venvPath
}

& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $projectRoot 'requirements-chroma.txt')
Write-Host 'ChromaDB setup completed. Start it with: npm.cmd run chroma'
