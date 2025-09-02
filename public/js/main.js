/**
 * GymTracker Main Application
 * Orchestratore principale che coordina tutti i moduli
 */
class GymTrackerApp {
  constructor() {
    this.authModule = null;
    this.profileModule = null;
    this.workoutModule = null;
    this.isInitialized = false;
  }

  async init() {
    console.log('🚀 GymTracker - Avvio applicazione...');

    try {
      // 1) Config
      await this.loadConfiguration();

      // 2) Supabase
      if (!(await this.initializeSupabase())) {
        throw new Error('Fallimento inizializzazione Supabase');
      }

      // 3) Moduli
      this.initializeModules();

      // 4) Event handlers
      this.setupEventHandlers();

      // 5) Handlers globali (senza logout aggressivo)
      this.setupGlobalHandlers();

      // 6) Hash post-conferma (già gestita da SupabaseManager)
      await this.handleUrlHash();

      // 7) Auth
      await this.startAuthentication();

      this.isInitialized = true;
      console.log('✅ GymTracker avviato con successo!');
    } catch (error) {
      console.error('💥 Errore avvio app:', error);
      this.handleStartupError(error);
    }
  }

  async loadConfiguration() {
    try {
      console.log('🔧 Caricamento configurazione...');
      if (window.ConfigLoader) {
        const config = await window.ConfigLoader.loadConfig();
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (!isLocalhost && config.API_BASE) {
          window.apiUtils.API_BASE = config.API_BASE;
          console.log(`[Config] API_BASE aggiornato: ${config.API_BASE}`);
        }
      } else {
        console.warn('⚠️ ConfigLoader non disponibile, uso configurazione di default');
      }
    } catch (error) {
      console.warn('⚠️ Errore caricamento config, continuo con default:', error?.message || error);
    }
  }

  async initializeSupabase() {
    console.log('🔗 Inizializzazione Supabase...');
    const ok = await SupabaseManager.initialize();
    if (ok) {
      // SupabaseManager.setupAuthStateListener();
      return true;
    }
    return false;
  }

  initializeModules() {
    console.log('🧩 Inizializzazione moduli...');
    this.authModule = new AuthModule();
    this.profileModule = new ProfileModule();
    this.workoutModule = new WorkoutModule();

    // Export “di comodo” per debugging
    window.authModule = this.authModule;
    window.profileModule = this.profileModule;
    window.workoutModule = this.workoutModule;

    console.log('✅ Moduli inizializzati');
  }

  setupEventHandlers() {
    console.log('🎛️ Setup event handlers...');
    EventManager.setupEventListeners(
      this.authModule,
      this.profileModule,
      this.workoutModule
    );
    EventManager.setupGlobalErrorHandlers();
    EventManager.setupAnimations();
  }

  setupGlobalHandlers() {
    // NIENTE logout su visibilitychange. Solo refresh "soft".
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📵 App nascosta');
      } else {
        console.log('👀 App visibile');
        this.handleAppVisible(); // soft refresh
      }
    });

    window.addEventListener('online', () => {
      console.log('🌐 Connessione ristabilita');
      DOMUtils.showAlert('Connessione ristabilita', 'success');
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connessione persa');
      DOMUtils.showAlert('Connessione persa. Alcune funzionalità potrebbero non essere disponibili.', 'warning');
    });
  }

  async handleUrlHash() {
    if (window.location.hash.includes('access_token=')) {
      console.log('🔗 Hash con token rilevato (gestito)');
    }
  }

  async startAuthentication() {
    console.log('🔐 Avvio autenticazione...');
    await this.authModule.init();
  }

  handleStartupError(error) {
    console.error('💥 Errore critico di avvio:', error);
    const errorHtml = `
      <div style="text-align:center; padding:2rem; max-width:520px; margin:2rem auto;">
        <div style="color: var(--danger-color); font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: var(--danger-color);">Errore di Avvio</h2>
        <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
        <p style="font-size:.9rem; color: var(--text-secondary); margin:1rem 0;">${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top:1rem;">🔄 Ricarica Pagina</button>
      </div>
    `;
    document.body.innerHTML = errorHtml;
  }

  // Soft refresh quando la pagina torna visibile (niente logout qui)
  async handleAppVisible() {
    if (!this.isInitialized) return;
    try {
      // Ricalcola la rotta corrente per riallineare la vista/UI
      const current = window.GTRouter?.current?.() || { name: 'default', params: {} };
      window.dispatchEvent(new CustomEvent('gt:route', { detail: current }));

      // Se già autenticato e hai dati, puoi rinfrescare le schede
      const session = await SupabaseManager.getSession();
      if (session && this.authModule?.isAuthenticated && this.workoutModule?.workouts?.length > 0) {
        await this.workoutModule.loadWorkouts();
      }
    } catch (e) {
      console.error('Errore durante refresh visibilità:', e);
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      supabaseReady: SupabaseManager.isInitialized,
      authenticated: this.authModule?.isAuthenticated || false,
      currentUser: this.authModule?.user || null,
      workoutsCount: this.workoutModule?.workouts.length || 0,
    };
  }

  async refreshData() {
    if (!this.isInitialized || !this.authModule?.isAuthenticated) return;
    try {
      DOMUtils.showLoading();
      await this.workoutModule.loadWorkouts();
      DOMUtils.showAlert('Dati aggiornati', 'success');
    } catch (e) {
      console.error('Errore aggiornamento dati:', e);
      DOMUtils.showAlert('Errore aggiornamento dati', 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  destroy() {
    console.log('🧹 Pulizia app...');
    this.authModule?.reset?.();
    this.profileModule?.reset?.();
    this.workoutModule?.reset?.();
    delete window.authModule;
    delete window.profileModule;
    delete window.workoutModule;
    delete window.app;
    this.isInitialized = false;
  }
}

// =====================
// Bootstrap
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM caricato, avvio GymTracker...');
  try {
    window.app = new GymTrackerApp();
    await window.app.init();

    // utilità debug
    window.gymTrackerStatus = () => window.app.getStatus();
    window.gymTrackerRefresh = () => window.app.refreshData();
  } catch (e) {
    console.error('💥 Errore bootstrap app:', e);
    document.body.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <h1 style="color:red;">Errore di Avvio</h1>
        <p>Impossibile avviare l'applicazione.</p>
        <button onclick="window.location.reload()">Ricarica</button>
      </div>
    `;
  }
});

// Export opzionale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GymTrackerApp;
}
