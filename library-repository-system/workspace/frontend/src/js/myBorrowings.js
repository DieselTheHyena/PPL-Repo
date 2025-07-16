import { UserUtils } from './userUtils.js';
import { MenuUtils } from './menuUtils.js';

const user = UserUtils.getCurrentUser();

// Redirect guests
if (!user || user.isGuest) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function() {
    UserUtils.setupUserDisplay(user);
    MenuUtils.setupHamburgerMenu();
    MenuUtils.setupUserMenu();
    
    fetchMyBorrowings();
});

async function fetchMyBorrowings() {
    const container = document.getElementById('borrowingsContainer');
    const loading = document.getElementById('loading');
    
    try {
        const response = await fetch(ApiConfig.getApiUrl('/borrowings/user'), {
            headers: {
                'X-User-Id': String(user.id),
                'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
            }
        });
        
        const borrowings = await response.json();
        
        if (response.ok) {
            displayBorrowings(borrowings);
            updateStats(borrowings);
        } else {
            showMessage(borrowings.message || 'Failed to load borrowings', 'red');
        }
    } catch (error) {
        console.error('Error fetching borrowings:', error);
        showMessage('Failed to load borrowings. Please try again.', 'red');
    } finally {
        loading.style.display = 'none';
    }
}

function displayBorrowings(borrowings) {
    const container = document.getElementById('borrowingsContainer');
    
    if (borrowings.length === 0) {
        container.innerHTML = `
            <div class="no-borrowings">
                <h3>📖 No books currently borrowed</h3>
                <p>Visit the <a href="books.html">Books page</a> to borrow some books!</p>
            </div>
        `;
        return;
    }
    
    const currentBorrowings = borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue');
    const history = borrowings.filter(b => b.status === 'returned');
    
    let html = '';
    
    if (currentBorrowings.length > 0) {
        html += '<h3>📚 Currently Borrowed</h3>';
        html += '<div class="borrowings-list">';
        currentBorrowings.forEach(borrowing => {
            html += createBorrowingCard(borrowing, true);
        });
        html += '</div>';
    }
    
    if (history.length > 0) {
        html += '<h3>📋 Borrowing History</h3>';
        html += '<div class="borrowings-list">';
        history.slice(0, 10).forEach(borrowing => {
            html += createBorrowingCard(borrowing, false);
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Add return button listeners
    container.addEventListener('click', handleReturnBook);
}

function createBorrowingCard(borrowing, showReturnBtn) {
    const isOverdue = borrowing.status === 'overdue';
    const dueDate = new Date(borrowing.due_date);
    const borrowedDate = new Date(borrowing.borrowed_date);
    const returnedDate = borrowing.returned_date ? new Date(borrowing.returned_date) : null;
    
    return `
        <div class="borrowing-card ${isOverdue ? 'overdue' : ''} ${borrowing.status}">
            <div class="book-details">
                <h4>${borrowing.title}</h4>
                <p><strong>Author:</strong> ${borrowing.author}</p>
                <p><strong>ISBN:</strong> ${borrowing.isbn}</p>
                <p><strong>Call Number:</strong> ${borrowing.call_number}</p>
            </div>
            <div class="borrowing-details">
                <p><strong>Borrowed:</strong> ${borrowedDate.toLocaleDateString()}</p>
                ${showReturnBtn ? `
                    <p><strong>Due:</strong> <span class="${isOverdue ? 'overdue-text' : ''}">${dueDate.toLocaleDateString()}</span></p>
                    <p><strong>Status:</strong> <span class="status-${borrowing.status}">${borrowing.status.toUpperCase()}</span></p>
                ` : `
                    <p><strong>Returned:</strong> ${returnedDate.toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="status-returned">RETURNED</span></p>
                `}
            </div>
            ${showReturnBtn ? `
                <div class="borrowing-actions">
                    <button class="return-btn main-btn" data-borrowing-id="${borrowing.id}">
                        📤 Return Book
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function updateStats(borrowings) {
    const current = borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue').length;
    const overdue = borrowings.filter(b => b.status === 'overdue').length;
    const remaining = Math.max(0, 5 - current);
    
    document.getElementById('currentCount').textContent = current;
    document.getElementById('overdueCount').textContent = overdue;
    document.getElementById('remainingSlots').textContent = remaining;
}

async function handleReturnBook(e) {
    if (!e.target.classList.contains('return-btn')) return;
    
    const borrowingId = e.target.dataset.id;
    
    try {
        const response = await fetch(ApiConfig.getApiUrl('/borrowings/return'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': String(user.id),
                'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
            },
            body: JSON.stringify({ borrowing_id: borrowingId })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Book returned successfully!', 'green');
            fetchMyBorrowings(); // Refresh the borrowings list
        } else {
            showMessage(data.message || 'Failed to return book', 'red');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        showMessage('Error returning book. Please try again.', 'red');
    }
}

function showMessage(msg, color) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
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