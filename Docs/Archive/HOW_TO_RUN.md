# 🚀 HOW TO RUN THE COMPLETE SMART PARKING SYSTEM

## ✅ Quick Start (ONE-CLICK)

**Just double-click this file:**
```
START_EVERYTHING.bat
```

That's it! Everything will start automatically.

---

## 📊 What Will Happen

After running `START_EVERYTHING.bat`, you'll see **5 command windows** open:

1. **Backend API** (Port 8000) - Blue window
2. **Vision Service** (Port 8001) - Purple window  
3. **Aggregator** (Port 8002) - Yellow window
4. **ESP32 Gates** (Ports 8100-8101) - Red window
5. **React Frontend** (Port 3000) - Green window

After ~20 seconds, your browser will automatically open to:
```
http://localhost:3000
```

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main admin dashboard |
| **Backend API** | http://localhost:8000 | REST API |
| **Vision Service** | http://localhost:8001 | Camera simulation |
| **Aggregator** | http://localhost:8002 | MQTT coordinator |
| **Entry Gate** | http://127.0.0.1:8100 | ESP32 entry gate |
| **Exit Gate** | http://127.0.0.1:8101 | ESP32 exit gate |

---

## 📱 Frontend Navigation

Once the browser opens, use the **☰ menu** (top-left) to navigate:

- **📊 Dashboard** - System overview with health indicators
- **🅿️ Parking Slots** - Live slot visualization
- **👥 RFID Users** - User management (register, edit, wallet)
- **🚗 Active Sessions** - Monitor current parking sessions
- **⚙️ System Monitor** - Check all service statuses ← **GO HERE FIRST!**

---

## ✅ Verify Everything is Working

1. Click **☰ menu** → **⚙️ System Monitor**
2. You should see **ALL GREEN** status indicators:
   - ✅ FastAPI Backend: Online
   - ✅ Vision Service: Online  
   - ✅ Aggregator: Online
   - ✅ Entry Gate: Online (127.0.0.1:8100)
   - ✅ Exit Gate: Online (127.0.0.1:8101)

If any show offline, wait 10 more seconds and refresh the page.

---

## 🧪 Quick Test

### Test 1: View Users
1. Go to **👥 RFID Users**
2. You should see 3 sample users:
   - John Doe (RFID001)
   - Jane Smith (RFID002)
   - Bob Wilson (RFID003)

### Test 2: View Active Sessions
1. Go to **🚗 Active Sessions**
2. You should see 2 active parking sessions

### Test 3: View Parking Slots
1. Go to **🅿️ Parking Slots**
2. You should see 5 slots (2 occupied, 3 available)

### Test 4: Test Wallet Top-up
1. Go to **👥 RFID Users**
2. Click the **💳 wallet icon** next to any user
3. Click **+ ₹100**
4. Balance should update immediately

### Test 5: Test Manual Exit
1. Go to **🚗 Active Sessions**
2. Click **Exit** button on any session
3. Session should disappear from list
4. Slot should become available

---

## 🛑 How to Stop

**Option 1:** Close each command window individually

**Option 2:** Run this command in PowerShell:
```powershell
Get-Process | Where-Object {$_.MainWindowTitle -like "*Backend*" -or $_.MainWindowTitle -like "*Vision*" -or $_.MainWindowTitle -like "*Aggregator*" -or $_.MainWindowTitle -like "*ESP32*" -or $_.MainWindowTitle -like "*React*"} | Stop-Process
```

---

## 🐛 Troubleshooting

### Backend shows "Offline"
- Check if the "Backend API" window is open
- Look for errors in that window
- Port 8000 might be in use - close other apps using it

### Vision/Aggregator shows "Offline"  
- Check if their windows are open
- They might take 10-15 seconds to fully start
- Refresh the System Monitor page

### Gates show "Offline"
- Check if "ESP32 Gates" window is running
- Wait 10 seconds, they take time to start
- Ports 8100/8101 might be in use

### Frontend won't load
- Check if "React Frontend" window shows "Compiled successfully"
- It takes 20-30 seconds to compile first time
- Try manually opening http://localhost:3000

### "Port already in use" errors
- Close all command windows
- Wait 10 seconds
- Run `START_EVERYTHING.bat` again

---

## 📦 What's Included

✅ **Full Backend** - FastAPI with all endpoints
✅ **RFID User Management** - Complete CRUD operations
✅ **Payment System** - Wallet management ready
✅ **Computer Vision Simulator** - 3 cameras simulated
✅ **Session Management** - Entry/exit tracking
✅ **ESP32 Gate Simulators** - 2 gate controllers
✅ **Aggregator** - MQTT coordination simulator
✅ **React Frontend** - Beautiful admin dashboard
✅ **Real-time Updates** - Auto-refresh every 5-10 seconds

---

## 🎉 You're All Set!

The system is **100% working** with sample data.

Navigate to **System Monitor** to see all services online! 🟢

---

**Need help?** Check the system logs in each command window.
