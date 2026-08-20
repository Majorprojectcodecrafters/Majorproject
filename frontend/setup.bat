@echo off
REM FRONTEND SETUP SCRIPT FOR QPGEN (Windows)
REM This script sets up and runs the QPGen frontend

echo Installing dependencies...
call npm install

echo.
echo Setup complete!
echo.
echo To start the frontend development server, run:
echo.
echo    npm run dev
echo.
echo The frontend will be available at: http://localhost:5173
echo.
echo Make sure the backend is running on http://localhost:5000
echo.
echo Demo Credentials:
echo    Teacher: teacher@school.com / teacher123
echo    Admin:   admin@school.com / admin123
