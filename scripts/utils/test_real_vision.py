"""
Quick test script to verify Real Vision Service is working
"""
import requests
import time

BASE_URL = "http://localhost:8005"

def test_service():
    print("=" * 60)
    print("🧪 TESTING REAL VISION SERVICE")
    print("=" * 60)
    print()
    
    # Test 1: Root endpoint
    print("Test 1: Checking service root...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    print()
    
    # Test 2: Status endpoint
    print("Test 2: Checking service status...")
    try:
        response = requests.get(f"{BASE_URL}/status")
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   Mode: {data.get('mode')}")
        print(f"   Model: {data.get('model')}")
        print(f"   Cameras: {data.get('cameras')}")
        print(f"   Slots: {data.get('slots_monitored')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    print()
    
    # Test 3: Slots endpoint
    print("Test 3: Checking slot status...")
    try:
        response = requests.get(f"{BASE_URL}/slots/status")
        print(f"✅ Status: {response.status_code}")
        slots = response.json().get('slots', {})
        for slot_id, status in slots.items():
            occupied = status.get('occupied')
            print(f"   {slot_id}: {'🔴 OCCUPIED' if occupied else '🟢 FREE'}")
    except Exception as e:
        print(f"❌ Error: {e}")
    print()
    
    # Test 4: Cameras endpoint
    print("Test 4: Checking cameras...")
    try:
        response = requests.get(f"{BASE_URL}/cameras")
        print(f"✅ Status: {response.status_code}")
        cameras = response.json().get('cameras', [])
        for cam in cameras:
            print(f"   📹 {cam.get('camera_id')}: {cam.get('status')}")
            print(f"      Source: {cam.get('source')}")
            print(f"      Slots: {cam.get('slots_count')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    print()
    
    # Test 5: Video feed
    print("Test 5: Checking video feed...")
    print(f"   📺 Live feed URL: {BASE_URL}/camera/CAM_01/frame")
    print(f"   🌐 Open this in your browser to see live detection!")
    print()
    
    print("=" * 60)
    print("✅ ALL TESTS COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Open browser: http://localhost:8005/camera/CAM_01/frame")
    print("2. Show car images/toys to your webcam")
    print("3. Watch YOLOv8 detect vehicles in real-time!")
    print()

if __name__ == "__main__":
    print("Waiting 2 seconds for service to be ready...")
    time.sleep(2)
    test_service()
