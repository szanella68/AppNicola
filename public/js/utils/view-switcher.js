// public/js/utils/view-switcher.js
// Switch tra le viste della SPA (Schede/Dashboard ↔ Calendario).

(function () {
  function $(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }

  async function safeLoadWorkouts() {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        await window.workoutModule?.loadWorkouts?.();
      }
    } catch (e) {
      console.warn('[View] loadWorkouts skipped:', e?.message || e);
    }
  }

  const S = {
    dashboard: async () => {
      show($('dashboard-section'));
      hide($('calendar-section'));
      // 👉 assicurati di caricare/aggiornare le schede quando entri
      await safeLoadWorkouts();
    },
    calendar:  () => {
      hide($('dashboard-section'));
      show($('calendar-section'));
    },
  };

  window.AppView = window.AppView || {};
  window.AppView.showDashboard = S.dashboard;
  window.AppView.showCalendar  = S.calendar;

  window.addEventListener('gt:show-dashboard', () => S.dashboard());
  window.addEventListener('gt:show-calendar',  () => S.calendar());

  document.addEventListener('DOMContentLoaded', () => {
    if (location.hash.startsWith('#/calendar')) S.calendar();
  });
})();
