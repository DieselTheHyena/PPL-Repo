class ApiConfig {
    static getApiUrl(endpoint = '') {
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
            return `http://localhost:5000/api${endpoint}`;
        } else {
            const currentHost = window.location.hostname;
            return `http://${currentHost}:5000/api${endpoint}`;
        }
    }
    
    static getBaseUrl() {
        return this.getApiUrl();
    }
}

window.ApiConfig = ApiConfig;