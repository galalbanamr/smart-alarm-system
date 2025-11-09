/**
 * Configuration file
 * Modify VIDEO_STREAM_URL to use ESP32-CAM or other video stream sources
 * Set to null to use device camera
 */

export const CONFIG = {
    // Set to null to use device camera
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
        // Maximum RGB value for black detection (all channels must be below this)
        maxBlackValue: 80, // Maximum value for any RGB channel to be considered black
        // Color tolerance for distance-based matching (0.0 to 1.0)
        colorTolerance: 0.15, // 15% tolerance - stricter for black detection
        // Required continuous duration in seconds
        requiredDuration: 5
    },
    
    // Check requirements
    CHECKS: {
        // Required continuous standing duration in seconds
        standingDuration: 5,
        // Required continuous clothing duration in seconds
        clothingDuration: 5
    }
};

