export class UserUtils {
    static getCurrentUser() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    }
    
    static setupUserDisplay(user) {
        if (!user) return null;
        
        const displayName = user.display_name || 
                           (user.firstname && user.surname 
                               ? `${user.surname}, ${user.firstname}` 
                               : user.firstname || user.username || 'User');
        
        // Update drawer elements
        const drawerUserName = document.getElementById('drawerUserName');
        const drawerUserRole = document.getElementById('drawerUserRole');
        const userInitials = document.getElementById('userInitials');
        const dashboardUser = document.getElementById('dashboardUser');
        
        if (drawerUserName) drawerUserName.textContent = displayName;
        if (drawerUserRole) drawerUserRole.textContent = user.is_admin ? 'Administrator' : 'Member';
        if (dashboardUser) dashboardUser.textContent = displayName;
        
        if (userInitials) {
            const initials = displayName.includes(', ') 
                ? displayName.split(', ').map(part => part.charAt(0).toUpperCase()).join('')
                : displayName.charAt(0).toUpperCase();
            userInitials.textContent = initials;
        }
        
        return displayName;
    }
    
    static isAdmin(user) {
        return user && (user.is_admin === true || user.is_admin === 1 || user.is_admin === "1");
    }
}