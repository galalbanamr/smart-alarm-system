/**
 * Configuration file
 * Modify VIDEO_STREAM_URL to use ESP32-CAM or other video stream sources
 * Set to null to use device camera
 */

export const CONFIG = {
    // Camera source: 'laptop' or 'esp32'
    CAMERA_SOURCE: 'laptop',

    // ESP32-CAM hostname/IP - Uses mDNS hostname for automatic IP discovery
    // mDNS works for img src attributes in most browsers
    ESP32_CAM_IP: 'esp32-cam.local', // mDNS hostname

    // ESP32-CAM stream endpoint - set directly to the working URL
    ESP32_CAM_STREAM_URL: 'http://esp32-cam.local/stream',

    // ESP32 Buzzer IP Address
    // IMPORTANT: JavaScript fetch() cannot resolve .local hostnames!
    // Find your ESP32's IP in the Serial Monitor after boot
    // Or visit http://esp32-buzzer.local in your browser address bar
    ESP32_BUZZER_IP: '192.168.137.130',

    // Legacy: Set to null to use device camera
    // Example ESP32-CAM URLs:
    // - 'http://192.168.1.100:81/stream' (MJPEG stream)
    // - 'http://192.168.1.100:81/video' (H.264 stream)
    VIDEO_STREAM_URL: null,

    // MediaPipe Pose settings
    POSE_SETTINGS: {
        modelComplexity: 1, // 0, 1, or 2 (higher = more accurate but slower)
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    },

    // Standing detection thresholds
    STANDING_THRESHOLDS: {
        verticalTolerance: 0.25, // Increased tolerance for alignment
        minHeightRatio: 1.1, // Much lower threshold for easier detection
        maxAngleDeviation: 30
    },

    // Clothing detection settings
    CLOTHING_DETECTION: {
        // Target color to detect (RGB values 0-255)
        // Default: black (0, 0, 0)
        targetColor: { r: 0, g: 0, b: 0 },
        // Maximum Brightness (max RGB channel) to consider "black"
        // Increased to 120 to allow for "gray" which is black under bright light
        maxBlackValue: 120,
        // Maximum Saturation (difference between max and min channel)
        // Black/Gray has very low saturation. Colors have high saturation.
        // Threshold of 30 prevents dark red/blue from being detected as black
        maxSaturation: 30,
        // Color tolerance for distance-based matching (optional fallback)
        colorTolerance: 0.3,
        // Required continuous duration in seconds
        requiredDuration: 5,
        // Enable debug logging (set to true to see color values in console)
        debug: true
    },

    // Check requirements
    CHECKS: {
        // Required continuous standing duration in seconds
        standingDuration: 5,
        // Required continuous clothing duration in seconds
        clothingDuration: 5
    }
};

