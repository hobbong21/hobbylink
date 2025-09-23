@echo off
setlocal enabledelayedexpansion

REM 도움말 함수
:show_help
echo HobbyLink Docker Utilities
echo.
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   start [dev^|prod]     Start the application
echo   stop [dev^|prod]      Stop the application
echo   restart [dev^|prod]   Restart the application
echo   logs [dev^|prod]      Show logs
echo   status [dev^|prod]    Show container status
echo   clean [dev^|prod]     Clean up containers and images
echo   build [dev^|prod]     Build images
echo   shell ^<service^>      Open shell in container
echo   help                 Show this help
echo.
echo Examples:
echo   %~nx0 start dev         Start development environment
echo   %~nx0 logs prod         Show production logs
echo   %~nx0 shell backend     Open shell in backend container
goto :eof

REM Compose 파일 선택 함수
:get_compose_file
if "%~1"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
) else (
    set COMPOSE_FILE=docker-compose.yml
)
goto :eof

REM 애플리케이션 시작
:start_app
call :get_compose_file %~1
echo [INFO] Starting HobbyLink (%~1 environment)...
docker-compose -f %COMPOSE_FILE% up -d

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Application started successfully!
    echo [INFO] Waiting for services to be ready...
    timeout /t 10 /nobreak >nul
    docker-compose -f %COMPOSE_FILE% ps
) else (
    echo [ERROR] Failed to start application
    exit /b 1
)
goto :eof

REM 애플리케이션 중지
:stop_app
call :get_compose_file %~1
echo [INFO] Stopping HobbyLink (%~1 environment)...
docker-compose -f %COMPOSE_FILE% down

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Application stopped successfully!
) else (
    echo [ERROR] Failed to stop application
    exit /b 1
)
goto :eof

REM 애플리케이션 재시작
:restart_app
call :stop_app %~1
call :start_app %~1
goto :eof

REM 로그 보기
:show_logs
call :get_compose_file %~1
echo [INFO] Showing logs for %~1 environment...
docker-compose -f %COMPOSE_FILE% logs -f
goto :eof

REM 상태 보기
:show_status
call :get_compose_file %~1
echo [INFO] Container status for %~1 environment:
docker-compose -f %COMPOSE_FILE% ps
goto :eof

REM 정리
:clean_up
call :get_compose_file %~1
echo [WARNING] This will remove all containers, networks, and volumes for %~1 environment
set /p CONFIRM="Are you sure? (y/N): "

if /i "%CONFIRM%"=="y" (
    echo [INFO] Cleaning up %~1 environment...
    docker-compose -f %COMPOSE_FILE% down -v --rmi all
    echo [SUCCESS] Cleanup completed!
) else (
    echo [INFO] Cleanup cancelled
)
goto :eof

REM 이미지 빌드
:build_images
call build.bat %~1
goto :eof

REM 셸 열기
:open_shell
if "%~1"=="" (
    echo [ERROR] Service name required. Available services: backend, frontend
    exit /b 1
)

call :get_compose_file %~2
echo [INFO] Opening shell in %~1 container...
docker-compose -f %COMPOSE_FILE% exec %~1 /bin/sh
goto :eof

REM 메인 스크립트
if "%~1"=="start" (
    call :start_app %~2
) else if "%~1"=="stop" (
    call :stop_app %~2
) else if "%~1"=="restart" (
    call :restart_app %~2
) else if "%~1"=="logs" (
    call :show_logs %~2
) else if "%~1"=="status" (
    call :show_status %~2
) else if "%~1"=="clean" (
    call :clean_up %~2
) else if "%~1"=="build" (
    call :build_images %~2
) else if "%~1"=="shell" (
    call :open_shell %~2 %~3
) else if "%~1"=="help" (
    call :show_help
) else if "%~1"=="--help" (
    call :show_help
) else if "%~1"=="-h" (
    call :show_help
) else (
    echo [ERROR] Unknown command: %~1
    echo.
    call :show_help
    exit /b 1
)

endlocal