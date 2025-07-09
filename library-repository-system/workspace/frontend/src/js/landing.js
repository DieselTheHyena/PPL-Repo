import { UserUtils } from './userUtils.js';
import { MenuUtils } from './menuUtils.js';

const user = UserUtils.getCurrentUser();

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing Dashboard...');
    
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
    
    // === LOAD DASHBOARD CONTENT ===
    loadDashboardStats();
    loadRecentActivity();
    loadAnnouncements();
    checkDueDates();
    setupQuickActions();
    
    console.log('Dashboard page initialization complete');
});

// Enhanced dashboard stats with real data
async function loadDashboardStats() {
    try {
        const statElements = {
            totalBooks: document.getElementById('statTotalBooks'),
            borrowedToday: document.getElementById('statBorrowedToday'),
            overdue: document.getElementById('statOverdue'),
            users: document.getElementById('statUsers')
        };

        // Show loading spinners
        Object.values(statElements).forEach(element => {
            if (element) {
                element.innerHTML = '<span class="dashboard-stat-loading">⏳</span>';
            }
        });

        // Fetch real statistics
        const [booksResponse, borrowingsResponse] = await Promise.all([
            fetch('http://localhost:5000/api/books'),
            user && !user.isGuest ? fetch('http://localhost:5000/api/borrowings/user', {
                headers: {
                    'X-User-Id': String(user.id),
                    'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
                }
            }) : Promise.resolve({ ok: false })
        ]);

        // Process books data
        if (booksResponse.ok) {
            const books = await booksResponse.json();
            if (statElements.totalBooks) {
                statElements.totalBooks.textContent = books.length.toLocaleString();
            }
        }

        // Process borrowings data
        if (borrowingsResponse.ok) {
            const borrowings = await borrowingsResponse.json();
            const currentBorrowings = borrowings.filter(b => b.status === 'borrowed' || b.status === 'overdue');
            const overdue = borrowings.filter(b => b.status === 'overdue');
            
            if (statElements.borrowedToday) {
                statElements.borrowedToday.textContent = currentBorrowings.length;
            }
            if (statElements.overdue) {
                statElements.overdue.textContent = overdue.length;
            }

            // Show overdue notification
            if (overdue.length > 0) {
                showOverdueNotification(overdue.length);
            }
        } else {
            // Guest user defaults
            if (statElements.borrowedToday) statElements.borrowedToday.textContent = '0';
            if (statElements.overdue) statElements.overdue.textContent = '0';
        }

        // Default user count (you can implement user counting later)
        if (statElements.users) statElements.users.textContent = '245';

        showToast('Dashboard loaded successfully', 'success');

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        handleStatsLoadError();
    }
}

function showOverdueNotification(count) {
    const notification = document.createElement('div');
    notification.className = 'overdue-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">⚠️</span>
            <div class="notification-text">
                <strong>Overdue Books Alert!</strong>
                <p>You have ${count} overdue book(s). Please return them as soon as possible.</p>
            </div>
            <button class="notification-action" onclick="window.location.href='myBorrowings.html'">
                View My Books
            </button>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

function handleStatsLoadError() {
    const statElements = ['statTotalBooks', 'statBorrowedToday', 'statOverdue', 'statUsers'];
    statElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span style="color: #f44336;">Error</span>';
        }
    });
    showToast('Failed to load dashboard statistics', 'error');
}

// Enhanced recent activity with real data simulation
async function loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;

    try {
        // Show loading
        recentActivity.innerHTML = '<li class="activity-loading">Loading recent activity...</li>';
        
        // Simulate API call - replace with real endpoint later
        setTimeout(() => {
            const activities = [
                { icon: '📖', text: 'Book "Modern JavaScript" added by admin', time: '2 minutes ago' },
                { icon: '👤', text: `User "${user?.username || 'guest'}" browsed the catalog`, time: '5 minutes ago' },
                { icon: '📚', text: 'Book "CSS Secrets" returned by user', time: '15 minutes ago' },
                { icon: '➕', text: 'New user "msmith" registered', time: '1 hour ago' },
                { icon: '🔄', text: 'Book "React Handbook" borrowed', time: '2 hours ago' }
            ];

            recentActivity.innerHTML = activities.map(activity => `
                <li class="activity-item">
                    <span class="activity-icon">${activity.icon}</span>
                    <div class="activity-content">
                        <span class="activity-text">${activity.text}</span>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </li>
            `).join('');
        }, 1500);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        recentActivity.innerHTML = '<li class="activity-error">Failed to load recent activity</li>';
    }
}

