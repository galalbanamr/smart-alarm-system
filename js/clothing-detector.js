/**
 * Clothing Detector Module
 * Detects if person is wearing specified color clothing on upper body
 */

import { CONFIG } from './config.js';

export class ClothingDetector {
    constructor() {
        // MediaPipe Pose landmark indices for upper body
        this.LANDMARKS = {
            LEFT_SHOULDER: 11,
            RIGHT_SHOULDER: 12,
            LEFT_ELBOW: 13,
            RIGHT_ELBOW: 14,
            LEFT_WRIST: 15,
            RIGHT_WRIST: 16,
            LEFT_HIP: 23,
            RIGHT_HIP: 24
        };
        
        // Target color from config (default: black)
        this.TARGET_COLOR = CONFIG.CLOTHING_DETECTION.targetColor;
        this.COLOR_TOLERANCE = CONFIG.CLOTHING_DETECTION.colorTolerance;
        this.MAX_BLACK_VALUE = CONFIG.CLOTHING_DETECTION.maxBlackValue || 80;
        
        // Create a hidden canvas for color sampling (to avoid conflicts with pose detector)
        this.sampleCanvas = document.createElement('canvas');
        this.sampleCtx = this.sampleCanvas.getContext('2d');
    }

    /**
     * Check if person is wearing the target color clothing on upper body
     * @param {Array} landmarks - MediaPipe pose landmarks
     * @param {HTMLVideoElement} video - Video element to sample colors from
     * @param {HTMLCanvasElement} canvas - Canvas element (not used, kept for compatibility)
     * @returns {boolean} - True if wearing target color, false otherwise
     */
    isWearingTargetColor(landmarks, video, canvas) {
        try {
            if (!landmarks || landmarks.length < 29 || !video || !canvas) {
                return false;
            }

            // Check if video is ready
            if (video.readyState < 2) { // HAVE_CURRENT_DATA
                return false;
            }

            // Get upper body landmarks
            const leftShoulder = landmarks[this.LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = landmarks[this.LANDMARKS.RIGHT_SHOULDER];
            const leftHip = landmarks[this.LANDMARKS.LEFT_HIP];
            const rightHip = landmarks[this.LANDMARKS.RIGHT_HIP];

            // Check if landmarks are visible
            if (!this.isLandmarkVisible(leftShoulder) || 
                !this.isLandmarkVisible(rightShoulder) ||
                !this.isLandmarkVisible(leftHip) || 
                !this.isLandmarkVisible(rightHip)) {
                return false;
            }

            // Calculate chest area (between shoulders and above hips)
            const chestCenter = {
                x: (leftShoulder.x + rightShoulder.x) / 2,
                y: (leftShoulder.y + rightHip.y) / 2
            };

            // Sample multiple points in the chest area
            const samplePoints = this.getSamplePoints(chestCenter, leftShoulder, rightShoulder, leftHip, rightHip);
            
            // Get video dimensions
            const videoWidth = video.videoWidth || video.clientWidth;
            const videoHeight = video.videoHeight || video.clientHeight;
            
            if (videoWidth === 0 || videoHeight === 0) {
                return false;
            }

            // Sample colors from video
            const colors = this.sampleColorsFromVideo(video, canvas, samplePoints, videoWidth, videoHeight);
            
            // Check if colors match target color
            return this.checkColorMatch(colors);
        } catch (error) {
            console.warn('Error in isWearingTargetColor:', error);
            return false;
        }
    }

    /**
     * Get sample points in the chest/torso area
     */
    getSamplePoints(chestCenter, leftShoulder, rightShoulder, leftHip, rightHip) {
        const points = [];
        
        // Add center point
        points.push(chestCenter);
        
        // Add points between shoulders
        points.push({
            x: (leftShoulder.x + chestCenter.x) / 2,
            y: (leftShoulder.y + chestCenter.y) / 2
        });
        points.push({
            x: (rightShoulder.x + chestCenter.x) / 2,
            y: (rightShoulder.y + chestCenter.y) / 2
        });
        
        // Add points in upper torso area
        points.push({
            x: chestCenter.x,
            y: (chestCenter.y + leftHip.y) / 2
        });
        
        return points;
    }

    /**
     * Sample colors from video at specified points
     */
    sampleColorsFromVideo(video, canvas, points, videoWidth, videoHeight) {
        try {
            // Check if video is ready
            if (video.readyState < 2) { // HAVE_CURRENT_DATA
                return [];
            }

            const colors = [];
            
            // Use our own sample canvas to avoid conflicts with pose detector
            // Set canvas size to match video
            if (this.sampleCanvas.width !== videoWidth || this.sampleCanvas.height !== videoHeight) {
                this.sampleCanvas.width = videoWidth;
                this.sampleCanvas.height = videoHeight;
            }
            
            // Draw current video frame to our sample canvas
            this.sampleCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
            
            // Sample colors at each point
            for (const point of points) {
                // Convert normalized coordinates to pixel coordinates
                const x = Math.floor(point.x * videoWidth);
                const y = Math.floor(point.y * videoHeight);
                
                // Ensure coordinates are within bounds
                if (x >= 0 && x < videoWidth && y >= 0 && y < videoHeight) {
                    try {
                        const imageData = this.sampleCtx.getImageData(x, y, 1, 1);
                        const [r, g, b] = imageData.data;
                        colors.push({ r, g, b });
                    } catch (e) {
                        // Skip this point if there's an error
                        console.warn('Error sampling color:', e);
                    }
                }
            }
            
            return colors;
        } catch (error) {
            console.warn('Error in sampleColorsFromVideo:', error);
            return [];
        }
    }

    /**
     * Check if sampled colors match the target color (black)
     */
    checkColorMatch(colors) {
        if (colors.length === 0) {
            return false;
        }

        // Calculate average color
        const avgColor = {
            r: colors.reduce((sum, c) => sum + c.r, 0) / colors.length,
            g: colors.reduce((sum, c) => sum + c.g, 0) / colors.length,
            b: colors.reduce((sum, c) => sum + c.b, 0) / colors.length
        };

        // For black detection, check that all RGB values are below threshold
        // This is more reliable than distance-based matching for dark colors
        const isDark = avgColor.r <= this.MAX_BLACK_VALUE && 
                      avgColor.g <= this.MAX_BLACK_VALUE && 
                      avgColor.b <= this.MAX_BLACK_VALUE;

        if (!isDark) {
            return false;
        }

        // Additional check: Calculate distance from pure black
        // This ensures we're detecting actual black/dark colors, not just dark shades
        const colorDistance = Math.sqrt(
            Math.pow(avgColor.r - this.TARGET_COLOR.r, 2) +
            Math.pow(avgColor.g - this.TARGET_COLOR.g, 2) +
            Math.pow(avgColor.b - this.TARGET_COLOR.b, 2)
        );

        // Max distance for black (sqrt(80^2 + 80^2 + 80^2) ≈ 138)
        // Use stricter tolerance for black detection
        const maxDistance = 138 * this.COLOR_TOLERANCE;
        
        // Must be both dark AND close to black
        return colorDistance <= maxDistance;
    }

    /**
     * Check if landmark is visible
     */
    isLandmarkVisible(landmark) {
        return landmark && landmark.visibility > 0.3;
    }
}

