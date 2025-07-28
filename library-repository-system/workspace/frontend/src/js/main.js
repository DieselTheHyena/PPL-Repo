document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const addBookButton = document.getElementById('add-book-button');
    const user = JSON.parse(sessionStorage.getItem('user')); // Changed from localStorage
    const addBookNav = document.getElementById('addBookNav');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = './pages/login.html';
        });
    }

    if (addBookButton) {
        addBookButton.addEventListener('click', () => {
            window.location.href = './pages/addBook.html';
        });
    }

    if (addBookNav && (!user || !(user.is_admin === true || user.is_admin === 1))) {
        addBookNav.style.display = 'none';
    }
});