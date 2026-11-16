# Resumable, lossless frame render of RicksClipsFull.
#
# Why: `remotion render` writes its frames into a temp file and throws them away on failure, so an
# interrupted 45-minute render loses everything. This writes PNGs named by GLOBAL frame number into
# out\frames, one 200-frame chunk at a time, and skips chunks that are already complete. A crash or a
# reboot costs at most the chunk in progress; re-running fills only the gaps.
#
# Then: tools\mux-frames.ps1 turns the frames + narration into out\video.mp4 in one encode.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\render-frames.ps1
#   powershell -ExecutionPolicy Bypass -File tools\render-frames.ps1 -Chunk 400
param(
  [int]$Chunk = 200,
  # composition length in frames; derived from the narration WAV so it cannot drift from the audio
  [int]$Total = 0
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ffprobe = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
if ($Total -le 0) {
  $dur = [double](& $ffprobe -v error -show_entries format=duration -of csv=p=0 public\bridge_voiceover.wav)
  $Total = [math]::Ceiling($dur * 30)
}

$frames = Join-Path $root 'out\frames'
$log = Join-Path $root 'out\render-log.txt'
New-Item -ItemType Directory -Force -Path $frames | Out-Null

# Remotion pads the frame number to the width of the range's LAST frame, so the same frame can be
# element-060.png or element-0060.png depending on the chunk. Normalise everything to 4 digits.
function Normalize-Frames {
  Get-ChildItem $frames -Filter 'element-*.png' -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.BaseName -match '^element-(\d+)$' -and $matches[1].Length -lt 4) {
      Move-Item -Force $_.FullName (Join-Path $frames ("element-{0:d4}.png" -f [int]$matches[1]))
    }
  }
}

function Test-Chunk($s, $e) {
  return ((Test-Path (Join-Path $frames ("element-{0:d4}.png" -f $s))) -and
          (Test-Path (Join-Path $frames ("element-{0:d4}.png" -f $e))))
}

Add-Content $log ("=== run {0} total={1} chunk={2} ===" -f (Get-Date -Format s), $Total, $Chunk)

for ($s = 0; $s -lt $Total; $s += $Chunk) {
  $e = [Math]::Min($s + $Chunk - 1, $Total - 1)
  Normalize-Frames
  if (Test-Chunk $s $e) {
    Add-Content $log ("skip {0}-{1} (done)" -f $s, $e)
    continue
  }
  $sw = [Diagnostics.Stopwatch]::StartNew()
  & cmd /c "node_modules\.bin\remotion.cmd render src/index.ts RicksClipsFull `"$frames`" --sequence --image-format=png --frames=$s-$e --log=error 2>&1" | Out-Null
  $code = $LASTEXITCODE
  $sw.Stop()
  Normalize-Frames
  $has = (Get-ChildItem $frames -Filter 'element-*.png').Count
  Add-Content $log ("chunk {0}-{1} exit={2} {3:n1}s onDisk={4}/{5}" -f $s, $e, $code, $sw.Elapsed.TotalSeconds, $has, $Total)
}

Add-Content $log ("=== chunks done {0} ===" -f (Get-Date -Format s))
