$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Durtup Admin.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = '""C:\Users\mdnah\Downloads\durtup-shop-v2-main\durtup-shop-v2-main\scripts\launch_admin_app.vbs""'
$Shortcut.WorkingDirectory = "C:\Users\mdnah\Downloads\durtup-shop-v2-main\durtup-shop-v2-main"
$Shortcut.IconLocation = "C:\Users\mdnah\Downloads\durtup-shop-v2-main\durtup-shop-v2-main\public\favicon.ico"
$Shortcut.Description = "Durtup Shop - Admin Panel Desktop App"
$Shortcut.Save()
Write-Host "SUCCESS: Desktop shortcut installed at: $ShortcutPath"
