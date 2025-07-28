import { UserUtils } from './userUtils.js';
import { MenuUtils } from './menuUtils.js';

// Get user and redirect if not logged in
const user = UserUtils.getCurrentUser();
let allBooks = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing Books page...');
    
    // === ELEMENT REFERENCES ===
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const booksContainer = document.getElementById('booksContainer');
    
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
    
    // === SEARCH FUNCTIONALITY ===
    setupSearchFunctionality();
    
    // === EVENT LISTENERS ===
    setupEventListeners();
    
    // === LOAD BOOKS ===
    fetchBooks();
    
    console.log('Books page initialization complete');
});

function setupSearchFunctionality() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
        const performSearch = () => {
            const searchValue = searchInput.value.trim().toLowerCase();
            const filterMethod = document.getElementById('filterMethod')?.value || 'title';
            
            if (!searchValue) {
                renderBooks(allBooks);
                return;
            }
            
            const filtered = allBooks.filter(book => {
                if (!book) return false;
                
                switch (filterMethod) {
                    case 'subject':
                        return book.subject && book.subject.toLowerCase().includes(searchValue);
                    case 'author':
                        return book.author && book.author.toLowerCase().includes(searchValue);
                    case 'title':
                        return book.title && book.title.toLowerCase().includes(searchValue);
                    default:
                        return book.title && book.title.toLowerCase().includes(searchValue);
                }
            });
            
            renderBooks(filtered);
        };
        
        searchBtn.addEventListener('click', performSearch);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function setupEventListeners() {
    const booksContainer = document.getElementById('booksContainer');
    if (!booksContainer) return;
    
    // Single event listener for all book interactions
    booksContainer.addEventListener('click', async (e) => {
        const currentUser = JSON.parse(sessionStorage.getItem('user')); // Changed from localStorage
        const isAdmin = UserUtils.isAdmin(currentUser);
        const isMember = currentUser && !currentUser.isGuest;
        
        // Book menu toggle
        if (e.target.classList.contains('book-menu-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isAdmin) {
                showMessage('Only administrators can access book options.', 'red');
                return;
            }
            
            toggleBookMenu(e.target);
            return;
        }
        
        // Borrow button
        if (e.target.classList.contains('borrow-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isMember) {
                showMessage('Only registered members can borrow books. Please log in with a member account.', 'red');
                return;
            }
            
            const bookId = e.target.getAttribute('data-id');
            if (bookId) {
                await handleBorrowBook(bookId);
            }
            return;
        }
        
        // Delete button
        if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isAdmin) {
                showMessage('Only administrators can delete books.', 'red');
                return;
            }
            
            const bookId = e.target.getAttribute('data-id');
            if (bookId && confirm('Are you sure you want to delete this book?')) {
                closeAllMenus();
                await handleDeleteBook(bookId);
            }
            return;
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isAdmin) {
                showMessage('Only administrators can edit books.', 'red');
                return;
            }
            
            const bookId = e.target.getAttribute('data-id');
            const bookDiv = e.target.closest('.book-item');
            
            if (bookDiv && bookDiv.dataset.book) {
                closeAllMenus();
                handleEditBook(bookId, bookDiv);
            }
            return;
        }
        
        // Cancel edit
        if (e.target.classList.contains('cancel-edit')) {
            e.preventDefault();
            e.stopPropagation();
            fetchBooks();
            return;
        }
        
        // Prevent menu closing when clicking inside menu
        if (e.target.closest('.book-menu')) {
            e.stopPropagation();
            return;
        }
        
        // Close all menus when clicking elsewhere
        closeAllMenus();
    });
}

