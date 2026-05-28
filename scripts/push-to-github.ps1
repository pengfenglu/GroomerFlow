# One-click: stage all safe changes, commit, push to GitHub (Vercel auto-deploys).
# Usage:
#   .\scripts\push-to-github.ps1
#   .\scripts\push-to-github.ps1 -Message "fix settings hours"

param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-Git {
  param([string[]]$GitArgs)
  $output = & git @GitArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join "`n")
  }
  return $output
}

Write-Host "== GetGroomerFlow: push to GitHub ==" -ForegroundColor Cyan
Write-Host "Folder: $repoRoot`n"

Invoke-Git @("rev-parse", "--is-inside-work-tree") | Out-Null

$status = Invoke-Git @("status", "--porcelain")
if (-not $status) {
  Write-Host "Nothing to push. No file changes detected." -ForegroundColor Yellow
  exit 0
}

Write-Host "Changes to include:" -ForegroundColor Gray
Invoke-Git @("status", "--short") | ForEach-Object { Write-Host "  $_" }

Invoke-Git @("add", "-A")

if (-not $Message.Trim()) {
  $Message = "chore: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host "`nCommit: $Message" -ForegroundColor Green
Invoke-Git @("commit", "-m", $Message)

Write-Host "`nPushing to GitHub..." -ForegroundColor Green
Invoke-Git @("push")

Write-Host "`nDone. Vercel will redeploy in 1-3 minutes if the project is connected." -ForegroundColor Cyan
Write-Host "Check: https://www.getgroomerflow.com`n"
