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
        this.MAX_BLACK_VALUE = CONFIG.CLOTHING_DETECTION.maxBlackValue || 100;
        this.DEBUG = CONFIG.CLOTHING_DETECTION.debug || false;
        
        // Create a hidden canvas for color sampling (to avoid conflicts with pose detector)
        this.sampleCanvas = document.createElement('canvas');
        this.sampleCtx = this.sampleCanvas.getContext('2d');
    }

    /**
     * Check if person is wearing the target color clothing on upper body
     * @param {Array} landmarks - MediaPipe pose landmarks
     * @param {HTMLVideoElement|HTMLImageElement} source - Video or image element to sample colors from
     * @param {HTMLCanvasElement} canvas - Canvas element (not used, kept for compatibility)
     * @returns {boolean} - True if wearing target color, false otherwise
     */
    isWearingTargetColor(landmarks, source, canvas) {
        try {
            if (!landmarks || landmarks.length < 29 || !source || !canvas) {
                return false;
            }

            // Check if source is ready (works for both video and image)
            if (source.readyState !== undefined && source.readyState < 2) {
                // Video element not ready
                return false;
            }
            if (source.complete !== undefined && !source.complete) {
                // Image element not loaded
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
            
            // Get source dimensions (works for both video and image)
            const sourceWidth = source.videoWidth || source.naturalWidth || source.clientWidth;
            const sourceHeight = source.videoHeight || source.naturalHeight || source.clientHeight;
            
            if (sourceWidth === 0 || sourceHeight === 0) {
                return false;
            }

            // Sample colors from source
            const colors = this.sampleColorsFromVideo(source, canvas, samplePoints, sourceWidth, sourceHeight);
            
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
        
        // Add points between shoulders (more points for better detection)
        points.push({
            x: (leftShoulder.x + chestCenter.x) / 2,
            y: (leftShoulder.y + chestCenter.y) / 2
        });
        points.push({
            x: (rightShoulder.x + chestCenter.x) / 2,
            y: (rightShoulder.y + chestCenter.y) / 2
        });
        
        // Add points slightly above center (chest area)
        points.push({
            x: chestCenter.x,
            y: chestCenter.y - 0.05 // Slightly above center
        });
        
        // Add points in upper torso area
        points.push({
            x: chestCenter.x,
            y: (chestCenter.y + leftHip.y) / 2
        });
        
        // Add a few more points for better coverage
        points.push({
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        });
        
        return points;
    }

    /**
     * Sample colors from video/image at specified points
     */
    sampleColorsFromVideo(source, canvas, points, sourceWidth, sourceHeight) {
        try {
            // Check if source is ready (works for both video and image)
            if (source.readyState !== undefined && source.readyState < 2) {
                // Video element not ready
                return [];
            }
            if (source.complete !== undefined && !source.complete) {
                // Image element not loaded
                return [];
            }

            const colors = [];
            
            // Use our own sample canvas to avoid conflicts with pose detector
            // Set canvas size to match source
            if (this.sampleCanvas.width !== sourceWidth || this.sampleCanvas.height !== sourceHeight) {
                this.sampleCanvas.width = sourceWidth;
                this.sampleCanvas.height = sourceHeight;
            }
            
            // Draw current source frame to our sample canvas (works for both video and image)
            this.sampleCtx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
            
            // Sample colors at each point
            for (const point of points) {
                // Convert normalized coordinates to pixel coordinates
                const x = Math.floor(point.x * sourceWidth);
                const y = Math.floor(point.y * sourceHeight);
                
                // Ensure coordinates are within bounds
                if (x >= 0 && x < sourceWidth && y >= 0 && y < sourceHeight) {
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

        if (this.DEBUG) {
            console.log('Color detection:', {
                avgColor,
                isDark,
                maxBlackValue: this.MAX_BLACK_VALUE,
                sampleColors: colors
            });
        }

        if (!isDark) {
            return false;
        }

        // Calculate distance from pure black
        const colorDistance = Math.sqrt(
            Math.pow(avgColor.r - this.TARGET_COLOR.r, 2) +
            Math.pow(avgColor.g - this.TARGET_COLOR.g, 2) +
            Math.pow(avgColor.b - this.TARGET_COLOR.b, 2)
        );

        // Max distance for black (sqrt(100^2 + 100^2 + 100^2) ≈ 173)
        // Use tolerance for black detection
        const maxDistance = 173 * this.COLOR_TOLERANCE;
        
        const matches = colorDistance <= maxDistance;

        if (this.DEBUG) {
            console.log('Color match result:', {
                colorDistance,
                maxDistance,
                matches
            });
        }
        
        // Must be both dark AND close to black
        return matches;
    }

    /**
     * Check if landmark is visible
     */
    isLandmarkVisible(landmark) {
        return landmark && landmark.visibility > 0.3;
    }
}

