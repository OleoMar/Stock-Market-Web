
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('alphawave_users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('alphawave_current_user') || 'null');
        this.initializeAuth();
    }

    // Initialize authentication system
    initializeAuth() {
        
        const protectedPages = ['dashboard.html', 'portfolio.html', 'news.html', 'stocks.html', 'watchlist.html', 'pro.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
            this.redirectToLogin();
        }
        
        
        if ((currentPage === 'index.html' || currentPage === 'signup.html') && this.isLoggedIn()) {
            this.redirectToDashboard();
        }
    }

    // email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // password 
    validatePassword(password) {
        return password && password.length >= 6;
    }

    // phone number 
    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    //  if user exists
    userExists(email) {
        return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // register  new user
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

        // create new user
        const newUser = {
            id: Date.now().toString(),
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            fullName,
            phone: phone || '',
            gender: gender || '',
            dateOfBirth: dateOfBirth || '',
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        // save user
        this.users.push(newUser);
        this.saveUsers();

        // auto login 
        this.setCurrentUser(newUser);

        return { success: true, message: 'Registration successful!' };
    }

    // login user
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

        // last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // current user
        this.setCurrentUser(user);

        return { success: true, message: 'Login successful!' };
    }

    // logout user
    logout() {
        localStorage.removeItem('alphawave_current_user');
        this.currentUser = null;
        this.redirectToLogin();
    }

    // if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    
    getCurrentUser() {
        return this.currentUser;
    }

    
    setCurrentUser(user) {
        
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        this.currentUser = userWithoutPassword;
        localStorage.setItem('alphawave_current_user', JSON.stringify(userWithoutPassword));
    }

    // Simple password hashing
    hashPassword(password) {
    
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // verify password
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('alphawave_users', JSON.stringify(this.users));
    }

    // Redirect to login
    redirectToLogin() {
        if (window.location.pathname.split('/').pop() !== 'index.html') {
            window.location.href = 'index.html';
        }
    }

    // Redirect to dashboard
    redirectToDashboard() {
        if (window.location.pathname.split('/').pop() !== 'dashboard.html') {
            window.location.href = 'dashboard.html';
        }
    }

    // Update user profile
    updateProfile(updates) {
        if (!this.isLoggedIn()) {
            throw new Error('You must be logged in to update your profile');
        }

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Update user data
        Object.assign(this.users[userIndex], updates);
        this.saveUsers();

        // Update current user
        this.setCurrentUser(this.users[userIndex]);

        return { success: true, message: 'Profile updated successfully!' };
    }

    // Change password
    changePassword(currentPassword, newPassword) {
        if (!this.isLoggedIn()) {
            throw new Error('You must be logged in to change your password');
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user) {
            throw new Error('User not found');
        }

        if (!this.verifyPassword(currentPassword, user.password)) {
            throw new Error('Current password is incorrect');
        }

        if (!this.validatePassword(newPassword)) {
            throw new Error('New password must be at least 6 characters long');
        }

        user.password = this.hashPassword(newPassword);
        this.saveUsers();

        return { success: true, message: 'Password changed successfully!' };
    }

    // Delete account
    deleteAccount() {
        if (!this.isLoggedIn()) {
            throw new Error('You must be logged in to delete your account');
        }

        this.users = this.users.filter(u => u.id !== this.currentUser.id);
        this.saveUsers();
        this.logout();

        return { success: true, message: 'Account deleted successfully!' };
    }
}

// Initialize global auth system
window.authSystem = new AuthSystem();

// Form handlers for Sign In page
function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    
    try {
        const result = window.authSystem.login(email, password);
        showMessage(result.message, 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Form handlers for Sign Up page
function handleSignUp(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        email: formData.get('email') || document.querySelector('input[type="email"]').value,
        password: formData.get('password') || document.querySelectorAll('input[type="password"]')[0].value,
        confirmPassword: formData.get('confirmPassword') || document.querySelectorAll('input[type="password"]')[1].value,
        fullName: formData.get('fullName') || document.querySelector('input[placeholder*="full name"]').value,
        phone: formData.get('phone') || document.querySelector('input[type="tel"]').value,
        gender: formData.get('gender') || document.querySelector('select').value,
        dateOfBirth: formData.get('dateOfBirth') || document.querySelector('input[placeholder*="DD/MM/YYYY"]').value
    };
    
    try {
        const result = window.authSystem.register(userData);
        showMessage(result.message, 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Show message to user
function showMessage(message, type = 'info') {
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

// Social login handlers (mock implementation)
function handleSocialLogin(provider) {
    showMessage(`${provider} login is not implemented in this demo`, 'info');
}

// Initialize form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Sign In page
    if (currentPage === 'index.html') {
        const signInForm = document.querySelector('.auth-form form');
        const signInButton = document.querySelector('.btn-auth');
        
        if (signInButton) {
            signInButton.onclick = function(event) {
                event.preventDefault();
                handleSignIn(event);
            };
        }
        
        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.onclick = function() {
                const provider = this.querySelector('img').alt;
                handleSocialLogin(provider);
            };
        });
    }
    
    // Sign Up page
    if (currentPage === 'signup.html') {
        const signUpForm = document.querySelector('.auth-form form');
        const signUpButton = document.querySelector('.btn-auth');
        
        if (signUpButton) {
            signUpButton.onclick = function(event) {
                event.preventDefault();
                handleSignUp(event);
            };
        }
        
        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.onclick = function() {
                const provider = this.querySelector('img').alt;
                handleSocialLogin(provider);
            };
        });
    }
    
    // Add logout functionality to user profile modals
    const logoutButtons = document.querySelectorAll('[onclick*="logout"]');
    logoutButtons.forEach(btn => {
        btn.onclick = function() {
            window.authSystem.logout();
        };
    });
});

// Handle logout from profile modal
function handleMenuClick(action) {
    console.log('Menu action:', action);
    
    if (action === 'logout') {
        window.authSystem.logout();
        return;
    }
    
    if (action === 'delete-account') {
        // Show delete confirmation modal
        showDeleteModal();
        return;
    }
    
    // Close modal for other actions
    closeProfileModal();
}

// Handle delete account confirmation
function confirmDelete() {
    try {
        window.authSystem.deleteAccount();
        showMessage('Account deleted successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
    closeDeleteModal();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}