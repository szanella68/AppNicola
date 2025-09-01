/**
 * API Utilities - Gestione chiamate API e comunicazione server
 */
class APIUtils {
  constructor() {
    // Configurazione dinamica API Base
    this.isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    this.API_BASE = this.isLocalhost ? '/api' : '/nicola/api';
    console.log(`[API] Hostname: ${window.location.hostname}, API_BASE: ${this.API_BASE}`);
  }

  async apiRequest(endpoint, options = {}) {
    // 1) prova sessione viva di Supabase
    let token;
    try {
      if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        token = session?.access_token;
      }
    } catch (_) {}

    // 2) fallback al token salvato localmente
    if (!token) token = localStorage.getItem('supabase_token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // API_BASE viene risolto dinamicamente:
    // Sviluppo: '/api/' → localhost:3007/api/
    // Produzione: '/nicola/api/' → zanserver.sytes.net/nicola/api/ → Apache → 3007/api/
    const response = await fetch(this.API_BASE + endpoint, config);
    return response.json();
  }

  // Metodi API specifici per semplificare l'uso nei moduli
  async auth(action, data) {
    return this.apiRequest(`/auth/${action}`, {
      method: 'POST',
      body: data
    });
  }

  async profile(action = '', data = null, method = 'GET') {
    const endpoint = `/profile${action ? `/${action}` : ''}`;
    const options = data ? { method, body: data } : { method };
    return this.apiRequest(endpoint, options);
  }

  async workouts(workoutId = '', data = null, method = 'GET') {
    const endpoint = `/workouts${workoutId ? `/${workoutId}` : ''}`;
    const options = data ? { method, body: data } : { method };
    return this.apiRequest(endpoint, options);
  }

  async exercises(workoutId, exerciseId = '', data = null, method = 'GET') {
    const endpoint = `/workouts/${workoutId}/exercises${exerciseId ? `/${exerciseId}` : ''}`;
    const options = data ? { method, body: data } : { method };
    return this.apiRequest(endpoint, options);
  }

  // Storage utilities
  setAuthData(token, user) {
    localStorage.setItem('supabase_token', token);
    localStorage.setItem('supabase_user', JSON.stringify(user));
  }

  getAuthData() {
    const token = localStorage.getItem('supabase_token');
    const user = localStorage.getItem('supabase_user');
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  }

  clearAuthData() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_user');
  }
}

// Istanza singleton
window.apiUtils = new APIUtils();
window.APIUtils = APIUtils;