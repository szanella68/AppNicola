/* menu-component.js - Professional Version */

const Menu = {
  isOpen: false,
  currentPage: 'hub',
  currentUser: null,
  
  // Initialize menu
  init() {
    this.bindEvents();
    this.checkAuthState();
    this.updateActiveState();
  },

  // Force refresh menu state (useful after page navigation)
  refreshAuthState() {
    this.checkAuthState();
  },
  
  // Bind global events
  bindEvents() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#mainMenu') && this.isOpen) {
        this.close();
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Handle page load to set active state
    window.addEventListener('load', () => {
      this.detectCurrentPage();
    });
  },
  
  // Toggle dropdown
  toggle() {
    const dropdown = document.getElementById('dropdownContent');
    const trigger = document.getElementById('menuTrigger');
    
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      dropdown.classList.add('show');
      trigger.classList.add('open');
    } else {
      this.close();
    }
  },
  
  // Close dropdown
  close() {
    const dropdown = document.getElementById('dropdownContent');
    const trigger = document.getElementById('menuTrigger');
    
    if (dropdown) dropdown.classList.remove('show');
    if (trigger) trigger.classList.remove('open');
    this.isOpen = false;
  },
  
  // Navigate to page
  goto(page) {
    this.close();
    
    // Map internal pages to actual files
    const pageMap = {
      'hub': 'app.html',
      'sessioni': 'sessioni.html',
      'schede': 'schede.html', 
      'trainer': 'trainer.html',
      'calendario': 'calendario.html',
      'profilo': 'profilo.html',
      'terms': 'terms.html',
      'privacy': 'privacy.html',
      'contatti': 'contatti.html'
    };
    
    const targetFile = pageMap[page];
    
    if (targetFile) {
      // Check if we're already on the target page
      const currentPath = window.location.pathname;
      if (!currentPath.includes(targetFile)) {
        window.location.href = targetFile;
      } else {
        // Already on page, just update active state
        this.setActive(page);
      }
    } else {
      console.warn(`Page "${page}" not found in page map`);
    }
  },
  
  // Set active menu item
  setActive(page) {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    this.currentPage = page;
  },
  
  // Detect current page from URL
  detectCurrentPage() {
    const path = window.location.pathname;
    let currentPage = 'hub'; // default
    
    if (path.includes('sessioni.html')) currentPage = 'sessioni';
    else if (path.includes('schede.html')) currentPage = 'schede';
    else if (path.includes('trainer.html')) currentPage = 'trainer';
    else if (path.includes('calendario.html')) currentPage = 'calendario';
    else if (path.includes('profilo.html')) currentPage = 'profilo';
    else if (path.includes('terms.html')) currentPage = 'terms';
    else if (path.includes('privacy.html')) currentPage = 'privacy';
    else if (path.includes('contatti.html')) currentPage = 'contatti';
    else if (path.includes('app.html')) currentPage = 'hub';
    
    this.setActive(currentPage);
  },
  
  // Update active state on page load
  updateActiveState() {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      this.detectCurrentPage();
    }, 100);
  },
  
  // Go to home (logo click)
  goHome() {
    if (this.isAuthenticated()) {
      // If authenticated, go to hub
      if (!window.location.pathname.includes('app.html')) {
        window.location.href = 'app.html';
      }
    } else {
      // If not authenticated, go to home
      window.location.href = 'home.html';
    }
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  },
  
  // Show authenticated menu
  showPrivateMenu(user) {
    this.currentUser = user;
    const publicMenu = document.getElementById('menuPublic');
    const privateMenu = document.getElementById('menuPrivate');
    
    if (publicMenu) publicMenu.classList.add('hidden');
    if (privateMenu) privateMenu.classList.remove('hidden');
    
    // Update greeting
    this.updateUserGreeting(user);

    // Apply role-based visibility (minimal frontend test)
    try {
      const role = (user && (user.user_type || user.role))
        || localStorage.getItem('gymtracker_role')
        || 'standard';
      this.applyRoleVisibility(role);
    } catch (_) {}
  },
  
  // Show public menu
  showPublicMenu() {
    this.currentUser = null;
    const publicMenu = document.getElementById('menuPublic');
    const privateMenu = document.getElementById('menuPrivate');
    
    if (publicMenu) publicMenu.classList.remove('hidden');
    if (privateMenu) privateMenu.classList.add('hidden');
  },

  // Role-based visibility for dropdown items
  applyRoleVisibility(role = 'standard') {
    const allowed = String(role).toLowerCase();
    document.querySelectorAll('#dropdownContent [data-role]')
      .forEach(el => {
        const roles = String(el.getAttribute('data-role') || 'all').toLowerCase();
        const list = roles.split(',').map(r => r.trim());
        const visible = list.includes('all') || list.includes(allowed);
        el.style.display = visible ? '' : 'none';
      });
  },
  
  // Update user greeting
  updateUserGreeting(user) {
    const greeting = document.getElementById('userGreeting');
    if (greeting && user) {
      const name = user.name || user.email?.split('@')[0] || 'Utente';
      greeting.textContent = `Ciao ${name}!`;
    }
  },
  
  // Check current auth state
  checkAuthState() {
    const stored = localStorage.getItem('gymtracker_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.showPrivateMenu(user);
      } catch (e) {
        localStorage.removeItem('gymtracker_user');
        this.showPublicMenu();
      }
    } else {
      this.showPublicMenu();
    }
  },

  // External link handler (for Terms, Privacy, Contatti)
  openExternal(url) {
    this.close();
    window.location.href = url;
  }
};

// Expose globally so other modules (Auth, TemplateLoader) can access it
try {
  window.Menu = Menu;
  console.log('🌐 Menu exposed on window');
} catch (e) {
  // no-op in non-browser environments
}

// Initialize when DOM is ready - BUT only if template system hasn't initialized us already
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're using template system
  if (!window.TemplateLoader) {
    // No template system, initialize immediately
    Menu.init();
  }
  // If template system exists, it will initialize us after templates load
});
