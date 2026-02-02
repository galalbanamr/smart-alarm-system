/**
 * Child Dashboard Controller
 */

import { AuthManager } from './auth.js';
import { RecordsManager } from './records.js';
import { PoseDetector } from './pose-detector.js';
import { StandingDetector } from './standing-detector.js';
import { ClothingDetector } from './clothing-detector.js';
import { UIController } from './ui-controller.js';
import { BuzzerController } from './buzzer-controller.js';
import { CONFIG } from './config.js';
import { translationManager } from './translations.js';

const authManager = new AuthManager();
const recordsManager = new RecordsManager();
const buzzerController = new BuzzerController();

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

    // Setup Language Toggle
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        // Initial state
        const updateBtnState = (lang) => {
            const langText = document.getElementById('langText');
            if (langText) langText.textContent = lang === 'en' ? 'EN' : 'AR';
        };

        updateBtnState(translationManager.currentLang);

        langBtn.onclick = () => {
            const newLang = translationManager.currentLang === 'en' ? 'ar' : 'en';
            translationManager.setLanguage(newLang);
        };

        // Subscribe to changes
        translationManager.subscribe(updateBtnState);
    }

    // Setup camera source selector FIRST (before initializing detection)
    const cameraSourceSelect = document.getElementById('cameraSource');
    if (cameraSourceSelect) {
        // Set initial value from config
        cameraSourceSelect.value = CONFIG.CAMERA_SOURCE || 'laptop';

        // Handle camera source changes
        cameraSourceSelect.addEventListener('change', async (e) => {
            const newSource = e.target.value;
            await switchCameraSource(newSource);
        });
    }

    // Initialize buzzer controller (discovers ESP32 IP)
    buzzerController.init().then(() => {
        console.log('Buzzer controller initialized');
    });

    // Initialize standing detection (after setting up selector)
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
let lastLoggedDuration = -1; // For debug logging

async function initStandingDetection(session) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const standingDetector = new StandingDetector();
    const clothingDetector = new ClothingDetector();
    const uiController = new UIController();

    // Get initial camera source from config or selector
    const cameraSourceSelect = document.getElementById('cameraSource');
    const initialSource = cameraSourceSelect ? cameraSourceSelect.value : (CONFIG.CAMERA_SOURCE || 'laptop');

    // Initialize pose detector
    const poseDetector = new PoseDetector(
        video,
        canvas,
        (results) => onPoseResults(results, session, standingDetector, clothingDetector, uiController, poseDetector)
    );

    // Initialize app structure immediately so we can switch cameras if initialization fails
    app = { poseDetector, standingDetector, clothingDetector, uiController };

    // Setup Color Detection Tuning Sliders
    setupColorTuningSliders(clothingDetector);

    try {
        uiController.showInitializing();
        await poseDetector.initialize(initialSource);
    } catch (error) {
        console.error('Initialization error:', error);
        const errorMessage = initialSource === 'esp32'
            ? `Failed to connect to ESP32-CAM. Check IP address (${CONFIG.ESP32_CAM_IP}) and network connection.`
            : 'Failed to initialize camera. Please check permissions.';
        uiController.showError(errorMessage);
    }
}

function setupColorTuningSliders(clothingDetector) {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const saturationSlider = document.getElementById('saturationSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    const saturationValue = document.getElementById('saturationValue');

    if (brightnessSlider && clothingDetector) {
        // Set initial value from detector
        brightnessSlider.value = clothingDetector.MAX_BLACK_VALUE;
        if (brightnessValue) brightnessValue.textContent = clothingDetector.MAX_BLACK_VALUE;

        brightnessSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            clothingDetector.MAX_BLACK_VALUE = value;
            if (brightnessValue) brightnessValue.textContent = value;
            console.log(`🎨 Max Brightness set to: ${value}`);
        });
    }

    if (saturationSlider && clothingDetector) {
        // Set initial value from detector
        saturationSlider.value = clothingDetector.MAX_SATURATION;
        if (saturationValue) saturationValue.textContent = clothingDetector.MAX_SATURATION;

        saturationSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            clothingDetector.MAX_SATURATION = value;
            if (saturationValue) saturationValue.textContent = value;
            console.log(`🎨 Max Saturation set to: ${value}`);
        });
    }
}

async function switchCameraSource(newSource) {
    if (!app || !app.poseDetector) {
        console.warn('Cannot switch camera: app not initialized');
        return;
    }

    // Reset detection state when switching cameras
    standingStartTime = null;
    clothingStartTime = null;
    lastStandingState = false;
    lastClothingState = false;
    standingCheckComplete = false;
    clothingCheckComplete = false;
    detectionStopped = false;
    buzzerController.reset(); // Reset buzzer controller to allow sending off command again

    try {
        app.uiController.showInitializing();
        await app.poseDetector.switchCameraSource(newSource);
        console.log(`Switched to ${newSource === 'esp32' ? 'ESP32-CAM' : 'Laptop Camera'}`);
    } catch (error) {
        console.error('Camera switch error:', error);
        const errorMessage = newSource === 'esp32'
            ? `Failed to connect to ESP32-CAM. Check IP address (${CONFIG.ESP32_CAM_IP}) and network connection.`
            : 'Failed to initialize laptop camera. Please check permissions.';
        app.uiController.showError(errorMessage);
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
    const canvas = document.getElementById('canvas');

    // Get the current source element (video or ESP32 image)
    const source = poseDetector.getCurrentSource();
    if (!source) {
        // Source not ready yet
        return;
    }

    let isStanding = false;
    let isWearingUniform = false;

    // Always check standing first
    try {
        isStanding = standingDetector.isStanding(results.poseLandmarks);
        // Debug: log standing state changes
        if (isStanding !== lastStandingState) {
            console.log(`🎯 Standing state changed: ${lastStandingState} → ${isStanding}`);
        }
    } catch (error) {
        console.warn('Error in standing detection:', error);
        isStanding = false;
    }

    // Only check clothing AFTER standing check is complete
    if (standingCheckComplete) {
        try {
            if (canvas && source) {
                isWearingUniform = clothingDetector.isWearingTargetColor(
                    results.poseLandmarks,
                    source,
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

            // Log duration progress every second
            if (standingDuration > 0 && standingDuration !== lastLoggedDuration) {
                console.log(`⏱️ Standing duration: ${standingDuration}/${CONFIG.CHECKS.standingDuration}s`);
                lastLoggedDuration = standingDuration;
            }

            // Only mark as complete after 5 seconds of continuous standing
            // The timer resets automatically if person stops standing (handled above)
            if (standingDuration >= CONFIG.CHECKS.standingDuration) {
                standingCheckComplete = true;
                // Turn off buzzer and LED IMMEDIATELY when standing is detected (after required duration)
                console.log(`🎯 Standing check COMPLETE! (${standingDuration} seconds) - Turning off buzzer and LED NOW`);

                // Send the off command immediately - don't wait for promise
                buzzerController.turnOff().then(success => {
                    if (success) {
                        console.log('✅ ESP32 Buzzer and LED turned OFF successfully - child is standing!');
                        uiController.showBuzzerOffSuccess();
                    } else {
                        console.warn('⚠️ Failed to turn off buzzer/LED - check:');
                        console.warn('   1. ESP32 is powered on and connected to WiFi');
                        console.warn('   2. ESP32 IP address is correct in config.js');
                        console.warn('   3. Browser console for network errors');
                    }
                }).catch(error => {
                    console.error('❌ Error sending buzzer off command:', error);
                });

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
