<#
.SYNOPSIS
  Generates high-CTR vertical YouTube Shorts thumbnails directly from the 2.5D Cel-Shaded engine.
.DESCRIPTION
  Extracts the highest-impact drama/shock frame at full 1080x1920 resolution,
  and optionally overlays high-contrast cartoon thumbnail typography with heavy black borders.
.PARAMETER Composition
  The Remotion composition ID (e.g. CartoonShortsTemplate, EmuWar, MonaLisaHeist, MolassesFlood, RicksClipsFull).
.PARAMETER Frame
  The frame index to extract. If omitted, uses pre-configured climax frames per composition.
.PARAMETER OverlayText
  Optional bold click-magnet teaser text (e.g. "THE WORST HEIST EVER", "74 SOLDIERS VS 1 BRIDGE").
.PARAMETER OutDir
  Output directory. Default: out/<Composition>
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Composition,

  [int]$Frame = -1,

  [string]$OverlayText = "",

  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

# Default climax/drama frames per composition
$DefaultFrames = @{
  "CartoonShortsTemplate" = 165 # Shock reaction frame
  "RicksClipsFull"        = 970 # Bridge snap moment
  "RicksClipsShowcase"    = 120 # Mid-march bridge bounce
  "EmuWar"                = 480 # Soldiers firing at evasive emus
  "MolassesFlood"         = 620 # Vat rupture / wave surge
  "MonaLisaHeist"         = 540 # Guard discovering empty hook
}

if ($Frame -lt 0) {
  if ($DefaultFrames.ContainsKey($Composition)) {
    $Frame = $DefaultFrames[$Composition]
  } else {
    $Frame = 90
  }
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $OutDir = Join-Path $ProjectRoot "out\$Composition"
} elseif (![System.IO.Path]::IsPathRooted($OutDir)) {
  $OutDir = Join-Path $ProjectRoot $OutDir
}

if (!(Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$RawStill = Join-Path $OutDir "thumbnail_raw.png"
$FinalPng = Join-Path $OutDir "thumbnail.png"
$FinalJpg = Join-Path $OutDir "thumbnail.jpg"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " HIGH-CTR THUMBNAIL GENERATOR" -ForegroundColor Cyan
Write-Host " Composition: $Composition | Frame: $Frame" -ForegroundColor Yellow
Write-Host " Output Dir : $OutDir" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Render Still Frame via Remotion
Write-Host "[1/2] Rendering lossless 1080x1920 still frame..." -ForegroundColor Green
Push-Location $ProjectRoot
try {
  $cmd = "npx.cmd remotion still src/index.ts $Composition `"$RawStill`" --frame=$Frame --gl=angle"
  cmd.exe /c $cmd
} finally {
  Pop-Location
}

if (!(Test-Path $RawStill)) {
  throw "Failed to render still frame: $RawStill"
}

# 2. Apply High-CTR Thumbnail Styling (if text overlay provided)
Add-Type -AssemblyName System.Drawing

if ([string]::IsNullOrWhiteSpace($OverlayText)) {
  Copy-Item $RawStill $FinalPng -Force
  Write-Host "[2/2] Using raw drama frame without text overlay." -ForegroundColor Green
} else {
  Write-Host "[2/2] Applying high-impact cartoon typography overlay: '$OverlayText'..." -ForegroundColor Green

  $bmp = [System.Drawing.Bitmap]::FromFile($RawStill)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # Typography styling: Upper third safe-zone (Y: 380 - 600px), visible in 9:16 and 16:9 crop
  $fontSize = 72
  $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
  try {
    $fontFamily = [System.Drawing.FontFamily]::new("Impact")
  } catch {}

  $font = [System.Drawing.Font]::new($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $rect = [System.Drawing.RectangleF]::new(60, 420, 960, 220)

  # Semi-transparent dark backing card
  $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 15, 15, 20))
  $bgRect = [System.Drawing.Rectangle]::new(50, 410, 980, 240)
  $gfx.FillRectangle($bgBrush, $bgRect)

  # Electric Yellow Border for the backing card
  $borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 230, 0), 8)
  $gfx.DrawRectangle($borderPen, $bgRect)

  # Draw text with heavy black cartoon outline
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddString(
    $OverlayText.ToUpper(),
    $font.FontFamily,
    [int]$font.Style,
    $gfx.DpiY * $fontSize / 72,
    $rect,
    $format
  )

  # Heavy black stroke
  $strokePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 16)
  $strokePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $gfx.DrawPath($strokePen, $path)

  # Bright Electric Yellow fill
  $fillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 230, 0))
  $gfx.FillPath($fillBrush, $path)

  # Clean up GDI objects
  $strokePen.Dispose()
  $fillBrush.Dispose()
  $path.Dispose()
  $borderPen.Dispose()
  $bgBrush.Dispose()
  $font.Dispose()
  $gfx.Dispose()

  $bmp.Save($FinalPng, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

# 3. Export Web-Optimized JPEG (<2MB for YouTube)
$pngBmp = [System.Drawing.Bitmap]::FromFile($FinalPng)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]92)
$pngBmp.Save($FinalJpg, $codec, $encoderParams)
$pngBmp.Dispose()
$encoderParams.Dispose()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " THUMBNAIL READY FOR YOUTUBE" -ForegroundColor Green
Write-Host " PNG Master: $FinalPng" -ForegroundColor White
Write-Host " JPG Upload: $FinalJpg ($( [math]::Round((Get-Item $FinalJpg).Length / 1KB) ) KB)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
