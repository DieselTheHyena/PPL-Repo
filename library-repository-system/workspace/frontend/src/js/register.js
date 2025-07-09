const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Clear previous errors
    ClientValidation.clearFieldErrors('registerForm');
    
    // Get and sanitize form values
    const username = ClientValidation.sanitizeInput(document.getElementById('username').value);
    const password = document.getElementById('password').value; // Don't sanitize password
    const confirmPassword = document.getElementById('confirmPassword').value;
    const surname = ClientValidation.sanitizeInput(document.getElementById('surname').value);
    const firstname = ClientValidation.sanitizeInput(document.getElementById('firstname').value);
    const middleInitial = ClientValidation.sanitizeInput(document.getElementById('middleInitial').value) || null;
    
    console.log('Form values:', { username, surname, firstname, middleInitial }); // Debug log
    
    // Define validation rules with proper error handling
    const validationRules = {
        username: [
            { 
                validator: (val) => {
                    const result = ClientValidation.validateUsername(val);
                    console.log('Username validation:', val, result); // Debug log
                    return result;
                }
            }
        ],
        password: [
            { 
                validator: (val) => {
                    const result = ClientValidation.validatePassword(val);
                    console.log('Password validation:', result); // Debug log
                    // Convert the password validation result to the expected format
                    if (result.isValid) {
                        return { isValid: true, message: '' };
                    } else {
                        return { isValid: false, message: result.errors.join(', ') };
                    }
                }
            }
        ],
        surname: [
            { 
                validator: (val) => {
                    const result = ClientValidation.validateName(val, 'Surname');
                    console.log('Surname validation:', val, result); // Debug log
                    return result;
                }
            }
        ],
        firstname: [
            { 
                validator: (val) => {
                    const result = ClientValidation.validateName(val, 'First name');
                    console.log('Firstname validation:', val, result); // Debug log
                    return result;
                }
            }
        ]
    };
    
    // Validate form
    const isFormValid = ClientValidation.validateForm('registerForm', validationRules);
    console.log('Form validation result:', isFormValid); // Debug log
    
    // Additional password confirmation check
    if (password !== confirmPassword) {
        ClientValidation.showFieldError('confirmPassword', 'Passwords do not match');
        showRegisterMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!isFormValid) {
        showRegisterMessage('Please fix the errors above', 'error');
        return;
    }
    
    showLoader(true);
    
    try {
        const displayName = surname + (firstname ? ', ' + firstname : '') + (middleInitial ? ' ' + middleInitial + '.' : '');
        
        console.log('Sending registration data:', {
            username,
            displayName,
            surname,
            firstname,
            middleInitial
        }); // Debug log
        
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                username,
                password,
                displayName,
                surname,
                firstname,
                middleInitial
            })
        });
        
        if (response.ok) {
            showRegisterMessage('Registration successful! Please log in.', 'success');
            showToast('Registration successful! Please log in.', 'success');
            setTimeout(() => { 
                window.location.href = 'login.html'; 
            }, 2000);
        } else {
            const errorData = await response.json();
            console.error('Server validation errors:', errorData); // Debug log
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
                errorData.errors.forEach(err => {
                    ClientValidation.showFieldError(err.field, err.message);
                });
                showRegisterMessage('Please fix the server validation errors', 'error');
            } else {
                showRegisterMessage(errorData.message || 'Registration failed', 'error');
            }
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showRegisterMessage('Registration failed. Please try again.', 'error');
        showToast('Registration failed. Please try again.', 'error');
    } finally {
        showLoader(false);
    }
});

registerForm.addEventListener('reset', () => {
    document.getElementById('displayNamePreview').textContent = '';
    document.querySelectorAll('.valid, .invalid').forEach(el => {
        el.classList.remove('valid', 'invalid');
    });
    document.getElementById('passwordStrength').textContent = '';
    document.getElementById('passwordStrength').className = 'password-strength';
    ClientValidation.clearFieldErrors('registerForm');
});

document.getElementById('showPassword').addEventListener('change', function() {
    const pw = document.getElementById('password');
    const cpw = document.getElementById('confirmPassword');
    const type = this.checked ? 'text' : 'password';
    if (pw) pw.type = type;
    if (cpw) cpw.type = type;
});

function showRegisterMessage(msg, type = 'error') {
    const msgDiv = document.getElementById('registerMessage');
    msgDiv.textContent = msg;
    msgDiv.className = type;
    setTimeout(() => { 
        msgDiv.textContent = ''; 
        msgDiv.className = ''; 
    }, 4000);
}

function updateDisplayNamePreview() {
    const surname = document.getElementById('surname').value.trim();
    const firstname = document.getElementById('firstname').value.trim();
    const middleInitial = document.getElementById('middleInitial').value.trim();
    let displayName = surname;
    if (firstname) displayName += ', ' + firstname;
    if (middleInitial) displayName += ' ' + middleInitial + '.';
    document.getElementById('displayNamePreview').textContent = displayName ? `Display Name: ${displayName}` : '';
}

['surname', 'firstname', 'middleInitial'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateDisplayNamePreview);
});

document.getElementById('password').addEventListener('input', function() {
    const strengthDiv = document.getElementById('passwordStrength');
    const val = this.value;
    let strength = 0;

    // Simple strength logic: length, numbers, special chars, upper/lower
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    if (!val) {
        strengthDiv.textContent = '';
        strengthDiv.className = 'password-strength';
    } else if (strength <= 1) {
        strengthDiv.textContent = 'Weak';
        strengthDiv.className = 'password-strength weak';
    } else if (strength === 2 || strength === 3) {
        strengthDiv.textContent = 'Medium';
        strengthDiv.className = 'password-strength medium';
    } else {
        strengthDiv.textContent = 'Strong';
        strengthDiv.className = 'password-strength strong';
    }
});