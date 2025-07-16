const loginForm = document.getElementById('loginForm');
const guestLoginBtn = document.getElementById('guestLoginBtn');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        showLoader(true);

        const response = await fetch(ApiConfig.getApiUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        showLoader(false); // Hide loader animation

        if (response.ok) {
            const data = await response.json(); // Get user data from backend
            
            // UPDATE THIS DEBUG CODE TO SEE RAW BACKEND DATA:
            console.log('=== RAW BACKEND RESPONSE ===');
            console.log('Full response data:', data);
            console.log('data.user:', data.user);
            console.log('data.user.display_name:', data.user.display_name);
            console.log('data.user.firstname:', data.user.firstname);        // Changed from first_name
            console.log('data.user.surname:', data.user.surname);            // Changed from last_name  
            console.log('data.user.middle_initial:', data.user.middle_initial);
            console.log('data.user.username:', data.user.username);
            console.log('=== END RAW BACKEND ===');
            
            // Ensure all user fields are preserved, including display_name
            const userToStore = {
                id: data.user.id,
                username: data.user.username,
                // Use correct database field names
                firstname: data.user.firstname,
                surname: data.user.surname,
                middle_initial: data.user.middle_initial,
                // Create display_name from correct database fields
                display_name: data.user.display_name || 
                             (data.user.surname && data.user.firstname 
                                 ? `${data.user.surname}, ${data.user.firstname}` // "Zeldrym, Krueger"
                                 : data.user.firstname || data.user.username),
                is_admin: data.user.is_admin,
                
                // Also keep the old field names for backward compatibility
                first_name: data.user.firstname,
                last_name: data.user.surname,
            };
            
            console.log('Storing user object:', userToStore);
            localStorage.setItem('user', JSON.stringify(userToStore)); // Store complete user info
            localStorage.setItem('loginSuccess', '1');
            window.location.href = 'landing.html';
        } else {
            const error = await response.json();
            showToast('Login failed: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An unexpected error occurred. Please try again later.', 'error');
        showLoader(false); // Make sure to hide loader on error
    }
});

// Guest login functionality
guestLoginBtn.addEventListener('click', () => {
    // Create guest user object with proper field names
    const guestUser = {
        id: 'guest',
        username: 'guest',
        first_name: 'Guest',
        last_name: 'User',
        display_name: 'Guest User', // Use display_name instead of displayName
        email: 'guest@library.local',
        is_admin: false, // Use is_admin instead of role
        isGuest: true
    };
    
    console.log('Storing guest user:', guestUser);
    // Store guest user info
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('loginSuccess', '1');
    
    // Show success message
    showToast('Logged in as Guest', 'success');
    
    // Redirect to landing page
    setTimeout(() => {
        window.location.href = 'landing.html';
    }, 1000);
});