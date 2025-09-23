@echo off
setlocal enabledelayedexpansion

echo 🚀 Building HobbyLink Docker Images...
echo.

REM 환경 선택
if "%1"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    echo [INFO] Building for development environment
) else (
    set COMPOSE_FILE=docker-compose.yml
    echo [INFO] Building for production environment
)

REM Docker Compose로 빌드
echo [INFO] Building images with Docker Compose...
docker-compose -f %COMPOSE_FILE% build --no-cache

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Build completed successfully!
) else (
    echo [ERROR] Build failed!
    exit /b 1
)

echo.
echo 🎉 All images built successfully!
echo.

REM 사용법 안내
if "%1"=="dev" (
    echo Development Environment:
    echo   Start: docker-compose -f docker-compose.dev.yml up -d
    echo   Stop:  docker-compose -f docker-compose.dev.yml down
    echo   Logs:  docker-compose -f docker-compose.dev.yml logs -f
    echo.
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:8081
    echo   Debug:    localhost:5005 ^(Java Debug Wire Protocol^)
) else (
    echo Production Environment:
    echo   Start: docker-compose up -d
    echo   Stop:  docker-compose down
    echo   Logs:  docker-compose logs -f
    echo.
    echo   Application: http://localhost
    echo   Backend API: http://localhost:8081
)

echo.
echo Additional Commands:
echo   Health Check: docker-compose ps
echo   Remove All:   docker-compose down -v --rmi all

endlocal