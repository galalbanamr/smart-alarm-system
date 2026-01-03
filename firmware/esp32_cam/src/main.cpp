/*
 * Smart Alarm System - ESP32-CAM Firmware
 * 
 * This firmware connects the ESP32-CAM to Wi-Fi and streams video via MJPEG.
 * The web app will use this stream for pose and clothing detection.
 * 
 * Hardware: ESP32-CAM (AI-Thinker board)
 * 
 * Usage:
 * 1. Configure WIFI_SSID and WIFI_PASSWORD below
 * 2. Upload to ESP32-CAM
 * 3. Access stream at: http://<esp32-ip>/stream
 * 4. Use in web app: <img src="http://<esp32-ip>/stream" />
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>
#include <ESPmDNS.h>

// ============================================================================
// CONFIGURATION - TODO: Change these values for your network
// ============================================================================
const char* WIFI_SSID = "GALAL";
const char* WIFI_PASSWORD = "123456789";


// ============================================================================
// CAMERA PIN CONFIGURATION - TODO: Adjust if using different ESP32-CAM board
// ============================================================================
// Standard pin configuration for AI-Thinker ESP32-CAM board
// If you have a different board, modify these pin definitions
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
WebServer server(80);

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void initCamera();
void initWiFi();
void handleStream();
void handleRoot();

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Smart Alarm System - ESP32-CAM ===");
  
  // Initialize camera
  initCamera();
  
  // Connect to Wi-Fi
  initWiFi();
  
  // Setup HTTP server routes
  server.on("/", handleRoot);
  
  // Handle CORS preflight requests for /stream
  server.on("/stream", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });
  
  server.on("/stream", HTTP_GET, handleStream);
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
  Serial.println("Stream available at:");
  Serial.println("  http://" + WiFi.localIP().toString() + "/stream");
  Serial.println("  http://esp32-cam.local/stream (mDNS)");
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
// CAMERA INITIALIZATION
// ============================================================================
void initCamera() {
  Serial.println("Initializing camera...");
  
  // Configure camera pins
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Frame size and quality - TODO: Adjust based on your needs
  // Smaller frames = lower bandwidth but lower quality
  // Options: FRAMESIZE_QQVGA, FRAMESIZE_QVGA, FRAMESIZE_VGA, FRAMESIZE_SVGA, etc.
  config.frame_size = FRAMESIZE_VGA;  // 640x480
  config.jpeg_quality = 12;  // 0-63, lower = higher quality
  config.fb_count = 1;
  
  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }
  
  Serial.println("Camera initialized successfully");
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
    // This allows access via: http://esp32-cam.local
    if (MDNS.begin("esp32-cam")) {
      Serial.println("mDNS responder started");
      Serial.println("Access via: http://esp32-cam.local");
    } else {
      Serial.println("Error setting up MDNS responder!");
    }
  } else {
    Serial.println("\nWi-Fi connection failed!");
    Serial.println("Please check your SSID and password.");
  }
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

// Root endpoint - provides basic info
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>ESP32-CAM Stream</title></head><body>";
  html += "<h1>Smart Alarm System - ESP32-CAM</h1>";
  html += "<p>IP Address: " + WiFi.localIP().toString() + "</p>";
  html += "<p><a href='/stream'>View Stream</a></p>";
  html += "<h2>Stream Preview:</h2>";
  html += "<img src='/stream' style='max-width: 640px;' />";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// MJPEG stream endpoint
// This is the main endpoint your web app will use
void handleStream() {
  Serial.println("Stream requested");
  
  WiFiClient client = server.client();
  
  // Send MJPEG headers with CORS support for JavaScript fetch
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n";
  response += "Access-Control-Allow-Origin: *\r\n";
  response += "Access-Control-Allow-Methods: GET, OPTIONS\r\n";
  response += "Access-Control-Allow-Headers: Content-Type\r\n\r\n";
  server.sendContent(response);
  
  // Continuously send frames
  while (client.connected()) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      break;
    }
    
    // Send frame boundary and headers
    client.print("--frame\r\n");
    client.print("Content-Type: image/jpeg\r\n");
    client.print("Content-Length: " + String(fb->len) + "\r\n\r\n");
    
    // Send frame data
    client.write(fb->buf, fb->len);
    client.print("\r\n");
    
    // Return frame buffer
    esp_camera_fb_return(fb);
    
    delay(10);  // Small delay between frames (adjust for frame rate)
  }
}

/*
 * ============================================================================
 * INTEGRATION GUIDE FOR WEB APP
 * ============================================================================
 * 
 * To use this stream in your web app, you have several options:
 * 
 * Option 1: Simple <img> tag (easiest for MJPEG)
 *   <img src="http://<esp32-ip>/stream" alt="Camera Stream" />
 * 
 * Option 2: JavaScript with fetch (for more control)
 *   const streamUrl = 'http://<esp32-ip>/stream';
 *   const img = document.createElement('img');
 *   img.src = streamUrl;
 *   document.body.appendChild(img);
 * 
 * Option 3: Video element (if browser supports MJPEG)
 *   <video autoplay>
 *     <source src="http://<esp32-ip>/stream" type="video/mjpeg">
 *   </video>
 * 
 * Option 4: Canvas-based approach (for processing frames)
 *   const img = new Image();
 *   img.crossOrigin = 'anonymous';
 *   img.src = 'http://<esp32-ip>/stream';
 *   img.onload = function() {
 *     const canvas = document.createElement('canvas');
 *     const ctx = canvas.getContext('2d');
 *     ctx.drawImage(img, 0, 0);
 *     // Process frame with your ML models
 *   };
 * 
 * Finding the ESP32 IP:
 * - Check Serial Monitor after upload
 * - Or use your router's admin panel
 * - Or scan your network with a tool like Advanced IP Scanner
 * 
 * TODO: Consider adding authentication if needed for security
 * TODO: Consider adding frame rate control endpoint
 * TODO: Consider adding resolution control endpoint
 */

