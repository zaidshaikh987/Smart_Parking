# 🚗 RFID Smart Parking System

**Complete IoT-Based Parking Management Solution with Computer Vision, RFID Access Control, and Real-Time Dashboard**

---

## 🎯 Overview

A production-ready smart parking system that combines:
- **Computer Vision** (YOLOv8) for real-time vehicle detection
- **ESP32-CAM** for live video streaming
- **RFID Access Control** for automated entry/exit
- **Payment Gateway** (Razorpay) integration
- **Real-Time Dashboard** (React + Material-UI)
- **IoT Integration** (MQTT, ESP32 gate control)

---

## 🏗️ System Architecture

```
┌─────────────┐
│ ESP32-CAM   │──► Video Stream
└─────────────┘
       │
       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vision    │────────►│ Aggregator  │────────►│   Backend   │
│  Service    │  MQTT   │  Service    │   API   │    (API)    │
│  (YOLOv8)   │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                               │                       │
                               │ MQTT                  │ HTTP
                               ▼                       ▼
                        ┌─────────────┐        ┌─────────────┐
                        │ ESP32 Gate  │        │  Frontend   │
                        │  Controller │        │  Dashboard  │
                        └─────────────┘        └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ RFID Reader │
                        └─────────────┘
```

---

## ✨ Key Features

### 🎥 Computer Vision
- YOLOv8-based vehicle detection
- Real-time parking slot occupancy tracking
- ESP32-CAM integration for live video
- Multi-camera support
- Configurable detection zones

### 🔐 Access Control
- RFID-based entry/exit automation
- User registration and management
- Automated gate control via ESP32
- Session tracking (entry/exit times)

### 💰 Payment System
- Razorpay payment gateway integration
- Prepaid wallet system (FASTag-style)
- Automatic billing based on parking duration
- Transaction history and analytics

### 📊 Admin Dashboard
- Real-time parking occupancy visualization
- Live session monitoring
- Revenue analytics with charts
- System health monitoring
- User management interface

### 🔄 Real-Time Updates
- WebSocket-based live data
- MQTT for IoT communication
- Instant slot status updates
- Active session tracking

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database
- MQTT broker (Mosquitto)
- ESP32-CAM module (optional for live camera)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Car_Parking_Space_Detection
```

2. **Set up backend**
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload
```

3. **Set up vision service**
```bash
cd vision
pip install -r requirements.txt
python src/vision_service.py
```

4. **Set up frontend**
```bash
cd frontend
npm install
npm start

# In another terminal
cd frontend
node server/server.js
```

5. **Access the dashboard**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Vision Service: http://localhost:8001

---

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup and configuration guide
- **[esp32_firmware/ESP32_GUIDE.md](esp32_firmware/ESP32_GUIDE.md)** - ESP32-CAM hardware setup
- **[frontend/FRONTEND_GUIDE.md](frontend/FRONTEND_GUIDE.md)** - Frontend features and customization

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Python REST API
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Razorpay** - Payment gateway
- **Pydantic** - Data validation

### Frontend
- **React** - UI framework
- **Material-UI** - Component library
- **Recharts** - Data visualization
- **Socket.io** - Real-time communication
- **Axios** - HTTP client

### Computer Vision
- **YOLOv8** - Object detection
- **OpenCV** - Image processing
- **Ultralytics** - YOLO implementation

### IoT & Hardware
- **ESP32-CAM** - Video streaming
- **ESP32** - Gate controller
- **MQTT** - IoT messaging
- **RFID RC522** - Card reader

---

## 📁 Project Structure

```
Car_Parking_Space_Detection/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # REST endpoints
│   │   ├── models/      # Database models
│   │   ├── services/    # Business logic
│   │   └── db/          # Database config
│   └── alembic/         # Database migrations
├── vision/              # Computer vision service
│   ├── src/
│   │   ├── vision_service.py    # Main detection service
│   │   └── detectors/           # YOLO & OpenCV detectors
│   └── config/          # Camera configurations
├── aggregator/          # MQTT aggregator service
│   └── aggregator_service.py
├── frontend/            # React dashboard
│   ├── client/          # React app
│   │   └── src/
│   │       ├── components/
│   │       ├── services/
│   │       └── pages/
│   └── server/          # Node.js proxy server
├── esp32_firmware/      # ESP32 Arduino code
│   └── camera_stream/   # Camera streaming firmware
└── esp32_gate/          # Gate controller firmware
```

---

## 🎮 Usage

### Admin Login
Default credentials:
- Email: `admin@parking.com`
- Password: `admin123`

### Dashboard Features
1. **Overview** - Real-time slot availability, active sessions, revenue
2. **Parking Grid** - Visual representation of parking slots
3. **Users** - Manage RFID users and wallets
4. **Sessions** - Monitor active parking sessions
5. **Transactions** - Payment history
6. **System Monitor** - Health status of all services

### API Documentation
Visit: http://localhost:8000/docs for interactive API documentation

---

## 🧪 Testing

### Test Backend
```bash
cd backend
pytest tests/
```

### Test Vision Service
```bash
cd vision
python tests/test_detector.py
```

### View Live Camera Feed
http://localhost:8001/camera/CAM_01/frame

---

## 🔧 Configuration

### Database
Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/parking_db
```

### MQTT Broker
Edit `aggregator/config.yaml`:
```yaml
mqtt:
  broker: "localhost"
  port: 1883
```

### Camera Setup
Edit `vision/config/cameras.yaml`:
```yaml
cameras:
  CAM_01:
    stream_url: "http://192.168.1.105/stream"  # ESP32-CAM IP
    zones:
      - zone_id: "SLOT_A1"
        coordinates: [[100, 100], [300, 250]]
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Use production database (not SQLite)
- [ ] Set strong JWT secret key
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper firewall rules
- [ ] Set up monitoring and logging
- [ ] Use process managers (PM2, systemd)

### Docker Deployment (Optional)
```bash
docker-compose up -d
```

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**MD. Zaid Shaikh**

---

## 🙏 Acknowledgments

- YOLOv8 by Ultralytics
- Material-UI components
- FastAPI framework
- ESP32 community

---

## 📞 Support

For questions or issues, please open a GitHub issue or contact the maintainer.

---

**Built with ❤️ for smart city infrastructure**
