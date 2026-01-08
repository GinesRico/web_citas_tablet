@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   MIGRACIÓN DE CITAS - Cal.com to API
echo ========================================
echo.
echo Selecciona una opción:
echo.
echo 1. Probar conectividad
echo 2. Migrar citas
echo 3. Verificar migración
echo 4. Instalar dependencias
echo 5. Salir
echo.
set /p opcion="Elige una opción (1-5): "

if "%opcion%"=="1" goto test
if "%opcion%"=="2" goto migrate
if "%opcion%"=="3" goto verify
if "%opcion%"=="4" goto install
if "%opcion%"=="5" goto end

:test
echo.
echo Ejecutando prueba de conectividad...
python test_conexion.py
pause
goto end

:migrate
echo.
echo Ejecutando migración...
python migrate_citas.py
pause
goto end

:verify
echo.
echo Verificando migración...
python verificar_migracion.py
pause
goto end

:install
echo.
echo Instalando dependencias...
pip install -r requirements_migration.txt
echo.
echo Dependencias instaladas.
pause
goto end

:end
echo.
echo ¡Hasta luego!
