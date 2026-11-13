param([string]$In, [string]$Out)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$sizes = @{}
$scale = 2.0
$bad = 0
foreach ($f in Get-ChildItem -Path $In -File) {
  if ($f.Extension -notin '.wmf', '.emf') { continue }
  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $pw = $img.PhysicalDimension.Width / 2540.0 * 96.0
    $ph = $img.PhysicalDimension.Height / 2540.0 * 96.0
    if ($pw -lt 1) { $pw = 1 }
    if ($ph -lt 1) { $ph = 1 }
    $bw = [int][Math]::Ceiling($pw * $scale)
    $bh = [int][Math]::Ceiling($ph * $scale)
    $bmp = New-Object System.Drawing.Bitmap($bw, $bh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.DrawImage($img, 0, 0, $bw, $bh)
    $g.Dispose()
    $name = [System.IO.Path]::GetFileNameWithoutExtension($f.Name) + '.png'
    $bmp.Save((Join-Path $Out $name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $img.Dispose()
    $sizes[$name] = @([Math]::Round($pw, 1), [Math]::Round($ph, 1))
  } catch {
    $bad++
  }
}
$sizes | ConvertTo-Json -Compress | Set-Content -Path (Join-Path $Out 'sizes.json') -Encoding UTF8
Write-Output "done: $($sizes.Count) converted, $bad failed"
