# Encode out\frames + narration into final master video (CRF 14, BT.709, AAC).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\mux-frames.ps1
#   powershell -ExecutionPolicy Bypass -File tools\mux-frames.ps1 -Wav public\emu_voiceover.wav -Out out\emu-video.mp4

param(
  [string]$Wav = "public\emu_voiceover.wav",
  [string]$FramesDir = "out\frames\emu",
  [string]$Out = "out\emu\video.mp4",
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
Write-Host "Muxing frames: $count / $expected (using $([System.IO.Path]::GetFileName($finalAudio)), $([math]::Round($dur, 2))s @ 30fps)"

if ($count -lt ($expected - 2)) {
  throw "Incomplete frame sequence ($count / $expected). Run tools\render-frames.ps1 to complete all chunks before muxing."
}

& $ff -y -hide_banner -loglevel warning `
  -framerate 30 -start_number 0 -i "$frames\element-%04d.png" `
  -i $finalAudio `
  -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p `
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv `
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" `
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest $outPath

if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed with exit code $LASTEXITCODE" }

Write-Host "Master render complete: $outPath"