// Enhanced announcements
function loadAnnouncements() {
    const dashboardAnnouncements = document.getElementById('dashboardAnnouncements');
    if (!dashboardAnnouncements) return;

    try {
        // Show loading
        dashboardAnnouncements.innerHTML = '<li class="announcement-loading">Loading announcements...</li>';
        
        setTimeout(() => {
            const announcements = [
                { icon: '🔧', text: 'System maintenance scheduled for July 15, 2025', priority: 'high' },
                { icon: '📚', text: 'New collection of programming books available!', priority: 'medium' },
                { icon: '📊', text: 'Extended library hours during exam period', priority: 'low' },
                { icon: '🎉', text: 'New digital borrowing system launched', priority: 'medium' }
            ];

            dashboardAnnouncements.innerHTML = announcements.map(announcement => `
                <li class="announcement-item priority-${announcement.priority}">
                    <span class="announcement-icon">${announcement.icon}</span>
                    <span class="announcement-text">${announcement.text}</span>
                </li>
            `).join('');
        }, 1000);
    } catch (error) {
        console.error('Error loading announcements:', error);
        dashboardAnnouncements.innerHTML = '<li class="announcement-error">Failed to load announcements</li>';
    }
}

// Check for due dates and show notifications
async function checkDueDates() {
    if (!user || user.isGuest) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/borrowings/user', {
            headers: {
                'X-User-Id': String(user.id),
                'X-Is-Admin': String(user.is_admin === true || user.is_admin === 1)
            }
        });
        
        if (response.ok) {
            const borrowings = await response.json();
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            // Check for books due tomorrow
            const dueTomorrow = borrowings.filter(b => {
                if (b.status !== 'borrowed') return false;
                const dueDate = new Date(b.due_date);
                return dueDate.toDateString() === tomorrow.toDateString();
            });
            
            if (dueTomorrow.length > 0) {
                showDueSoonNotification(dueTomorrow);
            }
        }
    } catch (error) {
        console.error('Error checking due dates:', error);
    }
}

function showDueSoonNotification(books) {
    const notification = document.createElement('div');
    notification.className = 'due-soon-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">📅</span>
            <div class="notification-text">
                <strong>Books Due Tomorrow!</strong>
                <p>${books.length} book(s) are due tomorrow. Don't forget to renew or return them.</p>
            </div>
            <button class="notification-action" onclick="window.location.href='myBorrowings.html'">
                View Books
            </button>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 8000);
}

// Setup quick action buttons
function setupQuickActions() {
    const quickActions = document.querySelector('.quick-actions');
    if (quickActions) {
        quickActions.addEventListener('click', (e) => {
            if (e.target.matches('.quick-action-btn')) {
                const action = e.target.dataset.action;
                handleQuickAction(action);
            }
        });
    }
}

function handleQuickAction(action) {
    switch (action) {
        case 'search-books':
            window.location.href = 'books.html';
            break;
        case 'my-borrowings':
            if (user && !user.isGuest) {
                window.location.href = 'myBorrowings.html';
            } else {
                showToast('Please log in to view your borrowings', 'warning');
            }
            break;
        case 'add-book':
            if (UserUtils.isAdmin(user)) {
                window.location.href = 'addBook.html';
            } else {
                showToast('Only administrators can add books', 'warning');
            }
            break;
        case 'profile':
            showToast('Profile management coming soon!', 'info');
            break;
        default:
            console.log('Unknown quick action:', action);
    }
}

// Enhanced showToast function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.log(`Toast: ${message} (${type})`);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Real-time clock
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

// Export functions for use in other modules
window.showToast = showToast;