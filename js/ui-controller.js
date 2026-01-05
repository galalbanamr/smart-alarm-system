/**
 * UI Controller Module
 * Handles all UI updates including status display and background effects
 */

import { CONFIG } from './config.js';
import { translationManager } from './translations.js';

export class UIController {
    constructor() {
        // Support both old and new element IDs
        this.statusOverlay = document.getElementById('statusOverlay');
        this.statusCard = document.getElementById('statusCard');

        // Standard elements (Sidebar)
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.statusSubtext = document.getElementById('statusSubtext');

        // Large overlay elements
        this.statusIconLarge = document.getElementById('statusIconLarge');
        this.statusTextLarge = document.getElementById('statusTextLarge');
        this.statusSubtextLarge = document.getElementById('statusSubtextLarge');

        this.statusRing = document.getElementById('statusRing');
        this.statusIconContainer = document.getElementById('statusIconContainer');
        this.body = document.body;
        this.currentStatus = null;

        // New AR-style elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.instructionText = document.getElementById('instructionText');
        this.instructionIcon = document.getElementById('instructionIcon');
        this.taskLabel = document.getElementById('taskLabel');

        // Mission Step elements
        // Step 1: Posture Check (was Step 2)

        this.step2Container = document.getElementById('step2Container');
        this.step2Glow = document.getElementById('step2Glow');
        this.step2Status = document.getElementById('step2Status');

        this.step3Container = document.getElementById('step3Container');
        this.step3Icon = document.getElementById('step3Icon');
        this.step3IconContainer = document.getElementById('step3IconContainer');
        this.step3Status = document.getElementById('step3Status');

        // Progress bars
        this.postureBar = document.getElementById('postureBar');
        this.postureLabel = document.getElementById('postureLabel');
        this.uniformBar = document.getElementById('uniformBar');
        this.uniformLabel = document.getElementById('uniformLabel');
    }

    // Helper methods for safe element updates
    setIcon(text) {
        if (this.statusIcon) this.statusIcon.textContent = text;
        if (this.statusIconLarge) this.statusIconLarge.textContent = text;
    }

    setText(text) {
        if (this.statusText) this.statusText.textContent = text;
        if (this.statusTextLarge) this.statusTextLarge.textContent = text;
    }

    setSubtext(text) {
        if (this.statusSubtext) this.statusSubtext.textContent = text;
        if (this.statusSubtextLarge) this.statusSubtextLarge.textContent = text;
    }

    setCardClass(className) {
        if (this.statusCard) this.statusCard.className = className;
    }

    setOverlayClass(className) {
        if (this.statusOverlay) this.statusOverlay.className = className;
    }

    setRingClass(className) {
        if (this.statusRing) this.statusRing.className = className;
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
            const remainingTime = Math.max(0, CONFIG.CHECKS.standingDuration - standingDuration);

            if (isStanding) {
                // Show standing progress with timer
                if (standingDuration > 0) {
                    this.setIcon('⏳');
                    this.setText(`${translationManager.t('standing')}: ${standingDuration}/${CONFIG.CHECKS.standingDuration}s`);
                    this.setSubtext(translationManager.t('keepStanding'));
                } else {
                    // Just started standing (duration will be 0 for first frame)
                    this.setIcon('⏳');
                    this.setText(`${translationManager.t('standing')}: 0/${CONFIG.CHECKS.standingDuration}s`);
                    this.setSubtext(translationManager.t('startingTimer'));
                }

                // Update AR elements for standing detection
                this.updateTimer(remainingTime);
                this.updateInstruction('Hold your position!', 'accessibility_new');
                this.updateStep2('active', `${standingDuration}s / ${CONFIG.CHECKS.standingDuration}s`);
                this.updatePostureBar((standingDuration / CONFIG.CHECKS.standingDuration) * 100);

            } else {
                // Not standing yet
                this.setIcon('❌');
                this.setText(translationManager.t('pleaseStandUp'));
                this.setSubtext(translationManager.t('standUpToBegin'));

                // Update AR elements
                this.updateTimer(CONFIG.CHECKS.standingDuration);
                this.updateInstruction('Stand straight inside the circle', 'accessibility_new');
                this.updateStep2('scanning', 'Scanning...');
                this.updatePostureBar(0);
            }

            // Update styling for standing phase
            if (isStanding) {
                this.setCardClass('status-card standing');
                this.setOverlayClass('status-overlay standing');
                this.setRingClass('status-ring standing');
                this.body.className = 'standing';
            } else {
                this.setCardClass('status-card not-standing');
                this.setOverlayClass('status-overlay not-standing');
                this.setRingClass('status-ring not-standing');
                this.body.className = 'not-standing';
            }
            return;
        }

