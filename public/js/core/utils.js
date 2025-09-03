// Shared Utilities for GymTracker
// Common functions used across the application

class Utils {
    // ===== NOTIFICATION SYSTEM =====
    
    // Show success message
    static showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }
    
    // Show error message
    static showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    // Show info message
    static showInfo(message, duration = 4000) {
        this.showNotification(message, 'info', duration);
    }
    
    // Show warning message
    static showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }
    
    // Generic notification system
    static showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications of same type
        const existingNotifications = document.querySelectorAll(`.notification.${type}`);
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not already present
        this.addNotificationStyles();
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
    }
    
    // Get icon for notification type
    static getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
    // Add notification styles to page
    static addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: none;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
                pointer-events: auto;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background: white;
                border-left: 4px solid;
            }
            
            .notification.success .notification-content {
                border-left-color: #10b981;
                background: #f0fdf4;
            }
            
            .notification.error .notification-content {
                border-left-color: #ef4444;
                background: #fef2f2;
            }
            
            .notification.warning .notification-content {
                border-left-color: #f59e0b;
                background: #fffbeb;
            }
            
            .notification.info .notification-content {
                border-left-color: #3b82f6;
                background: #eff6ff;
            }
            
            .notification-icon {
                font-size: 1.2rem;
                margin-right: 0.75rem;
            }
            
            .notification-message {
                flex: 1;
                font-weight: 500;
                color: #374151;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
                margin-left: 0.75rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-close:hover {
                color: #374151;
            }
            
            @media (max-width: 640px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // ===== LOADING STATES =====
    
    // Show loading spinner
    static showLoading(target = document.body, message = 'Caricamento...') {
        this.hideLoading(target); // Remove existing loader
        
        const loader = document.createElement('div');
        loader.className = 'utils-loading';
        loader.innerHTML = `
            <div class="utils-loading-content">
                <div class="utils-spinner"></div>
                <span class="utils-loading-text">${message}</span>
            </div>
        `;
        
        this.addLoadingStyles();
        
        if (target === document.body) {
            target.appendChild(loader);
        } else {
            target.style.position = 'relative';
            target.appendChild(loader);
        }
    }
    
    // Hide loading spinner
    static hideLoading(target = document.body) {
        const loaders = target.querySelectorAll('.utils-loading');
        loaders.forEach(loader => loader.remove());
    }
    
    // Add loading styles
    static addLoadingStyles() {
        if (document.getElementById('loading-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            .utils-loading {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.9);
                z-index: 9999;
            }
            
            .utils-loading-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            
            .utils-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f4f6;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .utils-loading-text {
                color: #374151;
                font-weight: 500;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // ===== FORM VALIDATION =====
    
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate password strength
    static isValidPassword(password) {
        return password && password.length >= 6;
    }
    
    // Validate required fields
    static validateRequired(fields) {
        const errors = {};
        
        Object.keys(fields).forEach(fieldName => {
            const value = fields[fieldName];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors[fieldName] = 'Campo obbligatorio';
            }
        });
        
        return Object.keys(errors).length === 0 ? null : errors;
    }
    
    // Show field validation error
    static showFieldError(fieldElement, message) {
        this.clearFieldError(fieldElement);
        
        fieldElement.classList.add('error');
        
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
    }
    
    // Clear field validation error
    static clearFieldError(fieldElement) {
        fieldElement.classList.remove('error');
        
        const errorElement = fieldElement.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // ===== DOM UTILITIES =====
    
    // Safe query selector
    static $(selector, context = document) {
        return context.querySelector(selector);
    }
    
    // Safe query selector all
    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }
    
    // Create element with attributes and content
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else {
                element.appendChild(content);
            }
        }
        
        return element;
    }
    
    // ===== DATE & TIME UTILITIES =====
    
    // Format date for display
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        return date.toLocaleDateString('it-IT', formatOptions);
    }
    
    // Format date for input fields
    static formatDateForInput(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        return date.toISOString().split('T')[0];
    }
    
    // Get relative time (e.g., "2 ore fa")
    static getRelativeTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} giorn${diffDays === 1 ? 'o' : 'i'} fa`;
        } else if (diffHours > 0) {
            return `${diffHours} or${diffHours === 1 ? 'a' : 'e'} fa`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minut${diffMinutes === 1 ? 'o' : 'i'} fa`;
        } else {
            return 'Ora';
        }
    }
    
    // ===== STRING UTILITIES =====
    
    // Capitalize first letter
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Truncate text
    static truncate(str, maxLength = 100, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }
    
    // Slugify text (for URLs)
    static slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // ===== NUMBER UTILITIES =====
    
    // Format number with thousands separator
    static formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
    
    // ===== LOCAL STORAGE UTILITIES =====
    
    // Safe localStorage get
    static getLocal(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('localStorage get error:', error);
            return defaultValue;
        }
    }
    
    // Safe localStorage set
    static setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('localStorage set error:', error);
            return false;
        }
    }
    
    // Safe localStorage remove
    static removeLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('localStorage remove error:', error);
            return false;
        }
    }
    
    // ===== DEBOUNCE & THROTTLE =====
    
    // Debounce function calls
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    // Throttle function calls
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ===== MOBILE DETECTION =====
    
    // Check if device is mobile
    static isMobile() {
        return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Check if device is touch-enabled
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
}

// Make Utils globally available
window.Utils = Utils;