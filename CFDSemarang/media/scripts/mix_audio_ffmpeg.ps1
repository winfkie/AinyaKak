param(
  [Parameter(Mandatory=$true)][string]$VideoIn,
  [Parameter(Mandatory=$true)][string]$VoiceIn,
  [Parameter(Mandatory=$true)][string]$VideoOut,
  [string]$MusicIn = "",
  [double]$MusicVolume = 0.12
)

$ErrorActionPreference = "Stop"
if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw "ffmpeg tidak ditemukan di PATH" }
if (!(Test-Path $VideoIn)) { throw "VideoIn tidak ditemukan: $VideoIn" }
if (!(Test-Path $VoiceIn)) { throw "VoiceIn tidak ditemukan: $VoiceIn" }

$outDir = Split-Path -Parent $VideoOut
if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

if ($MusicIn -and (Test-Path $MusicIn)) {
  ffmpeg -y -i $VideoIn -i $VoiceIn -i $MusicIn -filter_complex `
    "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=async=1:first_pts=0[voice];[2:a]volume=$MusicVolume,aresample=async=1:first_pts=0[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[a]" `
    -map 0:v:0 -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart $VideoOut
} else {
  ffmpeg -y -i $VideoIn -i $VoiceIn -filter_complex `
    "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=async=1:first_pts=0[a]" `
    -map 0:v:0 -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart $VideoOut
}

Write-Host "OK -> $VideoOut"