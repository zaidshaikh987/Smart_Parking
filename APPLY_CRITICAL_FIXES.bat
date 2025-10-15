@echo off
echo ============================================
echo   APPLYING CRITICAL FIXES
echo ============================================
echo.
echo This script will fix all critical configuration issues.
echo.
pause

REM ============================================
REM FIX 1: Update YOLO Model Path in cameras.yaml
REM ============================================
echo.
echo [1/8] Fixing YOLO model path...

powershell -Command "(Get-Content 'vision\config\cameras.yaml') -replace 'yolov8n\.pt', '../models/yolov8n.pt' | Set-Content 'vision\config\cameras.yaml'"
echo    ✓ Updated vision/config/cameras.yaml

REM ============================================
REM FIX 2: Create Backend .env
REM ============================================
echo.
echo [2/8] Creating backend/.env...

(
echo # Database
echo MONGODB_URI=mongodb://localhost:27017
echo MONGODB_DATABASE=smart_parking
echo.
echo # JWT
echo SECRET_KEY=smart-parking-secret-key-change-in-production-abc123xyz789
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=30
echo.
echo # API
echo API_V1_PREFIX=/api/v1
echo PROJECT_NAME=Smart Parking API
echo.
echo # CORS
echo BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
echo.
echo # Razorpay ^(optional - use test keys^)
echo RAZORPAY_KEY_ID=rzp_test_placeholder
echo RAZORPAY_KEY_SECRET=placeholder_secret
echo.
echo # MQTT
echo MQTT_BROKER=localhost
echo MQTT_PORT=1883
) > "backend\.env"

echo    ✓ Created backend/.env

REM ============================================
REM FIX 3: Create Frontend .env
REM ============================================
echo.
echo [3/8] Creating frontend/client/.env...

(
echo # API Endpoints
echo REACT_APP_API_URL=http://localhost:3001/api
echo REACT_APP_WS_URL=http://localhost:3001
echo.
echo # Backend Direct
echo REACT_APP_BACKEND_API=http://localhost:8000/api/v1
echo REACT_APP_VISION_API=http://localhost:8001
echo.
echo # Razorpay
echo REACT_APP_RAZORPAY_KEY_ID=rzp_test_placeholder
echo.
echo # System
echo REACT_APP_AGGREGATOR_API=http://localhost:5000
) > "frontend\client\.env"

echo    ✓ Created frontend/client/.env

REM ============================================
REM FIX 4: Create Aggregator Config
REM ============================================
echo.
echo [4/8] Creating aggregator/config.yaml...

(
echo # Aggregator Service Configuration
echo mqtt:
echo   broker_host: "localhost"
echo   broker_port: 1883
echo   qos: 1
echo.
echo backend_url: "http://localhost:8000"
) > "aggregator\config.yaml"

echo    ✓ Created aggregator/config.yaml

REM ============================================
REM FIX 5: Fix Vision Service Import
REM ============================================
echo.
echo [5/8] Fixing vision service import...

powershell -Command "(Get-Content 'vision\src\vision_service.py') -replace 'from detector_yolo import', 'from .detector_yolo import' | Set-Content 'vision\src\vision_service.py'"
echo    ✓ Updated vision/src/vision_service.py

REM ============================================
REM FIX 6: Update Camera Config for Webcam Testing
REM ============================================
echo.
echo [6/8] Setting camera to use webcam for testing...

powershell -Command "(Get-Content 'vision\config\cameras.yaml') -replace 'stream_url: \"http://192.168.1.100:81/stream\"', 'stream_url: 0  # Webcam for testing' | Set-Content 'vision\config\cameras.yaml'"
powershell -Command "(Get-Content 'vision\config\cameras.yaml') -replace 'stream_url: \"http://192.168.1.101:81/stream\"', 'stream_url: 1  # Webcam for testing' | Set-Content 'vision\config\cameras.yaml'"
echo    ✓ Updated cameras to use webcam

REM ============================================
REM FIX 7: Create Requirements Files
REM ============================================
echo.
echo [7/8] Creating requirements.txt files...

REM Backend requirements
(
echo fastapi==0.104.1
echo uvicorn[standard]==0.24.0
echo motor==3.3.2
echo pydantic==2.5.0
echo python-dotenv==1.0.0
echo pyyaml==6.0.1
echo razorpay==1.4.1
echo paho-mqtt==1.6.1
echo requests==2.31.0
) > "backend\requirements.txt"
echo    ✓ Created backend/requirements.txt

REM Vision requirements
(
echo opencv-python==4.8.1.78
echo ultralytics==8.0.200
echo paho-mqtt==1.6.1
echo pyyaml==6.0.1
echo requests==2.31.0
echo numpy==1.24.3
) > "vision\requirements.txt"
echo    ✓ Created vision/requirements.txt

