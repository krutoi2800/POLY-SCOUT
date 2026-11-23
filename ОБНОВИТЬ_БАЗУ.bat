@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo POLY SCOUT - update businesses from public OpenStreetMap data
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 tools\update_leads.py
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        python tools\update_leads.py
    ) else (
        echo Python not installed. Install Python 3 and try again.
        pause
        exit /b 1
    )
)
if errorlevel 1 (
    echo Update failed. Old leads are preserved.
    pause
    exit /b 1
)
echo Done. Opening updated client base...
start "" "%~dp0index.html"
pause
