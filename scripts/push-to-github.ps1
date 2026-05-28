# One-click: stage all safe changes, commit, push to GitHub (Vercel auto-deploys).
# Usage:
#   .\scripts\push-to-github.ps1
#   .\scripts\push-to-github.ps1 -Message "fix settings hours"

param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

# So you do not need to set PATH manually each time (Windows).
$gitCmd = "D:\Program Files\Git\cmd"
$nodeDir = "D:\Program Files\nodejs"
if (Test-Path $gitCmd) { $env:Path = "$gitCmd;$nodeDir;" + $env:Path }

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# Keep Chinese commit messages readable on Windows.
chcp 65001 | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

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
try {
  Invoke-Git @("push")
} catch {
  Write-Host "`nPush failed (network). Your commit is saved on this PC." -ForegroundColor Yellow
  Write-Host "When GitHub is reachable, run only:" -ForegroundColor Yellow
  Write-Host "  cd d:\cursor\GroomerFlow" -ForegroundColor White
  Write-Host "  git push`n" -ForegroundColor White
  exit 1
}

Write-Host "`nDone. Vercel will redeploy in 1-3 minutes if the project is connected." -ForegroundColor Cyan
Write-Host "Check: https://www.getgroomerflow.com`n"
