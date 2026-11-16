# Universal Nightly Render Pipeline (4:00 AM - 7:00 AM)
# Processes a queue of videos: checks frames, renders incomplete chunks with 7:00 AM cutoff, and auto-encodes.

param(
  [string]$SpecificSlug = "" # Leave empty to process the whole queue in order
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$logPath = Join-Path $root 'out\render-log.txt'
Add-Content $logPath ("=== Universal Nightly Render Triggered: {0} ===" -f (Get-Date -Format s))

# Prevent PC from sleeping while rendering (ES_SYSTEM_REQUIRED | ES_CONTINUOUS)
$sig = @'
[DllImport("kernel32.dll", SetLastError = true)]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
$power = Add-Type -MemberDefinition $sig -Name "KeepAlive" -Namespace "SysPower" -PassThru -ErrorAction SilentlyContinue

# Define active video render queue
$Queue = @(
  @{ Slug = "emu";      Composition = "EmuWar";        Wav = "public\emu_voiceover.wav" },
  @{ Slug = "molasses"; Composition = "MolassesFlood";  Wav = "public\molasses_voiceover.wav" },
  @{ Slug = "monalisa"; Composition = "MonaLisaHeist";  Wav = "public\monalisa_voiceover.wav" }
)

if ($SpecificSlug) {
  $Queue = $Queue | Where-Object { $_.Slug -eq $SpecificSlug }
}

$ffprobe = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'

try {
  if ($power) { [SysPower.KeepAlive]::SetThreadExecutionState([uint32](0x80000001L)) | Out-Null }

  foreach ($job in $Queue) {
    # Check if 7:00 AM cutoff has already passed
    $now = Get-Date
    if (($now.Hour -eq 7 -and $now.Minute -ge 0) -or ($now.Hour -gt 7 -and $now.Hour -lt 12)) {
      Write-Host "Cutoff 07:00 AM reached. Exiting queue cleanly." -ForegroundColor Yellow
      break
    }

    $slug = $job.Slug
    $comp = $job.Composition
    $wavPath = Join-Path $root $job.Wav
    $framesDir = Join-Path $root "out\frames\$slug"
    $outDir = Join-Path $root "out\$slug"
    New-Item -ItemType Directory -Force -Path $framesDir, $outDir | Out-Null

    if (-not (Test-Path $wavPath)) {
      Write-Host "Voiceover for '$slug' not found at '$wavPath'. Skipping."
      continue
    }

    $dur = [double](& $ffprobe -v error -show_entries format=duration -of csv=p=0 $wavPath)
    $total = [math]::Ceiling($dur * 30)

    Write-Host "`n>>> Processing Queue Item: $slug ($comp) - Total Frames: $total <<<"

    # 1. Run chunked render (hidden in background)
    & powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\render-frames.ps1') `
      -Composition $comp `
      -Wav $job.Wav `
      -FramesDir "out\frames\$slug" `
      -Chunk 150 `
      -StopTime "07:00"

    # 2. Check if all frames completed
    $count = (Get-ChildItem $framesDir -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
    if ($count -ge $total) {
      $masterOut = "out\$slug\video.mp4"
      $ytOut = "out\$slug\video-youtube.mp4"

      if (-not (Test-Path (Join-Path $root $ytOut))) {
        Write-Host "All frames present for '$slug'. Running final master and YouTube encodes..."
        & powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\mux-frames.ps1') `
          -Wav $job.Wav `
          -FramesDir "out\frames\$slug" `
          -Out $masterOut

        & powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\encode-youtube.ps1') `
          -Wav $job.Wav `
          -FramesDir "out\frames\$slug" `
          -Out $ytOut

        Add-Content $logPath ("=== [$slug] Render and encodes completed successfully: {0} ===" -f (Get-Date -Format s))
      } else {
        Write-Host "Final encodes for '$slug' already exist on disk."
      }
    } else {
      Write-Host "Partial progress saved for '$slug' ($count/$total frames). Will continue on next window."
    }
  }
}
finally {
  # Release sleep lock
  try {
    if ($power) { [SysPower.KeepAlive]::SetThreadExecutionState([uint32](0x80000000L)) | Out-Null }
  } catch {}
}
