/**
 * Supabase Manager - Gestione inizializzazione Supabase e sessioni
 */
class SupabaseManager {
  static async initialize() {
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase CDN non caricato');
      }
      if (typeof supabase.createClient !== 'function') {
        throw new Error('createClient non disponibile');
      }
      
      // Usa la configurazione caricata dinamicamente
      if (!window.SUPABASE_CONFIG) {
        throw new Error('Configurazione non caricata');
      }
      
      window.supabaseClient = supabase.createClient(
        window.SUPABASE_CONFIG.SUPABASE_URL, 
        window.SUPABASE_CONFIG.SUPABASE_ANON_KEY
      );
      
      console.log('✅ Supabase inizializzato correttamente');
      
      // Gestisce sessioni da hash (conferma email)
      await this.handleSessionFromHash();
      
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
        // Imposta la sessione in Supabase
        await window.supabaseClient.auth.setSession({ 
          access_token, 
          refresh_token 
        });
        
        // Salva nel localStorage
        localStorage.setItem('supabase_token', access_token);
        
        // Ottieni i dati utente
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
          console.error('[Supabase] Errore getUser dopo conferma:', error);
          DOMUtils.showAlert('Errore durante la conferma email. Riprova il login.', 'error');
          return;
        }

        if (user) {
          // Salva dati utente
          const userData = {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email
          };
          
          localStorage.setItem('supabase_user', JSON.stringify(userData));
          
          DOMUtils.showAlert('Email confermata! Benvenuto.', 'success');
          
          // Crea profilo automaticamente se non esiste
          try {
            await window.apiUtils.profile('onboarding', {
              id: user.id,
              email: user.email,
              full_name: userData.fullName
            }, 'POST');
            
            DOMUtils.showAlert('Profilo creato! Verrai reindirizzato all\'onboarding.', 'success');
            
            // Redirect dopo un breve delay
            setTimeout(() => {
              window.location.href = '/nicola/';
            }, 1500);
            
          } catch (err) {
            console.error('Errore onboarding automatico:', err);
            DOMUtils.showAlert('Conferma completata! Procedi con la configurazione.', 'success');
          }
        } else {
          DOMUtils.showAlert('Conferma email riuscita, ma nessun utente trovato. Effettua il login.', 'warning');
        }
        
        // Pulisci URL dalla hash
        history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      console.error('handleSessionFromHash failed:', e);
      DOMUtils.showAlert('Errore di sessione dopo conferma email. Riprova il login.', 'error');
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
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ User signed in');
          break;
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed');
          // Aggiorna il token nel localStorage
          if (session?.access_token) {
            localStorage.setItem('supabase_token', session.access_token);
          }
          break;
      }
    });
  }

  // Utility per verificare se Supabase è inizializzato
  static get isInitialized() {
    return !!window.supabaseClient;
  }

  // Utility per ottenere il client
  static get client() {
    return window.supabaseClient;
  }
}

window.SupabaseManager = SupabaseManager;