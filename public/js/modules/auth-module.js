// public/js/modules/auth-module.js
// Gestione login/signup/logout + apertura modali + sincronizzazione UI.
// Compatibile con EventManager legacy che chiama authModule.login/signup.

class AuthModule {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this._bound = false;
    this._busyLogin = false;
    this._busySignup = false;
  }

  async init() {
    console.log('🚀 Inizializzazione Auth...');
    this.bindUI();

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      this._applySession(session);
    } catch (e) {
      console.warn('[Auth] getSession iniziale fallito:', e?.message || e);
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      console.log('[Supabase] Auth state change:', _event, !!session);
      this._applySession(session);
    });
  }

  bindUI() {
    if (this._bound) return;
    const $ = (id) => document.getElementById(id);

    const loginBtn  = $('login-btn')  || $('hero-login-btn');
    const signupBtn = $('signup-btn') || $('hero-signup-btn');
    const logoutBtn = $('logout-btn');

    if (loginBtn && !loginBtn.dataset.bound) {
      loginBtn.addEventListener('click', () => this.openLogin());
      loginBtn.dataset.bound = '1';
    }
    if (signupBtn && !signupBtn.dataset.bound) {
      signupBtn.addEventListener('click', () => this.openSignup());
      signupBtn.dataset.bound = '1';
    }
    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.addEventListener('click', () => this.logout());
      logoutBtn.dataset.bound = '1';
    }

    const loginForm = $('login-form');
    if (loginForm && !loginForm.dataset.bound) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.login($('login-email')?.value?.trim(), $('login-password')?.value || '');
      });
      loginForm.dataset.bound = '1';
    }

    const signupForm = $('signup-form');
    if (signupForm && !signupForm.dataset.bound) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.signup(
          $('signup-email')?.value?.trim(),
          $('signup-password')?.value || '',
          $('signup-name')?.value?.trim()
        );
      });
      signupForm.dataset.bound = '1';
    }

    window.addEventListener('gt:route', (e) => {
      const name = e.detail?.name;
      if (name === 'login')  this.openLogin();
      if (name === 'signup') this.openSignup();
    });

    window.addEventListener('gt:auth-required', () => this.openLogin());

    window.Auth = window.Auth || {};
    window.Auth.openLogin  = () => this.openLogin();
    window.Auth.openSignup = () => this.openSignup();

    this._bound = true;
  }

  openLogin() {
    document.getElementById('signup-modal')?.classList.remove('active');
    document.getElementById('login-modal')?.classList.add('active');
    try { document.getElementById('login-email')?.focus(); } catch {}
  }

  openSignup() {
    document.getElementById('login-modal')?.classList.remove('active');
    document.getElementById('signup-modal')?.classList.add('active');
    try { document.getElementById('signup-email')?.focus(); } catch {}
  }

  async login(email, password) {
    if (this._busyLogin) return;
    this._busyLogin = true;
    try { await this._handleLogin(email, password); }
    finally { this._busyLogin = false; }
  }

  async signup(email, password, fullName) {
    if (this._busySignup) return;
    this._busySignup = true;
    try { await this._handleSignup(email, password, fullName); }
    finally { this._busySignup = false; }
  }

  async _handleLogin(email, password) {
    console.log('🔐 Tentativo login per:', email);
    try {
      DOMUtils?.showLoading?.();
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('✅ Login OK:', !!data.user, !!data.session);
      DOMUtils?.showAlert?.('Accesso eseguito', 'success');
      // _applySession verrà richiamato dall'onAuthStateChange
    } catch (err) {
      console.error('💥 Login error:', err);
      DOMUtils?.showAlert?.(err?.message || 'Credenziali non valide', 'error');
    } finally {
      DOMUtils?.hideLoading?.();
    }
  }

  async _handleSignup(email, password, fullName) {
    console.log('📝 Tentativo signup per:', email);
    try {
      DOMUtils?.showLoading?.();
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      DOMUtils?.showAlert?.('Registrazione inviata. Controlla la mail per confermare.', 'info');
      this.openLogin();
    } catch (err) {
      console.error('💥 Signup error:', err);
      DOMUtils?.showAlert?.(err?.message || 'Errore registrazione', 'error');
    } finally {
      DOMUtils?.hideLoading?.();
    }
  }

  async logout() {
    try {
      await supabaseClient.auth.signOut();
      DOMUtils?.showAlert?.('Disconnesso', 'info');
      this.openLogin();
    } catch (err) {
      console.error('Logout error:', err);
      DOMUtils?.showAlert?.('Errore logout', 'error');
    }
  }

  _applySession(session) {
    this.isAuthenticated = !!session;
    this.user = session?.user || null;

    try {
      window.dispatchEvent(new CustomEvent('gt:auth', {
        detail: { event: this.isAuthenticated ? 'SIGNED_IN' : 'SIGNED_OUT', session }
      }));
    } catch {}

    if (this.isAuthenticated) {
      document.getElementById('login-modal')?.classList.remove('active');
      document.getElementById('signup-modal')?.classList.remove('active');

      const cur = window.GTRouter?.current?.()?.name;
      if (!cur || cur === 'login' || cur === 'signup' || cur === 'default' || cur === 'unknown') {
        window.GTRouter?.navigateTo?.('dashboard');
      }

      // 👉 carica subito le schede dopo il login
      // (se il modulo c’è, altrimenti ignora in silenzio)
      setTimeout(() => {
        try { window.workoutModule?.loadWorkouts?.(); } catch {}
      }, 0);

    } else {
      const cur = window.GTRouter?.current?.()?.name;
      if (cur !== 'login' && cur !== 'signup') {
        window.GTRouter?.navigateTo?.('login');
      }
    }
  }
}