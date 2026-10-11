@echo off
title QPGen System Launcher
echo ========================================================
echo   Starting Shree Siddheshwar Mahavidyalaya QPGen Portal
echo ========================================================
echo.

echo [1/3] Launching ChromaDB Vector Engine on port 8000...
start "ChromaDB Engine" cmd /k "cd /d %~dp0backend && .\.chroma-venv\Scripts\chroma.exe run --path chroma_db --port 8000"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Backend Server on port 5000...
start "Backend API" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Launching Frontend Interface on port 5173...
start "Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   All services launched!
echo   Local Web App: http://localhost:5173
echo   Local API:     http://localhost:5000
echo   ChromaDB:      http://localhost:8000
echo ========================================================
