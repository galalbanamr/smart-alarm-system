/**
 * UI Controller Module
 * Handles all UI updates including status display and background effects
 */

import { CONFIG } from './config.js';
import { translationManager } from './translations.js';

export class UIController {
    constructor() {
        this.statusOverlay = document.getElementById('statusOverlay');
        this.statusCard = document.getElementById('statusCard');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.statusSubtext = document.getElementById('statusSubtext');
        this.statusRing = document.getElementById('statusRing');
        this.body = document.body;
        this.currentStatus = null;
    }

    /**
     * Update the UI based on standing and clothing status
     * @param {boolean} isStanding - Whether the person is standing
     * @param {boolean} isWearingUniform - Whether the person is wearing uniform
     * @param {boolean} standingCheckComplete - Whether standing check is complete
     * @param {boolean} clothingCheckComplete - Whether clothing check is complete
     * @param {number} standingDuration - Current standing duration in seconds
     * @param {number} clothingDuration - Current clothing duration in seconds
     */
    updateStatus(isStanding, isWearingUniform, standingCheckComplete, clothingCheckComplete, standingDuration = 0, clothingDuration = 0) {
        // Show checks complete status
        if (standingCheckComplete && clothingCheckComplete) {
            this.showChecksComplete();
            return;
        }

        // Phase 1: Standing check (must complete first)
        if (!standingCheckComplete) {
            if (isStanding) {
                // Show standing progress with timer
                if (standingDuration > 0) {
                    this.statusIcon.textContent = '⏳';
                    this.statusText.textContent = `${translationManager.t('standing')}: ${standingDuration}/${CONFIG.CHECKS.standingDuration}s`;
                    this.statusSubtext.textContent = translationManager.t('keepStanding');
                } else {
                    // Just started standing (duration will be 0 for first frame)
                    this.statusIcon.textContent = '⏳';
                    this.statusText.textContent = `${translationManager.t('standing')}: 0/${CONFIG.CHECKS.standingDuration}s`;
                    this.statusSubtext.textContent = translationManager.t('startingTimer');
                }
            } else {
                // Not standing yet
                this.statusIcon.textContent = '❌';
                this.statusText.textContent = translationManager.t('pleaseStandUp');
                this.statusSubtext.textContent = translationManager.t('standUpToBegin');
            }
            
            // Update styling for standing phase
            if (isStanding) {
                this.statusCard.className = 'status-card standing';
                this.statusOverlay.className = 'status-overlay standing';
                this.statusRing.className = 'status-ring standing';
                this.body.className = 'standing';
            } else {
                this.statusCard.className = 'status-card not-standing';
                this.statusOverlay.className = 'status-overlay not-standing';
                this.statusRing.className = 'status-ring not-standing';
                this.body.className = 'not-standing';
            }
            return;
        }

        // Phase 2: Clothing check (only after standing is complete)
        if (standingCheckComplete && !clothingCheckComplete) {
            if (isWearingUniform) {
                // Show clothing progress with timer
                if (clothingDuration > 0) {
                    this.statusIcon.textContent = '⏳';
                    this.statusText.textContent = `${translationManager.t('uniformCheck')}: ${clothingDuration}/${CONFIG.CHECKS.clothingDuration}s`;
                    this.statusSubtext.textContent = `✅ ${translationManager.t('standingComplete')} • ${translationManager.t('keepWearingUniform')}`;
                } else {
                    // Just started wearing uniform (duration will be 0 for first frame)
                    this.statusIcon.textContent = '⏳';
                    this.statusText.textContent = `${translationManager.t('uniformCheck')}: 0/${CONFIG.CHECKS.clothingDuration}s`;
                    this.statusSubtext.textContent = `✅ ${translationManager.t('standingComplete')} • ${translationManager.t('startingTimer')}`;
                }
            } else {
                // Not wearing uniform yet
                this.statusIcon.textContent = '⏳';
                this.statusText.textContent = translationManager.t('pleaseWearUniform');
                this.statusSubtext.textContent = `✅ ${translationManager.t('standingComplete')} • ${translationManager.t('putOnBlackTop')}`;
            }
            
            // Update styling for clothing phase
            this.statusCard.className = 'status-card standing';
            this.statusOverlay.className = 'status-overlay standing';
            this.statusRing.className = 'status-ring standing';
            this.body.className = 'standing';
            return;
        }
    }

    /**
     * Show checks complete message
     */
    showChecksComplete() {
        this.statusIcon.textContent = '✅';
        this.statusText.textContent = translationManager.t('allChecksCompleteTitle');
        this.statusSubtext.textContent = `${translationManager.t('standingCheckmark')} | ${translationManager.t('uniformCheckmark')} | ${translationManager.t('detectionStopped')}`;
        this.statusText.className = 'status-text standing';
        this.statusCard.className = 'status-card standing';
        this.statusOverlay.className = 'status-overlay standing';
        this.statusRing.className = 'status-ring standing';
        this.body.className = 'standing';
    }

    /**
     * Show standing status (legacy method for compatibility)
     */
    showStanding() {
        this.statusIcon.textContent = '✅';
        this.statusText.textContent = 'Child Stood Up';
        this.statusSubtext.textContent = 'Great job! Keep it up!';
        this.statusText.className = 'status-text standing';
        this.statusCard.className = 'status-card standing';
        this.statusOverlay.className = 'status-overlay standing';
        this.statusRing.className = 'status-ring standing';
        this.body.className = 'standing';
    }

    /**
     * Show not standing status (legacy method for compatibility)
     */
    showNotStanding() {
        this.statusIcon.textContent = '❌';
        this.statusText.textContent = 'Not Standing Yet';
        this.statusSubtext.textContent = '';
        this.statusText.className = 'status-text not-standing';
        this.statusCard.className = 'status-card not-standing';
        this.statusOverlay.className = 'status-overlay not-standing';
        this.statusRing.className = 'status-ring not-standing';
        this.body.className = 'not-standing';
    }

    /**
     * Show initialization message
     */
    showInitializing() {
        this.statusIcon.textContent = '⏳';
        this.statusText.textContent = translationManager.t('initializingCamera');
        this.statusSubtext.textContent = translationManager.t('pleaseWait');
        this.statusText.className = 'status-text';
        this.statusCard.className = 'status-card';
        this.statusOverlay.className = 'status-overlay standing';
        this.statusRing.className = 'status-ring';
        this.body.className = '';
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.statusIcon.textContent = '⚠️';
        this.statusText.textContent = message;
        this.statusSubtext.textContent = 'Please check camera permissions';
        this.statusText.className = 'status-text not-standing';
        this.statusCard.className = 'status-card not-standing';
        this.statusOverlay.className = 'status-overlay standing';
        this.statusRing.className = 'status-ring not-standing';
        this.body.className = 'not-standing';
    }
}