        // Phase 2: Clothing check (only after standing is complete)
        if (standingCheckComplete && !clothingCheckComplete) {
            const remainingTime = Math.max(0, CONFIG.CHECKS.clothingDuration - clothingDuration);

            // Mark step 2 as complete and activate step 3
            this.updateStep2('complete', 'Complete ✓');
            this.activateStep3();

            if (isWearingUniform) {
                // Show clothing progress with timer
                if (clothingDuration > 0) {
                    this.setIcon('⏳');
                    this.setText(`${translationManager.t('uniformCheck')}: ${clothingDuration}/${CONFIG.CHECKS.clothingDuration}s`);
                    this.setSubtext(`✅ ${translationManager.t('standingComplete')} • ${translationManager.t('keepWearingUniform')}`);
                } else {
                    // Just started wearing uniform (duration will be 0 for first frame)
                    this.setIcon('⏳');
                    this.setText(`${translationManager.t('uniformCheck')}: 0/${CONFIG.CHECKS.clothingDuration}s`);
                    this.setSubtext(`✅ ${translationManager.t('standingComplete')} • ${translationManager.t('startingTimer')}`);
                }

                // Update AR elements for uniform detection
                this.updateTimer(remainingTime);
                this.updateInstruction('Hold still for uniform check!', 'checkroom');
                this.updateStep3('active', `${clothingDuration}s / ${CONFIG.CHECKS.clothingDuration}s`);
                this.updateUniformBar((clothingDuration / CONFIG.CHECKS.clothingDuration) * 100);

            } else {
                // Not wearing uniform yet
                this.setIcon('⏳');
                this.setText(translationManager.t('pleaseWearUniform'));
                this.setSubtext(`✅ ${translationManager.t('standingComplete')} • ${translationManager.t('putOnBlackTop')}`);

                // Update AR elements
                this.updateTimer(CONFIG.CHECKS.clothingDuration);
                this.updateInstruction('Put on your black school uniform', 'checkroom');
                this.updateStep3('scanning', 'Scanning...');
                this.updateUniformBar(0);
            }

            // Update styling for clothing phase
            this.setCardClass('status-card standing');
            this.setOverlayClass('status-overlay standing');
            this.setRingClass('status-ring standing');
            this.body.className = 'standing';

            // Mark posture as 100% complete
            this.updatePostureBar(100);
            if (this.postureLabel) this.postureLabel.textContent = 'POSTURE_OK ✓';
            return;
        }
    }

    // ========== AR Element Helper Methods ==========

    /**
     * Update the timer display with formatted time
     */
    updateTimer(seconds) {
        if (this.timerDisplay) {
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            this.timerDisplay.textContent = `${mins}:${secs}`;
        }
    }

    /**
     * Update the instruction card text and icon
     */
    updateInstruction(text, iconName) {
        if (this.instructionText) this.instructionText.textContent = text;
        if (this.instructionIcon) this.instructionIcon.textContent = iconName;
    }

    /**
     * Update Step 2 (Posture Check) status
     */
    updateStep2(state, statusText) {
        if (this.step2Status) this.step2Status.textContent = statusText;

        if (state === 'complete' && this.statusIcon) {
            this.statusIcon.textContent = 'check';
            this.statusIcon.classList.remove('animate-spin-slow');
            if (this.step2Glow) this.step2Glow.classList.remove('animate-pulse');
            if (this.statusIconContainer) {
                this.statusIconContainer.classList.remove('bg-accent-orange', 'shadow-neon-orange');
                this.statusIconContainer.classList.add('bg-primary/20', 'border', 'border-primary', 'text-primary');
            }
        } else if (state === 'active' && this.statusIcon) {
            this.statusIcon.textContent = 'cached';
            this.statusIcon.classList.add('animate-spin-slow');
        }
    }

    /**
     * Activate Step 3 (Uniform Check)
     */
    activateStep3() {
        if (this.step3Container) {
            this.step3Container.classList.remove('opacity-30');
        }
        if (this.step3IconContainer) {
            this.step3IconContainer.classList.remove('bg-white/5', 'border-white/10');
            this.step3IconContainer.classList.add('bg-accent-orange', 'text-white', 'shadow-neon-orange');
        }
        if (this.step3Icon) {
            this.step3Icon.textContent = 'cached';
            this.step3Icon.classList.add('material-symbols-outlined', 'animate-spin-slow');
            this.step3Icon.classList.remove('text-sm', 'font-bold');
        }
    }

    /**
     * Update Step 3 (Uniform Check) status
     */
    updateStep3(state, statusText) {
        if (this.step3Status) this.step3Status.textContent = statusText;

        if (state === 'complete' && this.step3Icon) {
            this.step3Icon.textContent = 'check';
            this.step3Icon.classList.remove('animate-spin-slow');
            if (this.step3IconContainer) {
                this.step3IconContainer.classList.remove('bg-accent-orange', 'shadow-neon-orange');
                this.step3IconContainer.classList.add('bg-primary/20', 'border', 'border-primary', 'text-primary');
            }
        }
    }

    /**
     * Update posture progress bar
     */
    updatePostureBar(percentage) {
        if (this.postureBar) {
            this.postureBar.style.width = `${Math.min(100, percentage)}%`;
        }
    }

    /**
     * Update uniform progress bar
     */
    updateUniformBar(percentage) {
        if (this.uniformBar) {
            this.uniformBar.style.width = `${Math.min(100, percentage)}%`;
        }
    }

    /**
     * Show checks complete message
     */
    showChecksComplete() {
        this.setIcon('✅');
        this.setText(translationManager.t('allChecksCompleteTitle'));
        this.setSubtext(`${translationManager.t('standingCheckmark')} | ${translationManager.t('uniformCheckmark')} | ${translationManager.t('detectionStopped')}`);
        if (this.statusText) this.statusText.className = 'status-text standing';
        this.setCardClass('status-card standing');
        this.setOverlayClass('status-overlay standing');
        this.setRingClass('status-ring standing');
        this.body.className = 'standing';

        // Update AR elements for completion
        this.updateTimer(0);
        this.updateInstruction('All checks complete! Great job! 🎉', 'celebration');
        this.updateStep2('complete', 'Complete ✓');
        this.updateStep3('complete', 'Complete ✓');
        this.updatePostureBar(100);
        this.updateUniformBar(100);
        if (this.postureLabel) this.postureLabel.textContent = 'POSTURE_OK ✓';
        if (this.uniformLabel) this.uniformLabel.textContent = 'UNIFORM ✓';
        if (this.taskLabel) this.taskLabel.textContent = 'Mission Complete';

        // Change status ring to green for success
        if (this.statusRing) {
            this.statusRing.classList.remove('border-accent-orange/60');
            this.statusRing.classList.add('border-primary/60');
        }
    }

    /**
     * Show standing status (legacy method for compatibility)
     */
    showStanding() {
        this.setIcon('✅');
        this.setText('Child Stood Up');
        this.setSubtext('Great job! Keep it up!');
        if (this.statusText) this.statusText.className = 'status-text standing';
        this.setCardClass('status-card standing');
        this.setOverlayClass('status-overlay standing');
        this.setRingClass('status-ring standing');
        this.body.className = 'standing';
    }

    /**
     * Show not standing status (legacy method for compatibility)
     */
    showNotStanding() {
        this.setIcon('❌');
        this.setText('Not Standing Yet');
        this.setSubtext('');
        if (this.statusText) this.statusText.className = 'status-text not-standing';
        this.setCardClass('status-card not-standing');
        this.setOverlayClass('status-overlay not-standing');
        this.setRingClass('status-ring not-standing');
        this.body.className = 'not-standing';
    }

    /**
     * Show initialization message
     */
    showInitializing() {
        this.setIcon('⏳');
        this.setText(translationManager.t('initializingCamera'));
        this.setSubtext(translationManager.t('pleaseWait'));
        if (this.statusText) this.statusText.className = 'status-text';
        this.setCardClass('status-card');
        this.setOverlayClass('status-overlay standing');
        this.setRingClass('status-ring');
        this.body.className = '';
        // Show overlay during initialization
        this.showOverlay();
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.setIcon('⚠️');
        this.setText(message);
        this.setSubtext('Please check camera permissions');
        if (this.statusText) this.statusText.className = 'status-text not-standing';
        this.setCardClass('status-card not-standing');
        this.setOverlayClass('status-overlay standing');
        this.setRingClass('status-ring not-standing');
        this.body.className = 'not-standing';
        // Show overlay when there's an error
        this.showOverlay();
    }

    /**
     * Hide the status overlay (show video feed)
     */
    hideOverlay() {
        if (this.statusOverlay) {
            this.statusOverlay.style.display = 'none';
            this.statusOverlay.classList.add('hidden');
        }
    }

    /**
     * Show the status overlay
     */
    showOverlay() {
        if (this.statusOverlay) {
            this.statusOverlay.style.display = 'flex'; // Use flex for centering in new UI
            this.statusOverlay.classList.remove('hidden');
        }
    }

    /**
     * Show success message when buzzer is turned off
     */
    showBuzzerOffSuccess() {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-24 left-1/2 -translate-x-1/2 glass-panel px-6 py-4 rounded-xl flex items-center gap-4 z-50 animate-bounce shadow-neon';
        notification.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">notifications_off</span>
            </div>
            <div>
                <h3 class="font-bold text-white">Alarm Silenced!</h3>
                <p class="text-xs text-gray-300">Great job standing up!</p>
            </div>
        `;
        document.body.appendChild(notification);

        // Update status overlay text if visible
        this.setIcon('🔕');
        // Safely access translationManager or fallback
        const title = (typeof translationManager !== 'undefined') ? translationManager.t('alarmSilenced') : 'Alarm Silenced!';
        const subtitle = (typeof translationManager !== 'undefined') ? translationManager.t('preparingUniformCheck') : 'Get ready for uniform check...';

        this.setText(title || 'Alarm Silenced!');
        this.setSubtext(subtitle || 'Get ready for uniform check...');

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}
