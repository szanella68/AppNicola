/**
 * Supabase Manager - Gestione inizializzazione Supabase e sessioni
 */
class SupabaseManager {
  static _booted = false;

  static async initialize() {
    try {
      if (this._booted && window.supabaseClient) {
        return true; // già inizializzato
      }
      if (typeof supabase === 'undefined') throw new Error('Supabase CDN non caricato');
      if (typeof supabase.createClient !== 'function') throw new Error('createClient non disponibile');
      if (!window.SUPABASE_CONFIG) throw new Error('Configurazione non caricata');

      // Client con persistenza robusta
      window.supabaseClient = supabase.createClient(
        window.SUPABASE_CONFIG.SUPABASE_URL,
        window.SUPABASE_CONFIG.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: localStorage, // esplicito
          },
        }
      );

      console.log('✅ Supabase inizializzato correttamente');

      // Gestisce eventuale conferma via hash (ok anche con detectSessionInUrl)
      await this.handleSessionFromHash();

      this._booted = true;
      return true;
    } catch (e) {
      console.error('❌ Errore inizializzazione Supabase:', e);
      return false;
    }
  }

  // Gestisce i token dall'hash (#access_token=...&refresh_token=...)
  static async handleSessionFromHash() {
    const hash = window.location.hash?.slice(1);
    if (!hash || !hash.includes('access_token=')) {
      console.log('[Supabase] Nessun access_token trovato nella hash.');
      return;
    }

    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');

    console.log(`[Supabase] handleSessionFromHash: access_token=${access_token?.substring(0, 20)}..., type=${type}`);

    try {
      if (access_token && window.supabaseClient) {
        // Imposta la sessione in Supabase (persistita)
        await window.supabaseClient.auth.setSession({ access_token, refresh_token });

        // Pulisci URL dalla hash per non rielaborarla
        history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      console.error('handleSessionFromHash failed:', e);
      DOMUtils?.showAlert?.('Errore di sessione dopo conferma email. Riprova il login.', 'error');
    }
  }

  // Verifica stato sessione corrente
  static async getSession() {
    try {
      if (!window.supabaseClient) return null;
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;
      return session;
    } catch (e) {
      console.error('Errore ottenimento sessione:', e);
      return null;
    }
  }

  // Ottieni utente corrente
  static async getCurrentUser() {
    try {
      if (!window.supabaseClient) return null;
      const { data: { user }, error } = await window.supabaseClient.auth.getUser();
      if (error) throw error;
      return user;
    } catch (e) {
      console.error('Errore ottenimento utente corrente:', e);
      return null;
    }
  }

  // Setup listeners per cambi di stato auth
  static setupAuthStateListener() {
    if (!window.supabaseClient) return;

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase] Auth state change:', event, session?.user?.id);

      // Piccolo aggancio per chi ascolta (es. menu-state)
      try {
        window.dispatchEvent(new CustomEvent('gt:auth', { detail: { event, session } }));
      } catch {}

      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ User signed in');
          break;
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed');
          break;
      }
    });
  }

  static get isInitialized() {
    return !!window.supabaseClient;
  }

  static get client() {
    return window.supabaseClient;
  }
}

window.SupabaseManager = SupabaseManager;
