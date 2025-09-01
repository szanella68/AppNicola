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
      // Step 1: Carica configurazione dinamica
      await this.loadConfiguration();
      
      // Step 2: Inizializza Supabase
      if (!await this.initializeSupabase()) {
        throw new Error('Fallimento inizializzazione Supabase');
      }
      
      // Step 3: Inizializza moduli dell'applicazione
      this.initializeModules();
      
      // Step 4: Setup event listeners
      this.setupEventHandlers();
      
      // Step 5: Setup gestori globali
      this.setupGlobalHandlers();
      
      // Step 6: Gestisci sessioni da hash (conferma email)
      await this.handleUrlHash();
      
      // Step 7: Avvia autenticazione
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
      
      // Usa ConfigLoader se disponibile, altrimenti fallback
      if (window.ConfigLoader) {
        const config = await window.ConfigLoader.loadConfig();
        
        // Aggiorna API_BASE se necessario
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (!isLocalhost && config.API_BASE) {
          window.apiUtils.API_BASE = config.API_BASE;
          console.log(`[Config] API_BASE aggiornato: ${config.API_BASE}`);
        }
      } else {
        console.warn('⚠️ ConfigLoader non disponibile, uso configurazione di default');
      }
    } catch (error) {
      console.warn('⚠️ Errore caricamento config, continuo con default:', error.message);
    }
  }

  async initializeSupabase() {
    console.log('🔗 Inizializzazione Supabase...');
    
    const success = await SupabaseManager.initialize();
    
    if (success) {
      // Setup listener per cambi di stato auth
      SupabaseManager.setupAuthStateListener();
      return true;
    }
    
    return false;
  }

  initializeModules() {
    console.log('🧩 Inizializzazione moduli...');
    
    // Inizializza i moduli principali
    this.authModule = new AuthModule();
    this.profileModule = new ProfileModule();
    this.workoutModule = new WorkoutModule();
    
    // Esponi globalmente per backward compatibility
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
    // Gestione visibilità pagina (pausa/riprendi operazioni)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📵 App nascosta');
      } else {
        console.log('👀 App visibile');
        // Potremmo aggiornare i dati quando l'app torna visibile
        this.handleAppVisible();
      }
    });

    // Gestione cambio connessione
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
    // Gestisce hash per conferma email (già gestito in SupabaseManager)
    if (window.location.hash.includes('access_token=')) {
      console.log('🔗 Hash con token rilevato');
      // SupabaseManager.handleSessionFromHash() è già chiamato durante l'inizializzazione
    }
  }

  async startAuthentication() {
    console.log('🔐 Avvio autenticazione...');
    await this.authModule.init();
  }

  // Gestisce errori di avvio
  handleStartupError(error) {
    console.error('💥 Errore critico di avvio:', error);
    
    // Mostra messaggio all'utente
    const errorHtml = `
      <div style="text-align: center; padding: 2rem; max-width: 500px; margin: 2rem auto;">
        <div style="color: var(--danger-color); font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: var(--danger-color);">Errore di Avvio</h2>
        <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 1rem 0;">
          ${error.message}
        </p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
          🔄 Ricarica Pagina
        </button>
      </div>
    `;
    
    document.body.innerHTML = errorHtml;
  }

  // Chiamato quando l'app torna visibile
  async handleAppVisible() {
    if (!this.isInitialized) return;

    try {
      // Verifica se la sessione è ancora valida
      const session = await SupabaseManager.getSession();
      
      if (this.authModule.isAuthenticated && !session) {
        console.warn('⚠️ Sessione scaduta, logout automatico');
        this.authModule.logout();
        DOMUtils.showAlert('Sessione scaduta. Effettua nuovamente il login.', 'warning');
      }
      
      // Aggiorna dati se necessario
      if (this.authModule.isAuthenticated && this.workoutModule.workouts.length > 0) {
        // Ricarica schede solo se sono già state caricate
        await this.workoutModule.loadWorkouts();
      }
    } catch (error) {
      console.error('Errore durante aggiornamento visibilità:', error);
    }
  }

  // Utility per debugging
  getStatus() {
    return {
      initialized: this.isInitialized,
      supabaseReady: SupabaseManager.isInitialized,
      authenticated: this.authModule?.isAuthenticated || false,
      currentUser: this.authModule?.user || null,
      workoutsCount: this.workoutModule?.workouts.length || 0
    };
  }

  // Metodi pubblici per interazione esterna
  async refreshData() {
    if (!this.isInitialized || !this.authModule.isAuthenticated) return;
    
    try {
      DOMUtils.showLoading();
      await this.workoutModule.loadWorkouts();
      DOMUtils.showAlert('Dati aggiornati', 'success');
    } catch (error) {
      console.error('Errore aggiornamento dati:', error);
      DOMUtils.showAlert('Errore aggiornamento dati', 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  // Cleanup per eventuali test o reload
  destroy() {
    console.log('🧹 Pulizia app...');
    
    // Reset moduli
    this.authModule?.reset?.();
    this.profileModule?.reset?.();
    this.workoutModule?.reset?.();
    
    // Rimuovi riferimenti globali
    delete window.authModule;
    delete window.profileModule;
    delete window.workoutModule;
    delete window.app;
    
    this.isInitialized = false;
  }
}

// =====================
// Bootstrap dell'applicazione
// =====================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('📄 DOM caricato, avvio GymTracker...');
  
  try {
    // Crea e avvia l'app
    window.app = new GymTrackerApp();
    await window.app.init();
    
    // Esponi funzioni di debug nella console
    window.gymTrackerStatus = () => window.app.getStatus();
    window.gymTrackerRefresh = () => window.app.refreshData();
    
  } catch (error) {
    console.error('💥 Errore bootstrap app:', error);
    
    // Fallback di emergenza
    document.body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: red;">Errore di Avvio</h1>
        <p>Impossibile avviare l'applicazione.</p>
        <button onclick="window.location.reload()">Ricarica</button>
      </div>
    `;
  }
});

// Export per eventuale uso in ambienti modulari futuri
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GymTrackerApp;
}