@echo off
setlocal

:: Check if port 8080 is active
netstat -ano | findstr :8080 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo Starting Durtup Local Server in background...
    cd /d "C:\Users\mdnah\Downloads\durtup-shop-v2-main\durtup-shop-v2-main"
    start /b npm run dev >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Find browser executable
set "BROWSER_EXE="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

if defined BROWSER_EXE (
    start "" "%BROWSER_EXE%" --app="http://localhost:8080/admin" --user-data-dir="%LOCALAPPDATA%\DurtupAdminProfile" --window-size=1440,920
) else (
    start http://localhost:8080/admin
)

exit
