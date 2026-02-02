/*
 * Smart Alarm System - ESP32 Buzzer Controller Firmware
 * 
 * This firmware controls a passive buzzer connected to an ESP32.
 * Uses HTTP only - for GitHub Pages use, run app locally with server.py
 * 
 * Hardware: ESP32 Dev Board + Passive Buzzer
 * 
 * Usage:
 * 1. Configure WIFI_SSID and WIFI_PASSWORD below
 * 2. Upload to ESP32
 * 3. Control buzzer via HTTP endpoints:
 *    - POST/GET /buzzer/on  → Turn buzzer ON
 *    - POST/GET /buzzer/off → Turn buzzer OFF
 *    - GET /status          → Get current status
 * 
 * NOTE: For GitHub Pages (HTTPS), you must run the web app locally
 *       using the provided server.py (python server.py)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

// ============================================================================
// CONFIGURATION - Change these values for your setup
// ============================================================================
const char* WIFI_SSID = "GALAL";
const char* WIFI_PASSWORD = "123456789";

// Buzzer pin - GPIO 2 (D2) - Has built-in LED on most ESP32 dev boards
#define BUZZER_PIN 2

// Buzzer frequency for passive buzzer (in Hz)
#define BUZZER_FREQUENCY 2000

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
WebServer server(80);
bool buzzerState = true;  // Start with buzzer ON

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void initWiFi();
void handleRoot();
void handleBuzzerOn();
void handleBuzzerOff();
void handleStatus();
void handleNotFound();
void handleOptions();
void setBuzzer(bool state);
void addCorsHeaders();

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Alarm System - ESP32 Buzzer Controller ===");
  
  // Configure buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Start with buzzer ON
  setBuzzer(true);
  Serial.println("Buzzer initialized: ON");
  
  // Connect to Wi-Fi
  initWiFi();
  
  // Setup HTTP server routes - support both GET and POST
  server.on("/", HTTP_GET, handleRoot);
  server.on("/buzzer/on", HTTP_POST, handleBuzzerOn);
  server.on("/buzzer/on", HTTP_GET, handleBuzzerOn);
  server.on("/buzzer/off", HTTP_POST, handleBuzzerOff);
  server.on("/buzzer/off", HTTP_GET, handleBuzzerOff);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/buzzer/on", HTTP_OPTIONS, handleOptions);
  server.on("/buzzer/off", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);
  
  // Start server
  server.begin();
  Serial.println("HTTP server started on port 80");
  Serial.println("\nAPI endpoints:");
  Serial.println("  POST/GET http://" + WiFi.localIP().toString() + "/buzzer/on");
  Serial.println("  POST/GET http://" + WiFi.localIP().toString() + "/buzzer/off");
  Serial.println("  GET http://" + WiFi.localIP().toString() + "/status");
  Serial.println("  mDNS: http://esp32-buzzer.local");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {
  server.handleClient();
  delay(1);
}

// ============================================================================
// WIFI INITIALIZATION
// ============================================================================
void initWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    if (MDNS.begin("esp32-buzzer")) {
      Serial.println("mDNS: esp32-buzzer.local");
    }
  } else {
    Serial.println("\nWi-Fi connection failed!");
  }
}

// ============================================================================
// BUZZER CONTROL
// ============================================================================
void setBuzzer(bool state) {
  buzzerState = state;
  
  if (state) {
    tone(BUZZER_PIN, BUZZER_FREQUENCY);
    Serial.println("Buzzer: ON");
  } else {
    noTone(BUZZER_PIN);
    delay(10);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("Buzzer: OFF");
  }
}

// ============================================================================
// CORS Headers - Required for cross-origin requests
// ============================================================================
void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================
void handleRoot() {
  addCorsHeaders();
  String html = "<!DOCTYPE html><html><head><title>ESP32 Buzzer</title></head><body>";
  html += "<h1>Smart Alarm - ESP32 Buzzer Controller</h1>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>Status: <strong>" + String(buzzerState ? "ON" : "OFF") + "</strong></p>";
  html += "<button onclick=\"fetch('/buzzer/on').then(()=>location.reload())\">Turn ON</button> ";
  html += "<button onclick=\"fetch('/buzzer/off').then(()=>location.reload())\">Turn OFF</button>";
  html += "<hr><p><small>For GitHub Pages: Run app locally with server.py</small></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleBuzzerOn() {
  Serial.println("\n=== BUZZER ON REQUEST ===");
  addCorsHeaders();
  setBuzzer(true);
  server.send(200, "application/json", "{\"status\":\"success\",\"buzzer\":\"on\"}");
}

void handleBuzzerOff() {
  Serial.println("\n=== BUZZER OFF REQUEST ===");
  addCorsHeaders();
  setBuzzer(false);
  server.send(200, "application/json", "{\"status\":\"success\",\"buzzer\":\"off\"}");
  Serial.println("✅ Buzzer turned OFF via HTTP");
}

void handleStatus() {
  addCorsHeaders();
  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["buzzer"] = buzzerState ? "on" : "off";
  doc["ip"] = WiFi.localIP().toString();
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleNotFound() {
  addCorsHeaders();
  server.send(404, "text/plain", "Not Found");
}
