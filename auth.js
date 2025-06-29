// Enhanced Authentication System with Fixed Session Management
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('alphawave_users') || '[]');
        this.currentUser = this.loadCurrentUser();
        this.initializeAuth();
    }

    // Safely load current user with validation
    loadCurrentUser() {
        try {
            const stored = localStorage.getItem('alphawave_current_user');
            if (!stored || stored === 'null' || stored === 'undefined') {
                return null;
            }
            
            const user = JSON.parse(stored);
            
            // Validate user object has required properties
            if (!user || !user.id || !user.email) {
                console.warn('Invalid user session detected, clearing...');
                localStorage.removeItem('alphawave_current_user');
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error loading current user:', error);
            localStorage.removeItem('alphawave_current_user');
            return null;
        }
    }

    // Initialize authentication system
    initializeAuth() {
        const protectedPages = ['dashboard.html', 'portfolio.html', 'news.html', 'stocks.html', 'watchlist.html', 'pro.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        console.log('🔐 Auth check - Page:', currentPage, 'Logged in:', this.isLoggedIn());
        
        // Check if user should be on protected page but isn't logged in
        if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
            console.log('❌ Protected page access denied, redirecting to login...');
            this.redirectToLogin();
            return;
        }
        
        // Only redirect away from auth pages if user is actually logged in with valid session
        if ((currentPage === 'index.html' || currentPage === 'signup.html') && this.isLoggedIn()) {
            console.log('✅ User logged in, redirecting to dashboard...');
            this.redirectToDashboard();
        }
    }

    // Email validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password validation
    validatePassword(password) {
        return password && password.length >= 6;
    }

    // Phone validation
    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Check if user exists
    userExists(email) {
        return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Register new user
    register(userData) {
        const { email, password, confirmPassword, fullName, phone, gender, dateOfBirth } = userData;

        // Validation
        if (!email || !password || !fullName) {
            throw new Error('Email, password, and full name are required');
        }

        if (!this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (this.userExists(email)) {
            throw new Error('An account with this email already exists');
        }

        if (phone && !this.validatePhone(phone)) {
            throw new Error('Please enter a valid phone number');
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            fullName,
            phone: phone || '',
            gender: gender || '',
            dateOfBirth: dateOfBirth || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // Save user
        this.users.push(newUser);
        this.saveUsers();

        // Auto login after registration
        this.setCurrentUser(newUser);

        console.log('✅ User registered successfully:', email);
        return { success: true, message: 'Registration successful!' };
    }

    // Login user
    login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        if (!this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            throw new Error('No account found with this email address');
        }

        if (!this.verifyPassword(password, user.password)) {
            throw new Error('Incorrect password');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // Set current user
        this.setCurrentUser(user);

        console.log('✅ User logged in successfully:', email);
        return { success: true, message: 'Login successful!' };
    }

    // Logout user
    logout() {
        console.log('🚪 Logging out user:', this.currentUser?.email);
        this.clearSession();
        this.showMessage('You have been logged out successfully', 'success');
        
        // Redirect after showing message
        setTimeout(() => {
            this.redirectToLogin();
        }, 1000);
    }

    // Clear user session
    clearSession() {
        localStorage.removeItem('alphawave_current_user');
        this.currentUser = null;
        console.log('🧹 User session cleared');
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null && 
               this.currentUser.id && 
               this.currentUser.email;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Set current user (without password)
    setCurrentUser(user) {
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        this.currentUser = userWithoutPassword;
        localStorage.setItem('alphawave_current_user', JSON.stringify(userWithoutPassword));
        console.log('💾 User session saved:', userWithoutPassword.email);
    }

    // Delete account
    deleteAccount() {
        if (!this.isLoggedIn()) {
            throw new Error('You must be logged in to delete your account');
        }

        const userEmail = this.currentUser.email;
        console.log('🗑️ Deleting account for user:', userEmail);
        
        // Remove user from users array
        this.users = this.users.filter(u => u.id !== this.currentUser.id);
        this.saveUsers();
        
        // Clear session
        this.clearSession();
        
        console.log('✅ Account deleted successfully for:', userEmail);
        return { success: true, message: 'Account deleted successfully!' };
    }

    // Simple password hashing (for demo purposes)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Verify password
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('alphawave_users', JSON.stringify(this.users));
    }

    // Redirect to login page
    redirectToLogin() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== 'index.html') {
            console.log('🔄 Redirecting to login page...');
            window.location.href = 'index.html';
        }
    }

    // Redirect to dashboard
    redirectToDashboard() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== 'dashboard.html') {
            console.log('🔄 Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;
        
        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: 'Quicksand', sans-serif;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #4CAF50;' : ''}
            ${type === 'error' ? 'background: #f44336;' : ''}
            ${type === 'info' ? 'background: #2196F3;' : ''}
            ${type === 'warning' ? 'background: #ff9800;' : ''}
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (messageDiv && messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Debug function to clear all data
    clearAllData() {
        localStorage.clear();
        console.log('🧹 All localStorage data cleared');
        this.users = [];
        this.currentUser = null;
        this.showMessage('All data cleared. Please refresh the page.', 'warning');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // Debug function to get session info
    getSessionInfo() {
        return {
            isLoggedIn: this.isLoggedIn(),
            currentUser: this.currentUser,
            totalUsers: this.users.length,
            localStorage: {
                users: localStorage.getItem('alphawave_users'),
                currentUser: localStorage.getItem('alphawave_current_user')
            }
        };
    }
}

// Initialize global auth system
window.authSystem = new AuthSystem();

// ============================================
// FORM HANDLERS FOR SIGN IN/UP PAGES
// ============================================

// Handle sign in form submission
function handleSignIn(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const submitBtn = document.getElementById('signInBtn');
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Clear previous messages
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
    }
    
    try {
        const result = window.authSystem.login(email, password);
        
        if (successDiv) {
            successDiv.textContent = result.message;
            successDiv.style.display = 'block';
        }
        
        window.authSystem.showMessage(result.message, 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
        
        window.authSystem.showMessage(error.message, 'error');
        
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        }
    }
}

// Handle sign up form submission
function handleSignUp(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        gender: formData.get('gender'),
        dateOfBirth: formData.get('dateOfBirth')
    };
    
    const submitBtn = document.getElementById('signUpBtn');
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Clear previous messages
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.classList.add('loading');
    }
    
    try {
        const result = window.authSystem.register(userData);
        
        if (successDiv) {
            successDiv.textContent = result.message;
            successDiv.style.display = 'block';
        }
        
        window.authSystem.showMessage(result.message, 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
        
        window.authSystem.showMessage(error.message, 'error');
        
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
            submitBtn.classList.remove('loading');
        }
    }
}

// Handle social login (mock implementation)
function handleSocialLogin(provider) {
    window.authSystem.showMessage(`${provider} login is not implemented in this demo`, 'info');
}

// ============================================
// PROFILE MODAL HANDLERS (FOR DASHBOARD)
// ============================================

// Handle profile menu clicks
function handleMenuClick(action) {
    console.log('🎯 Menu action:', action);
    
    switch(action) {
        case 'logout':
            closeProfileModal();
            setTimeout(() => {
                window.authSystem.logout();
            }, 300);
            break;
            
        case 'delete-account':
            closeProfileModal();
            setTimeout(() => {
                showDeleteConfirmation();
            }, 300);
            break;
            
        case 'personal-info':
            window.authSystem.showMessage('Personal info page not implemented yet', 'info');
            closeProfileModal();
            break;
            
        case 'currency':
            window.authSystem.showMessage('Currency settings not implemented yet', 'info');
            closeProfileModal();
            break;
            
        case 'theme':
            window.authSystem.showMessage('Theme settings not implemented yet', 'info');
            closeProfileModal();
            break;
            
        case 'help':
            window.authSystem.showMessage('Help & Support not implemented yet', 'info');
            closeProfileModal();
            break;
            
        case 'terms':
            window.authSystem.showMessage('Terms of Service not implemented yet', 'info');
            closeProfileModal();
            break;
            
        default:
            closeProfileModal();
    }
}

// Show delete account confirmation
function showDeleteConfirmation() {
    const confirmed = confirm('⚠️ Do you really want to delete your account?\n\nThis action cannot be undone and you will lose all your data.');
    
    if (confirmed) {
        try {
            window.authSystem.deleteAccount();
            window.authSystem.showMessage('Account deleted successfully. Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            window.authSystem.showMessage(error.message, 'error');
        }
    }
}

// Profile modal functions (if not already defined)
function toggleProfileModal() {
    const overlay = document.getElementById('profileModalOverlay');
    if (overlay) {
        if (overlay.classList.contains('show')) {
            closeProfileModal();
        } else {
            openProfileModal();
        }
    }
}

function openProfileModal() {
    const overlay = document.getElementById('profileModalOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfileModal(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }
    
    const overlay = document.getElementById('profileModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// GLOBAL EVENT LISTENERS
// ============================================

// Initialize form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Page loaded:', currentPage);
    
    // Sign In page
    if (currentPage === 'index.html') {
        const signInForm = document.getElementById('signInForm');
        if (signInForm) {
            signInForm.addEventListener('submit', handleSignIn);
            console.log('✅ Sign in form handler attached');
        }
    }
    
    // Sign Up page
    if (currentPage === 'signup.html') {
        const signUpForm = document.getElementById('signUpForm');
        if (signUpForm) {
            signUpForm.addEventListener('submit', handleSignUp);
            console.log('✅ Sign up form handler attached');
        }
    }
    
    // Add logout functionality to any logout buttons
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.authSystem.logout();
        });
    });
});

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProfileModal();
    }
});

// ============================================
// DEBUG FUNCTIONS (GLOBAL)
// ============================================

// Debug function to clear all data
window.clearAllData = function() {
    if (window.authSystem) {
        window.authSystem.clearAllData();
    }
};

// Debug function to get session info
window.getSessionInfo = function() {
    if (window.authSystem) {
        console.table(window.authSystem.getSessionInfo());
        return window.authSystem.getSessionInfo();
    }
};

// Debug function to force logout
window.forceLogout = function() {
    if (window.authSystem) {
        window.authSystem.logout();
    }
};

console.log('🔐 Enhanced Auth System loaded successfully');

// Export for use in other files (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}