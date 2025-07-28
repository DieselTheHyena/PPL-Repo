export class MenuUtils {
    static setupHamburgerMenu() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sideDrawer = document.getElementById('collapsibleMenu');
        const drawerOverlay = document.getElementById('drawerOverlay');
        
        if (hamburgerBtn && sideDrawer && drawerOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                const isOpen = sideDrawer.classList.contains('open');
                this.toggleDrawer(sideDrawer, drawerOverlay, hamburgerBtn, !isOpen);
            });
            
            drawerOverlay.addEventListener('click', () => {
                this.toggleDrawer(sideDrawer, drawerOverlay, hamburgerBtn, false);
            });
        }
    }
    
    static setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu(userMenu, userMenuBtn);
            });
            
            document.addEventListener('click', () => {
                this.closeUserMenu(userMenu, userMenuBtn);
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('user');  // Changed from localStorage
                sessionStorage.removeItem('loginSuccess');
                window.location.href = 'login.html';
            });
        }
    }
    
    static toggleDrawer(drawer, overlay, button, open) {
        if (open) {
            drawer.classList.add('open');
            overlay.classList.add('active');
            button.classList.add('open');
            button.setAttribute('aria-expanded', 'true');
        } else {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
            button.classList.remove('open');
            button.setAttribute('aria-expanded', 'false');
        }
    }
    
    static toggleUserMenu(menu, button) {
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            this.closeUserMenu(menu, button);
        } else {
            menu.classList.add('open');
            button.classList.add('open');
            button.setAttribute('aria-expanded', 'true');
        }
    }
    
    static closeUserMenu(menu, button) {
        menu.classList.remove('open');
        button.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
    }
}