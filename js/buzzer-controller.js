/**
 * Buzzer Controller Module
 * Handles communication with ESP32 Buzzer via HTTP API
 */

import { CONFIG } from './config.js';
import { MDNSResolver } from './mdns-resolver.js';

export class BuzzerController {
    constructor() {
        this.buzzerIP = CONFIG.ESP32_BUZZER_IP;
        this.resolvedIP = null; // Discovered IP address
        this.buzzerOffSent = false; // Track if we've already sent the off command
        this.initialized = false;
    }

    /**
     * Initialize the buzzer controller - discover ESP32 IP
     * Call this at app startup
     */
    async init() {
        if (this.initialized) return;

        console.log('🔌 Initializing buzzer controller...');

        // Try to discover ESP32 IP
        this.resolvedIP = await MDNSResolver.ensureConnection(this.buzzerIP);

        if (this.resolvedIP) {
            console.log(`✅ Buzzer controller ready - ESP32 at ${this.resolvedIP}`);
            this.initialized = true;
        } else {
            console.warn('⚠️ Could not connect to ESP32 buzzer');
            console.warn('   Make sure ESP32 is powered on and connected to the same network');
        }
    }

    /**
     * Check if buzzer is configured
     * @returns {boolean} - True if buzzer IP is configured
     */
    isConfigured() {
        return this.buzzerIP !== null && this.buzzerIP !== '';
    }

    /**
     * Turn buzzer ON
     * @returns {Promise<boolean>} - True if successful, false otherwise
     */
    async turnOn() {
        if (!this.isConfigured()) {
            console.warn('Buzzer IP not configured');
            return false;
        }

        try {
            const url = MDNSResolver.getUrl(this.buzzerIP, '/buzzer/on');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Buzzer turned ON:', data);
                this.buzzerOffSent = false; // Reset flag
                return true;
            } else {
                console.error('Failed to turn buzzer ON:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error turning buzzer ON:', error);
            return false;
        }
    }

    /**
     * Turn buzzer OFF
     * @returns {Promise<boolean>} - True if successful, false otherwise
     */
    async turnOff() {
        if (!this.isConfigured()) {
            console.warn('⚠️ Buzzer IP not configured - cannot turn off LED');
            console.warn('   Configure ESP32_BUZZER_IP in config.js');
            return false;
        }

        // Only send once to avoid multiple requests
        if (this.buzzerOffSent) {
            console.log('ℹ️ Buzzer off command already sent, skipping duplicate request');
            return true; // Already sent, consider it successful
        }

        try {
            const url = MDNSResolver.getUrl(this.buzzerIP, '/buzzer/off');
            console.log(`📡 Sending buzzer OFF request to: ${url}`);

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Buzzer turned OFF successfully:', data);
                this.buzzerOffSent = true; // Mark as sent
                return true;
            } else {
                console.error(`❌ Failed to turn buzzer OFF: HTTP ${response.status}`);
                const text = await response.text().catch(() => '');
                console.error('   Response:', text);
                return false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Buzzer OFF request timed out after 5 seconds');
                console.error('   Check ESP32 connection and IP address:', this.buzzerIP);
            } else {
                console.error('❌ Error turning buzzer OFF:', error);
                console.error('   ESP32 IP:', this.buzzerIP);
                console.error('   Make sure ESP32 is connected to the same network');
            }
            return false;
        }
    }

    /**
     * Get buzzer status
     * @returns {Promise<Object|null>} - Status object or null if error
     */
    async getStatus() {
        if (!this.isConfigured()) {
            console.warn('Buzzer IP not configured');
            return null;
        }

        try {
            const url = MDNSResolver.getUrl(this.buzzerIP, '/status');
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Failed to get buzzer status:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error getting buzzer status:', error);
            return null;
        }
    }

    /**
     * Reset the off flag (useful when restarting detection)
     */
    reset() {
        this.buzzerOffSent = false;
    }
}

