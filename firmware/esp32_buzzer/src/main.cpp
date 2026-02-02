/*
 * Smart Alarm System - ESP32 Buzzer Controller Firmware (HTTPS Version)
 * 
 * This firmware controls a passive buzzer connected to an ESP32.
 * The buzzer starts ON by default and can be controlled via HTTPS REST API.
 * 
 * HTTPS is required for communication from GitHub Pages (HTTPS) to ESP32.
 * Uses a self-signed certificate - you may need to accept it in your browser first.
 * 
 * Hardware: ESP32 Dev Board + Passive Buzzer
 * 
 * Usage:
 * 1. Configure WIFI_SSID, WIFI_PASSWORD, and BUZZER_PIN below
 * 2. Upload to ESP32
 * 3. IMPORTANT: First visit https://<ESP32-IP>/ in your browser and accept the certificate
 * 4. Control buzzer via HTTPS endpoints:
 *    - POST /buzzer/on  → Turn buzzer ON
 *    - POST /buzzer/off → Turn buzzer OFF
 *    - GET /status      → Get current status
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

// For HTTPS support
#include <HTTPSServer.hpp>
#include <SSLCert.hpp>
#include <HTTPRequest.hpp>
#include <HTTPResponse.hpp>

using namespace httpsserver;

// ============================================================================
// CONFIGURATION - TODO: Change these values for your setup
// ============================================================================
const char* WIFI_SSID = "GALAL";
const char* WIFI_PASSWORD = "123456789";

// Buzzer pin - GPIO 2 (D2) - Has built-in LED on most ESP32 dev boards
#define BUZZER_PIN 2  // GPIO 2 (D2) - LED pin on most ESP32 boards

// Buzzer frequency for passive buzzer (in Hz)
#define BUZZER_FREQUENCY 2000  // 2kHz is a common frequency

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
SSLCert * cert;
HTTPSServer * secureServer;
WebServer httpServer(80);  // Also keep HTTP server for local access
bool buzzerState = true;  // Start with buzzer ON (default behavior)

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void initWiFi();
void setBuzzer(bool state);
void handleRoot(HTTPRequest * req, HTTPResponse * res);
void handleBuzzerOn(HTTPRequest * req, HTTPResponse * res);
void handleBuzzerOff(HTTPRequest * req, HTTPResponse * res);
void handleStatus(HTTPRequest * req, HTTPResponse * res);
void handleOptions(HTTPRequest * req, HTTPResponse * res);
void handleNotFound(HTTPRequest * req, HTTPResponse * res);
// HTTP handlers (for local access)
void handleHttpRoot();
void handleHttpBuzzerOn();
void handleHttpBuzzerOff();
void handleHttpStatus();
void handleHttpOptions();

// ============================================================================
// CORS Headers Helper
// ============================================================================
void addCorsHeaders(HTTPResponse * res) {
  res->setHeader("Access-Control-Allow-Origin", "*");
  res->setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res->setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Alarm System - ESP32 Buzzer Controller (HTTPS) ===");
  
  // Configure buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Start with buzzer ON (default morning state)
  setBuzzer(true);
  Serial.println("Buzzer initialized: ON (default)");
  
  // Connect to Wi-Fi
  initWiFi();
  
  // Generate self-signed certificate
  Serial.println("Generating self-signed certificate...");
  cert = new SSLCert();
  int createCertResult = createSelfSignedCert(
    *cert,
    KEYSIZE_2048,
    "CN=esp32-buzzer.local,O=SmartAlarm,C=US",
    "20250101000000",
    "20350101000000"
  );
  
  if (createCertResult != 0) {
    Serial.println("ERROR: Certificate generation failed!");
    Serial.println("Falling back to HTTP only...");
  } else {
    Serial.println("Certificate generated successfully!");
    
    // Create HTTPS server on port 443
    secureServer = new HTTPSServer(cert, 443, 5);
    
    // Register HTTPS routes
    ResourceNode * nodeRoot = new ResourceNode("/", "GET", &handleRoot);
    ResourceNode * nodeBuzzerOnPost = new ResourceNode("/buzzer/on", "POST", &handleBuzzerOn);
    ResourceNode * nodeBuzzerOnGet = new ResourceNode("/buzzer/on", "GET", &handleBuzzerOn);  // Also support GET
    ResourceNode * nodeBuzzerOnOptions = new ResourceNode("/buzzer/on", "OPTIONS", &handleOptions);
    ResourceNode * nodeBuzzerOffPost = new ResourceNode("/buzzer/off", "POST", &handleBuzzerOff);
    ResourceNode * nodeBuzzerOffGet = new ResourceNode("/buzzer/off", "GET", &handleBuzzerOff);  // Also support GET
    ResourceNode * nodeBuzzerOffOptions = new ResourceNode("/buzzer/off", "OPTIONS", &handleOptions);
    ResourceNode * nodeStatus = new ResourceNode("/status", "GET", &handleStatus);
    ResourceNode * nodeNotFound = new ResourceNode("", "GET", &handleNotFound);
    
    secureServer->registerNode(nodeRoot);
    secureServer->registerNode(nodeBuzzerOnPost);
    secureServer->registerNode(nodeBuzzerOnGet);
    secureServer->registerNode(nodeBuzzerOnOptions);
    secureServer->registerNode(nodeBuzzerOffPost);
    secureServer->registerNode(nodeBuzzerOffGet);
    secureServer->registerNode(nodeBuzzerOffOptions);
    secureServer->registerNode(nodeStatus);
    secureServer->setDefaultNode(nodeNotFound);
    
    // Start HTTPS server
    secureServer->start();
    if (secureServer->isRunning()) {
      Serial.println("HTTPS server started on port 443");
    } else {
      Serial.println("ERROR: HTTPS server failed to start!");
    }
  }
  
  // Also setup HTTP server (for local access without HTTPS)
  httpServer.on("/", handleHttpRoot);
  httpServer.on("/buzzer/on", HTTP_POST, handleHttpBuzzerOn);
  httpServer.on("/buzzer/on", HTTP_GET, handleHttpBuzzerOn);
  httpServer.on("/buzzer/off", HTTP_POST, handleHttpBuzzerOff);
  httpServer.on("/buzzer/off", HTTP_GET, handleHttpBuzzerOff);
  httpServer.on("/status", HTTP_GET, handleHttpStatus);
  httpServer.on("/buzzer/on", HTTP_OPTIONS, handleHttpOptions);
  httpServer.on("/buzzer/off", HTTP_OPTIONS, handleHttpOptions);
  httpServer.begin();
  Serial.println("HTTP server started on port 80");
  
  Serial.println("\n=== API Endpoints ===");
  Serial.println("HTTPS (for GitHub Pages):");
  Serial.println("  POST https://" + WiFi.localIP().toString() + "/buzzer/on");
  Serial.println("  POST https://" + WiFi.localIP().toString() + "/buzzer/off");
  Serial.println("  GET  https://" + WiFi.localIP().toString() + "/status");
  Serial.println("\nHTTP (for local access):");
  Serial.println("  POST http://" + WiFi.localIP().toString() + "/buzzer/on");
  Serial.println("  POST http://" + WiFi.localIP().toString() + "/buzzer/off");
  Serial.println("");
  Serial.println("IMPORTANT: Before using from GitHub Pages, visit");
  Serial.println("https://" + WiFi.localIP().toString() + "/ in your browser");
  Serial.println("and accept the self-signed certificate!");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {
  if (secureServer != nullptr) {
    secureServer->loop();
  }
  httpServer.handleClient();
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
    
    // Initialize mDNS
    if (MDNS.begin("esp32-buzzer")) {
      Serial.println("mDNS responder started: esp32-buzzer.local");
    } else {
      Serial.println("Error setting up MDNS responder!");
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
    delay(5);
    Serial.println("Buzzer: OFF");
  }
}

// ============================================================================
// HTTPS HANDLERS
// ============================================================================
void handleRoot(HTTPRequest * req, HTTPResponse * res) {
  addCorsHeaders(res);
  res->setHeader("Content-Type", "text/html");
  
  String html = "<!DOCTYPE html><html><head><title>ESP32 Buzzer (HTTPS)</title></head><body>";
  html += "<h1>Smart Alarm - ESP32 Buzzer Controller</h1>";
  html += "<p>Buzzer Status: " + String(buzzerState ? "ON" : "OFF") + "</p>";
  html += "<p>HTTPS is enabled! You can now control this from GitHub Pages.</p>";
  html += "<button onclick=\"fetch('/buzzer/on', {method:'POST'}).then(()=>location.reload())\">Turn ON</button> ";
  html += "<button onclick=\"fetch('/buzzer/off', {method:'POST'}).then(()=>location.reload())\">Turn OFF</button>";
  html += "</body></html>";
  
  res->print(html);
}

void handleBuzzerOn(HTTPRequest * req, HTTPResponse * res) {
  addCorsHeaders(res);
  res->setHeader("Content-Type", "application/json");
  
  setBuzzer(true);
  res->print("{\"status\":\"success\",\"buzzer\":\"on\"}");
  Serial.println("API: Buzzer ON (HTTPS)");
}

void handleBuzzerOff(HTTPRequest * req, HTTPResponse * res) {
  Serial.println("\n=== BUZZER OFF REQUEST (HTTPS) ===");
  addCorsHeaders(res);
  res->setHeader("Content-Type", "application/json");
  
  setBuzzer(false);
  res->print("{\"status\":\"success\",\"buzzer\":\"off\"}");
  Serial.println("✅ Buzzer OFF via HTTPS");
}

void handleStatus(HTTPRequest * req, HTTPResponse * res) {
  addCorsHeaders(res);
  res->setHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["buzzer"] = buzzerState ? "on" : "off";
  doc["ip"] = WiFi.localIP().toString();
  doc["https"] = true;
  
  String response;
  serializeJson(doc, response);
  res->print(response);
}

void handleOptions(HTTPRequest * req, HTTPResponse * res) {
  addCorsHeaders(res);
  res->setStatusCode(204);
}

void handleNotFound(HTTPRequest * req, HTTPResponse * res) {
  res->setStatusCode(404);
  res->print("Not Found");
}

// ============================================================================
// HTTP HANDLERS (for local access)
// ============================================================================
void handleHttpRoot() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  String html = "<!DOCTYPE html><html><body><h1>ESP32 Buzzer (HTTP)</h1>";
  html += "<p>Status: " + String(buzzerState ? "ON" : "OFF") + "</p>";
  html += "<p>For GitHub Pages access, use HTTPS on port 443</p></body></html>";
  httpServer.send(200, "text/html", html);
}

void handleHttpBuzzerOn() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  setBuzzer(true);
  httpServer.send(200, "application/json", "{\"status\":\"success\",\"buzzer\":\"on\"}");
}

void handleHttpBuzzerOff() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  setBuzzer(false);
  httpServer.send(200, "application/json", "{\"status\":\"success\",\"buzzer\":\"off\"}");
}

void handleHttpStatus() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["buzzer"] = buzzerState ? "on" : "off";
  doc["ip"] = WiFi.localIP().toString();
  String response;
  serializeJson(doc, response);
  httpServer.send(200, "application/json", response);
}

void handleHttpOptions() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  httpServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  httpServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  httpServer.send(204);
}
