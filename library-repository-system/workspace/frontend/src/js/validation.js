class ClientValidation {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    static validateISBN(isbn) {
        // Remove any non-digit characters
        const cleanISBN = isbn.replace(/\D/g, '');
        
        // Check if it's 10 or 13 digits
        if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
            return {
                isValid: false,
                message: 'ISBN must be 10 or 13 digits'
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    }
    
    static validateYear(year) {
        const currentYear = new Date().getFullYear();
        const numYear = parseInt(year);
        
        if (isNaN(numYear)) {
            return {
                isValid: false,
                message: 'Year must be a number'
            };
        }
        
        if (numYear < 1000 || numYear > currentYear + 5) {
            return {
                isValid: false,
                message: `Year must be between 1000 and ${currentYear + 5}`
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    }
    
    static validateName(name, fieldName) {
        if (!name || name.trim().length === 0) {
            return {
                isValid: false,
                message: `${fieldName} is required`
            };
        }
        
        if (name.trim().length < 2) {
            return {
                isValid: false,
                message: `${fieldName} must be at least 2 characters long`
            };
        }
        
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            return {
                isValid: false,
                message: `${fieldName} must only contain letters and spaces`
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    }
    
    static validateUsername(username) {
        if (!username || username.trim().length === 0) {
            return {
                isValid: false,
                message: 'Username is required'
            };
        }
        
        if (username.length < 3) {
            return {
                isValid: false,
                message: 'Username must be at least 3 characters long'
            };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return {
                isValid: false,
                message: 'Username must only contain letters, numbers, and underscores'
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    }
    
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove HTML tags and dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim(); // Remove leading/trailing whitespace
    }
    
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error if message provided
        if (message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.color = '#f44336';
            errorDiv.style.fontSize = '0.85em';
            errorDiv.style.marginTop = '0.3em';
            errorDiv.setAttribute('role', 'alert');
            
            field.parentNode.appendChild(errorDiv);
            field.style.borderColor = '#f44336';
            field.setAttribute('aria-invalid', 'true');
        } else {
            field.style.borderColor = '';
            field.removeAttribute('aria-invalid');
        }
    }
    
    static clearFieldErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Remove all error messages
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        
        // Reset field border colors and aria attributes
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.style.borderColor = '';
            input.removeAttribute('aria-invalid');
        });
    }
    
    static validateForm(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        this.clearFieldErrors(formId);
        let isValid = true;
        
        for (const [fieldId, rules] of Object.entries(validationRules)) {
            const field = document.getElementById(fieldId);
            if (!field) continue;
            
            const value = this.sanitizeInput(field.value);
            
            for (const rule of rules) {
                const result = rule.validator(value);
                if (!result.isValid) {
                    this.showFieldError(fieldId, result.message);
                    isValid = false;
                    break; // Stop at first error for this field
                }
            }
        }
        
        return isValid;
    }
}

// Make it globally available
window.ClientValidation = ClientValidation;