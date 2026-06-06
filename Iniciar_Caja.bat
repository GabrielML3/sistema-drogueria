@echo off
title Sistema POS - FarmaAdmin
color 0B

echo ===================================================
echo     INICIANDO SISTEMA DE DROGUERIA DON SIXTO
echo ===================================================
echo.
echo [1/3] Encendiendo el Servidor Central (Base de datos)...
:: Activa el entorno virtual ahí mismo y arranca Django
start "Servidor Backend (No cerrar)" cmd /k "venv\Scripts\activate && python manage.py runserver"

echo [2/3] Encendiendo el Punto de Venta (Pantallas)...
:: Entra a la carpeta frontend y arranca React
start "Punto de Venta (No cerrar)" cmd /k "cd frontend && npm run dev"

echo.
echo Esperando 5 segundos a que los motores arranquen...
timeout /t 5 /nobreak > nul

echo [3/3] Abriendo el sistema en el navegador...
start http://localhost:5173

echo.
echo ===================================================
echo   !SISTEMA INICIADO CON EXITO!
echo   Ya puedes minimizar todas estas ventanas negras.
echo   Por favor, NO LAS CIERRES hasta terminar el turno.
echo ===================================================
echo.
pause