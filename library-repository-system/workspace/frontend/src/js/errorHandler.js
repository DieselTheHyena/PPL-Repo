class ErrorHandler {
    static handleFetchError(error, context = 'API call') {
        console.error(`Error in ${context}:`, error);
        
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            this.showError('Network error. Please check your internet connection.');
            return;
        }
        
        // HTTP status errors
        if (error.message.includes('401')) {
            this.showError('Session expired. Please login again.');
            setTimeout(() => {
                this.redirectToLogin();
            }, 2000);
            return;
        }
        
        if (error.message.includes('403')) {
            this.showError('Access denied. You do not have permission for this action.');
            return;
        }
        
        if (error.message.includes('404')) {
            this.showError('Resource not found.');
            return;
        }
        
        if (error.message.includes('409')) {
            this.showError('Conflict: This item already exists.');
            return;
        }
        
        if (error.message.includes('429')) {
            this.showError('Too many requests. Please wait a moment and try again.');
            return;
        }
        
        if (error.message.includes('500')) {
            this.showError('Server error. Please try again later.');
            return;
        }
        
        // Default error
        this.showError(`Error: ${error.message}`);
    }
    
    static showError(message) {
        // Try to use toast if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else if (typeof alert !== 'undefined') {
            alert(message);
        } else {
            console.error(message);
        }
    }
    
    static showSuccess(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            console.log(message);
        }
    }
    
    static async fetchWithErrorHandling(url, options = {}, context = 'API call') {
        try {
            // Add timeout to requests
            const timeoutId = setTimeout(() => {
                throw new Error('Request timeout');
            }, 30000); // 30 second timeout
            
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `HTTP ${response.status}`;
                } catch {
                    errorMessage = `HTTP ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            return response;
        } catch (error) {
            this.handleFetchError(error, context);
            throw error;
        }
    }
    
    static redirectToLogin() {
        localStorage.clear();
        window.location.href = 'login.html';
    }
    
    static validateUserSession() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }
    
    static logError(error, context = 'Unknown') {
        console.error(`[${new Date().toISOString()}] Error in ${context}:`, {
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }
}

// Make it globally available
window.ErrorHandler = ErrorHandler;

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
    ErrorHandler.logError(event.error, 'Global error handler');
    ErrorHandler.showError('An unexpected error occurred. Please refresh the page.');
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.logError(event.reason, 'Unhandled promise rejection');
    ErrorHandler.showError('An unexpected error occurred. Please try again.');
});