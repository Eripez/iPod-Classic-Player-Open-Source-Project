@echo off
title oPud Classic Player
cd /d "%~dp0"
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)
start /B npm start
exit