# Universal Nightly Render Pipeline (4:00 AM - 7:00 AM)
# Processes a queue of videos: checks frames, renders incomplete chunks with 7:00 AM cutoff, and auto-encodes.

param(
  [string]$SpecificSlug = "", # Leave empty to process the whole queue in order
  [int]$CutoffHour = 7,        # Cutoff hour (default 7:00 AM - no rendering past 7 AM)
  [string]$StopTime = "07:00", # Stop time for chunk renderers (HH:mm)
  [string]$ConfigFile = "render-queue.json", # Optional custom queue configuration for different users
  [switch]$Force               # Override cutoff only when explicitly passed
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
if (-not ([System.Management.Automation.PSTypeName]'SysPower.KeepAlive').Type) {
  Add-Type -MemberDefinition $sig -Name "KeepAlive" -Namespace "SysPower" -PassThru -ErrorAction SilentlyContinue
}
$power = ([System.Management.Automation.PSTypeName]'SysPower.KeepAlive').Type

# Define active video render queue (customizable via render-queue.json or script parameter)
$Queue = @(
  @{ Slug = "emu";      Composition = "EmuWar";        Wav = "public\emu_voiceover.wav" },
  @{ Slug = "molasses"; Composition = "MolassesFlood";  Wav = "public\molasses_voiceover.wav" },
  @{ Slug = "monalisa"; Composition = "MonaLisaHeist";  Wav = "public\monalisa_voiceover.wav" }
)

$configPath = Join-Path $root $ConfigFile
if (Test-Path $configPath) {
  try {
    $jsonQueue = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($jsonQueue -and $jsonQueue.Count -gt 0) {
      $Queue = @($jsonQueue)
      Write-Host "Loaded custom render queue from $ConfigFile ($($Queue.Count) jobs)"
    }
  } catch {
    Write-Warning "Could not parse $ConfigFile, using default queue."
  }
}

if ($SpecificSlug) {
  $Queue = $Queue | Where-Object { $_.Slug -eq $SpecificSlug }
}

$ffprobe = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
if (-not (Test-Path $ffprobe)) {
  $cmdProbe = Get-Command ffprobe -ErrorAction SilentlyContinue
  if ($cmdProbe) { $ffprobe = $cmdProbe.Source }
}

try {
  if ($power) { [SysPower.KeepAlive]::SetThreadExecutionState([uint32](0x80000001L)) | Out-Null }

  foreach ($job in $Queue) {
    # Check if 7:00 AM cutoff has already passed (strictly enforced unless -Force is explicitly supplied)
    $now = Get-Date
    if (-not $Force -and (($now.Hour -eq $CutoffHour -and $now.Minute -ge 0) -or ($now.Hour -gt $CutoffHour -and $now.Hour -lt 12))) {
      Write-Host ("Cutoff {0:d2}:00 AM reached. Exiting queue cleanly." -f $CutoffHour) -ForegroundColor Yellow
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
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\render-frames.ps1') `
      -Composition $comp `
      -Wav $job.Wav `
      -FramesDir "out\frames\$slug" `
      -Chunk 150 `
      -StopTime $StopTime

    # 2. Check if all frames completed
    $count = (Get-ChildItem $framesDir -Filter 'element-*.png' -ErrorAction SilentlyContinue).Count
    if ($count -ge $total) {
      $masterOut = "out\$slug\video.mp4"
      $ytOut = "out\$slug\video-youtube.mp4"
      $soundtrackPath = "out\$slug\soundtrack.wav"

      if (-not (Test-Path (Join-Path $root $ytOut))) {
        Write-Host "All frames present for '$slug'. Running final master and YouTube encodes..."
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\mux-frames.ps1') `
          -Wav $job.Wav `
          -FramesDir "out\frames\$slug" `
          -Out $masterOut `
          -Audio $soundtrackPath

        & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $root 'tools\encode-youtube.ps1') `
          -Wav $job.Wav `
          -FramesDir "out\frames\$slug" `
          -Out $ytOut `
          -Audio $soundtrackPath

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
