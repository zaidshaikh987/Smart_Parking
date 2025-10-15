@echo off
echo ============================================
echo    COMPLETE PROJECT CLEANUP & ORGANIZATION
echo ============================================
echo.

REM Create necessary folders
echo Creating folder structure...
if not exist "scripts" mkdir "scripts"
if not exist "scripts\startup" mkdir "scripts\startup"
if not exist "scripts\utils" mkdir "scripts\utils"
if not exist "models" mkdir "models"
if not exist "Docs\Archive" mkdir "Docs\Archive"

echo.
echo ============================================
echo PHASE 1: Organizing Python Files
echo ============================================

REM Move standalone Python files to scripts/utils
echo Moving utility Python files...
if exist "esp32_simulator.py" move /Y "esp32_simulator.py" "scripts\utils\" 2>nul
if exist "quick_backend.py" move /Y "quick_backend.py" "scripts\utils\" 2>nul
if exist "test_real_vision.py" move /Y "test_real_vision.py" "scripts\utils\" 2>nul

echo.
echo ============================================
echo PHASE 2: Organizing Batch/Shell Scripts
echo ============================================

REM Move startup batch files to scripts/startup
echo Moving startup scripts...
if exist "RUN_ALL.bat" move /Y "RUN_ALL.bat" "scripts\startup\" 2>nul
if exist "START_AND_TEST_REAL_VISION.bat" move /Y "START_AND_TEST_REAL_VISION.bat" "scripts\startup\" 2>nul
if exist "START_COMPLETE_SYSTEM.bat" move /Y "START_COMPLETE_SYSTEM.bat" "scripts\startup\" 2>nul
if exist "START_EVERYTHING.bat" move /Y "START_EVERYTHING.bat" "scripts\startup\" 2>nul
if exist "START_REAL_VISION.bat" move /Y "START_REAL_VISION.bat" "scripts\startup\" 2>nul
if exist "START_SYSTEM.bat" move /Y "START_SYSTEM.bat" "scripts\startup\" 2>nul
if exist "START_SYSTEM.ps1" move /Y "START_SYSTEM.ps1" "scripts\startup\" 2>nul
if exist "start_all_services.ps1" move /Y "start_all_services.ps1" "scripts\startup\" 2>nul

REM Keep cleanup_docs.bat as it's needed for doc organization
echo Keeping cleanup scripts in root for now...

echo.
echo ============================================
echo PHASE 3: Organizing Model Files
echo ============================================

REM Move YOLO model to models folder
echo Moving YOLO model...
if exist "yolov8n.pt" move /Y "yolov8n.pt" "models\" 2>nul

echo.
echo ============================================
echo PHASE 4: Organizing Requirements Files
echo ============================================

REM Root requirements.txt is fine - it's for entire project
echo Root requirements.txt is OK (project-level dependencies)

echo.
echo ============================================
echo PHASE 5: Archive Old Documentation
echo ============================================

REM Move old markdown files to archive
echo Checking for old documentation files...

REM Check and archive these if they exist
if exist "COMPLETE_SYSTEM_GUIDE.md" move /Y "COMPLETE_SYSTEM_GUIDE.md" "Docs\Archive\" 2>nul
if exist "FEATURES_COMPLETE.md" move /Y "FEATURES_COMPLETE.md" "Docs\Archive\" 2>nul
if exist "FRONTEND_INTEGRATION_GUIDE.md" move /Y "FRONTEND_INTEGRATION_GUIDE.md" "Docs\Archive\" 2>nul
if exist "HOW_TO_RUN.md" move /Y "HOW_TO_RUN.md" "Docs\Archive\" 2>nul
if exist "IMPLEMENTATION_COMPLETE.md" move /Y "IMPLEMENTATION_COMPLETE.md" "Docs\Archive\" 2>nul
if exist "PROJECT_COMPLETE.md" move /Y "PROJECT_COMPLETE.md" "Docs\Archive\" 2>nul
if exist "PROJECT_SUMMARY.md" move /Y "PROJECT_SUMMARY.md" "Docs\Archive\" 2>nul
if exist "QUICKSTART.md" move /Y "QUICKSTART.md" "Docs\Archive\" 2>nul
if exist "QUICK_START.md" move /Y "QUICK_START.md" "Docs\Archive\" 2>nul
if exist "README_REAL_VISION.md" move /Y "README_REAL_VISION.md" "Docs\Archive\" 2>nul
if exist "README_UPDATED.md" move /Y "README_UPDATED.md" "Docs\Archive\" 2>nul
if exist "README_NEW.md" move /Y "README_NEW.md" "Docs\Archive\" 2>nul
if exist "SETUP_NEW.md" move /Y "SETUP_NEW.md" "Docs\Archive\" 2>nul
if exist "REAL_VISION_SUMMARY.md" move /Y "REAL_VISION_SUMMARY.md" "Docs\Archive\" 2>nul
if exist "REAL_VS_DEMO.md" move /Y "REAL_VS_DEMO.md" "Docs\Archive\" 2>nul
if exist "SETUP_REAL_VISION.md" move /Y "SETUP_REAL_VISION.md" "Docs\Archive\" 2>nul
if exist "TESTING_REAL_VISION.md" move /Y "TESTING_REAL_VISION.md" "Docs\Archive\" 2>nul
if exist "WARP.md" move /Y "WARP.md" "Docs\Archive\" 2>nul

