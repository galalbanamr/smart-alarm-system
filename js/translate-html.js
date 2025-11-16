/**
 * HTML Translation Module
 * Updates HTML elements with translations
 */

import { translationManager } from './translations.js';

export function translateHTML() {
    // Update login page
    if (document.querySelector('.auth-title')) {
        const title = document.querySelector('.auth-title');
        if (title && title.textContent.includes('Standing Detection')) {
            title.innerHTML = `<span class="auth-icon">👁️</span>${translationManager.t('standingDetection')}`;
        }
        
        const subtitle = document.querySelector('.auth-subtitle');
        if (subtitle) {
            subtitle.textContent = translationManager.t('chooseDashboard');
        }
    }
    
    // Update dashboard options
    const parentDashboard = document.getElementById('parentDashboardOption');
    if (parentDashboard) {
        const h3 = parentDashboard.querySelector('h3');
        const p = parentDashboard.querySelector('p');
        const btn = parentDashboard.querySelector('.dashboard-btn');
        if (h3) h3.textContent = translationManager.t('parentDashboard');
        if (p) p.textContent = translationManager.t('monitorActivity');
        if (btn) btn.textContent = translationManager.t('loginAsParent');
    }
    
    const childDashboard = document.getElementById('childDashboardOption');
    if (childDashboard) {
        const h3 = childDashboard.querySelector('h3');
        const p = childDashboard.querySelector('p');
        const btn = childDashboard.querySelector('.dashboard-btn');
        if (h3) h3.textContent = translationManager.t('childDashboardTitle');
        if (p) p.textContent = translationManager.t('standingDetectionForChildren');
        if (btn) btn.textContent = translationManager.t('loginAsChild');
    }
    
    // Update form labels
    const labels = {
        'parentUsername': translationManager.t('username'),
        'parentPassword': translationManager.t('password'),
        'childName': translationManager.t('name'),
        'childPassword': translationManager.t('password'),
        'fatherName': translationManager.t('fathersName'),
        'regName': translationManager.t('name'),
        'regUsername': translationManager.t('username'),
        'regPassword': translationManager.t('password'),
        'regRole': translationManager.t('accountType'),
        'regFatherName': translationManager.t('fathersName')
    };
    
    Object.keys(labels).forEach(id => {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
            label.textContent = labels[id];
        }
    });
    
    // Update select options
    const roleSelect = document.getElementById('regRole');
    if (roleSelect) {
        Array.from(roleSelect.options).forEach(option => {
            if (option.value === 'parent') {
                option.textContent = translationManager.t('parent');
            } else if (option.value === 'child') {
                option.textContent = translationManager.t('child');
            }
        });
    }
    
    // Update buttons
    const parentLoginBtn = document.querySelector('#parentLoginForm button[type="submit"] span');
    if (parentLoginBtn) {
        parentLoginBtn.textContent = translationManager.t('loginAsParent');
    }
    
    const childLoginBtn = document.querySelector('#childLoginForm button[type="submit"] span');
    if (childLoginBtn) {
        childLoginBtn.textContent = translationManager.t('loginAsChild');
    }
    
    const registerBtn = document.querySelector('#registerForm button[type="submit"] span');
    if (registerBtn) {
        registerBtn.textContent = translationManager.t('register');
    }
    
    // Update back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        if (btn.textContent.includes('Back') || btn.textContent.includes('←')) {
            btn.textContent = `← ${translationManager.t('back')}`;
        }
    });
    
    // Update footer links
    const authFooter = document.querySelector('.auth-footer');
    if (authFooter) {
        const links = authFooter.querySelectorAll('a');
        links.forEach(link => {
            if (link.textContent === 'Create one' || link.textContent.includes('Create')) {
                link.textContent = translationManager.t('register');
            }
            if (link.textContent === 'Login' || link.textContent.includes('Login')) {
                link.textContent = translationManager.t('login');
            }
        });
        
        const footerText = authFooter.querySelector('p');
        if (footerText) {
            if (footerText.textContent.includes("Don't have")) {
                footerText.innerHTML = `${translationManager.t('dontHaveAccount')} <a href="register.html" class="auth-link">${translationManager.t('register')}</a>`;
            } else if (footerText.textContent.includes("Already have")) {
                footerText.innerHTML = `${translationManager.t('alreadyHaveAccount')} <a href="login.html" class="auth-link">${translationManager.t('login')}</a>`;
            }
        }
    }
    
    // Update register page title
    const registerTitle = document.querySelector('.auth-title');
    if (registerTitle && registerTitle.textContent.includes('Create Account')) {
        registerTitle.innerHTML = `<span class="auth-icon">👁️</span>${translationManager.t('register')}`;
    }
    
    const registerSubtitle = document.querySelector('.auth-subtitle');
    if (registerSubtitle && registerSubtitle.textContent.includes('Join')) {
        registerSubtitle.textContent = translationManager.t('standingDetection');
    }
    
    // Update child dashboard header
    const childDashboardTitle = document.querySelector('.title');
    if (childDashboardTitle && childDashboardTitle.textContent.includes('Child Dashboard')) {
        childDashboardTitle.innerHTML = `<span class="title-icon">👁️</span>${translationManager.t('childDashboard')}`;
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && logoutBtn.textContent.includes('Logout')) {
        logoutBtn.textContent = translationManager.t('logout');
    }
    
    // Update calendar buttons
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) prevBtn.textContent = `◀ ${translationManager.t('previous')}`;
    if (nextBtn) nextBtn.textContent = `${translationManager.t('next')} ▶`;
    
    // Update mark all read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.textContent = translationManager.t('markAllRead');
    }
    
    // Update section headers
    const sectionHeaders = {
        'overviewSection': translationManager.t('overview'),
        'childrenSection': translationManager.t('myChildren'),
        'notificationsSection': translationManager.t('notifications'),
        'recordsSection': translationManager.t('recentRecords'),
        'calendarSection': translationManager.t('wakingTimesCalendar')
    };
    
    Object.keys(sectionHeaders).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const h2 = section.querySelector('.section-header h2');
            if (h2) {
                h2.textContent = sectionHeaders[sectionId];
            }
        }
    });
}

// Listen for language changes
window.addEventListener('languageChanged', () => {
    translateHTML();
});

// Initial translation - wait for DOM and translations to be ready
function initTranslation() {
    // Small delay to ensure all elements are loaded
    setTimeout(() => {
        try {
            translateHTML();
        } catch (error) {
            console.warn('Translation initialization error:', error);
        }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslation);
} else {
    initTranslation();
}

