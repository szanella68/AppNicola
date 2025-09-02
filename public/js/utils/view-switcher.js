// public/js/utils/view-switcher.js
// Switch tra le viste della SPA - SAFE per produzione sytes.net

(function () {
  function $(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }

  // Detection ambiente
  const isProduction = !['localhost', '127.0.0.1'].includes(window.location.hostname);
  const baseDelay = isProduction ? 1000 : 300; // Delay maggiore in produzione

  async function safeLoadWorkouts() {
    try {
      // Controllo sicurezza: è inizializzato e autenticato?
      if (!window.supabaseClient?.auth) {
        console.log('[View] Supabase non ancora pronto, skip loadWorkouts');
        return false; // Indica fallimento per retry
      }

      // Controllo sessione in modo sicuro
      let session;
      try {
        const { data } = await window.supabaseClient.auth.getSession();
        session = data?.session;
      } catch (e) {
        console.log('[View] getSession fallito:', e?.message || e);
        return false; // Retry possibile
      }

      if (!session) {
        console.log('[View] Nessuna sessione attiva, skip loadWorkouts');
        return true; // Non è un errore, è normale
      }

      // Controllo modulo workout
      if (!window.workoutModule?.loadWorkouts) {
        console.log('[View] WorkoutModule non ancora pronto, skip loadWorkouts');
        return false; // Retry possibile
      }

      console.log('[View] ✅ Caricando schede...');
      await window.workoutModule.loadWorkouts();
      console.log('[View] ✅ Schede caricate');
      return true; // Successo
      
    } catch (e) {
      console.warn('[View] Errore loadWorkouts:', e?.message || e);
      return false; // Retry possibile
    }
  }

  // Funzione di caricamento con retry intelligente per produzione
  async function safeLoadWorkoutsWithRetry() {
    const maxRetries = isProduction ? 5 : 3;
    const delay = baseDelay;
    
    console.log(`[View] Avvio caricamento (env: ${isProduction ? 'prod' : 'dev'}, maxRetries: ${maxRetries})`);
    
    for (let i = 0; i < maxRetries; i++) {
      const success = await safeLoadWorkouts();
      
      if (success) {
        if (i > 0) console.log(`[View] ✅ Successo al tentativo ${i + 1}`);
        return true;
      }
      
      if (i < maxRetries - 1) {
        const currentDelay = delay * (i + 1); // Delay crescente
        console.log(`[View] Tentativo ${i + 1}/${maxRetries} fallito, retry in ${currentDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }
    
    console.warn('[View] ⚠️ Tutti i tentativi di caricamento falliti');
    return false;
  }

  const S = {
    dashboard: async () => {
      console.log('[View] Switching to dashboard');
      show($('dashboard-section'));
      hide($('calendar-section'));
      
      // Caricamento asincrono con delay adattivo
      setTimeout(() => {
        safeLoadWorkoutsWithRetry();
      }, baseDelay / 3); // 100ms locale, 333ms produzione
    },
    
    calendar: () => {
      console.log('[View] Switching to calendar');
      hide($('dashboard-section'));
      show($('calendar-section'));
    },
  };

  // Funzione per aspettare che l'app sia completamente inizializzata
  async function waitForAppReady(maxWait = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (window.supabaseClient?.auth && 
          window.workoutModule?.loadWorkouts &&
          window.app?.isInitialized) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('[View] Timeout waiting for app ready');
    return false;
  }

  // API pubblica
  window.AppView = window.AppView || {};
  window.AppView.showDashboard = S.dashboard;
  window.AppView.showCalendar = S.calendar;

  // Event listeners
  window.addEventListener('gt:show-dashboard', async () => {
    console.log('[View] Evento gt:show-dashboard ricevuto');
    S.dashboard();
  });
  
  window.addEventListener('gt:show-calendar', () => {
    console.log('[View] Evento gt:show-calendar ricevuto');
    S.calendar();
  });

  // Listener per auth changes - ricarica schede quando user fa login
  window.addEventListener('gt:auth', async (e) => {
    const session = e?.detail?.session;
    const event = e?.detail?.event;
    
    console.log('[View] Auth event:', event, !!session);
    
    if (event === 'SIGNED_IN' && session) {
      // Aspetta che l'app sia pronta prima di caricare
      console.log('[View] Post-login: aspettando app ready...');
      const ready = await waitForAppReady();
      
      if (ready) {
        setTimeout(() => {
          const dashboardVisible = !$('dashboard-section')?.classList.contains('hidden');
          if (dashboardVisible) {
            console.log('[View] Post-login: ricaricando schede');
            safeLoadWorkoutsWithRetry();
          }
        }, baseDelay); // Delay adattivo per produzione
      }
    }
  });

  // Inizializzazione DOM con delay per produzione
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[View] DOM ready, ambiente:', isProduction ? 'produzione' : 'sviluppo');
    
    // Controllo iniziale hash con delay maggiore in produzione
    setTimeout(() => {
      if (location.hash.startsWith('#/calendar')) {
        console.log('[View] Hash iniziale: calendario');
        S.calendar();
      } else if (location.hash.startsWith('#/dashboard')) {
        console.log('[View] Hash iniziale: dashboard');
        // Non caricare schede qui - troppo presto
      }
    }, isProduction ? 500 : 100);
  });

  // Debug utilities
  window.ViewSwitcher = {
    loadWorkouts: safeLoadWorkouts,
    loadWorkoutsWithRetry: safeLoadWorkoutsWithRetry,
    showDashboard: S.dashboard,
    showCalendar: S.calendar,
    waitForAppReady,
    isProduction,
    baseDelay
  };

  console.log('[View] ViewSwitcher caricato, ambiente:', isProduction ? 'produzione' : 'sviluppo');
})();