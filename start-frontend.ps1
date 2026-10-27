param(
    [ValidateRange(1024,65535)] [int]$Port = 8091,
    [string]$PythonExe = ''
)
$ErrorActionPreference = 'Stop'
$webRoot = Join-Path $PSScriptRoot 'web'
Write-Host "AgentLedger Social: http://127.0.0.1:$Port"
Write-Host 'Open in Chrome / Edge. Keep this terminal open; Ctrl+C stops the local server.'
if ($PythonExe) {
    if (-not (Test-Path -LiteralPath $PythonExe -PathType Leaf)) { throw 'The specified Python executable does not exist.' }
    & $PythonExe -u -m http.server $Port --bind 127.0.0.1 --directory $webRoot
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    $previousPort = $env:PORT
    Push-Location $PSScriptRoot
    try { $env:PORT = "$Port"; & node scripts/serve.mjs }
    finally { $env:PORT = $previousPort; Pop-Location }
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 -u -m http.server $Port --bind 127.0.0.1 --directory $webRoot
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    & python3 -u -m http.server $Port --bind 127.0.0.1 --directory $webRoot
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python -u -m http.server $Port --bind 127.0.0.1 --directory $webRoot
} else { throw 'Install Node.js 20+ or Python 3, or supply -PythonExe with an existing python.exe path.' }
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 130) { throw 'Server stopped with an error. Check whether the port is in use.' }
