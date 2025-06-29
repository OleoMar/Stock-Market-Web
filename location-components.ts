
// Location Permission Prompt Component for AlphaWave
class LocationPrompt {
    constructor() {
        this.isVisible = false;
        this.promptElement = null;
    }

    // Show location permission prompt
    show() {
        if (this.isVisible) return;
        
        this.create();
        this.isVisible = true;
        
        // Add to DOM with animation
        document.body.appendChild(this.promptElement);
        
        // Trigger animation
        setTimeout(() => {
            this.promptElement.style.transform = 'translateX(0)';
            this.promptElement.style.opacity = '1';
        }, 100);
    }

    // Create the prompt element
    create() {
        this.promptElement = document.createElement('div');
        this.promptElement.className = 'location-permission-prompt';
        this.promptElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            max-width: 320px;
            z-index: 1000;
            font-family: 'Quicksand', sans-serif;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        this.promptElement.innerHTML = `
            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                <div style="background: #2196F3; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <i class="fas fa-map-marker-alt" style="font-size: 14px;"></i>
                </div>
                <div>
                    <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333; font-weight: 600;">Enable Location Access</h4>
                    <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">
                        Get personalized market data, regional news, and trading hours for your location.
                    </p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <i class="fas fa-chart-line" style="color: #4CAF50; margin-right: 8px; font-size: 12px;"></i>
                    <span style="font-size: 12px; color: #555;">Regional market hours & status</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <i class="fas fa-newspaper" style="color: #4CAF50; margin-right: 8px; font-size: 12px;"></i>
                    <span style="font-size: 12px; color: #555;">Local financial news</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-dollar-sign" style="color: #4CAF50; margin-right: 8px; font-size: 12px;"></i>
                    <span style="font-size: 12px; color: #555;">Currency preferences</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button class="location-deny-btn" style="
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    color: #666;
                    cursor: pointer;
                    font-family: 'Quicksand', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                ">
                    Not Now
                </button>
                <button class="location-allow-btn" style="
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #007bff;
                    border-radius: 6px;
                    background: #007bff;
                    color: white;
                    cursor: pointer;
                    font-family: 'Quicksand', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                ">
                    Allow Location
                </button>
            </div>
        `;
        
        // Add event listeners
        const denyBtn = this.promptElement.querySelector('.location-deny-btn');
        const allowBtn = this.promptElement.querySelector('.location-allow-btn');
        
        denyBtn.addEventListener('click', () => this.handleDeny());
        allowBtn.addEventListener('click', () => this.handleAllow());
        
        // Add hover effects
        denyBtn.addEventListener('mouseenter', () => {
            denyBtn.style.background = '#f8f9fa';
            denyBtn.style.borderColor = '#007bff';
        });
        denyBtn.addEventListener('mouseleave', () => {
            denyBtn.style.background = 'white';
            denyBtn.style.borderColor = '#ddd';
        });
        
        allowBtn.addEventListener('mouseenter', () => {
            allowBtn.style.background = '#0056b3';
        });
        allowBtn.addEventListener('mouseleave', () => {
            allowBtn.style.background = '#007bff';
        });
    }

    // Handle deny button click
    handleDeny() {
        this.hide();
        
        // Store user preference
        localStorage.setItem('alphawave_location_denied', 'true');
        
        // Show brief message
        this.showMessage('Using default market settings', 'info');
        
        // Set default location
        if (window.locationService) {
            window.locationService.setDefaultLocation();
        }
    }

    // Handle allow button click
    async handleAllow() {
        this.hide();
        
        // Store user preference
        localStorage.setItem('alphawave_location_denied', 'false');
        
        // Request location permission
        try {
            if (window.locationService) {
                const success = await window.locationService.requestLocationPermission();
                if (success) {
                    this.showMessage('Location access granted!', 'success');
                } else {
                    this.showMessage('Could not access location', 'warning');
                }
            }
        } catch (error) {
            console.error('Error requesting location:', error);
            this.showMessage('Location request failed', 'error');
        }
    }

    // Hide the prompt
    hide() {
        if (!this.isVisible || !this.promptElement) return;
        
        this.promptElement.style.transform = 'translateX(100%)';
        this.promptElement.style.opacity = '0';
        
        setTimeout(() => {
            if (this.promptElement && this.promptElement.parentNode) {
                this.promptElement.remove();
            }
            this.isVisible = false;
            this.promptElement = null;
        }, 300);
    }

    // Show status message
    showMessage(message, type) {
        const existingMsg = document.querySelector('.location-status-message');
        if (existingMsg) existingMsg.remove();
        
        const msgElement = document.createElement('div');
        msgElement.className = 'location-status-message';
        msgElement.textContent = message;
        msgElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-family: 'Quicksand', sans-serif;
            font-size: 13px;
            font-weight: 500;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: #4CAF50;' : ''}
            ${type === 'warning' ? 'background: #ff9800;' : ''}
            ${type === 'error' ? 'background: #f44336;' : ''}
            ${type === 'info' ? 'background: #2196F3;' : ''}
        `;
        
        document.body.appendChild(msgElement);
        
        setTimeout(() => {
            msgElement.style.transform = 'translateX(0)';
        }, 100);