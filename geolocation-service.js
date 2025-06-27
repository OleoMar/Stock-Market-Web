// Enhanced Geolocation API implementation for AlphaWave - Session-Based Permission
class LocationService {
    constructor() {
        this.userLocation = null;
        this.marketRegion = null;
        this.watchOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };
        this.watchId = null;
        this.locationPermissionStatus = null;
        
        // Session-based tracking
        this.sessionKey = 'alphawave_location_session_' + Date.now();
        this.hasAskedThisSession = false;
        
        // Market regions mapping
        this.marketRegions = {
            'US': { name: 'United States', currency: 'USD', timezone: 'America/New_York' },
            'EU': { name: 'Europe', currency: 'EUR', timezone: 'Europe/London' },
            'ASIA': { name: 'Asia Pacific', currency: 'JPY', timezone: 'Asia/Tokyo' },
            'DEFAULT': { name: 'Global', currency: 'USD', timezone: 'UTC' }
        };
        
        this.initializeLocation();
    }

    // Initialize location services with session check
    async initializeLocation() {
        try {
            // Check if geolocation is supported
            if (!this.isGeolocationSupported()) {
                console.warn('Geolocation is not supported by this browser');
                this.setDefaultLocation();
                return;
            }

            // Check if we've already handled location in this session
            if (this.hasHandledLocationThisSession()) {
                console.log('Location already handled this session, loading from storage');
                if (this.loadLocationFromStorage()) {
                    return; // Successfully loaded from storage
                }
            }

            // Check permission status first
            await this.checkPermissionStatus();
            
            // Only proceed if we haven't asked this session and permission isn't denied
            if (!this.hasAskedThisSession && this.locationPermissionStatus !== 'denied') {
                await this.getCurrentLocation();
                this.markAskedThisSession();
            } else {
                // Load from storage or use default
                if (!this.loadLocationFromStorage()) {
                    this.setDefaultLocation();
                }
            }
            
        } catch (error) {
            console.error('Error initializing location:', error);
            this.handleLocationError(error);
        }
    }

    // Check if location has been handled this session
    hasHandledLocationThisSession() {
        // Check sessionStorage for this session
        const sessionHandled = sessionStorage.getItem('alphawave_location_handled');
        if (sessionHandled) {
            this.hasAskedThisSession = true;
            return true;
        }
        
        // Check if we have valid recent location data
        const stored = localStorage.getItem('alphawave_location');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const storedTime = new Date(data.timestamp);
                const now = new Date();
                const minutesDiff = (now - storedTime) / (1000 * 60);
                
                // If location data is less than 30 minutes old, consider it valid for this session
                if (minutesDiff < 30) {
                    this.hasAskedThisSession = true;
                    return true;
                }
            } catch (error) {
                console.warn('Error parsing stored location data:', error);
            }
        }
        
        return false;
    }

    // Mark that we've asked for location this session
    markAskedThisSession() {
        this.hasAskedThisSession = true;
        sessionStorage.setItem('alphawave_location_handled', 'true');
    }

    // Check if geolocation is supported
    isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    // Check current permission status
    async checkPermissionStatus() {
        try {
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                this.locationPermissionStatus = permission.state;
                
                // Listen for permission changes
                permission.addEventListener('change', () => {
                    this.locationPermissionStatus = permission.state;
                    console.log('Geolocation permission changed to:', permission.state);
                    
                    if (permission.state === 'granted' && !this.userLocation) {
                        this.getCurrentLocation();
                    } else if (permission.state === 'denied') {
                        this.setDefaultLocation();
                    }
                });
            }
        } catch (error) {
            console.warn('Could not check permission status:', error);
        }
    }

    // Get current position
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000 // 5 minutes cache
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleLocationSuccess(position);
                    resolve(position);
                },
                (error) => {
                    this.handleLocationError(error);
                    reject(error);
                },
                options
            );
        });
    }

    // Handle successful location retrieval
    async handleLocationSuccess(position) {
        try {
            const { latitude, longitude, accuracy } = position.coords;
            
            this.userLocation = {
                lat: latitude,
                lng: longitude,
                accuracy: accuracy,
                timestamp: new Date().toISOString()
            };

            console.log('User location obtained:', this.userLocation);

            // Get location details (country, timezone, etc.)
            await this.getLocationDetails(latitude, longitude);
            
            // Update UI with location-based content
            this.updateLocationBasedContent();
            
            // Store location in localStorage for future use
            this.saveLocationToStorage();
            
            // Mark as handled this session
            this.markAskedThisSession();

        } catch (error) {
            console.error('Error processing location:', error);
            this.setDefaultLocation();
        }
    }

    // Handle location errors
    handleLocationError(error) {
        let message = '';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied by user';
                console.warn('Location access denied');
                // Mark as asked so we don't ask again this session
                this.markAskedThisSession();
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable';
                console.warn('Location unavailable');
                break;
            case error.TIMEOUT:
                message = 'Location request timed out';
                console.warn('Location timeout');
                break;
            default:
                message = 'Unknown location error';
                console.error('Unknown location error:', error);
                break;
        }
        
        this.setDefaultLocation();
    }

    // Get detailed location information using reverse geocoding
    async getLocationDetails(lat, lng) {
        try {
            // Using a free geocoding service
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const data = await response.json();
            
            // Extract relevant information
            const locationInfo = {
                country: data.countryCode || 'US',
                countryName: data.countryName || 'United States',
                city: data.city || data.locality || 'Unknown',
                region: data.principalSubdivision || '',
                timezone: this.getTimezoneFromCountry(data.countryCode)
            };

            // Determine market region
            this.marketRegion = this.determineMarketRegion(locationInfo.country);
            
            // Store additional location info
            Object.assign(this.userLocation, locationInfo);
            
            console.log('Location details:', locationInfo);
            
        } catch (error) {
            console.warn('Could not get location details:', error);
            // Use default based on basic location
            this.marketRegion = this.marketRegions.DEFAULT;
        }
    }

    // Determine market region based on country
    determineMarketRegion(countryCode) {
        const usCountries = ['US', 'CA'];
        const euCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'];
        const asiaCountries = ['JP', 'CN', 'KR', 'IN', 'SG', 'HK', 'TW', 'AU', 'NZ'];
        
        if (usCountries.includes(countryCode)) {
            return this.marketRegions.US;
        } else if (euCountries.includes(countryCode)) {
            return this.marketRegions.EU;
        } else if (asiaCountries.includes(countryCode)) {
            return this.marketRegions.ASIA;
        } else {
            return this.marketRegions.DEFAULT;
        }
    }

    // Get timezone from country code
    getTimezoneFromCountry(countryCode) {
        const timezones = {
            'US': 'America/New_York',
            'CA': 'America/Toronto',
            'GB': 'Europe/London',
            'DE': 'Europe/Berlin',
            'FR': 'Europe/Paris',
            'JP': 'Asia/Tokyo',
            'CN': 'Asia/Shanghai',
            'AU': 'Australia/Sydney',
            'IN': 'Asia/Kolkata'
        };
        
        return timezones[countryCode] || 'UTC';
    }

    // Set default location when geolocation fails
    setDefaultLocation() {
        this.userLocation = {
            lat: 40.7128, // New York coordinates as default
            lng: -74.0060,
            country: 'US',
            countryName: 'United States',
            city: 'New York',
            timezone: 'America/New_York',
            isDefault: true,
            timestamp: new Date().toISOString()
        };
        
        this.marketRegion = this.marketRegions.US;
        console.log('Using default location:', this.userLocation);
        
        // Save default location
        this.saveLocationToStorage();
        
        // Update UI
        this.updateLocationBasedContent();
    }

    // Update UI content based on location
    updateLocationBasedContent() {
        try {
            // Update currency displays
            this.updateCurrencyDisplays();
            
            // Update market hours
            this.updateMarketHours();
            
            // Trigger custom event for UI updates
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('locationUpdated', {
                    detail: {
                        location: this.userLocation,
                        marketRegion: this.marketRegion
                    }
                }));
            }
            
        } catch (error) {
            console.error('Error updating location-based content:', error);
        }
    }

    // Update currency displays based on location
    updateCurrencyDisplays() {
        const currency = this.marketRegion?.currency || 'USD';
        const currencyElements = document.querySelectorAll('[data-currency]');
        
        currencyElements.forEach(element => {
            const value = parseFloat(element.textContent.replace(/[^0-9.-]/g, ''));
            if (!isNaN(value)) {
                element.textContent = this.formatCurrency(value, currency);
            }
        });
    }

    // Format currency based on locale
    formatCurrency(amount, currency = 'USD') {
        try {
            const locale = this.getLocaleFromCountry(this.userLocation?.country || 'US');
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            return `$${amount.toFixed(2)}`;
        }
    }

    // Get locale from country code
    getLocaleFromCountry(countryCode) {
        const locales = {
            'US': 'en-US',
            'GB': 'en-GB',
            'DE': 'de-DE',
            'FR': 'fr-FR',
            'JP': 'ja-JP',
            'CN': 'zh-CN'
        };
        
        return locales[countryCode] || 'en-US';
    }

    // Update market hours display
    updateMarketHours() {
        const timezone = this.userLocation?.timezone || 'America/New_York';
        const marketStatus = this.getMarketStatus(timezone);
        
        // Update market status in UI
        const statusElements = document.querySelectorAll('.market-status');
        statusElements.forEach(element => {
            element.textContent = marketStatus.isOpen ? 'Market Open' : 'Market Closed';
            element.className = `market-status ${marketStatus.isOpen ? 'open' : 'closed'}`;
        });
    }

    // Get market status based on timezone
    getMarketStatus(timezone) {
        try {
            const now = new Date();
            const marketTime = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }).formatToParts(now);
            
            const hour = parseInt(marketTime.find(part => part.type === 'hour').value);
            const minute = parseInt(marketTime.find(part => part.type === 'minute').value);
            const currentTime = hour * 60 + minute;
            
            // NYSE hours: 9:30 AM - 4:00 PM EST (570 - 960 minutes)
            const marketOpen = 9 * 60 + 30; // 9:30 AM
            const marketClose = 16 * 60; // 4:00 PM
            
            const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
            const isOpen = isWeekday && currentTime >= marketOpen && currentTime < marketClose;
            
            return {
                isOpen: isOpen,
                currentTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                timezone: timezone
            };
        } catch (error) {
            console.error('Error getting market status:', error);
            return { isOpen: false, currentTime: '', timezone: 'UTC' };
        }
    }

    // Save location to localStorage
    saveLocationToStorage() {
        try {
            const locationData = {
                location: this.userLocation,
                marketRegion: this.marketRegion,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('alphawave_location', JSON.stringify(locationData));
        } catch (error) {
            console.warn('Could not save location to storage:', error);
        }
    }

    // Load location from localStorage
    loadLocationFromStorage() {
        try {
            const stored = localStorage.getItem('alphawave_location');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Check if data is not too old (2 hours)
                const storedTime = new Date(data.timestamp);
                const now = new Date();
                const hoursDiff = (now - storedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 2) {
                    this.userLocation = data.location;
                    this.marketRegion = data.marketRegion;
                    this.updateLocationBasedContent();
                    console.log('Loaded location from storage:', this.userLocation);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Could not load location from storage:', error);
        }
        
        return false;
    }

    // Get current location info
    getLocationInfo() {
        return {
            location: this.userLocation,
            marketRegion: this.marketRegion,
            permissionStatus: this.locationPermissionStatus,
            hasAskedThisSession: this.hasAskedThisSession
        };
    }

    // Request location permission (manual trigger)
    async requestLocationPermission() {
        if (this.hasAskedThisSession) {
            console.log('Location already requested this session');
            return false;
        }
        
        try {
            await this.getCurrentLocation();
            this.markAskedThisSession();
            return true;
        } catch (error) {
            this.handleLocationError(error);
            return false;
        }
    }

    // Reset session state (for testing)
    resetSession() {
        sessionStorage.removeItem('alphawave_location_handled');
        this.hasAskedThisSession = false;
        console.log('Location session reset');
    }
}

// Initialize location service
const locationService = new LocationService();

// Export for global use
window.locationService = locationService;

// Integration with existing AlphaWave functions
document.addEventListener('DOMContentLoaded', function() {
    // The location service will handle initialization automatically
    console.log('Location service initialized');
    
    // Listen for location updates
    window.addEventListener('locationUpdated', function(event) {
        const { location, marketRegion } = event.detail;
        console.log('Location updated:', location.city, location.countryName);
        
        // Update any UI elements that depend on location
        if (typeof updateLocationDisplay === 'function') {
            updateLocationDisplay();
        }
    });
});

// Clean up session storage when page unloads (optional)
window.addEventListener('beforeunload', function() {
    // Keep the session flag so location isn't requested again in this session
    // Only clear it if you want to allow re-requesting on page reload
});

// Add CSS for location-based UI elements (if not already present)
if (!document.querySelector('#location-styles')) {
    const locationStyles = `
        .market-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .market-status.open {
            background: #4CAF50;
            color: white;
        }
        
        .market-status.closed {
            background: #f44336;
            color: white;
        }
        
        .location-info {
            font-size: 12px;
            color: #666;
            margin-left: 10px;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'location-styles';
    styleSheet.textContent = locationStyles;
    document.head.appendChild(styleSheet);
}