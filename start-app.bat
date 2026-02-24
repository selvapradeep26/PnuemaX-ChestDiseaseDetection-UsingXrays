@echo off
echo Starting PneumaX Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0Backend && python app.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d %~dp0pneuma-care-hub-main\pneuma-care-hub-main && npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:5000
echo.
echo Press any key to exit...
pause > nul
