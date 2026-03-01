@echo off
title Instalar Accesos Directos - oPud Classic
color 0B
echo ========================================
echo    Instalando accesos directos
echo    oPud Classic Player
echo ========================================
echo.

:: Obtener la ruta actual
set "CURRENT_DIR=%~dp0"
set "START_BAT=%CURRENT_DIR%start.bat"

:: Verificar que start.bat existe
if not exist "%START_BAT%" (
    echo ERROR: No se encuentra start.bat
    echo Asegurate de ejecutar este archivo desde la carpeta del programa
    pause
    exit /b 1
)

:: Crear acceso directo en el escritorio
echo Creando acceso directo en el Escritorio...
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=oPud Classic Player"

:: Usar PowerShell para crear el acceso directo
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $SC.TargetPath = '%START_BAT%'; $SC.WorkingDirectory = '%CURRENT_DIR%'; $SC.Description = 'oPud Classic Player - Reproductor estilo iPod'; $SC.Save()"

if %errorlevel% equ 0 (
    echo [OK] Acceso directo creado en el Escritorio
) else (
    echo [ERROR] No se pudo crear el acceso directo
)

:: Crear acceso directo en el menú inicio
echo Creando acceso directo en Menu Inicio...
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"

if exist "%START_MENU%" (
    powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%START_MENU%\%SHORTCUT_NAME%.lnk'); $SC.TargetPath = '%START_BAT%'; $SC.WorkingDirectory = '%CURRENT_DIR%'; $SC.Description = 'oPud Classic Player - Reproductor estilo iPod'; $SC.Save()"
    
    if %errorlevel% equ 0 (
        echo [OK] Acceso directo creado en Menu Inicio
    ) else (
        echo [ERROR] No se pudo crear el acceso directo en Menu Inicio
    )
) else (
    echo [WARN] No se encontro la carpeta de Menu Inicio
)

:: Ofrecer crear acceso directo en la barra de tareas
echo.
echo ========================================
echo    OPCION ADICIONAL
echo ========================================
echo.
echo ¿Quieres anclar el programa a la barra de tareas?
echo 1. Si
echo 2. No
echo.
set /p "option=Selecciona una opcion (1/2): "

if "%option%"=="1" (
    echo.
    echo Para anclar a la barra de tareas:
    echo 1. Ejecuta el programa (start.bat)
    echo 2. Haz clic derecho en el icono de la barra de tareas
    echo 3. Selecciona "Anclar a la barra de tareas"
    echo.
    echo Presiona cualquier tecla para continuar...
    pause > nul
)

echo.
echo ========================================
echo    INSTALACION COMPLETADA
echo ========================================
echo.
echo Ya puedes ejecutar oPud Classic desde:
echo - El acceso directo en el Escritorio
echo - El acceso directo en Menu Inicio
echo - O ejecutando start.bat directamente
echo.
echo Presiona cualquier tecla para salir...
pause > nul
exit