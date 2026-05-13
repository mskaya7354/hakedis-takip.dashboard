@echo off
cd /d "%~dp0"
cd frontend
call npm run build
if errorlevel 1 (echo BUILD FAILED & pause & exit /b 1)
cd ..
echo Dashboard: http://localhost:8767  (LAN: http://YOUR-IP:8767)
cd backend
venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8767
pause
