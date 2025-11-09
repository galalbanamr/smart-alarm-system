/**
 * Authentication and User Management Module
 * Handles login, registration, and user data management
 */

export class AuthManager {
    constructor() {
        this.STORAGE_KEY = 'standing_detection_users';
        this.SESSION_KEY = 'standing_detection_session';
        this.initDefaultParent();
    }

    /**
     * Initialize default parent if none exists
     */
    initDefaultParent() {
        const users = this.getAllUsers();
        const parents = users.filter(u => u.role === 'parent');
        
        if (parents.length === 0) {
            // Create default parent
            const defaultParent = {
                id: 'parent_1',
                username: 'parent',
                password: 'parent123', // In production, this should be hashed
                role: 'parent',
                name: 'Default Parent',
                createdAt: new Date().toISOString()
            };
            this.saveUser(defaultParent);
        }
    }

    /**
     * Get all users from storage
     */
    getAllUsers() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Save user to storage
     */
    saveUser(user) {
        const users = this.getAllUsers();
        const existingIndex = users.findIndex(u => u.id === user.id || u.username === user.username);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    }

    /**
     * Register a new user
     */
    register(username, password, role, name, fatherName = null) {
        // Check if username already exists
        const users = this.getAllUsers();
        if (users.some(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        // For children, find parent by father name
        let parentId = null;
        if (role === 'child' && fatherName) {
            const parent = users.find(u => u.role === 'parent' && u.name.toLowerCase() === fatherName.toLowerCase());
            if (!parent) {
                return { success: false, message: 'Parent not found. Please check the father\'s name.' };
            }
            parentId = parent.id;
        }

        // Create new user
        const newUser = {
            id: `${role}_${Date.now()}`,
            username,
            password, // In production, hash this
            role,
            name: name || username,
            fatherName: role === 'child' ? fatherName : null,
            parentId: parentId, // Assign to specific parent
            createdAt: new Date().toISOString()
        };

        this.saveUser(newUser);
        return { success: true, user: newUser };
    }

    /**
     * Login user (for parent)
     */
    login(username, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Create session
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return { success: true, user: session };
    }

    /**
     * Login child (requires name, password, and father name)
     */
    loginChild(name, password, fatherName) {
        const users = this.getAllUsers();
        const child = users.find(u => 
            u.role === 'child' && 
            u.name.toLowerCase() === name.toLowerCase() && 
            u.password === password &&
            u.fatherName && 
            u.fatherName.toLowerCase() === fatherName.toLowerCase()
        );

        if (!child) {
            return { success: false, message: 'Invalid credentials. Please check name, password, and father\'s name.' };
        }

        // Create session
        const session = {
            userId: child.id,
            username: child.username,
            role: child.role,
            name: child.name,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return { success: true, user: session };
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }

    /**
     * Get current session
     */
    getCurrentSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.getCurrentSession() !== null;
    }

    /**
     * Get children for a parent
     */
    getChildrenForParent(parentId) {
        const users = this.getAllUsers();
        return users.filter(u => u.role === 'child' && u.parentId === parentId);
    }

    /**
     * Get parent for a child
     */
    getParentForChild(childId) {
        const users = this.getAllUsers();
        const child = users.find(u => u.id === childId);
        if (!child || !child.parentId) return null;
        return users.find(u => u.id === child.parentId);
    }
}
