@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 22 yoki yangiroq versiyasini o'rnating.
 pause
 exit /b 1
)
if not exist .env (
 copy .env.example .env >nul
 echo .env yaratildi. MongoDB va ixtiyoriy AI/Telegram sozlamalarini tekshiring.
)
if not exist node_modules (
 call npm ci --omit=dev
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
echo Sayt: http://localhost:3000
echo MongoDB serveri ishlab turgan bo'lishi kerak.
call npm start
pause
