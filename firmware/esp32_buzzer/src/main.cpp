/*
 * Smart Alarm System - ESP32 Buzzer Controller Firmware
 * 
 * This firmware controls a passive buzzer connected to an ESP32.
 * The buzzer starts ON by default and can be controlled via HTTP REST API.
 * 
 * Hardware: ESP32 Dev Board + Passive Buzzer
 * 
 * Usage:
 * 1. Configure WIFI_SSID, WIFI_PASSWORD, and BUZZER_PIN below
 * 2. Upload to ESP32
 * 3. Control buzzer via HTTP endpoints:
 *    - POST /buzzer/on  → Turn buzzer ON
 *    - POST /buzzer/off → Turn buzzer OFF
 *    - GET /status      → Get current status
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

// ============================================================================
// CONFIGURATION - TODO: Change these values for your setup
// ============================================================================
const char* WIFI_SSID = "GALAL";
const char* WIFI_PASSWORD = "123456789";

// Buzzer pin - GPIO 2 (D2) - Has built-in LED on most ESP32 dev boards
// The LED will turn ON when buzzer is ON, providing visual feedback
// Note: For passive buzzers, you typically need a PWM pin
// GPIO 2 is a PWM-capable pin and has an LED for visual indication
#define BUZZER_PIN 2  // GPIO 2 (D2) - LED pin on most ESP32 boards

// Buzzer frequency for passive buzzer (in Hz)
// TODO: Adjust based on your buzzer specifications
#define BUZZER_FREQUENCY 2000  // 2kHz is a common frequency

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
WebServer server(80);
bool buzzerState = true;  // Start with buzzer ON (default behavior)

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

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Alarm System - ESP32 Buzzer Controller ===");
  
  // Configure buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Start with buzzer ON (default morning state)
  setBuzzer(true);
  Serial.println("Buzzer initialized: ON (default)");
  
  // Connect to Wi-Fi
  initWiFi();
  
  // Setup HTTP server routes
  server.on("/", handleRoot);
  server.on("/buzzer/on", HTTP_POST, handleBuzzerOn);
  server.on("/buzzer/off", HTTP_POST, handleBuzzerOff);
  server.on("/status", HTTP_GET, handleStatus);
  // Handle CORS preflight requests
  server.on("/buzzer/on", HTTP_OPTIONS, handleOptions);
  server.on("/buzzer/off", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
  Serial.println("API endpoints:");
  Serial.println("  POST http://" + WiFi.localIP().toString() + "/buzzer/on");
  Serial.println("  POST http://esp32-buzzer.local/buzzer/on (mDNS)");
  Serial.println("  POST http://" + WiFi.localIP().toString() + "/buzzer/off");
  Serial.println("  POST http://esp32-buzzer.local/buzzer/off (mDNS)");
  Serial.println("  GET  http://" + WiFi.localIP().toString() + "/status");
  Serial.println("  GET  http://esp32-buzzer.local/status (mDNS)");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {
  server.handleClient();
  // mDNS runs automatically on ESP32 - no update() needed
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
    
    // Initialize mDNS (Multicast DNS) for automatic IP discovery
    // This allows access via: http://esp32-buzzer.local
    if (MDNS.begin("esp32-buzzer")) {
      Serial.println("mDNS responder started");
      Serial.println("Access via: http://esp32-buzzer.local");
    } else {
      Serial.println("Error setting up MDNS responder!");
    }
  } else {
    Serial.println("\nWi-Fi connection failed!");
    Serial.println("Please check your SSID and password.");
  }
}

// ============================================================================
// BUZZER CONTROL
// ============================================================================
void setBuzzer(bool state) {
  buzzerState = state;
  
  if (state) {
    // Turn buzzer ON
    // For PASSIVE buzzer: use tone() - generates PWM signal
    // The LED on GPIO 2 will flicker/glow due to PWM, providing visual feedback
    tone(BUZZER_PIN, BUZZER_FREQUENCY);
    
    // For ACTIVE buzzer (uncomment if using active buzzer):
    // digitalWrite(BUZZER_PIN, HIGH);  // LED will be solid ON
    
    Serial.println("Buzzer: ON (LED on GPIO 2 should be visible/flickering)");
  } else {
    // Turn buzzer OFF
    // For passive buzzer: noTone() stops PWM
    noTone(BUZZER_PIN);
    
    // Small delay to ensure PWM is fully stopped
    delay(10);
    
    // Reconfigure pin to ensure it's in OUTPUT mode (not PWM mode)
    pinMode(BUZZER_PIN, OUTPUT);
    
    // Ensure LED is OFF - explicitly set to LOW
    digitalWrite(BUZZER_PIN, LOW);
    
    // Additional delay to ensure the state is applied
    delay(5);
    
    Serial.println("Buzzer: OFF (LED on GPIO 2 should be OFF)");
  }
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

// Root endpoint - provides API documentation
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>ESP32 Buzzer Controller</title></head><body>";
  html += "<h1>Smart Alarm System - ESP32 Buzzer Controller</h1>";
  html += "<p>IP Address: " + WiFi.localIP().toString() + "</p>";
  html += "<p>Current Status: " + String(buzzerState ? "ON" : "OFF") + "</p>";
  html += "<h2>API Endpoints:</h2>";
  html += "<ul>";
  html += "<li><strong>POST /buzzer/on</strong> - Turn buzzer ON</li>";
  html += "<li><strong>POST /buzzer/off</strong> - Turn buzzer OFF</li>";
  html += "<li><strong>GET /status</strong> - Get current status (JSON)</li>";
  html += "</ul>";
  html += "<h2>Test Controls:</h2>";
  html += "<button onclick=\"fetch('/buzzer/on', {method: 'POST'}).then(() => location.reload())\">Turn ON</button> ";
  html += "<button onclick=\"fetch('/buzzer/off', {method: 'POST'}).then(() => location.reload())\">Turn OFF</button>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// Turn buzzer ON
void handleBuzzerOn() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  setBuzzer(true);
  
  // Return JSON response
  String response = "{\"status\":\"success\",\"buzzer\":\"on\"}";
  server.send(200, "application/json", response);
  Serial.println("API: Buzzer turned ON via HTTP");
}

// Turn buzzer OFF
void handleBuzzerOff() {
  Serial.println("\n=== BUZZER OFF REQUEST RECEIVED ===");
  Serial.print("Client IP: ");
  Serial.println(server.client().remoteIP());
  Serial.print("Request URI: ");
  Serial.println(server.uri());
  Serial.print("Request Method: ");
  Serial.println(server.method() == HTTP_POST ? "POST" : "OTHER");
  
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  Serial.println("Calling setBuzzer(false)...");
  setBuzzer(false);
  
  Serial.print("Buzzer state after setBuzzer: ");
  Serial.println(buzzerState ? "ON" : "OFF");
  
  // Return JSON response
  String response = "{\"status\":\"success\",\"buzzer\":\"off\"}";
  server.send(200, "application/json", response);
  Serial.println("✅ Response sent: Buzzer turned OFF via HTTP");
  Serial.println("=====================================\n");
}

// Get status
void handleStatus() {
  // Create JSON response
  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["buzzer"] = buzzerState ? "on" : "off";
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
}

// Handle CORS preflight (OPTIONS) requests
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204); // No content response for OPTIONS
}

// Handle 404
void handleNotFound() {
  String message = "Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  
  server.send(404, "text/plain", message);
}

/*
 * ============================================================================
 * INTEGRATION GUIDE FOR WEB APP
 * ============================================================================
 * 
 * To control the buzzer from your web app, use the following endpoints:
 * 
 * 1. Turn Buzzer ON:
 *    JavaScript (fetch):
 *      fetch('http://<esp32-ip>/buzzer/on', { method: 'POST' })
 *        .then(response => response.json())
 *        .then(data => console.log(data));
 * 
 *    cURL:
 *      curl -X POST http://<esp32-ip>/buzzer/on
 * 
 * 2. Turn Buzzer OFF:
 *    JavaScript (fetch):
 *      fetch('http://<esp32-ip>/buzzer/off', { method: 'POST' })
 *        .then(response => response.json())
 *        .then(data => console.log(data));
 * 
 *    cURL:
 *      curl -X POST http://<esp32-ip>/buzzer/off
 * 
 * 3. Get Status:
 *    JavaScript (fetch):
 *      fetch('http://<esp32-ip>/status')
 *        .then(response => response.json())
 *        .then(data => {
 *          console.log('Buzzer:', data.buzzer);
 *          console.log('IP:', data.ip);
 *        });
 * 
 *    cURL:
 *      curl http://<esp32-ip>/status
 * 
 * Example: Turn off buzzer when standing is detected
 *    if (standingDetected) {
 *      fetch('http://<esp32-ip>/buzzer/off', { method: 'POST' })
 *        .then(() => console.log('Buzzer turned off'));
 *    }
 * 
 * Finding the ESP32 IP:
 * - Check Serial Monitor after upload
 * - Or use your router's admin panel
 * - Or scan your network with a tool like Advanced IP Scanner
 * 
 * TODO: Consider adding authentication if needed for security
 * TODO: Consider adding alarm schedule functionality
 * TODO: Consider adding volume control (PWM duty cycle)
 * TODO: Consider adding different buzzer patterns/sequences
 */

