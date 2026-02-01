@echo off
echo ===============================================
echo   Smart Alarm System - Local Server
echo   (Required for ESP32 buzzer control)
echo ===============================================
echo.
echo Starting local server at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python server.py
pause
