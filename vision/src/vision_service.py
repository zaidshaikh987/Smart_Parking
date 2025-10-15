"""
Vision Service - Main Orchestrator
Handles camera streams, detections, and MQTT publishing
"""
import cv2
import yaml
import time
import logging
import argparse
import threading
from pathlib import Path
from typing import Dict, List
import paho.mqtt.client as mqtt
import requests
from datetime import datetime

from .detector_yolo import YOLODetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VisionService:
    """Main vision service for parking slot detection"""
    
    def __init__(self, config_path: str, mqtt_config_path: str):
        """Initialize vision service"""
        self.config = self.load_config(config_path)
        self.mqtt_config = self.load_mqtt_config(mqtt_config_path)
        
        # Initialize MQTT client
        self.mqtt_client = self.setup_mqtt()
        
        # Initialize detector
        model_path = self.config['vision_settings'].get('yolo_model', 'yolov8n.pt')
        self.detector = YOLODetector(model_path=model_path, confidence_threshold=0.5)
        
        # Camera threads
        self.camera_threads = []
        self.running = False
        
        # Backend API URL
        self.backend_url = "http://localhost:8000"
        
        logger.info("Vision Service initialized")
    
    def load_config(self, config_path: str) -> Dict:
        """Load camera configuration"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"Loaded config from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            raise
    
    def load_mqtt_config(self, config_path: str) -> Dict:
        """Load MQTT configuration"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            return config.get('mqtt', {})
        except Exception as e:
            logger.warning(f"Failed to load MQTT config: {e}, using defaults")
            return {
                'broker_host': 'localhost',
                'broker_port': 1883,
                'qos': 1
            }
    
    def setup_mqtt(self) -> mqtt.Client:
        """Setup MQTT client"""
        client_id = f"vision_service_{int(time.time())}"
        client = mqtt.Client(client_id)
        
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                logger.info("Connected to MQTT broker")
            else:
                logger.error(f"MQTT connection failed with code {rc}")
        
        def on_disconnect(client, userdata, rc):
            if rc != 0:
                logger.warning("Unexpected MQTT disconnection, reconnecting...")
        
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        
        try:
            broker = self.mqtt_config.get('broker_host', 'localhost')
            port = self.mqtt_config.get('broker_port', 1883)
            client.connect(broker, port, 60)
            client.loop_start()
            logger.info(f"MQTT client connecting to {broker}:{port}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
        
        return client
    
    def publish_slot_update(self, camera_id: str, slot_id: str, is_occupied: bool, confidence: float = 1.0):
        """Publish slot occupancy update via MQTT and HTTP"""
        # MQTT publish
        topic = f"parking/camera/{camera_id}/slot/{slot_id}"
        payload = {
            'camera_id': camera_id,
            'slot_id': slot_id,
            'occupied': is_occupied,
            'confidence': confidence,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            import json
            self.mqtt_client.publish(topic, json.dumps(payload), qos=self.mqtt_config.get('qos', 1))
            logger.debug(f"Published: {topic} -> {is_occupied}")
        except Exception as e:
            logger.error(f"Failed to publish MQTT: {e}")
        
        # Also update backend via HTTP
        try:
            requests.post(
                f"{self.backend_url}/api/slots/update",
                json={
                    'slot_id': slot_id,
                    'camera_id': camera_id,
                    'is_occupied': is_occupied,
                    'confidence': confidence
                },
                timeout=2
            )
        except Exception as e:
            logger.debug(f"Failed to update backend: {e}")
    
    def process_camera(self, camera_config: Dict):
        """Process single camera stream"""
        camera_id = camera_config['camera_id']
        stream_url = camera_config['stream_url']
        slots = camera_config['slots']
        fps = camera_config.get('fps', 5)
        
        logger.info(f"Starting camera {camera_id}: {stream_url}")
        
        # Open video stream
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            logger.error(f"Failed to open camera {camera_id}")
            return
        
        frame_delay = 1.0 / fps
        last_status = {}
        
        # Prepare slots for detector
        detector_slots = []
        for slot in slots:
            detector_slots.append({
                'slot_id': slot['slot_id'],
                'polygon': slot['polygon']
            })
        
        while self.running:
            ret, frame = cap.read()
            if not ret:
                logger.warning(f"Failed to read frame from {camera_id}, reconnecting...")
                cap.release()
                time.sleep(5)
                cap = cv2.VideoCapture(stream_url)
                continue
            
            try:
                # Detect occupancy for all slots
                slot_statuses = self.detector.detect_all_slots(
                    frame, 
                    detector_slots,
                    overlap_threshold=camera_config.get('overlap_threshold', 0.3)
                )
                
                # Check for changes and publish
                for slot_id, status in slot_statuses.items():
                    is_occupied = status['occupied']
                    confidence = status['confidence']
                    
                    # Only publish if status changed
                    if slot_id not in last_status or last_status[slot_id] != is_occupied:
                        self.publish_slot_update(camera_id, slot_id, is_occupied, confidence)
                        last_status[slot_id] = is_occupied
                        logger.info(f"{camera_id}/{slot_id}: {'OCCUPIED' if is_occupied else 'FREE'} ({confidence:.2f})")
                
                # Visualization (optional)
                if self.config['vision_settings'].get('show_visualization', False):
                    vis_frame = self.detector.visualize_detections(frame, detector_slots, slot_statuses)
                    cv2.imshow(f"Camera {camera_id}", vis_frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        self.running = False
                        break
                
            except Exception as e:
                logger.error(f"Error processing frame from {camera_id}: {e}")
            
            time.sleep(frame_delay)
        
        cap.release()
        cv2.destroyAllWindows()
        logger.info(f"Camera {camera_id} stopped")
    
    def start(self):
        """Start all camera processing threads"""
        self.running = True
        
        cameras = self.config.get('cameras', [])
        if not cameras:
            logger.error("No cameras configured!")
            return
        
        logger.info(f"Starting {len(cameras)} camera(s)...")
        
        for camera_config in cameras:
            thread = threading.Thread(
                target=self.process_camera,
                args=(camera_config,),
                daemon=True
            )
            thread.start()
            self.camera_threads.append(thread)
            logger.info(f"Started thread for camera {camera_config['camera_id']}")
        
        # Wait for all threads
        try:
            for thread in self.camera_threads:
                thread.join()
        except KeyboardInterrupt:
            logger.info("Shutting down vision service...")
            self.stop()
    
    def stop(self):
        """Stop all camera processing"""
        self.running = False
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()
        logger.info("Vision service stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Vision Service for Parking Detection')
    parser.add_argument('--config', default='config/cameras.yaml', help='Camera config file')
    parser.add_argument('--mqtt-config', default='../config/mqtt.yaml', help='MQTT config file')
    args = parser.parse_args()
    
    # Resolve paths
    base_dir = Path(__file__).parent.parent
    config_path = base_dir / args.config
    mqtt_config_path = Path(__file__).parent.parent.parent / 'config' / 'mqtt.yaml'
    
    logger.info("=" * 60)
    logger.info("RFID Smart Parking - Vision Service")
    logger.info("=" * 60)
    
    service = VisionService(str(config_path), str(mqtt_config_path))
    
    try:
        service.start()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
        service.stop()


if __name__ == '__main__':
    main()
