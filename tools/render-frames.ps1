# Resumable, lossless chunked frame renderer for 2.5D cel-shaded cartoon shorts.
#
# Why: `remotion render` writes frames into a temp container and discards all progress on failure or reboot.
# This script writes lossless PNGs named by GLOBAL frame number into out\frames in chunks (default 150 frames),
# checking and skipping chunks that are already finished on disk.
# A crash, interruption, or scheduled window cutoff costs at most the chunk in progress; re-running fills gaps.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\render-frames.ps1
#   powershell -ExecutionPolicy Bypass -File tools\render-frames.ps1 -Composition EmuWar -Wav public\emu_voiceover.wav -Chunk 150 -StopTime "07:00"

param(
  [string]$Composition = "EmuWar",
  [string]$Wav = "public\emu_voiceover.wav",
  [int]$Chunk = 150,
  [int]$Total = 0,
  [string]$FramesDir = "",
  [string]$Log = "out\render-log.txt",
  [string]$StopTime = "" # e.g. "07:00" cutoff to stop morning renders cleanly
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$slug = switch -Regex ($Composition) {
  "Emu"        { "emu" }
  "Molasses"   { "molasses" }
  "Bridge"     { "demo" }
  "RicksClips" { "demo" }
  "MonaLisa"   { "monalisa" }
  "Template"   { "template" }
  default      { $Composition.ToLower() }
}
if (-not $FramesDir) { $FramesDir = "out\frames\$slug" }

$ffprobe = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$wavPath = Join-Path $root $Wav
if ($Total -le 0) {
  if (Test-Path $wavPath) {
    $dur = [double](& $ffprobe -v error -show_entries format=duration -of csv=p=0 $wavPath)
    $Total = [math]::Ceiling($dur * 30)
  } else {
    $Total = 1460
  }
}

$frames = Join-Path $root $FramesDir
$logPath = Join-Path $root $Log
New-Item -ItemType Directory -Force -Path $frames | Out-Null

function Normalize-Frames {
  Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.BaseName -match '^element-(\d+)$' -and $matches[1].Length -lt 4) {
      Move-Item -Force $_.FullName (Join-Path $frames ("element-{0:d4}.png" -f [int]$matches[1]))
    }
  }
}

function Test-Chunk($s, $e) {
  for ($i = $s; $i -le $e; $i++) {
    $f = Join-Path $frames ("element-{0:d4}.png" -f $i)
    if (-not (Test-Path $f)) { return $false }
    if ((Get-Item $f).Length -eq 0) { return $false }
  }
  return $true
}

Add-Content $logPath ("=== run {0} composition={1} total={2} chunk={3} stopTime={4} ===" -f (Get-Date -Format s), $Composition, $Total, $Chunk, $StopTime)
Write-Host "Starting chunked render for '$Composition' (Total frames: $Total, Chunk size: $Chunk)..."

for ($s = 0; $s -lt $Total; $s += $Chunk) {
  $e = [Math]::Min($s + $Chunk - 1, $Total - 1)
  Normalize-Frames

  # Check if scheduled cutoff time has arrived
  if ($StopTime) {
    $now = Get-Date
    $timeParts = $StopTime.Split(':')
    $stopHour = [int]$timeParts[0]
    $stopMin = [int]$timeParts[1]
    if (($now.Hour -eq $stopHour -and $now.Minute -ge $stopMin) -or ($now.Hour -gt $stopHour -and $now.Hour -lt 12)) {
      $msg = ("Reached scheduled cutoff time ({0} at {1}). Pausing cleanly. Finished chunks are safely stored." -f $StopTime, (Get-Date -Format 'HH:mm:ss'))
      Add-Content $logPath ("=== {0} ===" -f $msg)
      Write-Host $msg -ForegroundColor Yellow
      break
    }
  }

  if (Test-Chunk $s $e) {
    Add-Content $logPath ("skip {0}-{1} (already done)" -f $s, $e)
    Write-Host "Chunk $s-$e already rendered, skipping..."
    continue
  }

  Write-Host "Rendering chunk $s-$e using GT 710 (ANGLE D3D11)..."
  $sw = [Diagnostics.Stopwatch]::StartNew()
  & cmd /c "node_modules\.bin\remotion.cmd render src/index.ts $Composition `"$frames`" --sequence --image-format=png --frames=$s-$e --gl=angle --log=error 2>&1" | Out-Null
  $code = $LASTEXITCODE
  $sw.Stop()

  Normalize-Frames
  $has = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
  $entry = ("chunk {0}-{1} exit={2} {3:n1}s onDisk={4}/{5}" -f $s, $e, $code, $sw.Elapsed.TotalSeconds, $has, $Total)
  Add-Content $logPath $entry
  Write-Host $entry
}

$finalCount = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
Add-Content $logPath ("=== session done {0} onDisk={1}/{2} ===" -f (Get-Date -Format s), $finalCount, $Total)
Write-Host "Session complete. Frames on disk: $finalCount / $Total."
