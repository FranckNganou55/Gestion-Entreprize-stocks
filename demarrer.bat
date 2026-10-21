@echo off
title Inventa GestyPro
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Telechargez Node.js 18+ sur https://nodejs.org puis relancez ce fichier.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Premiere utilisation : installation des dependances...
  call npm install
)

set "PORT=3001"
set "HOST=127.0.0.1"
set "DB_CLIENT=mysql"
set "SP_DB="
echo Demarrage de Inventa GestyPro sur http://localhost:3001 ...
echo Gardez cette fenetre ouverte pendant l'utilisation de l'application.
echo Une autre entreprise ? Bouton "Creer mon entreprise" sur l'ecran d'accueil.
call npm start
pause
