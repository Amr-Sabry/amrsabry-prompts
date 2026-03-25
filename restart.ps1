Stop-Process -Id 71028 -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "C:\Users\Admin\.openclaw\workspace\prompt-lens\.next" -ErrorAction SilentlyContinue

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Admin\.openclaw\workspace\prompt-lens'; node node_modules\next\dist\bin\next dev --port 3456" -WindowStyle Minimized

Start-Sleep 20

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(1932, 1039)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(-1925, 351, 0, 0, [System.Drawing.Size]::new(1932, 1039))
$bmp.Save("$env:TEMP\bento.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "done"
