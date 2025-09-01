/**
 * Auth Module - Gestione completa autenticazione e sessioni
 */
class AuthModule {
  constructor() {
    this.currentUser = null;
  }

  async init() {
    console.log('🚀 Inizializzazione Auth...');
    const { token, user } = window.apiUtils.getAuthData();

    if (token && user) {
      try {
        this.currentUser = user;
        await this.checkUserProfile();
      } catch (e) {
        console.error('Errore ripristino sessione:', e);
        this.logout();
      }
    } else {
      this.showAuthUI();
    }
  }

  async checkUserProfile() {
    try {
      const response = await window.apiUtils.profile();
      const profile = response.profile;
      if (!profile || !profile.age || !profile.fitness_level) {
        this.showOnboarding();
      } else {
        this.showDashboard();
      }
    } catch (e) {
      console.error('Errore controllo profilo:', e);
      this.showOnboarding();
    }
  }

  async login(email, password) {
    try {
      DOMUtils.showLoading();
      console.log('🔐 Tentativo login per:', email);
      
      const response = await window.apiUtils.auth('signin', { email, password });

      if (response.session) {
        window.apiUtils.setAuthData(response.session.access_token, response.user);
        this.currentUser = response.user;
        DOMUtils.hideModal('login-modal');
        await this.checkUserProfile();
        DOMUtils.showAlert('Login effettuato con successo!', 'success');
      }
    } catch (e) {
      console.error('Errore login:', e);
      DOMUtils.showAlert('Errore durante il login: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async signup(email, password, fullName) {
    try {
      DOMUtils.showLoading();
      console.log('📝 Tentativo registrazione per:', email);
      
      const response = await window.apiUtils.auth('signup', { email, password, fullName });

      if (response.needsConfirmation) {
        DOMUtils.hideModal('signup-modal');
        DOMUtils.showAlert('Registrazione completata! Controlla la tua email per confermare l\'account.', 'info');
      } else if (response.session) {
        window.apiUtils.setAuthData(response.session.access_token, response.user);
        this.currentUser = response.user;
        DOMUtils.hideModal('signup-modal');
        this.showOnboarding();
        DOMUtils.showAlert('Registrazione completata con successo!', 'success');
      }
    } catch (e) {
      console.error('Errore registrazione:', e);
      DOMUtils.showAlert('Errore durante la registrazione: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  logout() {
    window.apiUtils.clearAuthData();
    this.currentUser = null;
    
    // Reset dei dati globali dell'app
    if (window.workoutModule) {
      window.workoutModule.reset();
    }
    
    this.showAuthUI();
    DOMUtils.showAlert('Logout effettuato con successo!', 'info');
  }

  showAuthUI() {
    DOMUtils.showSection('hero-section');
    DOMUtils.toggleAuthUI(true);
  }

  showOnboarding() {
    DOMUtils.showSection('onboarding-section');
    DOMUtils.toggleAuthUI(false);
    
    if (this.currentUser) {
      DOMUtils.updateUserName(this.currentUser.fullName || this.currentUser.email);
    }
  }

  showDashboard() {
    DOMUtils.showSection('dashboard-section');
    DOMUtils.toggleAuthUI(false);

    if (this.currentUser) {
      DOMUtils.updateUserName(this.currentUser.fullName || this.currentUser.email);
    }

    // Carica le schede quando si mostra la dashboard
    if (window.workoutModule) {
      window.workoutModule.loadWorkouts();
    }
  }

  // Getter per l'utente corrente
  get user() {
    return this.currentUser;
  }

  // Controlla se l'utente è autenticato
  get isAuthenticated() {
    return !!this.currentUser;
  }
}

window.AuthModule = AuthModule;