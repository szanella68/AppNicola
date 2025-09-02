// public/js/utils/hash-router.js
// Micro router per SPA basato su hash. Non fa UI: emette eventi e usa hook soft se esistono.
// Rotte: #/dashboard • #/calendar • #/profile • #/workout/:id • #/login • #/signup
(function () {
  const ROUTES = [
    { name: "dashboard", re: /^#\/dashboard\/?$/ },
    { name: "calendar",  re: /^#\/calendar\/?$/ },
    { name: "profile",   re: /^#\/profile\/?$/ },
    { name: "workout",   re: /^#\/workout\/([^/]+)\/?$/ },
    { name: "login",     re: /^#\/login\/?$/ },
    { name: "signup",    re: /^#\/signup\/?$/ },
  ];

  function parseHash(h) {
    const hash = (h ?? location.hash ?? "").trim();
    for (const r of ROUTES) {
      const m = hash.match(r.re);
      if (m) {
        const params = {};
        if (r.name === "workout") params.id = decodeURIComponent(m[1]);
        return { name: r.name, params };
      }
    }
    return hash
      ? { name: "unknown", params: { raw: hash } }
      : { name: "default", params: {} };
  }

  function emit(route) {
    try {
      window.dispatchEvent(new CustomEvent("gt:route", { detail: route }));
    } catch (e) {
      console.warn("[Router] emit error:", e);
    }

    // Hook soft opzionali: chiamiamo se esistono
    try {
      if (route.name === "dashboard" && window.AppView?.showDashboard)   window.AppView.showDashboard();
      if (route.name === "calendar"  && window.AppView?.showCalendar)    window.AppView.showCalendar();
      if (route.name === "profile"   && window.Profile?.open)            window.Profile.open();
      if (route.name === "workout"   && window.Workout?.openById && route.params.id)
        window.Workout.openById(route.params.id);

      // Rotte che aprono direttamente le modali di auth
      if (route.name === "login") {
        if (window.Auth?.openLogin) {
          window.Auth.openLogin();
        } else {
          const btn = document.getElementById("login-btn");
          if (btn) try { btn.click(); } catch {}
          window.dispatchEvent(new CustomEvent("gt:open-login"));
        }
      }
      if (route.name === "signup") {
        if (window.Auth?.openSignup) {
          window.Auth.openSignup();
        } else {
          const btn = document.getElementById("signup-btn") || document.getElementById("show-signup");
          if (btn) try { btn.click(); } catch {}
          window.dispatchEvent(new CustomEvent("gt:open-signup"));
        }
      }

      // Fallback eventi view-specifici (se non hai AppView)
      if (route.name === "calendar")  window.dispatchEvent(new CustomEvent("gt:show-calendar"));
      if (route.name === "dashboard") window.dispatchEvent(new CustomEvent("gt:show-dashboard"));

    } catch (e) {
      console.warn("[Router] hook error:", e);
    }
  }

  function handle() {
    const route = parseHash();
    console.log("[Router]", route);
    emit(route);
    return route;
  }

  function navigateTo(name, params = {}) {
    let hash = "";
    if (name === "dashboard") hash = "#/dashboard";
    else if (name === "calendar") hash = "#/calendar";
    else if (name === "profile")  hash = "#/profile";
    else if (name === "login")    hash = "#/login";
    else if (name === "signup")   hash = "#/signup";
    else if (name === "workout" && params.id) hash = "#/workout/" + encodeURIComponent(params.id);
    else hash = "#/dashboard";

    if (location.hash === hash) { handle(); return; }
    location.hash = hash; // triggerà handle() via hashchange
  }

  // API pubblica minimale
  window.GTRouter = {
    parse: parseHash,
    navigateTo,
    current: () => parseHash(),
    start: () => handle(),
  };

  // Eventi
  window.addEventListener("hashchange", handle, false);
  document.addEventListener("DOMContentLoaded", () => {
    if (location.hash) handle();
  });
})();
