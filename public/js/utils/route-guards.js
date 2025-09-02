// public/js/utils/route-guards.js
// Controllo accesso per rotte SPA. Non modifica la UI: emette solo un evento.
// Rotte protette: dashboard, calendar, profile, workout/:id
(function () {
  const PROTECTED = new Set(["dashboard", "calendar", "profile", "workout"]);

  async function isLoggedIn() {
    try {
      const client = window.supabaseClient;
      if (!client?.auth) return false;
      const { data: { session } } = await client.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  async function onRoute(e) {
    const route = e.detail || {};
    if (!PROTECTED.has(route.name)) return;

    const ok = await isLoggedIn();
    if (!ok) {
      console.warn("[Guard] Auth richiesta per rotta:", route);
      // Notifica: l'app può reagire aprendo la modale di login
      window.dispatchEvent(new CustomEvent("gt:auth-required", { detail: route }));

      // QoL: prova a mettere il focus sul bottone login se esiste
      const btn = document.getElementById("login-btn") || document.getElementById("hero-login-btn");
      if (btn) { try { btn.focus(); } catch {} }
    }
  }

  window.addEventListener("gt:route", onRoute);

  // Se c'è già un hash all'avvio, forza un controllo iniziale dopo che il DOM è pronto
  document.addEventListener("DOMContentLoaded", () => {
    if (location.hash) {
      setTimeout(() => {
        const current = window.GTRouter?.current?.() || { name: "default", params: {} };
        window.dispatchEvent(new CustomEvent("gt:route", { detail: current }));
      }, 0);
    }
  });
})();
