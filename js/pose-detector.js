/**
 * Pose Detector Module
 * Handles MediaPipe Pose initialization and detection
 */

import { CONFIG } from './config.js';
import { MDNSResolver } from './mdns-resolver.js';

export class PoseDetector {
    constructor(videoElement, canvasElement, onResults) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.onResults = onResults;
        this.pose = null;
        this.camera = null;
        this.currentSource = 'laptop'; // 'laptop' or 'esp32'
        this.detectionLoopId = null;
    }

    async initialize(cameraSource = 'laptop') {
        // First, initialize the Pose model
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: CONFIG.POSE_SETTINGS.modelComplexity,
            smoothLandmarks: CONFIG.POSE_SETTINGS.smoothLandmarks,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: CONFIG.POSE_SETTINGS.minDetectionConfidence,
            minTrackingConfidence: CONFIG.POSE_SETTINGS.minTrackingConfidence
        });

        this.pose.onResults((results) => {
            this.drawResults(results);
            if (this.onResults) {
                this.onResults(results);
            }
        });

        // Then initialize the camera based on source
        try {
            if (cameraSource === 'esp32') {
                await this.initializeESP32Camera();
                console.log('ESP32-CAM initialized');
            } else {
                await this.initializeLaptopCamera();
                console.log('Laptop camera initialized');
            }
        } catch (error) {
            console.error('Camera initialization failed:', error);
            throw error;
        }
    }

    async initializeLaptopCamera() {
        return new Promise((resolve, reject) => {
            console.log('Starting Laptop Camera initialization...');
            this.currentSource = 'laptop';
            
            // Stop any existing detection loop
            if (this.detectionLoopId) {
                cancelAnimationFrame(this.detectionLoopId);
                this.detectionLoopId = null;
            }

            // Clear video source completely if switching from ESP32
            this.video.pause();
            this.video.src = '';
            this.video.srcObject = null;
            
            // Remove all event listeners
            this.video.onloadeddata = null;
            this.video.oncanplay = null;
            this.video.oncanplaythrough = null;
            this.video.onerror = null;
            this.video.onloadedmetadata = null;

            // Small delay to ensure video is cleared
            setTimeout(() => {
                // Initialize MediaPipe Camera
                this.camera = new Camera(this.video, {
                    onFrame: async () => {
                        // Only process frames if we're still using laptop camera
                        if (this.currentSource === 'laptop' && this.camera) {
                            await this.pose.send({ image: this.video });
                        }
                    },
                    width: 1280,
                    height: 720
                });

                this.camera.start()
                    .then(() => {
                        console.log('Laptop Camera started successfully');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Laptop Camera start failed:', error);
                        reject(error);
                    });
            }, 300);
        });
    }

    async initializeESP32Camera() {
        return new Promise((resolve, reject) => {
            console.log('Starting ESP32-CAM initialization...');
            this.currentSource = 'esp32';
            
            // Ensure laptop camera is stopped
            if (this.camera) {
                try {
                    this.camera.stop();
                    console.log('Stopped MediaPipe Camera before ESP32 init');
                } catch (error) {
                    console.warn('Error stopping MediaPipe Camera:', error);
                }
                this.camera = null;
            }

            // Stop any existing detection loop and ESP32 resources
            if (this.detectionLoopId) {
                cancelAnimationFrame(this.detectionLoopId);
                this.detectionLoopId = null;
            }
            
            // Clean up any existing ESP32 stream
            if (this.esp32AbortController) {
                this.esp32AbortController.abort();
                this.esp32AbortController = null;
            }

            // Build ESP32-CAM stream URL (handles mDNS hostnames)
            const streamUrl = MDNSResolver.getUrl(CONFIG.ESP32_CAM_IP, '/stream');
            console.log('Connecting to ESP32-CAM:', streamUrl);

            // Clear any existing video source completely
            this.video.pause();
            this.video.src = '';
            this.video.srcObject = null;
            
            // Create image element for latest frame
            if (!this.esp32StreamImg) {
                this.esp32StreamImg = document.createElement('img');
                this.esp32StreamImg.crossOrigin = 'anonymous';
                this.esp32StreamImg.style.display = 'none';
                document.body.appendChild(this.esp32StreamImg);
            }
            
            let resolved = false;
            let frameCount = 0;
            let reader = null;
            let lastFrameTime = Date.now();
            let frameCheckInterval = null;
            this.esp32AbortController = new AbortController();
            this.esp32LastFrameTime = lastFrameTime; // Store in instance for access
            
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (this.esp32AbortController) {
                        this.esp32AbortController.abort();
                    }
                    if (frameCheckInterval) clearInterval(frameCheckInterval);
                    reject(new Error('ESP32-CAM stream timeout - check IP address and connection'));
                }
            }, 15000);

            const onSuccess = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log('ESP32-CAM stream loaded successfully');
                    
                    // Monitor frame updates - if no frames for 5 seconds, restart
                    frameCheckInterval = setInterval(() => {
                        if (this.currentSource !== 'esp32') {
                            clearInterval(frameCheckInterval);
                            return;
                        }
                        const timeSinceLastFrame = Date.now() - this.esp32LastFrameTime;
                        if (timeSinceLastFrame > 5000) {
                            console.warn('ESP32-CAM stream stopped receiving frames, restarting...');
                            clearInterval(frameCheckInterval);
                            // Restart the stream
                            this.stop(); // Clean up first
                            setTimeout(() => {
                                if (this.currentSource === 'esp32') {
                                    this.initializeESP32Camera().catch(err => {
                                        console.error('Failed to restart ESP32-CAM:', err);
                                    });
                                }
                            }, 500);
                        }
                    }, 2000);
                    
                    // Store interval reference for cleanup
                    this.esp32FrameCheckInterval = frameCheckInterval;
                    
                    setTimeout(() => {
                        this.startDetectionLoop();
                        resolve();
                    }, 500);
                }
            };

            // Fetch and parse MJPEG stream properly
            console.log('Attempting to fetch ESP32-CAM stream from:', streamUrl);
            fetch(streamUrl, { 
                signal: this.esp32AbortController.signal,
                cache: 'no-cache',
                mode: 'cors' // Explicitly allow CORS
            })
                .then(response => {
                    console.log('ESP32-CAM fetch response received:', response.status, response.statusText);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
                    }
                    console.log('ESP32-CAM stream fetch started successfully');
                    
                    reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = new Uint8Array(0);
                    const boundary = '--frame'; // From ESP32 firmware: boundary=frame
                    let frameStart = -1;
                    
                    const processChunk = () => {
                        reader.read().then(({ done, value }) => {
                            if (done || this.currentSource !== 'esp32') {
                                console.log('ESP32-CAM stream ended');
                                return;
                            }
                            
                            if (value) {
                                // Append new data
                                const newBuffer = new Uint8Array(buffer.length + value.length);
                                newBuffer.set(buffer);
                                newBuffer.set(value, buffer.length);
                                buffer = newBuffer;
                                
                                // Process frames continuously
                                while (buffer.length > 100) { // Need enough data
                                    if (frameStart === -1) {
                                        // Look for boundary marker
                                        const boundaryBytes = new TextEncoder().encode(boundary);
                                        const boundaryIndex = this.findInBuffer(buffer, boundary);
                                        
                                        if (boundaryIndex >= 0) {
                                            // Found boundary, now look for JPEG start (0xFF 0xD8)
                                            // Skip past boundary, headers, and newlines
                                            let searchStart = boundaryIndex + boundaryBytes.length;
                                            
                                            // Skip headers (look for double CRLF which ends headers)
                                            for (let i = searchStart; i < buffer.length - 3; i++) {
                                                if (buffer[i] === 0x0D && buffer[i+1] === 0x0A && 
                                                    buffer[i+2] === 0x0D && buffer[i+3] === 0x0A) {
                                                    // Found end of headers, JPEG should start after this
                                                    searchStart = i + 4;
                                                    break;
                                                }
                                            }
                                            
                                            // Look for JPEG start marker
                                            for (let i = searchStart; i < buffer.length - 1; i++) {
                                                if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8) {
                                                    frameStart = i;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        if (frameStart === -1) {
                                            // No frame found yet, keep some buffer and wait
                                            if (buffer.length > 50000) {
                                                // Too much data without finding frame, reset
                                                buffer = buffer.slice(-1000); // Keep last 1KB
                                            }
                                            break;
                                        }
                                    }
                                    
                                    // Look for JPEG end marker (0xFF 0xD9)
                                    if (frameStart >= 0) {
                                        for (let i = frameStart + 2; i < buffer.length - 1; i++) {
                                            if (buffer[i] === 0xFF && buffer[i + 1] === 0xD9) {
                                                // Found complete JPEG frame
                                                const frameData = buffer.slice(frameStart, i + 2);
                                                
                                                // Create blob URL and load image
                                                const blob = new Blob([frameData], { type: 'image/jpeg' });
                                                const url = URL.createObjectURL(blob);
                                                
                                                // Clean up old URL
                                                if (this.esp32StreamImg.src && this.esp32StreamImg.src.startsWith('blob:')) {
                                                    URL.revokeObjectURL(this.esp32StreamImg.src);
                                                }
                                                
                                                this.esp32StreamImg.onload = () => {
                                                    frameCount++;
                                                    this.esp32LastFrameTime = Date.now(); // Update last frame time
                                                    
                                                    // Update canvas size
                                                    if (this.canvas.width !== this.esp32StreamImg.naturalWidth || 
                                                        this.canvas.height !== this.esp32StreamImg.naturalHeight) {
                                                        this.canvas.width = this.esp32StreamImg.naturalWidth;
                                                        this.canvas.height = this.esp32StreamImg.naturalHeight;
                                                    }
                                                    
                                                    // Draw to canvas
                                                    this.ctx.drawImage(this.esp32StreamImg, 0, 0);
                                                    
                                                    if (frameCount === 1) {
                                                        console.log('ESP32-CAM first frame loaded');
                                                        onSuccess();
                                                    } else if (frameCount % 30 === 0) {
                                                        // Log every 30 frames to show it's still working
                                                        console.log(`ESP32-CAM: ${frameCount} frames received`);
                                                    }
                                                };
                                                
                                                this.esp32StreamImg.onerror = () => {
                                                    console.warn('Failed to load JPEG frame');
                                                };
                                                
                                                this.esp32StreamImg.src = url;
                                                
                                                // Remove processed frame from buffer
                                                buffer = buffer.slice(i + 2);
                                                frameStart = -1;
                                                break;
                                            }
                                        }
                                        
                                        // If frame not complete, wait for more data
                                        if (frameStart >= 0) {
                                            if (buffer.length > 500000) {
                                                // Frame too large, reset
                                                buffer = buffer.slice(-1000);
                                                frameStart = -1;
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // Continue reading
                            if (this.currentSource === 'esp32') {
                                processChunk();
                            }
                        }).catch(error => {
                            if (this.currentSource !== 'esp32') {
                                return; // Switched cameras, ignore error
                            }
                            
                            if (error.name === 'AbortError') {
                                return; // Expected when stopping
                            }
                            
                            console.error('ESP32-CAM stream read error:', error);
                            
                            // If we've received frames before, try to restart
                            if (frameCount > 0) {
                                console.log('ESP32-CAM stream interrupted, attempting to reconnect...');
                                // Wait a bit then restart
                                setTimeout(() => {
                                    if (this.currentSource === 'esp32') {
                                        this.initializeESP32Camera().catch(err => {
                                            console.error('Failed to reconnect ESP32-CAM:', err);
                                        });
                                    }
                                }, 2000);
                                return;
                            }
                            
                            // If no frames received yet, reject
                            if (!resolved && frameCount === 0) {
                                resolved = true;
                                clearTimeout(timeout);
                                if (frameCheckInterval) clearInterval(frameCheckInterval);
                                reject(new Error(`Failed to read ESP32-CAM stream: ${error.message}`));
                            }
                        });
                    };
                    
                    processChunk();
                })
                .catch(error => {
                    if (!resolved && error.name !== 'AbortError') {
                        resolved = true;
                        clearTimeout(timeout);
                        console.error('ESP32-CAM fetch error details:', {
                            error: error.message,
                            name: error.name,
                            stack: error.stack,
                            url: streamUrl
                        });
                        
                        // Provide helpful error message
                        let errorMsg = `Failed to connect to ESP32-CAM: ${error.message}`;
                        if (CONFIG.ESP32_CAM_IP.endsWith('.local')) {
                            errorMsg += '\n\nTip: If mDNS (.local) doesn\'t work, try using the IP address directly in config.js';
                        }
                        reject(new Error(errorMsg));
                    }
                });
        });
    }
    
    findInBuffer(buffer, searchString) {
        const searchBytes = new TextEncoder().encode(searchString);
        for (let i = 0; i <= buffer.length - searchBytes.length; i++) {
            let match = true;
            for (let j = 0; j < searchBytes.length; j++) {
                if (buffer[i + j] !== searchBytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }

    drawResults(results) {
        try {
            let sourceWidth, sourceHeight;
            let sourceElement = null;
            
            // Get source element and dimensions
            if (this.currentSource === 'esp32') {
                // For ESP32, use the stream image
                if (this.esp32StreamImg && this.esp32StreamImg.complete && this.esp32StreamImg.naturalWidth > 0) {
                    sourceElement = this.esp32StreamImg;
                    sourceWidth = this.esp32StreamImg.naturalWidth;
                    sourceHeight = this.esp32StreamImg.naturalHeight;
                } else {
                    return; // Not ready yet
                }
            } else {
                // Check if video is ready
                if (!this.video || this.video.readyState < 2 || this.video.videoWidth === 0) {
                    return;
                }
                sourceElement = this.video;
                sourceWidth = this.video.videoWidth;
                sourceHeight = this.video.videoHeight;
            }

            // Clear canvas
            this.ctx.save();
            
            // Set canvas size to match source (only if dimensions changed)
            if (this.canvas.width !== sourceWidth || this.canvas.height !== sourceHeight) {
                this.canvas.width = sourceWidth;
                this.canvas.height = sourceHeight;
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw the source element to canvas
            if (sourceElement) {
                this.ctx.drawImage(sourceElement, 0, 0, sourceWidth, sourceHeight);
            }

            // Draw pose landmarks using MediaPipe drawing utils
            if (results.poseLandmarks) {
                drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 2
                });
                drawLandmarks(this.ctx, results.poseLandmarks, {
                    color: '#FF0000',
                    lineWidth: 1,
                    radius: 3
                });
            }

            this.ctx.restore();
        } catch (error) {
            console.warn('Error in drawResults:', error);
        }
    }


    startDetectionLoop() {
        // Stop any existing loop
        if (this.detectionLoopId) {
            cancelAnimationFrame(this.detectionLoopId);
        }

        const detect = async () => {
            // Only process if we're using ESP32 (laptop uses MediaPipe Camera's onFrame)
            if (this.currentSource === 'esp32') {
                // For ESP32, use the stream image
                if (this.esp32StreamImg && this.esp32StreamImg.complete && this.esp32StreamImg.naturalWidth > 0) {
                    try {
                        await this.pose.send({ image: this.esp32StreamImg });
                    } catch (error) {
                        console.warn('Pose detection error:', error);
                    }
                }
            } else if (this.video && this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
                // For laptop camera
                try {
                    await this.pose.send({ image: this.video });
                } catch (error) {
                    console.warn('Pose detection error:', error);
                }
            }
            // Only continue loop if still using ESP32
            if (this.currentSource === 'esp32') {
                this.detectionLoopId = requestAnimationFrame(detect);
            }
        };
        detect();
    }

    async switchCameraSource(source) {
        console.log(`Switching camera from ${this.currentSource} to ${source}`);
        
        if (source === this.currentSource) {
            console.log('Already using this source, skipping switch');
            return; // Already using this source
        }

        // Stop current source completely
        console.log('Stopping current camera source...');
        this.stop();

        // Wait longer for cleanup to ensure everything is stopped
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Initialize new source
        console.log(`Initializing ${source} camera...`);
        try {
            if (source === 'esp32') {
                await this.initializeESP32Camera();
                console.log('Successfully switched to ESP32-CAM');
            } else {
                await this.initializeLaptopCamera();
                console.log('Successfully switched to Laptop Camera');
            }
        } catch (error) {
            console.error(`Failed to switch to ${source}:`, error);
            throw error;
        }
    }

    /**
     * Get the current source element (video or image) for detection
     * @returns {HTMLVideoElement|HTMLImageElement|null} - The current source element
     */
    getCurrentSource() {
        if (this.currentSource === 'esp32') {
            // Return ESP32 stream image if available
            if (this.esp32StreamImg && this.esp32StreamImg.complete && this.esp32StreamImg.naturalWidth > 0) {
                return this.esp32StreamImg;
            }
            return null;
        } else {
            // Return video element if ready
            if (this.video && this.video.readyState >= this.video.HAVE_CURRENT_DATA && this.video.videoWidth > 0) {
                return this.video;
            }
            return null;
        }
    }

    stop() {
        console.log('Stopping camera and cleaning up...');
        console.log('Current source before stop:', this.currentSource);
        
        // Stop laptop camera (MediaPipe Camera) FIRST and aggressively
        if (this.camera) {
            try {
                console.log('Stopping MediaPipe Camera...');
                this.camera.stop();
                // Set camera to null immediately to prevent any further frame captures
                this.camera = null;
                console.log('MediaPipe Camera stopped and set to null');
            } catch (error) {
                console.warn('Error stopping MediaPipe Camera:', error);
                this.camera = null;
            }
        }

        // Stop detection loop
        if (this.detectionLoopId) {
            cancelAnimationFrame(this.detectionLoopId);
            this.detectionLoopId = null;
            console.log('Detection loop stopped');
        }

        // Stop and clear video element completely
        if (this.video) {
            try {
                console.log('Clearing video element...');
                this.video.pause();
                
                // Clear srcObject first (MediaPipe uses this)
                if (this.video.srcObject) {
                    const stream = this.video.srcObject;
                    if (stream && stream.getTracks) {
                        stream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped video track:', track.kind);
                        });
                    }
                    this.video.srcObject = null;
                }
                
                // Then clear src
                this.video.src = '';
                
                // Remove all event listeners
                this.video.onloadeddata = null;
                this.video.oncanplay = null;
                this.video.oncanplaythrough = null;
                this.video.onerror = null;
                this.video.onloadedmetadata = null;
                
                console.log('Video element cleared completely');
                console.log('Video src after clear:', this.video.src);
                console.log('Video srcObject after clear:', this.video.srcObject);
            } catch (error) {
                console.warn('Error clearing video element:', error);
                // Fallback: just clear src
                this.video.pause();
                this.video.src = '';
                this.video.srcObject = null;
            }
        }
        
        // Clear ESP32 resources
        if (this.esp32AbortController) {
            this.esp32AbortController.abort();
            this.esp32AbortController = null;
        }
        
        // Clear frame check interval if it exists
        if (this.esp32FrameCheckInterval) {
            clearInterval(this.esp32FrameCheckInterval);
            this.esp32FrameCheckInterval = null;
        }
        
        if (this.esp32StreamImg) {
            if (this.esp32StreamImg.src && this.esp32StreamImg.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.esp32StreamImg.src);
            }
            this.esp32StreamImg.src = '';
            if (this.esp32StreamImg.parentNode) {
                this.esp32StreamImg.parentNode.removeChild(this.esp32StreamImg);
            }
            this.esp32StreamImg = null;
        }
    }
}

