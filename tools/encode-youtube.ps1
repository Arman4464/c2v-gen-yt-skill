# Encode the kept PNG frames the way YouTube asks for a 1080x1920 / 30 fps SDR upload.
#
# YouTube's upload recommendations for 1080p at 30 fps: H.264 (High profile), yuv420p, 8 Mbps,
# keyframe every 2 seconds, BT.709, audio AAC-LC 48 kHz stereo 384 kbps. Two-pass VBR so the rate is
# actually held over the 65 s. The master (out\video.mp4, CRF 14, ~96 Mbps) is left untouched.
#
# Usage: powershell -ExecutionPolicy Bypass -File tools\encode-youtube.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ff = 'node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe'
$fp = 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$frames = Join-Path $root 'out\frames'

$dur = [double](& $fp -v error -show_entries format=duration -of csv=p=0 public\bridge_voiceover.wav)
$expected = [math]::Ceiling($dur * 30)
$count = (Get-ChildItem $frames -Filter 'element-*.png').Count
if ($count -ne $expected) { throw "incomplete frame sequence ($count/$expected) - run tools\render-frames.ps1 first" }

$src = @('-framerate', '30', '-start_number', '0', '-i', "$frames\element-%04d.png", '-i', 'public\bridge_voiceover.wav')
$enc = @('-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
  '-b:v', '8M', '-maxrate', '12M', '-bufsize', '16M',
  '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709')

"pass 1/2"
& $ff -y -hide_banner -loglevel warning @src @enc -pass 1 -passlogfile out\ytpass -an -f null -
if ($LASTEXITCODE -ne 0) { throw "pass 1 failed" }

"pass 2/2"
& $ff -y -hide_banner -loglevel warning @src @enc -pass 2 -passlogfile out\ytpass `
  -c:a libfdk_aac -ar 48000 -ac 2 -b:a 384k -movflags +faststart -shortest out\video-youtube.mp4
if ($LASTEXITCODE -ne 0) { throw "pass 2 failed" }

Remove-Item out\ytpass* -Force -ErrorAction SilentlyContinue

"--- probe ---"
& $fp -v error -select_streams v:0 -count_frames `
  -show_entries stream=codec_name,profile,level,width,height,r_frame_rate,nb_read_frames,pix_fmt,color_space,color_primaries,color_transfer,bit_rate `
  -show_entries format=duration,size,bit_rate -of default=nw=1 out\video-youtube.mp4
& $fp -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate -of default=nw=1 out\video-youtube.mp4