REM Aggregator requirements
(
echo paho-mqtt==1.6.1
echo requests==2.31.0
echo pyyaml==6.0.1
) > "aggregator\requirements.txt"
echo    ✓ Created aggregator/requirements.txt

REM ============================================
REM FIX 8: Create Helper Scripts Directory
REM ============================================
echo.
echo [8/8] Creating helper scripts...

if not exist "backend\scripts" mkdir "backend\scripts"

REM Create init_db.py
(
echo """
echo Database Initialization Script
echo """
echo import asyncio
echo from app.database import db_instance, get_connection_string, get_database_name
echo import logging
echo.
echo logging.basicConfig^(level=logging.INFO^)
echo logger = logging.getLogger^(__name__^)
echo.
echo async def init_database^(^):
echo     """Initialize database with indexes"""
echo     connection_string = get_connection_string^(^)
echo     database_name = get_database_name^(^)
echo     
echo     logger.info^("Connecting to MongoDB..."^)
echo     await db_instance.connect_to_database^(connection_string, database_name^)
echo     
echo     logger.info^("Database initialized successfully!"^)
echo     logger.info^("Indexes created."^)
echo     
echo     await db_instance.close_database_connection^(^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(init_database^(^)^)
) > "backend\scripts\init_db.py"
echo    ✓ Created backend/scripts/init_db.py

REM Create admin user script
(
echo """
echo Create Admin User for Dashboard
echo """
echo import asyncio
echo from app.database import db_instance, get_connection_string, get_database_name
echo import logging
echo.
echo logging.basicConfig^(level=logging.INFO^)
echo logger = logging.getLogger^(__name__^)
echo.
echo async def create_admin^(^):
echo     """Create admin RFID user"""
echo     connection_string = get_connection_string^(^)
echo     database_name = get_database_name^(^)
echo     
echo     await db_instance.connect_to_database^(connection_string, database_name^)
echo     db = db_instance.database
echo     
echo     # Check if admin exists
echo     admin = await db.users.find_one^({"rfid_id": "ADMIN001"}^)
echo     
echo     if admin:
echo         logger.info^("Admin user already exists"^)
echo     else:
echo         admin_doc = {
echo             "rfid_id": "ADMIN001",
echo             "user_name": "Admin User",
echo             "vehicle_no": "ADMIN-CAR-001",
echo             "wallet_balance": 10000.0,
echo             "contact": "+919999999999",
echo             "email": "admin@parking.com",
echo             "is_active": True
echo         }
echo         
echo         await db.users.insert_one^(admin_doc^)
echo         logger.info^("✓ Admin user created: ADMIN001"^)
echo         logger.info^("  Email: admin@parking.com"^)
echo         logger.info^("  Initial Balance: ₹10,000"^)
echo     
echo     await db_instance.close_database_connection^(^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(create_admin^(^)^)
) > "backend\scripts\create_admin.py"
echo    ✓ Created backend/scripts/create_admin.py

echo.
echo ============================================
echo   FIXES APPLIED SUCCESSFULLY!
echo ============================================
echo.
echo Next Steps:
echo.
echo 1. Install MongoDB:
echo    - Download: https://www.mongodb.com/try/download/community
echo    - OR use MongoDB Atlas ^(cloud^): https://www.mongodb.com/cloud/atlas
echo    - Start service: net start MongoDB
echo.
echo 2. Install Mosquitto MQTT:
echo    - Download: https://mosquitto.org/download/
echo    - OR: choco install mosquitto
echo    - Start service: net start mosquitto
echo.
echo 3. Install Python Dependencies:
echo    cd backend
echo    pip install -r requirements.txt
echo    cd ..\vision
echo    pip install -r requirements.txt
echo    cd ..\aggregator
echo    pip install -r requirements.txt
echo.
echo 4. Initialize Database:
echo    cd backend
echo    python scripts\init_db.py
echo    python scripts\create_admin.py
echo.
echo 5. Install Node Dependencies:
echo    cd frontend
echo    npm install
echo    cd client
echo    npm install
echo.
echo 6. Start System:
echo    Use: scripts\startup\START_ALL.bat
echo.
echo ============================================
echo.
echo Configuration files created:
echo   - backend\.env
echo   - frontend\client\.env
echo   - aggregator\config.yaml
echo   - backend\requirements.txt
echo   - vision\requirements.txt
echo   - aggregator\requirements.txt
echo   - backend\scripts\init_db.py
echo   - backend\scripts\create_admin.py
echo.
echo Code fixes applied:
echo   - vision\config\cameras.yaml ^(model path^)
echo   - vision\src\vision_service.py ^(import^)
echo   - vision\config\cameras.yaml ^(webcam^)
echo.
echo ============================================
pause
