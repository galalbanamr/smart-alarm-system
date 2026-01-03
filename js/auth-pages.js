/**
 * Authentication Pages Controller
 * Handles both login and registration pages
 */

import { AuthManager } from './auth.js';
// import { translationManager } from './translations.js'; // Assuming translations might be optional or handled simply for now

const authManager = new AuthManager();

// Login page functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Role switcher logic for UI
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const fatherNameGroup = document.getElementById('fatherNameContainer');
    const fatherNameInput = document.getElementById('loginFatherName');

    if (roleRadios && fatherNameGroup) {
        roleRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const label = document.getElementById('usernameLabel');
                const input = document.getElementById('loginUsername');

                if (e.target.value === 'Child') {
                    fatherNameGroup.classList.remove('hidden');
                    if (fatherNameInput) fatherNameInput.required = true;
                    if (label) label.textContent = 'Child Name';
                    if (input) input.placeholder = 'Enter child name';
                } else {
                    fatherNameGroup.classList.add('hidden');
                    if (fatherNameInput) fatherNameInput.required = false;
                    if (label) label.textContent = 'Username';
                    if (input) input.placeholder = 'Enter your username';
                }
            });
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const errorDiv = document.getElementById('loginErrorMessage');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';
        }

        const role = document.querySelector('input[name="role"]:checked').value;
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Simple validation or translation fallback
        const showError = (msg) => {
            if (errorDiv) {
                errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            } else {
                alert(msg);
            }
        };

        if (role === 'Parent') {
            const result = authManager.login(username, password);
            if (result.success) {
                if (result.user.role !== 'parent') {
                    showError('Invalid role for this user.');
                    return;
                }
                window.location.href = 'parent-dashboard.html';
            } else {
                showError(result.message || 'Login failed');
            }
        } else if (role === 'Child') {
            const fatherName = document.getElementById('loginFatherName').value.trim();
            if (!fatherName) {
                showError('Father\'s name is required for child login');
                return;
            }
            const result = authManager.loginChild(username, password, fatherName);
            if (result.success) {
                window.location.href = 'child-dashboard.html';
            } else {
                showError(result.message || 'Login failed');
            }
        }
    });

    // Check if already logged in
    window.addEventListener('DOMContentLoaded', () => {
        if (authManager.isLoggedIn()) {
            const session = authManager.getCurrentSession();
            redirectToDashboard(session.role);
        }
    });
}

// Registration page functionality
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const fatherNameGroup = document.getElementById('fatherNameContainer');
    const fatherNameInput = document.getElementById('regFatherName');

    // Show/hide father name field based on role
    const updateFatherNameVisibility = () => {
        const selectedRole = document.querySelector('input[name="role"]:checked');
        if (selectedRole && fatherNameGroup && fatherNameInput) {
            if (selectedRole.value === 'child') {
                fatherNameGroup.classList.remove('hidden');
                fatherNameInput.required = true;
            } else {
                fatherNameGroup.classList.add('hidden');
                fatherNameInput.required = false;
            }
        }
    };

    if (roleRadios && fatherNameGroup && fatherNameInput) {
        roleRadios.forEach(radio => {
            radio.addEventListener('change', updateFatherNameVisibility);
        });
        // Check initial state on page load
        updateFatherNameVisibility();
    }

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('regName').value.trim(); // Full Name
        const username = document.getElementById('regUsername').value.trim(); // Username
        const password = document.getElementById('regPassword').value;
        const role = document.querySelector('input[name="role"]:checked').value;
        const fatherName = role === 'child' ? document.getElementById('regFatherName').value.trim() : null;

        // Note: The original authManager.register expects (username, password, role, name, fatherName)
        // We will use 'email' as the username for uniqueness if needed, or just map fields.
        // Assuming regUsername is the display name/codename.

        const errorDiv = document.getElementById('regErrorMessage'); // Need to add this to HTML
        const successDiv = document.getElementById('regSuccessMessage'); // Need to add this to HTML

        const showError = (msg) => {
            if (errorDiv) {
                errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            } else {
                alert(msg);
            }
        };

        if (successDiv) successDiv.classList.add('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            // Use username as unique ID
            const result = authManager.register(username, password, role, name, fatherName);

            if (result.success) {
                // Auto-login the user after successful registration
                const loginResult = role === 'child'
                    ? authManager.loginChild(name, password, fatherName)
                    : authManager.login(username, password);

                if (successDiv) {
                    successDiv.textContent = '✓ Account created successfully! Logging you in...';
                    successDiv.classList.remove('hidden');
                }

                setTimeout(() => {
                    // Redirect to appropriate dashboard
                    if (role === 'child') {
                        window.location.href = 'child-dashboard.html';
                    } else {
                        window.location.href = 'parent-dashboard.html';
                    }
                }, 1500);
            } else {
                showError(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred');
        }
    });
}

function redirectToDashboard(role) {
    if (role === 'child') {
        window.location.href = 'child-dashboard.html';
    } else if (role === 'parent') {
        window.location.href = 'parent-dashboard.html';
    }
}
