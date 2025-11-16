/**
 * Authentication Pages Controller
 * Handles both login and registration pages
 */

import { AuthManager } from './auth.js';
import { translationManager } from './translations.js';

const authManager = new AuthManager();

// Login page functionality
if (document.getElementById('parentLoginForm') || document.getElementById('childLoginForm')) {
    // Dashboard selection is handled by inline functions in login.html

    // Parent login
    if (document.getElementById('parentLoginForm')) {
        document.getElementById('parentLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('parentUsername').value.trim();
            const password = document.getElementById('parentPassword').value;
            
            const errorDiv = document.getElementById('parentErrorMessage');
            errorDiv.classList.remove('show');
            errorDiv.textContent = '';
            
            const result = authManager.login(username, password);
            
            if (result.success) {
                if (result.user.role !== 'parent') {
                    errorDiv.textContent = translationManager.t('error');
                    errorDiv.classList.add('show');
                    return;
                }
                redirectToDashboard('parent');
            } else {
                errorDiv.textContent = result.message || translationManager.t('error');
                errorDiv.classList.add('show');
            }
        });
    }

    // Child login
    if (document.getElementById('childLoginForm')) {
        document.getElementById('childLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('childName').value.trim();
            const password = document.getElementById('childPassword').value;
            const fatherName = document.getElementById('fatherName').value.trim();
            
            const errorDiv = document.getElementById('childErrorMessage');
            errorDiv.classList.remove('show');
            errorDiv.textContent = '';
            
            if (!name || !password || !fatherName) {
                errorDiv.textContent = translationManager.t('error');
                errorDiv.classList.add('show');
                return;
            }
            
            const result = authManager.loginChild(name, password, fatherName);
            
            if (result.success) {
                redirectToDashboard('child');
            } else {
                errorDiv.textContent = result.message;
                errorDiv.classList.add('show');
            }
        });
    }

    // Check if already logged in
    window.addEventListener('DOMContentLoaded', () => {
        if (authManager.isLoggedIn()) {
            const session = authManager.getCurrentSession();
            redirectToDashboard(session.role);
        }
    });
}

// Registration page functionality
window.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const roleSelect = document.getElementById('regRole');
    const fatherNameGroup = document.getElementById('fatherNameGroup');
    const fatherNameInput = document.getElementById('regFatherName');

    // Show/hide father name field based on role
    if (roleSelect && fatherNameGroup && fatherNameInput) {
        roleSelect.addEventListener('change', () => {
            if (roleSelect.value === 'child') {
                fatherNameGroup.style.display = 'block';
                fatherNameInput.required = true;
            } else {
                fatherNameGroup.style.display = 'none';
                fatherNameInput.required = false;
            }
        });
    }

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const fatherName = role === 'child' ? document.getElementById('regFatherName').value.trim() : null;
        
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        errorDiv.textContent = '';
        successDiv.textContent = '';
        
        // Validation
        if (!name || name.length === 0) {
            errorDiv.textContent = translationManager.t('error');
            errorDiv.classList.add('show');
            return;
        }
        
        if (username.length < 3) {
            errorDiv.textContent = translationManager.t('error');
            errorDiv.classList.add('show');
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = translationManager.t('error');
            errorDiv.classList.add('show');
            return;
        }

        if (role === 'child' && !fatherName) {
            errorDiv.textContent = translationManager.t('error');
            errorDiv.classList.add('show');
            return;
        }
        
        try {
            const result = authManager.register(username, password, role, name, fatherName);
            
            if (result.success) {
                successDiv.textContent = translationManager.t('success');
                successDiv.classList.add('show');
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                errorDiv.textContent = result.message || translationManager.t('error');
                errorDiv.classList.add('show');
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = translationManager.t('error');
            errorDiv.classList.add('show');
        }
    });
});

function redirectToDashboard(role) {
    if (role === 'child') {
        window.location.href = 'child-dashboard.html';
    } else if (role === 'parent') {
        window.location.href = 'parent-dashboard.html';
    }
}