echo.
echo ============================================
echo PHASE 6: Create Helper Scripts
echo ============================================

REM Create a master startup script
echo Creating master startup script...
(
echo @echo off
echo echo Starting Smart Parking System...
echo echo.
echo echo Starting Backend...
echo start cmd /k "cd backend && uvicorn app.main:app --reload"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Vision Service...
echo start cmd /k "cd vision && python src/vision_service.py"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Aggregator...
echo start cmd /k "cd aggregator && python aggregator_service.py"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Frontend Node Server...
echo start cmd /k "cd frontend && node server/server.js"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo Starting Frontend React App...
echo start cmd /k "cd frontend\client && npm start"
echo.
echo echo.
echo echo All services started!
echo echo Access dashboard at: http://localhost:3000
echo pause
) > "scripts\startup\START_ALL.bat"

echo.
echo ============================================
echo PHASE 7: Update Vision Service to Use Models Folder
echo ============================================

echo Creating vision config update note...
(
echo # Vision Service Model Path Update
echo.
echo After running this cleanup, update your vision service to load YOLO from:
echo   models/yolov8n.pt
echo.
echo Edit: vision/src/detectors/yolo_detector.py
echo Change model path to: ../../models/yolov8n.pt
) > "Docs\MODEL_PATH_UPDATE.txt"

echo.
echo ============================================
echo CLEANUP COMPLETE!
echo ============================================
echo.
echo New Project Structure:
echo.
echo Car_Parking_Space_Detection/
echo ├── README.md                    (Main documentation)
echo ├── SETUP.md                     (Setup guide)
echo ├── QUICK_START_ESP32.md         (ESP32 quick start)
echo ├── DOCUMENTATION_SUMMARY.md     (This organization guide)
echo ├── LICENSE
echo ├── requirements.txt             (Project dependencies)
echo ├── .gitattributes
echo │
echo ├── scripts/
echo │   ├── startup/                 (All .bat and .ps1 startup scripts)
echo │   └── utils/                   (Python utility scripts)
echo │
echo ├── models/
echo │   └── yolov8n.pt              (YOLO model file)
echo │
echo ├── backend/                     (FastAPI backend)
echo ├── vision/                      (Computer vision service)
echo ├── aggregator/                  (MQTT aggregator)
echo ├── frontend/                    (React frontend)
echo ├── esp32_firmware/              (ESP32-CAM firmware)
echo ├── esp32/                       (ESP32 gate controller)
echo └── Docs/
echo     └── Archive/                 (Old documentation)
echo.
echo ============================================
echo IMPORTANT NOTES:
echo ============================================
echo.
echo 1. All startup scripts moved to: scripts\startup\
echo    Use: scripts\startup\START_ALL.bat to launch everything
echo.
echo 2. Utility Python scripts moved to: scripts\utils\
echo.
echo 3. YOLO model moved to: models\yolov8n.pt
echo    Update vision service config if needed
echo.
echo 4. Old documentation archived in: Docs\Archive\
echo.
echo 5. Root directory now clean with only essential files:
echo    - README.md (start here!)
echo    - SETUP.md (setup instructions)
echo    - QUICK_START_ESP32.md (ESP32 guide)
echo    - LICENSE
echo    - requirements.txt
echo.
echo ============================================
echo NEXT STEPS:
echo ============================================
echo.
echo 1. Review the new structure
echo 2. Use: scripts\startup\START_ALL.bat to launch system
echo 3. Update any hardcoded paths in your code if needed
echo 4. Test all services still work correctly
echo 5. Delete cleanup scripts when satisfied:
echo    - cleanup_docs.bat
echo    - ORGANIZE_PROJECT.bat
echo.
echo ============================================
pause