function toggleBookMenu(button) {
    const menu = button.nextElementSibling;
    if (!menu) return;
    
    // Hide other menus first
    document.querySelectorAll('.book-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    
    // Toggle current menu
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeAllMenus() {
    document.querySelectorAll('.book-menu').forEach(m => m.style.display = 'none');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function renderBooks(books) {
    const booksContainer = document.getElementById('booksContainer');
    if (!booksContainer) {
        console.error('Books container not found!');
        return;
    }
    
    const isAdmin = UserUtils.isAdmin(user);
    const isMember = user && !user.isGuest;
    let booksArray = Array.isArray(books) ? books : [];
    
    if (books && books.books) {
        booksArray = books.books;
    }
    if (books && books.data) {
        booksArray = books.data;
    }
    
    if (!Array.isArray(booksArray)) {
        console.error('Books data is not an array:', booksArray);
        booksContainer.innerHTML = '<div class="error-message">Error: Invalid books data format</div>';
        return;
    }
    
    if (booksArray.length === 0) {
        booksContainer.innerHTML = '<div class="no-results">No books found matching your search.</div>';
        return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    booksArray.forEach((book, index) => {
        if (!book) return;
        
        const bookElement = createBookElement(book, isAdmin, isMember);
        fragment.appendChild(bookElement);
        
        if (index < booksArray.length - 1) {
            const divider = document.createElement('hr');
            divider.className = 'book-divider';
            fragment.appendChild(divider);
        }
    });
    
    // Single DOM update
    booksContainer.innerHTML = '';
    booksContainer.appendChild(fragment);
    
    console.log(`Rendered ${booksArray.length} books`);
}

function createBookElement(book, isAdmin, isMember) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book-item';
    bookDiv.dataset.book = JSON.stringify(book);
    
    const bookHeader = document.createElement('div');
    bookHeader.className = 'book-header';
    
    const bookInfo = document.createElement('div');
    bookInfo.className = 'book-info';
    
    const title = escapeHtml(book.title || 'Unknown Title');
    const author = escapeHtml(book.author || 'Unknown Author');
    const isbn = escapeHtml(book.isbn || 'No ISBN');
    const series = escapeHtml(book.series || '-');
    const subject = escapeHtml(book.subject || 'Unspecified');
    const callNumber = escapeHtml(book.call_number || 'No call number');
    const accessionNumber = escapeHtml(book.accession_number || 'No accession number');
    const location = escapeHtml(book.location || 'Unknown location');
    const availableCopies = book.available_copies || 0;
    const totalCopies = book.total_copies || 1;
    
    let infoHTML = `
        <strong>${title}</strong> by ${author} (ISBN: ${isbn})<br>
        <em>Series:</em> ${series}<br>
        <em>Subject:</em> ${subject} | <em>Call No.:</em> ${callNumber}<br>
        <em>Accession No.:</em> ${accessionNumber} | <em>Location:</em> ${location}<br>
        <em>Availability:</em> <span class="availability ${availableCopies > 0 ? 'available' : 'unavailable'}">
            ${availableCopies}/${totalCopies} available
        </span>
    `;
    
    if (isAdmin) {
        const publication = escapeHtml(book.publication || 'Unknown');
        const copyrightYear = escapeHtml(book.copyright_year || book.year || 'Unknown');
        const physicalDescription = escapeHtml(book.physical_description || 'Not specified');
        
        infoHTML = `
            <strong>${title}</strong> by ${author} (ISBN: ${isbn})<br>
            <em>Publication:</em> ${publication} | <em>Year:</em> ${copyrightYear}<br>
            <em>Physical:</em> ${physicalDescription} | <em>Series:</em> ${series}<br>
            <em>Subject:</em> ${subject} | <em>Call No.:</em> ${callNumber}<br>
            <em>Accession No.:</em> ${accessionNumber} | <em>Location:</em> ${location}<br>
            <em>Availability:</em> <span class="availability ${availableCopies > 0 ? 'available' : 'unavailable'}">
                ${availableCopies}/${totalCopies} available
            </span>
        `;
    }
    
    bookInfo.innerHTML = infoHTML;
    bookHeader.appendChild(bookInfo);
    
    // Create action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'book-actions';
    
    // Add borrow button for members
    if (isMember) {
        const borrowBtn = document.createElement('button');
        borrowBtn.className = 'borrow-btn main-btn';
        borrowBtn.setAttribute('data-id', book.id);
        borrowBtn.disabled = availableCopies <= 0;
        borrowBtn.innerHTML = availableCopies > 0 ? '📚 Borrow' : '❌ Not Available';
        borrowBtn.title = availableCopies > 0 ? 'Borrow this book' : 'This book is currently not available';
        actionsContainer.appendChild(borrowBtn);
    }
    
    // Add admin menu for admins
    if (isAdmin) {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'book-menu-container';
        
        menuContainer.innerHTML = `
            <button class="book-menu-btn" aria-label="Book options" data-id="${book.id}" title="Book options">&#8942;</button>
            <div class="book-menu" style="display:none;">
                <button class="edit-btn" data-id="${book.id}">✏️ Edit</button>
                <button class="delete-btn" data-id="${book.id}">🗑️ Delete</button>
            </div>
        `;
        
        actionsContainer.appendChild(menuContainer);
    }
    
    bookHeader.appendChild(actionsContainer);
    bookDiv.appendChild(bookHeader);
    return bookDiv;
}

// Borrowing functionality
async function handleBorrowBook(bookId) {
    try {
        const response = await fetch(ApiConfig.getApiUrl('/borrowings/borrow'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': String(user.id),
                'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
            },
            body: JSON.stringify({ book_id: bookId })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Book borrowed successfully!', 'green');
            fetchBooks(); // Refresh the books list
        } else {
            showMessage(data.message || 'Failed to borrow book', 'red');
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        showMessage('Error borrowing book. Please try again.', 'red');
    }
}

async function fetchBooks() {
    if (isLoading) return;
    
    console.log('Fetching books...');
    isLoading = true;
    showLoading();
    
    try {
        const response = await fetch(ApiConfig.getApiUrl('/books'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched books data:', data);
        
        allBooks = data;
        renderBooks(allBooks);
        
        if (data.length === 0) {
            showMessage('No books found in the library.', 'blue');
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        showMessage('Failed to load books. Please refresh the page.', 'red');
        
        const booksContainer = document.getElementById('booksContainer');
        if (booksContainer) {
            booksContainer.innerHTML = '<div class="error-message">Failed to load books. Please refresh the page.</div>';
        }
    } finally {
        isLoading = false;
        hideLoading();
    }
}

async function handleDeleteBook(bookId) {
    try {
        const response = await fetch(ApiConfig.getApiUrl(`/books/${bookId}`), {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Book deleted successfully!', 'green');
            fetchBooks(); // Refresh the books list
        } else {
            showMessage(data.message || 'Failed to delete book', 'red');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showMessage('Error deleting book. Please try again.', 'red');
    }
}

function handleEditBook(bookId, bookDiv) {
    console.log('Starting edit for book ID:', bookId);
    const book = JSON.parse(bookDiv.dataset.book);
    
    bookDiv.innerHTML = '';
    
    const form = document.createElement('form');
    form.className = 'edit-form';
    form.setAttribute('data-book-id', bookId);
    
    const fields = [
        { label: 'Title:', name: 'title', value: book.title, required: true },
        { label: 'Author:', name: 'author', value: book.author, required: true },
        { label: 'Publication:', name: 'publication', value: book.publication, required: true },
        { label: 'Year:', name: 'copyright_year', value: book.copyright_year, type: 'number', required: true },
        { label: 'Physical Description:', name: 'physical_description', value: book.physical_description, required: true },
        { label: 'Series:', name: 'series', value: book.series, required: false },
        { label: 'ISBN:', name: 'isbn', value: book.isbn, required: true },
        { label: 'Subject:', name: 'subject', value: book.subject, required: true },
        { label: 'Call Number:', name: 'call_number', value: book.call_number, required: true },
        { label: 'Accession Number:', name: 'accession_number', value: book.accession_number, required: true },
        { label: 'Location:', name: 'location', value: book.location, required: true },
        { label: 'Total Copies:', name: 'total_copies', value: book.total_copies || 1, type: 'number', required: true },
        { label: 'Available Copies:', name: 'available_copies', value: book.available_copies || 1, type: 'number', required: true }
    ];
    
    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'edit-field';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        fieldDiv.appendChild(label);
        
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.name = field.name;
        input.value = field.value || '';
        input.required = field.required;
        fieldDiv.appendChild(input);
        
        form.appendChild(fieldDiv);
    });
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'edit-buttons';
    
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'main-btn';
    saveBtn.textContent = 'Save Changes';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-edit main-btn guest-btn';
    cancelBtn.textContent = 'Cancel';
    
    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(cancelBtn);
    form.appendChild(buttonsDiv);
    
    bookDiv.appendChild(form);
    
    form.addEventListener('submit', async (event) => {
        await handleEditFormSubmit(event, bookId);
    });
}

async function handleEditFormSubmit(event, bookId) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    showLoading();
    
    try {
        const formData = new FormData(event.target);
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            publication: formData.get('publication'),
            copyright_year: Number(formData.get('copyright_year')),
            physical_description: formData.get('physical_description'),
            series: formData.get('series') || null,
            isbn: formData.get('isbn'),
            subject: formData.get('subject'),
            call_number: formData.get('call_number'),
            accession_number: formData.get('accession_number'),
            location: formData.get('location'),
            total_copies: Number(formData.get('total_copies')),
            available_copies: Number(formData.get('available_copies'))
        };
        
        console.log('Sending book data:', bookData);
        
        const response = await fetch(ApiConfig.getApiUrl(`/books/${bookId}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': String(user.id),
                'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
            },
            body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
            showMessage('Book updated successfully!', 'green');
            showToast('Book updated successfully!', 'success');
            fetchBooks();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error response:', errorData);
            showMessage(errorData.message || 'Failed to update book', 'red');
        }
    } catch (error) {
        console.error('Error updating book:', error);
        showMessage('Error updating book. Please try again.', 'red');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
        hideLoading();
    }
}

function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
        loading.textContent = 'Loading...';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showMessage(msg, color = 'green') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
        messageDiv.style.display = 'block';
        setTimeout(() => { 
            messageDiv.textContent = ''; 
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

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