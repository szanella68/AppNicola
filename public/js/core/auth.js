/* auth.js */

const Auth = {
  currentUser: null,
  isInitialized: false,
  
  // Initialize auth system
  init() {
    this.createModals();
    this.bindEvents();
    this.checkStoredAuth();
    this.isInitialized = true;
  },
  
  // Create login/register modals
  createModals() {
    // Create modal container if not exists
    let modalContainer = document.getElementById('authModals');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'authModals';
      document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = `
      <!-- Login Modal -->
      <div id="loginModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Accedi al tuo account</h3>
            <button class="modal-close" onclick="Auth.closeModals()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="loginForm" onsubmit="Auth.handleLogin(event)">
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="loginEmail" required placeholder="mario@esempio.com">
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="loginPassword" required placeholder="••••••••">
              </div>
              <button type="submit" class="auth-button" id="loginSubmit">
                Accedi
              </button>
            </form>
            <div class="auth-switch">
              <p>Non hai un account? <a href="#" onclick="Auth.showRegister()">Registrati</a></p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Register Modal -->
      <div id="registerModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Crea il tuo account</h3>
            <button class="modal-close" onclick="Auth.closeModals()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="registerForm" onsubmit="Auth.handleRegister(event)">
              <div class="form-group">
                <label>Nome completo</label>
                <input type="text" id="registerName" required placeholder="Mario Rossi">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="registerEmail" required placeholder="mario@esempio.com">
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="registerPassword" required placeholder="••••••••" minlength="6">
              </div>
              <button type="submit" class="auth-button" id="registerSubmit">
                Registrati
              </button>
            </form>
            <div class="auth-switch">
              <p>Hai già un account? <a href="#" onclick="Auth.showLogin()">Accedi</a></p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Styles -->
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        
        .modal-overlay.show {
          display: flex;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        .auth-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .auth-button:hover {
          background: #2563eb;
        }
        
        .auth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .auth-switch {
          text-align: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .auth-switch a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .auth-switch a:hover {
          text-decoration: underline;
        }
      </style>
    `;
  },
  
  // Bind events
  bindEvents() {
    // Close modal on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModals();
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });
  },
  
  // Show login modal
  showLogin() {
    this.closeModals();
    document.getElementById('loginModal').classList.add('show');
    setTimeout(() => {
      document.getElementById('loginEmail').focus();
    }, 100);
  },
  
  // Show register modal
  showRegister() {
    this.closeModals();
    document.getElementById('registerModal').classList.add('show');
    setTimeout(() => {
      document.getElementById('registerName').focus();
    }, 100);
  },
  
  // Close all modals
  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('show');
    });
  },
  
  // Handle login form
  async handleLogin(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('loginSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Accesso in corso...';
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      if (!window.API || typeof window.API.login !== 'function') {
        throw new Error('API non disponibile');
      }
      const result = await window.API.login(email, password);
      if (result?.session && result?.user) {
        this.setUser({
          email: result.user.email,
          name: result.user.fullName || (result.user.email?.split('@')[0]) || 'Utente',
          id: result.user.id
        });
        this.closeModals();
        if (window.location.pathname.includes('home.html')) {
          window.location.href = 'app.html';
        }
      } else {
        throw new Error('Login fallito');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      this.showErrorMessage(error.message || 'Errore di login');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Accedi';
    }
  },
  
  // Handle register form
  async handleRegister(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('registerSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrazione...';
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
      if (!window.API || typeof window.API.register !== 'function') {
        throw new Error('API non disponibile');
      }
      const result = await window.API.register(email, password, { fullName: name });
      if (result?.session && result?.user) {
        this.setUser({
          email: result.user.email,
          name: name || (result.user.email?.split('@')[0]) || 'Utente',
          id: result.user.id
        });
        this.closeModals();
        if (window.location.pathname.includes('home.html')) {
          window.location.href = 'app.html';
        }
        this.showSuccessMessage('Registrazione completata con successo!');
      } else if (result?.needsConfirmation) {
        this.showSuccessMessage('Controlla la tua email per confermare l\'account');
      } else {
        throw new Error('Registrazione fallita');
      }
    } catch (error) {
      console.error('[Auth] Register error:', error);
      this.showErrorMessage(error.message || 'Errore di registrazione');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrati';
    }
  },
  
  // Set current user
  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('gymtracker_user', JSON.stringify(user));
    
    // Update menu - try multiple times if Menu is not ready
    this.updateMenuAfterAuth(user);
  },
  
  // Update menu after authentication with retry logic
  updateMenuAfterAuth(user, retries = 5) {
    // Debug logs to diagnose Menu/Auth availability and DOM state
    try {
      console.log('[Auth.updateMenuAfterAuth] retries left:', retries);
      console.log('[Auth.updateMenuAfterAuth] window.Menu:', typeof window.Menu, 'Menu:', typeof Menu);
      console.log('[Auth.updateMenuAfterAuth] window.Auth:', typeof window.Auth, 'Auth:', typeof Auth);
      const hasPublic = !!document.getElementById('menuPublic');
      const hasPrivate = !!document.getElementById('menuPrivate');
      console.log('[Auth.updateMenuAfterAuth] menu DOM exists? {menuPublic, menuPrivate}:', hasPublic, hasPrivate);
    } catch (e) {
      console.warn('[Auth.updateMenuAfterAuth] log error:', e);
    }

    if (window.Menu && typeof Menu.showPrivateMenu === 'function') {
      Menu.showPrivateMenu(user);
      console.log('✅ Private menu activated for:', user.name);
    } else if (retries > 0) {
      // Retry after a short delay
      setTimeout(() => {
        this.updateMenuAfterAuth(user, retries - 1);
      }, 100);
    } else {
      console.warn('❌ Could not activate private menu - Menu not available');
    }
  },
  
  // Logout user
  logout() {
    this.currentUser = null;
    localStorage.removeItem('gymtracker_user');
    this.clearSession();
    
    // Update menu
    if (window.Menu) {
      Menu.showPublicMenu();
    }
    
    // Redirect to home
    try {
      if (window.API && typeof window.API.logout === 'function') {
        window.API.logout().catch(() => {});
      }
    } catch (_) {}
    window.location.href = 'home.html';
  },
  
  // Check stored auth
  checkStoredAuth() {
    const stored = localStorage.getItem('gymtracker_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUser = user;
        
        console.log('✅ Auth restored from localStorage:', user);
        
        // Update menu with retry logic
        this.updateMenuAfterAuth(user);
      } catch (e) {
        console.error('❌ Failed to parse stored user:', e);
        localStorage.removeItem('gymtracker_user');
      }
    } else {
      console.log('ℹ️ No stored user found');
    }
  },
  
  // Show success message
  showSuccessMessage(message) {
    this.showToast(message, 'success');
  },
  
  // Show error message
  showErrorMessage(message) {
    this.showToast(message, 'error');
  },
  
  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  // Get current user
  getCurrentUser() {
    return this.currentUser;
  },
  
  // Check if authenticated - fallback to localStorage if currentUser is null
  isAuthenticated() {
    if (this.currentUser !== null) {
      return true;
    }
    
    // Fallback: check localStorage directly
    const stored = localStorage.getItem('gymtracker_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUser = user; // Restore user if found
        return true;
      } catch (e) {
        localStorage.removeItem('gymtracker_user');
        return false;
      }
    }
    
    return false;
  }
};

// Session management for API tokens
Auth.setSession = function(session) {
  try {
    localStorage.setItem('gymtracker_session', JSON.stringify(session));
    console.log('[Auth] session stored:', !!session);
  } catch (e) {
    console.error('[Auth] setSession error:', e);
  }
};

Auth.getSession = function() {
  try {
    const raw = localStorage.getItem('gymtracker_session');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[Auth] getSession error:', e);
    return null;
  }
};

Auth.clearSession = function() {
  try {
    localStorage.removeItem('gymtracker_session');
    console.log('[Auth] session cleared');
  } catch (e) {
    console.error('[Auth] clearSession error:', e);
  }
};

// Expose globally so other modules and inline code can access it
try {
  window.Auth = Auth;
  console.log('🌐 Auth exposed on window');
} catch (e) {
  // no-op in non-browser environments
}
