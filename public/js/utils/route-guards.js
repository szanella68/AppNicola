// public/js/utils/route-guards.js
// Controllo accesso per rotte SPA con timing migliorato
(function () {
  const PROTECTED = new Set(["dashboard", "calendar", "profile", "workout"]);
  let _supabaseReady = false;

  async function isLoggedIn() {
    try {
      const client = window.supabaseClient;
      if (!client?.auth) {
        console.log('[Guard] Supabase client non ancora pronto');
        return false;
      }
      const { data: { session } } = await client.auth.getSession();
      return !!session;
    } catch (e) {
      console.warn('[Guard] Errore controllo sessione:', e?.message);
      return false;
    }
  }

  async function onRoute(e) {
    const route = e.detail || {};
    
    // Solo rotte protette
    if (!PROTECTED.has(route.name)) {
      console.log(`[Guard] Rotta "${route.name}" non protetta, ok`);
      return;
    }

    console.log(`[Guard] Verificando auth per rotta protetta: ${route.name}`);

    // Aspetta che Supabase sia pronto (max 3 secondi)
    if (!_supabaseReady) {
      console.log('[Guard] Aspettando che Supabase sia pronto...');
      let attempts = 0;
      while (!window.supabaseClient?.auth && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (window.supabaseClient?.auth) {
        _supabaseReady = true;
        console.log('[Guard] ✅ Supabase pronto');
      } else {
        console.warn('[Guard] ⚠️ Timeout Supabase, procedo comunque');
      }
    }

    const isAuth = await isLoggedIn();
    console.log(`[Guard] Utente autenticato: ${isAuth}`);

    if (!isAuth) {
      console.warn(`[Guard] 🚫 Accesso negato a "${route.name}" - auth richiesta`);
      
      // Emetti evento per far reagire l'app (es. aprire login modal)
      window.dispatchEvent(new CustomEvent("gt:auth-required", { 
        detail: { route, reason: 'not_authenticated' }
      }));

      // QoL: prova a mettere il focus sul bottone login se esiste
      setTimeout(() => {
        const btn = document.getElementById("login-btn") || document.getElementById("hero-login-btn");
        if (btn) { 
          try { 
            btn.focus(); 
            btn.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => btn.style.animation = '', 500);
          } catch {} 
        }
      }, 100);

      // Redirect a login se non in modalità SPA
      if (route.name !== 'login' && route.name !== 'signup') {
        setTimeout(() => {
          if (window.GTRouter?.navigateTo) {
            window.GTRouter.navigateTo('login');
          }
        }, 200);
      }
    } else {
      console.log(`[Guard] ✅ Accesso consentito a "${route.name}"`);
    }
  }

  // Listener principale
  window.addEventListener("gt:route", onRoute);

  // Listener per auth state changes (così aggiorniamo _supabaseReady)
  window.addEventListener("gt:auth", (e) => {
    _supabaseReady = true;
    console.log('[Guard] Auth state aggiornato, Supabase pronto');
  });

  // Controllo iniziale più conservativo
  document.addEventListener("DOMContentLoaded", () => {
    // Aspetta un po' prima del controllo iniziale
    setTimeout(() => {
      if (location.hash && location.hash.length > 1) {
        console.log('[Guard] Controllo iniziale per hash:', location.hash);
        const current = window.GTRouter?.current?.() || { name: "default", params: {} };
        if (current.name && current.name !== 'default') {
          window.dispatchEvent(new CustomEvent("gt:route", { detail: current }));
        }
      }
    }, 500); // Ritardo di 500ms per dare tempo a Supabase di inizializzarsi
  });

  // Debug export
  window.RouteGuard = {
    isReady: () => _supabaseReady,
    checkAuth: isLoggedIn,
    setReady: (ready) => { _supabaseReady = ready; }
  };
})();