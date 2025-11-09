/**
 * Pose Detector Module
 * Handles MediaPipe Pose initialization and detection
 */

import { CONFIG } from './config.js';

export class PoseDetector {
    constructor(videoElement, canvasElement, onResults) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.onResults = onResults;
        this.pose = null;
        this.camera = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
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

            // Initialize camera
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.pose.send({ image: this.video });
                },
                width: 1280,
                height: 720
            });

            this.camera.start()
                .then(() => {
                    console.log('Camera initialized');
                    resolve();
                })
                .catch((error) => {
                    console.error('Camera initialization failed:', error);
                    reject(error);
                });
        });
    }

    drawResults(results) {
        try {
            // Check if video is ready
            if (!this.video || this.video.readyState < 2 || this.video.videoWidth === 0) {
                return;
            }

            // Clear canvas
            this.ctx.save();
            
            // Set canvas size to match video (only if dimensions changed)
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;
            
            if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
                this.canvas.width = videoWidth;
                this.canvas.height = videoHeight;
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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


    // Method to switch to video stream URL (for ESP32-CAM)
    switchToVideoStream(videoUrl) {
        if (this.camera) {
            this.camera.stop();
        }
        
        // Set video source
        this.video.src = videoUrl;
        this.video.crossOrigin = 'anonymous'; // Handle CORS if needed
        
        // Handle video loading
        this.video.onloadedmetadata = () => {
            this.video.play().catch(error => {
                console.error('Error playing video:', error);
            });
            // Start pose detection loop
            this.startDetectionLoop();
        };
        
        this.video.onerror = (error) => {
            console.error('Video stream error:', error);
            if (this.onResults) {
                // Notify app of error
                this.onResults({ poseLandmarks: null, error: 'Video stream failed to load' });
            }
        };
    }

    startDetectionLoop() {
        const detect = async () => {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                await this.pose.send({ image: this.video });
            }
            requestAnimationFrame(detect);
        };
        detect();
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
    }
}

