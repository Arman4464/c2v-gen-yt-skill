# Encode kept PNG frames for YouTube 1080x1920 30fps upload standard.
# 2-pass VBR 8 Mbps, 2-sec closed GOP, BT.709, AAC 384k.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\encode-youtube.ps1
#   powershell -ExecutionPolicy Bypass -File tools\encode-youtube.ps1 -Wav public\emu_voiceover.wav -Out out\emu-youtube.mp4

param(
  [string]$Wav = "public\emu_voiceover.wav",
  [string]$FramesDir = "out\frames\emu",
  [string]$Out = "out\emu\video-youtube.mp4",
  [string]$Audio = "" # Optional path to composite soundtrack (defaults to soundtrack.wav if present, else $Wav)
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ff = 'node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe'
$fp = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$frames = Join-Path $root $FramesDir
$wavPath = Join-Path $root $Wav
$outPath = Join-Path $root $Out

# Determine best audio track: use composite mixed soundtrack if available
$finalAudio = $wavPath
if (-not [string]::IsNullOrWhiteSpace($Audio) -and (Test-Path (Join-Path $root $Audio))) {
  $finalAudio = Join-Path $root $Audio
} else {
  $slug = [System.IO.Path]::GetFileName($FramesDir)
  $candidate = Join-Path $root "out\$slug\soundtrack.wav"
  if (Test-Path $candidate) {
    $finalAudio = $candidate
  }
}

$dur = [double](& $fp -v error -show_entries format=duration -of csv=p=0 $finalAudio)
$expected = [math]::Ceiling($dur * 30)
$count = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
if ($count -lt $expected) {
  throw "Incomplete frame sequence ($count / $expected) - run tools\render-frames.ps1 first"
}

$src = @('-framerate', '30', '-start_number', '0', '-i', "$frames\element-%04d.png", '-i', $finalAudio)
$enc = @('-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
  '-b:v', '8M', '-maxrate', '12M', '-bufsize', '16M',
  '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709')

Write-Host "Encoding YouTube 2-pass VBR..."
& $ff -y -hide_banner -loglevel warning @src @enc -pass 1 -passlogfile out\ytpass -an -f null -
if ($LASTEXITCODE -ne 0) { throw "YouTube pass 1 failed" }

& $ff -y -hide_banner -loglevel warning @src @enc -pass 2 -passlogfile out\ytpass `
  -c:a aac -ar 48000 -ac 2 -b:a 384k -movflags +faststart -shortest $outPath
if ($LASTEXITCODE -ne 0) { throw "YouTube pass 2 failed" }

Remove-Item out\ytpass* -Force -ErrorAction SilentlyContinue
Write-Host "YouTube encode ready: $outPath"
