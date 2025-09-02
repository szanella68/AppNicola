// public/js/utils/entry-redirect.js
// Gate d'ingresso per la SPA:
// - Se NON loggato e NON su #/login o #/signup -> redirect a home.html
// - Se loggato -> assicura il toggle del menu privato

(function () {
  const ALLOW_NO_AUTH = new Set(['#/login', '#/signup']);

  function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
  }

  function toggleMenu(hasSession, session) {
    const menuPrivate = document.getElementById('menu-private');
    const authBtns    = document.getElementById('auth-buttons');
    const userMenu    = document.getElementById('user-menu');
    if (hasSession) {
      if (menuPrivate) menuPrivate.classList.remove('hidden');
      if (authBtns)    authBtns.classList.add('hidden');
      if (userMenu)    userMenu.classList.remove('hidden');
      const span = document.getElementById('user-name');
      const name = session?.user?.user_metadata?.full_name || session?.user?.email || 'Utente';
      if (span) span.textContent = `Ciao, ${name}!`;
    } else {
      if (menuPrivate) menuPrivate.classList.add('hidden');
      if (authBtns)    authBtns.classList.remove('hidden');
      if (userMenu)    userMenu.classList.add('hidden');
    }
  }

  async function checkAndAct() {
    const hash = location.hash || '';
    try {
      if (!window.supabaseClient?.auth) return false; // client non pronto, ritenta
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      const logged = !!session;

      if (!logged && !ALLOW_NO_AUTH.has(hash)) {
        // fuori dall'area login/signup senza sessione -> torna a home
        location.href = 'home.html';
        return true;
      }

      // sessione presente -> forza toggle menu (failsafe)
      if (logged) toggleMenu(true, session);
      return true;
    } catch {
      return false;
    }
  }

  // Aggancia anche l'evento auth (quando cambia stato)
  window.addEventListener('gt:auth', (e) => {
    const session = e?.detail?.session || null;
    toggleMenu(!!session, session || undefined);
  });

  // Avvio: aspetta che il client sia pronto (max ~3s)
  ready(() => {
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      const done = await checkAndAct();
      if (done || tries > 30) clearInterval(timer);
    }, 100);
  });
})();
