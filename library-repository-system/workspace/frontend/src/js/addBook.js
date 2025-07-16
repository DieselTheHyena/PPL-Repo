import { UserUtils } from './userUtils.js';
import { MenuUtils } from './menuUtils.js';

const addBookForm = document.getElementById('addBookForm');
const user = UserUtils.getCurrentUser();

// Hide form and show error for non-admins
if (!UserUtils.isAdmin(user)) {
    if (addBookForm) {
        addBookForm.style.display = 'none';
    }
    showMessage('Only administrators can add books.', 'red');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing Add Book page...');
    
    // === USER INFO SETUP ===
    UserUtils.setupUserDisplay(user);
    
    // === MENU SETUP ===
    MenuUtils.setupHamburgerMenu();
    MenuUtils.setupUserMenu();
    
    // === ADMIN VISIBILITY ===
    const addBookNav = document.getElementById('addBookNav');
    if (addBookNav && !UserUtils.isAdmin(user)) {
        addBookNav.style.display = 'none';
    }
    
    console.log('Add Book page initialization complete');
});

// Form submission handler
if (addBookForm) {
    addBookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Clear previous errors
        ClientValidation.clearFieldErrors('addBookForm');
        
        const formData = new FormData(addBookForm);
        
        // Define validation rules
        const validationRules = {
            author: [
                { validator: (val) => ClientValidation.validateName(val, 'Author') }
            ],
            title: [
                { validator: (val) => ClientValidation.validateName(val, 'Title') }
            ],
            publication: [
                { validator: (val) => val.trim() ? { isValid: true } : { isValid: false, message: 'Publication is required' } }
            ],
            copyrightYear: [
                { validator: (val) => ClientValidation.validateYear(val) }
            ],
            isbn: [
                { validator: (val) => ClientValidation.validateISBN(val) }
            ],
            subject: [
                { validator: (val) => val.trim() ? { isValid: true } : { isValid: false, message: 'Subject is required' } }
            ],
            callNumber: [
                { validator: (val) => val.trim() ? { isValid: true } : { isValid: false, message: 'Call number is required' } }
            ],
            accessionNumber: [
                { validator: (val) => val.trim() ? { isValid: true } : { isValid: false, message: 'Accession number is required' } }
            ],
            location: [
                { validator: (val) => val.trim() ? { isValid: true } : { isValid: false, message: 'Location is required' } }
            ]
        };
        
        // Validate form
        const isValid = ClientValidation.validateForm('addBookForm', validationRules);
        if (!isValid) {
            showMessage('Please fix the validation errors before submitting.', 'red');
            return;
        }
        
        // Sanitize data
        const bookData = {
            author: ClientValidation.sanitizeInput(formData.get('author')),
            title: ClientValidation.sanitizeInput(formData.get('title')),
            publication: ClientValidation.sanitizeInput(formData.get('publication')),
            copyright_year: Number(formData.get('copyrightYear')),
            physical_description: ClientValidation.sanitizeInput(formData.get('physicalDescription')),
            series: ClientValidation.sanitizeInput(formData.get('series')),
            isbn: ClientValidation.sanitizeInput(formData.get('isbn')),
            subject: ClientValidation.sanitizeInput(formData.get('subject')),
            call_number: ClientValidation.sanitizeInput(formData.get('callNumber')),
            accession_number: ClientValidation.sanitizeInput(formData.get('accessionNumber')),
            location: ClientValidation.sanitizeInput(formData.get('location')),
            allowDuplicateIsbn: addBookForm.allowDuplicateIsbn.checked
        };

        const submitBtn = addBookForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        showLoader(true);
        
        try {
            const response = await fetch(ApiConfig.getApiUrl('/books'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(user.id),
                    'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
                },
                body: JSON.stringify(bookData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Book added successfully!', 'success');
                showMessage('Book added successfully!', 'green');
                addBookForm.reset();
            } else {
                showToast(result.message || 'Failed to add book', 'error');
                showMessage(result.message || 'Failed to add book', 'red');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An unexpected error occurred. Please try again later.', 'error');
            showMessage('Network error. Please check your connection and try again.', 'red');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            showLoader(false);
        }
    });
}

// Helper function to show messages
function showMessage(msg, color = 'green') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
        messageDiv.style.display = 'block';
        // Add consistent timeout like in books.js
        setTimeout(() => { 
            messageDiv.textContent = ''; 
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Make showToast available if toast.js is loaded
function showToast(message, type = 'success') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`Toast: ${message} (${type})`);
    }
}

// Real-time clock function
function updateClock() {
    const now = new Date();
    const timeDisplay = document.getElementById('current-time-display');
    const dateDisplay = document.getElementById('current-date-display');
    
    if (timeDisplay && dateDisplay) {
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        timeDisplay.textContent = timeString;
        dateDisplay.textContent = dateString;
    }
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock(); // Initial call