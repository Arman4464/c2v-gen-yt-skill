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
if (-not (Test-Path $ff)) {
  $cmdFf = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($cmdFf) { $ff = $cmdFf.Source }
}
$fp = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
if (-not (Test-Path $fp)) {
  $cmdFp = Get-Command ffprobe -ErrorAction SilentlyContinue
  if ($cmdFp) { $fp = $cmdFp.Source }
}
$frames = Join-Path $root $FramesDir
$wavPath = Join-Path $root $Wav
$outPath = Join-Path $root $Out

$outDir = Split-Path $outPath -Parent
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
if (-not (Test-Path 'out')) { New-Item -ItemType Directory -Force -Path 'out' | Out-Null }

# Determine best audio track: use composite mixed soundtrack if available
$finalAudio = $wavPath
if (-not [string]::IsNullOrWhiteSpace($Audio) -and (Test-Path (Join-Path $root $Audio))) {
  $finalAudio = Join-Path $root $Audio
} else {
  $slug = [System.IO.Path]::GetFileName($FramesDir)
  $candidate = Join-Path $root "out\$slug\soundtrack.wav"
  if (Test-Path $candidate) {
    $finalAudio = $candidate
  } else {
    $comp = switch ($slug) {
      "emu"      { "EmuWar" }
      "molasses" { "MolassesFlood" }
      "demo"     { "RicksClipsDemo" }
      "monalisa" { "MonaLisaHeist" }
      "template" { "CartoonShortsTemplate" }
      default    { $null }
    }
    if ($comp) {
      Write-Host "Rendering missing composite soundtrack for '$comp'..."
      $candidateDir = Split-Path -Parent $candidate
      if (-not (Test-Path $candidateDir)) { New-Item -ItemType Directory -Force -Path $candidateDir | Out-Null }
      & cmd /c "node_modules\.bin\remotion.cmd render src/index.ts $comp `"$candidate`" --log=error"
      if (Test-Path $candidate) { $finalAudio = $candidate }
    }
  }
}

$dur = [double](& $fp -v error -show_entries format=duration -of csv=p=0 $finalAudio)
$expected = [math]::Ceiling($dur * 30)
$count = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
if ($count -lt ($expected - 2)) {
  throw "Incomplete frame sequence ($count / $expected) - run tools\render-frames.ps1 first"
}

$src = @('-framerate', '30', '-start_number', '0', '-i', "$frames\element-%04d.png", '-i', $finalAudio)
$enc = @('-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
  '-b:v', '8M', '-maxrate', '12M', '-bufsize', '16M',
  '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709')

$nullDevice = if ($IsWindows -or $env:OS -match 'Windows') { 'NUL' } else { '/dev/null' }
Write-Host "Encoding YouTube 2-pass VBR..."
& $ff -y -hide_banner -loglevel warning @src @enc -pass 1 -passlogfile out\ytpass -an -f null $nullDevice
if ($LASTEXITCODE -ne 0) { throw "YouTube pass 1 failed" }

& $ff -y -hide_banner -loglevel warning @src @enc -pass 2 -passlogfile out\ytpass `
  -c:a aac -ar 48000 -ac 2 -b:a 384k -movflags +faststart -shortest $outPath
if ($LASTEXITCODE -ne 0) { throw "YouTube pass 2 failed" }

Remove-Item out\ytpass* -Force -ErrorAction SilentlyContinue
Remove-Item ffmpeg2pass* -Force -ErrorAction SilentlyContinue
Write-Host "YouTube encode ready: $outPath"
