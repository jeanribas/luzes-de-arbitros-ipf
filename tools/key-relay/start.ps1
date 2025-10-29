Param(
  [switch]$NoInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

if (-not $NoInstall -and -not (Test-Path -Path 'node_modules')) {
  Write-Host 'Instalando dependências (primeira execução)...'
  npm install --omit=dev
}

Clear-Host
node .\src\index.mjs
$status = $LASTEXITCODE

Write-Host ''
Write-Host 'Pressione Enter para fechar...'
[void][System.Console]::ReadLine()

exit $status
