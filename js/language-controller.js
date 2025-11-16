/**
 * Language Controller
 * Handles language switching and UI updates
 */

import { translationManager } from './translations.js';

export class LanguageController {
    constructor() {
        this.translationManager = translationManager;
        this.init();
    }

    init() {
        // Apply language on load
        this.translationManager.applyLanguage();
        
        // Setup language switcher button
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            langBtn.addEventListener('click', () => {
                this.toggleLanguage();
            });
            this.updateLanguageButton();
        }
    }

    toggleLanguage() {
        const currentLang = this.translationManager.getLanguage();
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        this.translationManager.setLanguage(newLang);
        this.translationManager.applyLanguage();
        this.updateLanguageButton();
        this.updateAllTexts();
        
        // Trigger custom event for other modules
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
    }

    updateLanguageButton() {
        const langText = document.getElementById('langText');
        const langIcon = document.getElementById('langIcon');
        const currentLang = this.translationManager.getLanguage();
        
        if (langText) {
            langText.textContent = currentLang === 'ar' ? 'AR' : 'EN';
        }
        if (langIcon) {
            langIcon.textContent = currentLang === 'ar' ? '🌐' : '🌐';
        }
    }

    updateAllTexts() {
        // This will be called by individual modules to update their texts
        // Each module should listen to 'languageChanged' event
    }
}

// Initialize on DOM load
function initLanguageController() {
    try {
        new LanguageController();
    } catch (error) {
        console.error('Language controller initialization error:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageController);
} else {
    initLanguageController();
}


