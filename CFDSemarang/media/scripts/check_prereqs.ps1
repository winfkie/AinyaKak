param(
  [string]$EnvFile = "../.env"
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

function Load-DotEnv([string]$Path) {
  if (!(Test-Path $Path)) { return $false }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
    [Environment]::SetEnvironmentVariable($key, $val)
  }
  return $true
}

$envLoaded = Load-DotEnv $EnvFile
$results = @()

function Add-Result($name, $ok, $detail) {
  $script:results += [pscustomobject]@{ Check = $name; OK = $ok; Detail = $detail }
}

Add-Result "media/.env" $envLoaded $(if ($envLoaded) { "loaded" } else { "missing - copy from media/.env.example" })

$node = Get-Command node -ErrorAction SilentlyContinue
Add-Result "Node.js" ([bool]$node) $(if ($node) { (& node -v) } else { "not found" })
$npm = Get-Command npm -ErrorAction SilentlyContinue
Add-Result "npm" ([bool]$npm) $(if ($npm) { (& npm -v) } else { "not found" })
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
Add-Result "FFmpeg" ([bool]$ffmpeg) $(if ($ffmpeg) { "found" } else { "not found in PATH" })

Add-Result "ELEVENLABS_API_KEY" ([bool]$env:ELEVENLABS_API_KEY) $(if ($env:ELEVENLABS_API_KEY) { "set" } else { "missing" })
Add-Result "ELEVENLABS_VOICE_ID" ([bool]$env:ELEVENLABS_VOICE_ID) $(if ($env:ELEVENLABS_VOICE_ID) { "set" } else { "missing" })
Add-Result "R2_PUBLIC_BASE_URL" ([bool]$env:R2_PUBLIC_BASE_URL) $(if ($env:R2_PUBLIC_BASE_URL) { "set" } else { "missing (R2 pending)" })
Add-Result "ADMIN_PIN" ([bool]$env:ADMIN_PIN) $(if ($env:ADMIN_PIN) { "set" } else { "missing" })

$paths = @(
  "../../docs/video-1-script.txt",
  "../../docs/video-1-caption.txt",
  "../../docs/video-1-brief.md",
  "../flow/asset-manifest.json",
  "../remotion/src/CfdPromo.tsx",
  "../remotion/public/qr-cfdsemarang.svg"
)
foreach ($p in $paths) {
  $exists = Test-Path $p
  Add-Result "File: $p" $exists $(if ($exists) { "ok" } else { "missing" })
}

$results | Format-Table -AutoSize
$failed = $results | Where-Object { -not $_.OK }
if ($failed.Count -gt 0) {
  Write-Host "`nPending checks: $($failed.Count). Ini normal jika R2/ElevenLabs belum diisi." -ForegroundColor Yellow
  exit 1
}
Write-Host "`nAll checks passed." -ForegroundColor Green