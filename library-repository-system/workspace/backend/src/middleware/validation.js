import Joi from 'joi';
import validator from 'validator';

// Improved sanitize input function that decodes HTML entities first
export const sanitizeInput = (req, res, next) => {
    const decodeAndSanitize = (str) => {
        if (typeof str !== 'string') return str;
        
        // First decode HTML entities that might have been encoded by the frontend
        let decoded = str;
        try {
            // Use decodeURIComponent to handle any URL encoding
            decoded = decodeURIComponent(str);
        } catch (e) {
            // If decoding fails, use original string
            decoded = str;
        }
        
        // Decode common HTML entities
        decoded = decoded
            .replace(/&amp;#x2F;/g, '/')
            .replace(/&#x2F;/g, '/')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        
        // Now escape only truly dangerous characters for XSS prevention
        // But don't escape forward slashes or other normal characters
        return decoded
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    };

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = decodeAndSanitize(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    req.body = sanitizeObject(req.body);
    next();
};

// User registration validation schema
const userRegistrationSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'Username must only contain letters and numbers',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username must not exceed 30 characters',
            'any.required': 'Username is required'
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required'
        }),
    firstname: Joi.string()
        .min(1)
        .max(50)
        .pattern(new RegExp('^[a-zA-Z\\s]+$'))
        .required()
        .messages({
            'string.pattern.base': 'First name must only contain letters and spaces',
            'any.required': 'First name is required'
        }),
    surname: Joi.string()
        .min(1)
        .max(50)
        .pattern(new RegExp('^[a-zA-Z\\s]+$'))
        .required()
        .messages({
            'string.pattern.base': 'Surname must only contain letters and spaces',
            'any.required': 'Surname is required'
        }),
    middleInitial: Joi.string()
        .max(1)
        .pattern(new RegExp('^[a-zA-Z]$'))
        .allow('')
        .allow(null)
        .optional()
        .messages({
            'string.pattern.base': 'Middle initial must be a single letter'
        }),
    displayName: Joi.string()
        .min(1)
        .max(100)
        .required()
});

// Book validation schema
const bookSchema = Joi.object({
    author: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            'string.min': 'Author must be at least 2 characters long',
            'any.required': 'Author is required'
        }),
    title: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            'string.min': 'Title must be at least 2 characters long',
            'any.required': 'Title is required'
        }),
    publication: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            'any.required': 'Publication is required'
        }),
    copyright_year: Joi.number()
        .integer()
        .min(1000)
        .max(new Date().getFullYear() + 5)
        .required()
        .messages({
            'number.min': 'Copyright year must be after 1000',
            'number.max': `Copyright year cannot be more than 5 years in the future`,
            'any.required': 'Copyright year is required'
        }),
    physical_description: Joi.string()
        .min(1)
        .max(500)
        .required()
        .messages({
            'any.required': 'Physical description is required'
        }),
    series: Joi.string()
        .max(255)
        .allow('')
        .allow(null)
        .optional(),
    isbn: Joi.string()
        .pattern(new RegExp('^(?=(?:\\D*\\d){10}(?:(?:\\D*\\d){3})?$)[\\d-]+$'))
        .required()
        .messages({
            'string.pattern.base': 'ISBN must be a valid 10 or 13 digit number',
            'any.required': 'ISBN is required'
        }),
    subject: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
            'any.required': 'Subject is required'
        }),
    call_number: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'any.required': 'Call number is required'
        }),
    accession_number: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'any.required': 'Accession number is required'
        }),
    location: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'any.required': 'Location is required'
        }),
    allowDuplicateIsbn: Joi.boolean()
        .default(false)
        .optional()
});

// Validation middleware functions
export const validateUserRegistration = (req, res, next) => {
    const { error } = userRegistrationSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
        }));
        
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors
        });
    }
    
    next();
};

export const validateBookInput = (req, res, next) => {
    const { error } = bookSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
        }));
        
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors
        });
    }
    
    next();
};

export const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().required().messages({
            'any.required': 'Username is required'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required'
        })
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }
    
    next();
};

class ClientValidation {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePassword(password) {
        const errors = [];
        
        if (!password || password.length < 8) {
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
        if (!isbn || isbn.trim().length === 0) {
            return {
                isValid: false,
                message: 'ISBN is required'
            };
        }
        
        // Remove any spaces or hyphens
        const cleanIsbn = isbn.replace(/[\s-]/g, '');
        
        // Check if it's 10 or 13 digits
        if (!/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
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
        const yearNum = parseInt(year);
        
        if (!year || isNaN(yearNum)) {
            return {
                isValid: false,
                message: 'Year is required and must be a number'
            };
        }
        
        if (yearNum < 1000 || yearNum > currentYear + 1) {
            return {
                isValid: false,
                message: `Year must be between 1000 and ${currentYear + 1}`
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
        
        if (!/^[a-zA-Z\s\-\.]+$/.test(name)) {
            return {
                isValid: false,
                message: `${fieldName} must only contain letters, spaces, hyphens, and periods`
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

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientValidation;
}