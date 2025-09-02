// public/js/utils/menu-state.js
// Toggle menu pubblico/privato in base alla sessione + nascondi hero post-login.
// Evidenzia "Schede" / "Calendario" in base alla rotta.

(function () {
  // ------- helpers
  const $id = (x) => document.getElementById(x);
  const show = (n) => n && n.classList.remove('hidden');
  const hide = (n) => n && n.classList.add('hidden');

  function updateGreeting(session) {
    const span = $id('user-name');
    if (!span) return;
    const name =
      session?.user?.user_metadata?.full_name ||
      session?.user?.email ||
      'Utente';
    span.textContent = `Ciao, ${name}!`;
  }

  function markActive(routeName) {
    const links = document.querySelectorAll('#menu-private a');
    links.forEach((a) => a.classList.remove('active'));

    if (routeName === 'dashboard') {
      document
        .querySelector('#menu-private a[href="#/dashboard"]')
        ?.classList.add('active');
    } else if (routeName === 'calendar') {
      document
        .querySelector('#menu-private a[href="#/calendar"]')
        ?.classList.add('active');
    } else if (routeName === 'profile') {
      document
        .querySelector('#menu-private a[href="#/profile"]')
        ?.classList.add('active');
    }
  }

  function toggleHeroAndViews(logged) {
    const hero = $id('hero-section');
    const dash = $id('dashboard-section');
    const cal  = $id('calendar-section');

    if (logged) {
      // in app: niente hero, mostra almeno la dashboard (lo switcher gestisce il resto)
      hide(hero);
      show(dash);
    } else {
      // pubblico: mostra hero, nascondi viste app
      show(hero);
      hide(dash);
      hide(cal);
    }
  }

  function updateMenu(session) {
    const logged = !!session;

    const menuPublic  = $id('menu-public');
    const menuPrivate = $id('menu-private');
    const authBtns    = $id('auth-buttons');
    const userMenu    = $id('user-menu');

    show(menuPublic); // Home sempre visibile

    if (logged) {
      show(menuPrivate);
      hide(authBtns);
      show(userMenu);
      updateGreeting(session);
    } else {
      hide(menuPrivate);
      show(authBtns);
      hide(userMenu);
    }

    toggleHeroAndViews(logged);
  }

  async function getSessionSafe() {
    try {
      if (!window.supabaseClient?.auth) return null;
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return session || null;
    } catch {
      return null;
    }
  }

  // ------- bootstrap (attende Supabase se non pronto)
  function start() {
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      if (window.supabaseClient?.auth) {
        clearInterval(timer);
        updateMenu(await getSessionSafe());
      }
      if (tries > 50) clearInterval(timer); // ~5s di attesa max
    }, 100);
  }

  // Aggiorna su evento auth (emesso dall'AuthModule)
  window.addEventListener('gt:auth', (e) => {
    updateMenu(e?.detail?.session || null);
  });

  // Evidenzia la voce attiva quando cambia rotta
  window.addEventListener('gt:route', (e) => {
    markActive(e.detail?.name);
  });

  document.addEventListener('DOMContentLoaded', start);
})();
