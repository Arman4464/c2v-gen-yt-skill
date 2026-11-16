# Encode out\frames + the narration into the final vertical short.
#
# One generation only: lossless PNG frames -> libx264 (CRF 14, tune animation), BT.709 tagged the
# same way a plain `remotion render` tags its H.264 output, AAC 256k from the source WAV. No
# intermediate JPEG, no second encode, so the result matches a one-pass render visually.
#
# Usage: powershell -ExecutionPolicy Bypass -File tools\mux-frames.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ff = 'node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe'
$fp = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$frames = Join-Path $root 'out\frames'

$dur = [double](& $fp -v error -show_entries format=duration -of csv=p=0 public\bridge_voiceover.wav)
$expected = [math]::Ceiling($dur * 30)
$count = (Get-ChildItem $frames -Filter 'element-*.png').Count
"frames: $count / $expected (from bridge_voiceover.wav, $([math]::Round($dur, 2)) s @ 30 fps)"
if ($count -ne $expected) { throw "incomplete frame sequence - run tools\render-frames.ps1 first" }

& $ff -y -hide_banner -loglevel warning `
  -framerate 30 -start_number 0 -i "$frames\element-%04d.png" `
  -i public\bridge_voiceover.wav `
  -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p `
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv `
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" `
  -c:a aac -b:a 128k -movflags +faststart -shortest out\video.mp4
if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed with $LASTEXITCODE" }

"--- probe ---"
& $fp -v error -select_streams v:0 -count_frames `
  -show_entries stream=width,height,r_frame_rate,nb_read_frames,pix_fmt,color_space,color_primaries,color_transfer `
  -show_entries format=duration,size -of default=nw=1 out\video.mp4
