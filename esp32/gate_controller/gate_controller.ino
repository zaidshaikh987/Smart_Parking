/*
 * RFID Smart Parking - ESP32 Gate Controller
 * 
 * Features:
 * - MQTT client for receiving gate control commands
 * - Relay control for gate motor
 * - RFID reader integration (MFRC522)
 * - HTTP endpoints for status and manual control
 * - LED indicators for gate status
 * 
 * Hardware:
 * - ESP32 DevKit
 * - MFRC522 RFID Reader
 * - Relay Module (for gate control)
 * - LEDs for status indication
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// Configuration
#include "config.h"

// Pin Definitions
#define RELAY_PIN 25        // Relay control pin for gate
#define LED_GREEN_PIN 26    // Green LED - System OK
#define LED_RED_PIN 27      // Red LED - Error/Denied
#define LED_BLUE_PIN 14     // Blue LED - Gate Open

#define RST_PIN 22          // RFID Reset pin
#define SS_PIN 21           // RFID SDA pin

// Initialize objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);
WebServer server(80);
MFRC522 rfid(SS_PIN, RST_PIN);

// Global variables
bool gateOpen = false;
unsigned long gateOpenTime = 0;
const unsigned long GATE_OPEN_DURATION = 5000; // 5 seconds
String lastRFID = "";
unsigned long lastRFIDTime = 0;

// Function declarations
void setup_wifi();
void reconnect_mqtt();
void mqtt_callback(char* topic, byte* payload, unsigned int length);
void openGate(String reason);
void closeGate();
void checkGateTimeout();
void readRFID();
void handleRoot();
void handleStatus();
void handleControl();

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("RFID Smart Parking - Gate Controller");
  Serial.println("=================================\n");
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);
  
  // Initial state
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_BLUE_PIN, LOW);
  
  // Initialize SPI for RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID Reader initialized");
  
  // Connect to WiFi
  setup_wifi();
  
  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqtt_callback);
  
  // Setup HTTP server
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/control", HTTP_POST, handleControl);
  server.begin();
  Serial.println("HTTP server started");
  
  // Indicate ready
  digitalWrite(LED_GREEN_PIN, HIGH);
  Serial.println("\nGate Controller Ready!");
}

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnect_mqtt();
  }
  mqttClient.loop();
  
  // Handle HTTP requests
  server.handleClient();
  
  // Check gate timeout
  checkGateTimeout();
  
  // Read RFID
  readRFID();
  
  delay(50);
}

void setup_wifi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
    digitalWrite(LED_RED_PIN, HIGH);
  }
}

void reconnect_mqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
    return;
  }
  
  if (mqttClient.connected()) return;
  
  Serial.print("Connecting to MQTT broker...");
  
  String clientId = "ESP32_Gate_" + String(random(0xffff), HEX);
  
  if (mqttClient.connect(clientId.c_str())) {
    Serial.println("connected!");
    
    // Subscribe to gate control topic
    mqttClient.subscribe(MQTT_TOPIC_GATE_CONTROL);
    Serial.print("Subscribed to: ");
    Serial.println(MQTT_TOPIC_GATE_CONTROL);
    
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, LOW);
  } else {
    Serial.print("failed, rc=");
    Serial.println(mqttClient.state());
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(LED_GREEN_PIN, LOW);
  }
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // Convert payload to string
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Check action
  const char* action = doc["action"];
  if (strcmp(action, "open") == 0) {
    const char* reason = doc["reason"] | "MQTT command";
    openGate(String(reason));
  } else if (strcmp(action, "close") == 0) {
    closeGate();
  }
}

void openGate(String reason) {
  if (gateOpen) {
    Serial.println("Gate already open");
    return;
  }
  
  Serial.print("Opening gate - Reason: ");
  Serial.println(reason);
  
  gateOpen = true;
  gateOpenTime = millis();
  
  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(LED_BLUE_PIN, HIGH);
  
  // Publish status to MQTT
  StaticJsonDocument<128> doc;
  doc["gate_status"] = "open";
  doc["reason"] = reason;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  mqttClient.publish(MQTT_TOPIC_GATE_STATUS, output.c_str());
}

void closeGate() {
  if (!gateOpen) {
    Serial.println("Gate already closed");
    return;
  }
  
  Serial.println("Closing gate");
  
  gateOpen = false;
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_BLUE_PIN, LOW);
  
  // Publish status to MQTT
  StaticJsonDocument<128> doc;
  doc["gate_status"] = "closed";
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  mqttClient.publish(MQTT_TOPIC_GATE_STATUS, output.c_str());
}

void checkGateTimeout() {
  if (gateOpen && (millis() - gateOpenTime >= GATE_OPEN_DURATION)) {
    Serial.println("Gate timeout - Auto closing");
    closeGate();
  }
}

void readRFID() {
  // Check for new RFID card
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }
  
  // Read RFID UID
  String rfidUID = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    rfidUID += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    rfidUID += String(rfid.uid.uidByte[i], HEX);
  }
  rfidUID.toUpperCase();
  
  // Debounce - ignore same card within 3 seconds
  if (rfidUID == lastRFID && (millis() - lastRFIDTime < 3000)) {
    rfid.PICC_HaltA();
    return;
  }
  
  lastRFID = rfidUID;
  lastRFIDTime = millis();
  
  Serial.print("RFID Detected: ");
  Serial.println(rfidUID);
  
  // Publish RFID scan event to MQTT
  StaticJsonDocument<128> doc;
  doc["rfid_id"] = rfidUID;
  doc["timestamp"] = millis();
  doc["location"] = "gate";
  
  String output;
  serializeJson(doc, output);
  mqttClient.publish(MQTT_TOPIC_RFID_SCAN, output.c_str());
  
  // Visual feedback
  digitalWrite(LED_BLUE_PIN, HIGH);
  delay(200);
  digitalWrite(LED_BLUE_PIN, LOW);
  
  rfid.PICC_HaltA();
}

// HTTP Handlers
void handleRoot() {
  String html = "<html><head><title>Gate Controller</title></head>";
  html += "<body><h1>ESP32 Gate Controller</h1>";
  html += "<p>Status: " + String(gateOpen ? "OPEN" : "CLOSED") + "</p>";
  html += "<p>WiFi: Connected</p>";
  html += "<p>MQTT: " + String(mqttClient.connected() ? "Connected" : "Disconnected") + "</p>";
  html += "<p><a href='/status'>Status JSON</a></p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["gate_status"] = gateOpen ? "open" : "closed";
  doc["wifi_connected"] = WiFi.status() == WL_CONNECTED;
  doc["mqtt_connected"] = mqttClient.connected();
  doc["ip_address"] = WiFi.localIP().toString();
  doc["uptime_ms"] = millis();
  doc["last_rfid"] = lastRFID;
  
  String output;
  serializeJson(doc, output);
  
  server.send(200, "application/json", output);
}

void handleControl() {
  if (!server.hasArg("action")) {
    server.send(400, "application/json", "{\"error\":\"Missing action parameter\"}");
    return;
  }
  
  String action = server.arg("action");
  
  if (action == "open") {
    openGate("HTTP command");
    server.send(200, "application/json", "{\"message\":\"Gate opening\"}");
  } else if (action == "close") {
    closeGate();
    server.send(200, "application/json", "{\"message\":\"Gate closing\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"Invalid action\"}");
  }
}
