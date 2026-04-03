@echo off
REM Identif.ai Quick Start Script (Windows)
REM Starts both ML Backend (FastAPI) and Frontend (Express) servers

set PROJECT_DIR=C:\Users\CL502-30\identif.ai
set ML_ENV=%PROJECT_DIR%\ml_env

echo.
echo  Starting Identif.ai...
echo.

REM Create .env files if they don't exist
if not exist "%PROJECT_DIR%\.env" (
    echo ⚠️  Creating %PROJECT_DIR%\.env
    (
        echo # HuggingFace Credentials
        echo HF_TOKEN=hf_your_token_here
        echo HF_REPO=your-username/your-repo-name
        echo.
        echo # AWS Polly ^(optional^)
        echo AWS_ACCESS_KEY_ID=
        echo AWS_SECRET_ACCESS_KEY=
        echo AWS_REGION=us-east-1
    ) > "%PROJECT_DIR%\.env"
    echo    📝 Edit this file with your credentials
)

if not exist "%PROJECT_DIR%\frontend\server\.env" (
    echo ⚠️  Creating frontend\.env
    (
        echo PORT=5000
        echo ML_BACKEND_URL=http://localhost:8000
        echo NODE_ENV=development
    ) > "%PROJECT_DIR%\frontend\server\.env"
)

REM Start ML Backend
echo.
echo Starting ML Backend...
cd "%PROJECT_DIR%"
if not exist "%ML_ENV%" (
    echo    Creating Python virtual environment...
    python -m venv "%ML_ENV%"
)
call "%ML_ENV%\Scripts\activate.bat"
start "ML Backend" python ml_backend.py
echo    ✅ ML Backend started (port 8000)

REM Wait a bit for ML backend to start
timeout /t 5 /nobreak

REM Start Frontend
echo.
echo  Starting Frontend...
cd "%PROJECT_DIR%\frontend\server"
if not exist "node_modules" (
    echo    Installing npm dependencies...
    call npm install --quiet
)
start "Frontend" cmd /k npm start
echo    Frontend started (port 5000)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ Identif.ai is running!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo  URLs:
echo    Frontend:     http://localhost:5000
echo    ML Backend:   http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo.
echo  Close the opened terminal windows to stop the services.
echo.
pause
