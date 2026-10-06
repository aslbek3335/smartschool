@echo off
title SmartSchool Platform
echo ===================================================
echo     SmartSchool - Tizim ishga tushirilmoqda...
echo ===================================================
echo.
echo [1/2] Backend server boshlanmoqda (port 5005)...
start "SmartSchool Backend" cmd /k "cd /d %~dp0backend && node server.js"

echo [2/2] Frontend server boshlanmoqda (port 3000)...
start "SmartSchool Frontend" cmd /k "cd /d %~dp0frontend && node server.cjs"

echo.
echo ===================================================
echo   Barcha xizmatlar muvaffaqiyatli ishga tushdi!
echo   Sayt:    http://localhost:3000
echo   Backend: http://localhost:5005
echo ===================================================
ping 127.0.0.1 -n 4 >nul 2>&1
start http://localhost:3000
