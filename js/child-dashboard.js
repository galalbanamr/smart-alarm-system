/**
 * Child Dashboard Controller
 */

import { AuthManager } from './auth.js';
import { RecordsManager } from './records.js';
import { PoseDetector } from './pose-detector.js';
import { StandingDetector } from './standing-detector.js';
import { ClothingDetector } from './clothing-detector.js';
import { UIController } from './ui-controller.js';
import { CONFIG } from './config.js';

const authManager = new AuthManager();
const recordsManager = new RecordsManager();

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    const session = authManager.getCurrentSession();
    
    if (!session || session.role !== 'child') {
        window.location.href = 'login.html';
        return;
    }

    // Set user name
    document.getElementById('userName').textContent = session.name || session.username;

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authManager.logout();
        window.location.href = 'login.html';
    });

    // Initialize standing detection
    initStandingDetection(session);
});

let app = null;
let standingStartTime = null;
let clothingStartTime = null;
let lastStandingState = false;
let lastClothingState = false;
let standingCheckComplete = false;
let clothingCheckComplete = false;
let detectionStopped = false;

async function initStandingDetection(session) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const standingDetector = new StandingDetector();
    const clothingDetector = new ClothingDetector();
    const uiController = new UIController();

    // Initialize pose detector
    const poseDetector = new PoseDetector(
        video,
        canvas,
        (results) => onPoseResults(results, session, standingDetector, clothingDetector, uiController, poseDetector)
    );

    try {
        uiController.showInitializing();
        await poseDetector.initialize();
        app = { poseDetector, standingDetector, clothingDetector, uiController };
    } catch (error) {
        console.error('Initialization error:', error);
        uiController.showError('Failed to initialize camera. Please check permissions.');
    }
}

function onPoseResults(results, session, standingDetector, clothingDetector, uiController, poseDetector) {
    // Stop detection if both checks are complete
    if (detectionStopped) {
        return;
    }

    if (!results.poseLandmarks) {
        uiController.updateStatus(false, false, false, false);
        return;
    }

    const now = Date.now();
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    // Check if video is ready before processing
    if (!video || video.readyState < 2) {
        return;
    }

    let isStanding = false;
    let isWearingUniform = false;

    // Always check standing first
    try {
        isStanding = standingDetector.isStanding(results.poseLandmarks);
    } catch (error) {
        console.warn('Error in standing detection:', error);
        isStanding = false;
    }

    // Only check clothing AFTER standing check is complete
    if (standingCheckComplete) {
        try {
            if (canvas && video.readyState >= 2) {
                isWearingUniform = clothingDetector.isWearingTargetColor(
                    results.poseLandmarks,
                    video,
                    canvas
                );
            }
        } catch (error) {
            console.warn('Error in clothing detection:', error);
            isWearingUniform = false;
        }
    } else {
        // Don't check clothing until standing is complete
        isWearingUniform = false;
    }

    // Track standing duration
    if (isStanding !== lastStandingState) {
        if (isStanding && !lastStandingState) {
            // Started standing
            standingStartTime = now;
        } else if (!isStanding && lastStandingState) {
            // Stopped standing - reset timer
            standingStartTime = null;
        }
        lastStandingState = isStanding;
    }

    // Track clothing duration (only if standing check is complete)
    if (standingCheckComplete) {
        if (isWearingUniform !== lastClothingState) {
            if (isWearingUniform && !lastClothingState) {
                // Started wearing uniform
                clothingStartTime = now;
            } else if (!isWearingUniform && lastClothingState) {
                // Stopped wearing uniform - reset timer
                clothingStartTime = null;
            }
            lastClothingState = isWearingUniform;
        }
    } else {
        // Reset clothing state if standing check is not complete
        if (lastClothingState) {
            lastClothingState = false;
            clothingStartTime = null;
        }
    }

    // Check if standing for required duration (5 seconds continuous)
    let standingDuration = 0;
    if (isStanding && !standingCheckComplete) {
        if (standingStartTime) {
            // Calculate how long the person has been continuously standing
            standingDuration = Math.floor((now - standingStartTime) / 1000);
            
            // Only mark as complete after 5 seconds of continuous standing
            // The timer resets automatically if person stops standing (handled above)
            if (standingDuration >= CONFIG.CHECKS.standingDuration) {
                standingCheckComplete = true;
                // Notify parent that child has waked up (after 5 seconds)
                notifyParent(session, 'standing');
            }
        } else {
            // Just started standing - duration is 0
            standingDuration = 0;
        }
    }

    // Check if wearing uniform for required duration (5 seconds)
    // Only check if standing check is already complete
    let clothingDuration = 0;
    if (standingCheckComplete && isWearingUniform && !clothingCheckComplete) {
        if (clothingStartTime) {
            clothingDuration = Math.floor((now - clothingStartTime) / 1000);
            if (clothingDuration >= CONFIG.CHECKS.clothingDuration) {
                clothingCheckComplete = true;
                // Notify parent that child is wearing uniform
                notifyParent(session, 'clothing');
            }
        } else {
            // Just started wearing uniform - duration is 0
            clothingDuration = 0;
        }
    }

    // Update UI with current status
    uiController.updateStatus(
        isStanding,
        isWearingUniform,
        standingCheckComplete,
        clothingCheckComplete,
        standingDuration,
        clothingDuration
    );

    // Stop detection if both checks are complete
    if (standingCheckComplete && clothingCheckComplete && !detectionStopped) {
        detectionStopped = true;
        setTimeout(() => {
            poseDetector.stop();
            uiController.showChecksComplete();
        }, 1000); // Wait 1 second before stopping
    }
}

// Store check times globally
let standingCheckTime = null;
let uniformCheckTime = null;

function notifyParent(session, checkType) {
    const parent = authManager.getParentForChild(session.userId);
    
    if (!parent) {
        return;
    }

    const now = new Date().toISOString();

    // Create a record for the completed check
    if (checkType === 'standing') {
        standingCheckTime = now;
        recordsManager.addCheckRecord(
            session.userId,
            parent.id,
            'standing',
            true
        );
    } else if (checkType === 'clothing') {
        uniformCheckTime = now;
        recordsManager.addCheckRecord(
            session.userId,
            parent.id,
            'clothing',
            true
        );
    }

    // If both checks are complete, create final record with actual times
    if (standingCheckComplete && clothingCheckComplete) {
        recordsManager.addCompleteRecord(
            session.userId,
            parent.id,
            true, // standing check complete
            true, // clothing check complete
            standingCheckTime || new Date().toISOString(), // Use stored time or current
            uniformCheckTime || new Date().toISOString()  // Use stored time or current
        );
        // Reset times after creating complete record
        standingCheckTime = null;
        uniformCheckTime = null;
    }
}
