@echo off
setlocal
cd /d "%~dp0.."
set "ADC_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%ADC_NODE%" goto bundled
where npm.cmd >nul 2>nul
if errorlevel 1 goto missing
call npm.cmd %*
exit /b %errorlevel%
:bundled
set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
if not exist ".adc-tools\npm\package\bin\npm-cli.js" goto missing
"%ADC_NODE%" ".adc-tools\npm\package\bin\npm-cli.js" %*
exit /b %errorlevel%
:missing
echo Instala Node.js con npm para continuar. En este equipo se utiliza npm local si esta disponible.
exit /b 1
