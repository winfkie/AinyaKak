param(
  [string]$EnvFile = "../.env",
  [string]$ScriptFile = "../../docs/video-1-script.txt",
  [string]$VoiceOut = "../out/voiceover.mp3",
  [string]$RemotionOut = "../out/cfd-promo.mp4",
  [string]$MusicIn = "../assets/music/background.mp3",
  [string]$FinalOut = "../out/cfd-promo-final.mp4",
  [string]$CaptionFile = "../../docs/video-1-caption.txt",
  [switch]$SkipVoice,
  [switch]$SkipRender,
  [switch]$SkipMix,
  [switch]$Publish
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

function Load-DotEnv([string]$Path) {
  if (!(Test-Path $Path)) { return }
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
}

Load-DotEnv $EnvFile
New-Item -ItemType Directory -Force -Path "../out" | Out-Null

if (!(Test-Path $ScriptFile)) { throw "Script file tidak ditemukan: $ScriptFile" }
$scriptText = (Get-Content $ScriptFile -Raw).Trim()
if (!$scriptText) { throw "Script kosong: $ScriptFile" }

if (-not $SkipVoice) {
  if (!$env:ELEVENLABS_API_KEY -or !$env:ELEVENLABS_VOICE_ID) {
    throw "ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID belum diisi. Isi media/.env dulu."
  }
  Write-Host "== ElevenLabs: generate voiceover =="
  node ./generate_voiceover_elevenlabs.mjs $scriptText $VoiceOut
}

if (-not $SkipRender) {
  Write-Host "== Remotion: render video =="
  Push-Location ../remotion
  if (!(Test-Path node_modules)) { npm install }
  npx remotion render src/index.ts CfdPromo $RemotionOut
  Pop-Location
}

if (-not $SkipMix) {
  Write-Host "== FFmpeg: mix audio =="
  $musicArg = @()
  if (Test-Path $MusicIn) { $musicArg = @("-MusicIn", $MusicIn) }
  ./mix_audio_ffmpeg.ps1 -VideoIn $RemotionOut -VoiceIn $VoiceOut -VideoOut $FinalOut @musicArg
}

if ($Publish) {
  if (!$env:R2_PUBLIC_BASE_URL) {
    throw "R2_PUBLIC_BASE_URL belum diisi. Aktifkan R2, upload media/out/cfd-promo-final.mp4, lalu isi URL publik."
  }
  $videoUrl = "$($env:R2_PUBLIC_BASE_URL.TrimEnd('/'))/$($env:R2_VIDEO_PREFIX.TrimStart('/'))/cfd-promo-final.mp4"
  $caption = ""
  if (Test-Path $CaptionFile) { $caption = (Get-Content $CaptionFile -Raw).Trim() }
  Write-Host "== Publish Instagram =="
  node ./publish_instagram.mjs $videoUrl $caption
}

Write-Host "Pipeline selesai. Output: $FinalOut"