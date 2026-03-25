@echo off
title AmrSabry-Prompts Launcher
color 0D
echo.
echo  ========================================
echo     AmrSabry-Prompts Launcher
echo  ========================================
echo.
echo  Starting OCR Server (Python)...
start "OCR Server" python server.py
timeout /t 3 /nobreak >nul
echo  Starting Web Server (Next.js)...
start "Next.js" node node_modules\next\dist\bin\next dev --port 3456
timeout /t 4 /nobreak >nul
echo.
echo  ========================================
echo  Done! Open: http://localhost:3456
echo  Press any key to exit this window...
echo  ========================================
pause >nul
