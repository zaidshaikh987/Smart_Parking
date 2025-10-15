"""
Aggregator Service - Integration Layer
Connects Vision → Backend → ESP32 Gate Control
"""
import json
import time
import logging
import yaml
import requests
from pathlib import Path
import paho.mqtt.client as mqtt
from typing import Dict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AggregatorService:
    """Aggregates all components and manages workflow"""
    
    def __init__(self, config_path: str):
        """Initialize aggregator"""
        self.config = self.load_config(config_path)
        self.mqtt_config = self.config.get('mqtt', {})
        self.backend_url = self.config.get('backend_url', 'http://localhost:8000')
        
        # State tracking
        self.slot_states = {}
        self.any_slot_available = False
        
        # MQTT client
        self.mqtt_client = self.setup_mqtt()
        
        logger.info("Aggregator Service initialized")
    
    def load_config(self, config_path: str) -> Dict:
        """Load configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            # Default config
            return {
                'mqtt': {
                    'broker_host': 'localhost',
                    'broker_port': 1883,
                    'qos': 1
                },
                'backend_url': 'http://localhost:8000'
            }
    
    def setup_mqtt(self) -> mqtt.Client:
        """Setup MQTT client with subscriptions"""
        client_id = f"aggregator_{int(time.time())}"
        client = mqtt.Client(client_id)
        
        client.on_connect = self.on_connect
        client.on_message = self.on_message
        client.on_disconnect = self.on_disconnect
        
        try:
            broker = self.mqtt_config.get('broker_host', 'localhost')
            port = self.mqtt_config.get('broker_port', 1883)
            client.connect(broker, port, 60)
            logger.info(f"Connected to MQTT broker at {broker}:{port}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT: {e}")
            raise
        
        return client
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            logger.info("MQTT connected successfully")
            
            # Subscribe to all slot updates
            client.subscribe("parking/camera/+/slot/+")
            logger.info("Subscribed to: parking/camera/+/slot/+")
            
            # Subscribe to RFID scans
            client.subscribe("parking/rfid/scan")
            logger.info("Subscribed to: parking/rfid/scan")
            
            # Subscribe to gate status
            client.subscribe("parking/gate/status")
            logger.info("Subscribed to: parking/gate/status")
        else:
            logger.error(f"MQTT connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT disconnection callback"""
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnection (rc={rc}), reconnecting...")
    
    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.debug(f"Received: {topic} -> {payload}")
            
            # Handle slot updates
            if topic.startswith("parking/camera/") and "/slot/" in topic:
                self.handle_slot_update(payload)
            
            # Handle RFID scans
            elif topic == "parking/rfid/scan":
                self.handle_rfid_scan(payload)
            
            # Handle gate status
            elif topic == "parking/gate/status":
                self.handle_gate_status(payload)
        
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def handle_slot_update(self, payload: Dict):
        """Handle slot occupancy update"""
        slot_id = payload.get('slot_id')
        is_occupied = payload.get('occupied')
        camera_id = payload.get('camera_id')
        
        # Update local state
        self.slot_states[slot_id] = is_occupied
        
        # Calculate if any slot is available
        free_slots = sum(1 for occupied in self.slot_states.values() if not occupied)
        self.any_slot_available = free_slots > 0
        
        logger.info(f"Slot {slot_id}: {'OCCUPIED' if is_occupied else 'FREE'} | Free slots: {free_slots}")
        
        # Publish global availability
        self.publish_global_status()
    
    def handle_rfid_scan(self, payload: Dict):
        """Handle RFID tag scan"""
        rfid_id = payload.get('rfid_id')
        location = payload.get('location', 'unknown')
        
        logger.info(f"RFID scanned: {rfid_id} at {location}")
        
        # Determine if entry or exit
        if location == 'gate' or location == 'entry':
            self.handle_entry_request(rfid_id)
        elif location == 'exit':
            self.handle_exit_request(rfid_id)
    
    def handle_entry_request(self, rfid_id: str):
        """Process entry request"""
        logger.info(f"Processing entry for RFID: {rfid_id}")
        
        try:
            # Check if slot is available
            if not self.any_slot_available:
                logger.warning(f"Entry denied for {rfid_id}: No slots available")
                self.send_gate_command("deny", f"No parking slots available")
                return
            
            # Call backend API to record entry
            response = requests.post(
                f"{self.backend_url}/api/entry",
                json={
                    'rfid_id': rfid_id,
                    'camera_id': 'GATE_CAM'
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Entry recorded: {data}")
                
                # Open gate
                self.send_gate_command("open", f"Entry granted for {rfid_id}")
            else:
                error = response.json().get('detail', 'Unknown error')
                logger.error(f"Entry failed: {error}")
                self.send_gate_command("deny", error)
        
        except Exception as e:
            logger.error(f"Error processing entry: {e}")
            self.send_gate_command("deny", "System error")
    
    def handle_exit_request(self, rfid_id: str):
        """Process exit request"""
        logger.info(f"Processing exit for RFID: {rfid_id}")
        
        try:
            # Call backend API to record exit
            response = requests.post(
                f"{self.backend_url}/api/exit",
                json={
                    'rfid_id': rfid_id,
                    'camera_id': 'GATE_CAM'
                },
                timeout=5
            )
            
            if response.status_code == 200:
                receipt = response.json()
                logger.info(f"Exit processed. Amount: ₹{receipt['amount_charged']}")
                logger.info(f"Receipt: {receipt['session_id']}")
                
                # Open gate
                self.send_gate_command("open", f"Exit granted. Charged: ₹{receipt['amount_charged']}")
            elif response.status_code == 402:
                # Insufficient balance
                error = response.json().get('detail', 'Insufficient balance')
                logger.error(f"Exit denied: {error}")
                self.send_gate_command("deny", error)
            else:
                error = response.json().get('detail', 'Unknown error')
                logger.error(f"Exit failed: {error}")
                self.send_gate_command("deny", error)
        
        except Exception as e:
            logger.error(f"Error processing exit: {e}")
            self.send_gate_command("deny", "System error")
    
    def send_gate_command(self, action: str, reason: str = ""):
        """Send command to ESP32 gate controller"""
        topic = "parking/gate/control"
        payload = {
            'action': action,
            'reason': reason,
            'timestamp': time.time()
        }
        
        try:
            self.mqtt_client.publish(topic, json.dumps(payload), qos=1)
            logger.info(f"Gate command sent: {action} - {reason}")
        except Exception as e:
            logger.error(f"Failed to send gate command: {e}")
    
    def handle_gate_status(self, payload: Dict):
        """Handle gate status updates"""
        status = payload.get('gate_status')
        logger.debug(f"Gate status: {status}")
    
    def publish_global_status(self):
        """Publish global system status"""
        topic = "parking/global/any_slot"
        payload = {
            'any_slot_available': self.any_slot_available,
            'free_slots': sum(1 for occupied in self.slot_states.values() if not occupied),
            'total_slots': len(self.slot_states),
            'timestamp': time.time()
        }
        
        try:
            self.mqtt_client.publish(topic, json.dumps(payload), qos=1)
        except Exception as e:
            logger.error(f"Failed to publish global status: {e}")
    
    def start(self):
        """Start the aggregator service"""
        logger.info("=" * 60)
        logger.info("RFID Smart Parking - Aggregator Service")
        logger.info("=" * 60)
        logger.info("Connecting components: Vision ↔ Backend ↔ ESP32")
        logger.info("=" * 60)
        
        try:
            self.mqtt_client.loop_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down aggregator...")
            self.stop()
    
    def stop(self):
        """Stop the service"""
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()
        logger.info("Aggregator stopped")


def main():
    """Main entry point"""
    # Config path
    config_path = Path(__file__).parent / "config.yaml"
    if not config_path.exists():
        # Try parent config
        config_path = Path(__file__).parent.parent / "config" / "mqtt.yaml"
    
    aggregator = AggregatorService(str(config_path))
    
    try:
        aggregator.start()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
        aggregator.stop()


if __name__ == '__main__':
    main()
