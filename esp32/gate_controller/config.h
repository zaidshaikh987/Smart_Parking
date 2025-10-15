/*
 * Configuration file for ESP32 Gate Controller
 * Update these settings for your network and MQTT broker
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// MQTT Configuration
#define MQTT_SERVER "192.168.1.100"  // MQTT broker IP address
#define MQTT_PORT 1883
#define MQTT_USER ""  // Leave empty if no authentication
#define MQTT_PASSWORD ""

// MQTT Topics
#define MQTT_TOPIC_GATE_CONTROL "parking/gate/control"
#define MQTT_TOPIC_GATE_STATUS "parking/gate/status"
#define MQTT_TOPIC_RFID_SCAN "parking/rfid/scan"

// Gate Settings
#define GATE_OPEN_DURATION_MS 5000  // How long gate stays open (milliseconds)

#endif
