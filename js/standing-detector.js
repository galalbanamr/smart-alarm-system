/**
 * Standing Detector Module
 * Analyzes pose landmarks to determine if person is standing upright
 */

import { CONFIG } from './config.js';

export class StandingDetector {
    constructor() {
        // MediaPipe Pose landmark indices
        this.LANDMARKS = {
            LEFT_SHOULDER: 11,
            RIGHT_SHOULDER: 12,
            LEFT_HIP: 23,
            RIGHT_HIP: 24,
            LEFT_KNEE: 25,
            RIGHT_KNEE: 26,
            LEFT_ANKLE: 27,
            RIGHT_ANKLE: 28,
            NOSE: 0
        };
        
        // Thresholds for standing detection (from config)
        this.STANDING_THRESHOLDS = CONFIG.STANDING_THRESHOLDS;
    }

    /**
     * Check if person is standing based on pose landmarks
     * @param {Array} landmarks - MediaPipe pose landmarks
     * @returns {boolean} - True if standing, false otherwise
     */
    isStanding(landmarks) {
        if (!landmarks || landmarks.length < 29) {
            return false;
        }

        // Get key landmarks
        const leftShoulder = landmarks[this.LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = landmarks[this.LANDMARKS.RIGHT_SHOULDER];
        const leftHip = landmarks[this.LANDMARKS.LEFT_HIP];
        const rightHip = landmarks[this.LANDMARKS.RIGHT_HIP];
        const leftKnee = landmarks[this.LANDMARKS.LEFT_KNEE];
        const rightKnee = landmarks[this.LANDMARKS.RIGHT_KNEE];
        const leftAnkle = landmarks[this.LANDMARKS.LEFT_ANKLE];
        const rightAnkle = landmarks[this.LANDMARKS.RIGHT_ANKLE];

        // Check if enough landmarks are visible (at least 4 out of 8 - very lenient)
        const visibleLandmarks = [
            this.isLandmarkVisible(leftShoulder),
            this.isLandmarkVisible(rightShoulder),
            this.isLandmarkVisible(leftHip),
            this.isLandmarkVisible(rightHip),
            this.isLandmarkVisible(leftKnee),
            this.isLandmarkVisible(rightKnee),
            this.isLandmarkVisible(leftAnkle),
            this.isLandmarkVisible(rightAnkle)
        ].filter(Boolean).length;

        // Need at least 4 visible landmarks to detect standing (very lenient)
        if (visibleLandmarks < 4) {
            return false;
        }

        // Calculate midpoints for symmetry (use available landmarks)
        const midShoulder = this.midpoint(
            this.isLandmarkVisible(leftShoulder) ? leftShoulder : rightShoulder,
            this.isLandmarkVisible(rightShoulder) ? rightShoulder : leftShoulder
        );
        const midHip = this.midpoint(
            this.isLandmarkVisible(leftHip) ? leftHip : rightHip,
            this.isLandmarkVisible(rightHip) ? rightHip : leftHip
        );
        const midKnee = this.midpoint(
            this.isLandmarkVisible(leftKnee) ? leftKnee : rightKnee,
            this.isLandmarkVisible(rightKnee) ? rightKnee : leftKnee
        );
        const midAnkle = this.midpoint(
            this.isLandmarkVisible(leftAnkle) ? leftAnkle : rightAnkle,
            this.isLandmarkVisible(rightAnkle) ? rightAnkle : leftAnkle
        );

        // Method 1: Check vertical alignment (shoulder-hip-knee-ankle)
        const isVerticallyAligned = this.checkVerticalAlignment(
            midShoulder, midHip, midKnee, midAnkle
        );

        // Method 2: Check body height ratio
        const heightRatio = this.calculateHeightRatio(
            midShoulder, midHip, midKnee, midAnkle
        );

        // Method 3: Check if knees are below hips (not sitting)
        const kneesBelowHips = midKnee.y > midHip.y;

        // Method 4: Check if ankles are below knees
        const anklesBelowKnees = midAnkle.y > midKnee.y;

        // Method 5: Check overall body height (standing person should be taller)
        const bodyHeight = this.distance(midShoulder, midAnkle);
        const torsoHeight = this.distance(midShoulder, midHip);
        const legHeight = this.distance(midHip, midAnkle);
        
        // Standing person: legs should be longer than torso (very lenient - 60% instead of 80%)
        const legsLongerThanTorso = legHeight > torsoHeight * 0.6;

        // ULTRA SIMPLIFIED DETECTION: 
        // If knees are below hips (not sitting) and ankles are below knees, you're standing!
        // This is the most basic and reliable check
        const bodyPartsInOrder = kneesBelowHips && anklesBelowKnees;
        
        if (bodyPartsInOrder) {
            // Additional simple check: make sure legs exist (leg height > 0.1 of body height)
            // This prevents false positives when landmarks are misaligned
            const hasReasonableLegs = legHeight > bodyHeight * 0.1;
            
            // Standing if body parts in order AND has reasonable leg detection
            return hasReasonableLegs;
        }
        
        return false;
    }

    /**
     * Check if landmark is visible (lower threshold for better detection)
     */
    isLandmarkVisible(landmark) {
        return landmark && landmark.visibility > 0.3; // Lowered from 0.5 to 0.3
    }

    /**
     * Calculate midpoint between two points
     */
    midpoint(point1, point2) {
        return {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2,
            z: (point1.z + point2.z) / 2
        };
    }

    /**
     * Check if body parts are vertically aligned
     */
    checkVerticalAlignment(shoulder, hip, knee, ankle) {
        // Check if vertical line (x-coordinate) is reasonably consistent
        const xPositions = [shoulder.x, hip.x, knee.x, ankle.x];
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        const xSpread = maxX - minX;

        // Check if y-coordinates are in descending order (top to bottom)
        // Allow some flexibility - just check that they're generally in order
        const yOrdered = shoulder.y < hip.y && 
                         hip.y < knee.y && 
                         knee.y < ankle.y;

        // More lenient: just check that x-spread is reasonable and y is ordered
        return xSpread < this.STANDING_THRESHOLDS.VERTICAL_TOLERANCE && yOrdered;
    }

    /**
     * Calculate height ratio: (shoulder to ankle) / (hip to ankle)
     * Standing person should have a higher ratio
     */
    calculateHeightRatio(shoulder, hip, knee, ankle) {
        const shoulderToAnkle = this.distance(shoulder, ankle);
        const hipToAnkle = this.distance(hip, ankle);
        
        if (hipToAnkle === 0) return 0;
        
        return shoulderToAnkle / hipToAnkle;
    }

    /**
     * Calculate Euclidean distance between two points
     */
    distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}

