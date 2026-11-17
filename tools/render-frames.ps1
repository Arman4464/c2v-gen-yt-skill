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
  [string]$StopTime = "", # e.g. "07:00" cutoff to stop morning renders cleanly
  [int]$Concurrency = 2
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
if (-not (Test-Path $ffprobe)) {
  $cmdProbe = Get-Command ffprobe -ErrorAction SilentlyContinue
  if ($cmdProbe) {
    $ffprobe = $cmdProbe.Source
  } else {
    $ffprobe = $null
  }
}

$wavPath = Join-Path $root $Wav
if ($Total -le 0) {
  if ((Test-Path $wavPath) -and $ffprobe) {
    $durOutput = & $ffprobe -v error -show_entries format=duration -of csv=p=0 $wavPath
    $dur = 0.0
    if ($durOutput -and [double]::TryParse($durOutput, [ref]$dur)) {
      $Total = [math]::Ceiling($dur * 30)
    } else {
      $Total = 1460
    }
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

function Test-PngValid([string]$p) {
  $item = Get-Item $p -ErrorAction SilentlyContinue
  if (-not $item -or $item.Length -lt 10240) { return $false }
  try {
    $fs = [System.IO.File]::Open($p, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    if ($fs.Length -lt 12) { $fs.Dispose(); return $false }
    $fs.Seek(-12, [System.IO.SeekOrigin]::End) | Out-Null
    $buf = New-Object byte[] 8
    $null = $fs.Read($buf, 0, 8)
    $fs.Dispose()
    # Validate PNG IEND signature bytes (0x49, 0x45, 0x4E, 0x44)
    if ($buf[4] -eq 0x49 -and $buf[5] -eq 0x45 -and $buf[6] -eq 0x4E -and $buf[7] -eq 0x44) {
      return $true
    }
    return $false
  } catch {
    return $false
  }
}

function Test-Chunk($s, $e) {
  for ($i = $s; $i -le $e; $i++) {
    $f = Join-Path $frames ("element-{0:d4}.png" -f $i)
    if (-not (Test-PngValid $f)) { return $false }
  }
  return $true
}

$targetCutoff = $null
if ($StopTime) {
  try {
    $timeParts = $StopTime.Split(':')
    $stopHour = [int]$timeParts[0]
    $stopMin = [int]$timeParts[1]
    $todayCutoff = (Get-Date).Date.AddHours($stopHour).AddMinutes($stopMin)
    if ((Get-Date) -gt $todayCutoff) {
      $targetCutoff = $todayCutoff.AddDays(1)
    } else {
      $targetCutoff = $todayCutoff
    }
  } catch {
    Write-Warning "Failed to parse StopTime '$StopTime'. Format should be HH:mm."
  }
}

$gpuName = (Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name -First 1)
if (-not $gpuName) { $gpuName = "GPU" }

# Pre-render composite soundtrack (Foley SFX + music bed + voiceover) if missing
$soundtrackPath = Join-Path $root "out\$slug\soundtrack.wav"
if (-not (Test-Path $soundtrackPath)) {
  Write-Host "Pre-rendering composite soundtrack for '$Composition' -> $soundtrackPath..."
  $soundtrackDir = Split-Path -Parent $soundtrackPath
  if (-not (Test-Path $soundtrackDir)) { New-Item -ItemType Directory -Force -Path $soundtrackDir | Out-Null }
  & cmd /c "node_modules\.bin\remotion.cmd render src/index.ts $Composition `"$soundtrackPath`" --log=error"
  if (Test-Path $soundtrackPath) {
    Write-Host "Soundtrack successfully rendered: $soundtrackPath" -ForegroundColor Green
  } else {
    Write-Warning "Could not render soundtrack to $soundtrackPath. Mux may fall back to dry narration."
  }
}

Add-Content $logPath ("=== run {0} composition={1} total={2} chunk={3} stopTime={4} ===" -f (Get-Date -Format s), $Composition, $Total, $Chunk, $StopTime)
Write-Host "Starting chunked render for '$Composition' (Total frames: $Total, Chunk size: $Chunk)..."

for ($s = 0; $s -lt $Total; $s += $Chunk) {
  $e = [Math]::Min($s + $Chunk - 1, $Total - 1)
  Normalize-Frames

  # Check if scheduled cutoff time has arrived
  if ($targetCutoff -and ((Get-Date) -ge $targetCutoff)) {
    $msg = ("Reached scheduled cutoff time ({0} at {1}). Pausing cleanly. Finished chunks are safely stored." -f $StopTime, (Get-Date -Format 'HH:mm:ss'))
    Add-Content $logPath ("=== {0} ===" -f $msg)
    Write-Host $msg -ForegroundColor Yellow
    break
  }

  if (Test-Chunk $s $e) {
    Add-Content $logPath ("skip {0}-{1} (already done)" -f $s, $e)
    Write-Host "Chunk $s-$e already rendered, skipping..."
    continue
  }

  Write-Host "Rendering chunk $s-$e using $gpuName (ANGLE D3D11, ${Concurrency}x)..."
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $renderOutput = & cmd /c "node_modules\.bin\remotion.cmd render src/index.ts $Composition `"$frames`" --sequence --image-format=png --frames=$s-$e --gl=angle --concurrency=$Concurrency --log=error 2>&1"
  $code = $LASTEXITCODE
  $sw.Stop()

  if ($code -ne 0) {
    Write-Warning "Render failed for chunk $s-$e with exit code $code"
    if ($renderOutput) {
      $renderOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
      Add-Content $logPath ($renderOutput -join "`n")
    }
  }

  Normalize-Frames
  $has = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
  $entry = ("chunk {0}-{1} exit={2} {3:n1}s onDisk={4}/{5}" -f $s, $e, $code, $sw.Elapsed.TotalSeconds, $has, $Total)
  Add-Content $logPath $entry
  Write-Host $entry
}

$finalCount = (Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
Add-Content $logPath ("=== session done {0} onDisk={1}/{2} ===" -f (Get-Date -Format s), $finalCount, $Total)
Write-Host "Session complete. Frames on disk: $finalCount / $Total."
