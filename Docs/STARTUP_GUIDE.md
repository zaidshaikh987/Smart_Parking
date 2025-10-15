# Smart Parking System — Startup Guide

This guide explains how to run the frontend (React + Node server) and backend (FastAPI), and how to start everything via provided scripts.

---

## Prerequisites
- Node.js (LTS) and npm
- Python 3.10+ and pip
- MongoDB running locally (mongodb://localhost:27017)

---

## 1) Backend (FastAPI)

Install dependencies (once):
```powershell
# from project root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run the backend:
```powershell
# from project root OR backend directory
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Health check:
```powershell
curl http://localhost:8000/health
```

Notes:
- If MongoDB isn’t running, health may show database_connected: false.
- Pydantic v2 is supported; custom ObjectId is compatible.

---

## 2) Frontend

### A) Node.js Admin Gateway (frontend/server)
Install and run:
```powershell
cd frontend\server
npm install
npm run dev
```

### B) React App (frontend/client)
Install and run:
```powershell
cd frontend\client
npm install
npm start
```

The React app opens at http://localhost:3000 and connects to services on:
- Node server: http://localhost:5000
- Backend API: http://localhost:8000

---

## 3) One‑click Startup Scripts

Windows batch:
```powershell
scripts\startup\START_SYSTEM.bat
```
Starts: Backend (8000), Vision (8001), Aggregator (8002), ESP32 simulators (8100/8101).

Full system batch (includes React):
```powershell
scripts\startup\START_EVERYTHING.bat
```

PowerShell launcher:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\startup\start_all_services.ps1
```

---

## 4) URLs
- Frontend (React): http://localhost:3000
- Node server: http://localhost:5000
- Backend API: http://localhost:8000
- Vision: http://localhost:8001
- Aggregator: http://localhost:8002
- Entry gate: http://127.0.0.1:8100
- Exit gate: http://127.0.0.1:8101

---

## 5) Troubleshooting
- Port in use: close existing processes or change the port.
- Backend health degraded: ensure MongoDB is running.
- Node/React fails: run npm install in both frontend/server and frontend/client.
- PowerShell script execution: use `-ExecutionPolicy Bypass` when launching .ps1.
