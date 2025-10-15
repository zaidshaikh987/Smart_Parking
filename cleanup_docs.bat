@echo off
echo ========================================
echo  Documentation Cleanup and Organization
echo ========================================
echo.

REM Create archive folder for old docs
if not exist "Docs\Archive" mkdir "Docs\Archive"

echo Moving old documentation files to archive...

REM Move all old READMEs to archive (keep only the consolidated ones)
move /Y "COMPLETE_SYSTEM_GUIDE.md" "Docs\Archive\" 2>nul
move /Y "FEATURES_COMPLETE.md" "Docs\Archive\" 2>nul
move /Y "FRONTEND_INTEGRATION_GUIDE.md" "Docs\Archive\" 2>nul
move /Y "HOW_TO_RUN.md" "Docs\Archive\" 2>nul
move /Y "IMPLEMENTATION_COMPLETE.md" "Docs\Archive\" 2>nul
move /Y "PROJECT_COMPLETE.md" "Docs\Archive\" 2>nul
move /Y "PROJECT_SUMMARY.md" "Docs\Archive\" 2>nul
move /Y "QUICKSTART.md" "Docs\Archive\" 2>nul
move /Y "QUICK_START.md" "Docs\Archive\" 2>nul
move /Y "README_REAL_VISION.md" "Docs\Archive\" 2>nul
move /Y "README_UPDATED.md" "Docs\Archive\" 2>nul
move /Y "REAL_VISION_SUMMARY.md" "Docs\Archive\" 2>nul
move /Y "REAL_VS_DEMO.md" "Docs\Archive\" 2>nul
move /Y "SETUP_REAL_VISION.md" "Docs\Archive\" 2>nul
move /Y "TESTING_REAL_VISION.md" "Docs\Archive\" 2>nul
move /Y "WARP.md" "Docs\Archive\" 2>nul
move /Y "Docs\SETUP_GUIDE.md" "Docs\Archive\" 2>nul

REM Rename new consolidated docs to final names
echo.
echo Setting up new consolidated documentation...
move /Y "README_NEW.md" "README.md" 2>nul
move /Y "SETUP_NEW.md" "SETUP.md" 2>nul

REM Consolidate ESP32 docs
echo.
echo Consolidating ESP32 documentation...
cd esp32_firmware
if exist "ESP32_SETUP_GUIDE.md" if exist "WIRING_DIAGRAM.md" (
    echo Both ESP32 guides exist - keeping ESP32_SETUP_GUIDE.md as ESP32_GUIDE.md
    copy /Y "ESP32_SETUP_GUIDE.md" "ESP32_GUIDE.md" >nul
)
cd ..

REM Consolidate Frontend docs
echo.
echo Consolidating frontend documentation...
cd frontend
if exist "FRONTEND_SETUP_GUIDE.md" (
    copy /Y "FRONTEND_SETUP_GUIDE.md" "FRONTEND_GUIDE.md" >nul
)
cd client
if exist "README_INTEGRATED.md" (
    del "README_INTEGRATED.md" 2>nul
)
cd ..\..

echo.
echo ========================================
echo  Cleanup Complete!
echo ========================================
echo.
echo New documentation structure:
echo.
echo   README.md                         - Main project overview
echo   SETUP.md                          - Complete setup guide
echo   QUICK_START_ESP32.md              - Quick ESP32 setup
echo   esp32_firmware\ESP32_GUIDE.md     - Detailed ESP32 guide
echo   esp32_firmware\WIRING_DIAGRAM.md  - Wiring diagrams
echo   frontend\FRONTEND_GUIDE.md        - Frontend documentation
echo   Docs\Archive\                     - Old documentation (backup)
echo.
echo All old documentation has been archived in Docs\Archive\
echo.
pause
