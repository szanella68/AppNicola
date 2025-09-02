// =====================
// Configurazione Dinamica
// =====================
// Le configurazioni ora vengono caricate dal server via ConfigLoader

// =====================
// Variabili globali
// =====================
var supabaseClient;
let currentUser = null;
let currentWorkouts = [];
let currentWorkout = null;

// API Base URL (sarà caricato dinamicamente)
// Configurazione dinamica API Base
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
let API_BASE = isLocalhost ? '/api' : '/nicola/api';
console.log(`[API] Hostname: ${window.location.hostname}, API_BASE: ${API_BASE}`);

// =====================
// Utilità UI + API
// =====================
class Utils {
  static showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alertId = 'alert-' + Date.now();
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${type}" style="margin-bottom: 1rem; animation: slideInRight 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${message}</span>
          <button onclick="Utils.closeAlert('${alertId}')" style="background: none; border: none; cursor: pointer; color: inherit; font-size: 1.2rem; padding-left: 1rem;">&times;</button>
        </div>
      </div>`;
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => Utils.closeAlert(alertId), 5000);
  }

  static closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }
  }

  static showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  static hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  static hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // === API REQUEST (con sessione Supabase + fallback + gestione non-JSON) ===
  static async apiRequest(endpoint, options = {}) {
    // 1) prova sessione viva di Supabase
    let token;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      token = session?.access_token;
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
    const response = await fetch(API_BASE + endpoint, config);
    return response.json();

    // Può arrivare HTML (error page) → evita JSON.parse su '<!DOCTYPE ...'
    const isJson = resp.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await resp.json() : await resp.text();

    if (!resp.ok) {
      const msg = isJson && payload?.error ? payload.error : `HTTP ${resp.status}`;
      throw new Error(msg);
    }
    return isJson ? payload : { ok: true, raw: payload };
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

// =====================
// Auth
// =====================
class Auth {
  static async init() {
    console.log('🚀 Inizializzazione Auth...');
    const token = localStorage.getItem('supabase_token');
    const user = localStorage.getItem('supabase_user');

    if (token && user) {
      try {
        currentUser = JSON.parse(user);
        await this.checkUserProfile();
      } catch (e) {
        console.error('Errore ripristino sessione:', e);
        this.logout();
      }
    } else {
      this.showAuthUI();
    }
  }

  static async checkUserProfile() {
    try {
      const response = await Utils.apiRequest('/profile');
      const profile = response.profile;
      if (!profile || !profile.age || !profile.fitness_level) {
        this.showOnboarding();
      } else {
        this.showDashboard();
      }
    } catch (e) {
      console.error('Errore controllo profilo:', e);
      this.showOnboarding();
    }
  }

  static async login(email, password) {
    try {
      Utils.showLoading();
      console.log('🔐 Tentativo login per:', email);
      const response = await Utils.apiRequest('/auth/signin', { method: 'POST', body: { email, password } });

      if (response.session) {
        localStorage.setItem('supabase_token', response.session.access_token);
        localStorage.setItem('supabase_user', JSON.stringify(response.user));
        currentUser = response.user;
        Utils.hideModal('login-modal');
        await this.checkUserProfile();
        Utils.showAlert('Login effettuato con successo!', 'success');
      }
    } catch (e) {
      console.error('Errore login:', e);
      Utils.showAlert('Errore durante il login: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static async signup(email, password, fullName) {
    try {
      Utils.showLoading();
      console.log('📝 Tentativo registrazione per:', email);
      const response = await Utils.apiRequest('/auth/signup', { method: 'POST', body: { email, password, fullName } });

      if (response.needsConfirmation) {
        Utils.hideModal('signup-modal');
        Utils.showAlert('Registrazione completata! Controlla la tua email per confermare l\'account.', 'info');
      } else if (response.session) {
        localStorage.setItem('supabase_token', response.session.access_token);
        localStorage.setItem('supabase_user', JSON.stringify(response.user));
        currentUser = response.user;
        Utils.hideModal('signup-modal');
        this.showOnboarding();
        Utils.showAlert('Registrazione completata con successo!', 'success');
      }
    } catch (e) {
      console.error('Errore registrazione:', e);
      Utils.showAlert('Errore durante la registrazione: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static logout() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_user');
    currentUser = null;
    currentWorkouts = [];
    currentWorkout = null;
    this.showAuthUI();
    Utils.showAlert('Logout effettuato con successo!', 'info');
  }

  static showAuthUI() {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById('hero-section')?.classList.remove('hidden');
    document.getElementById('auth-buttons')?.classList.remove('hidden');
    document.getElementById('user-menu')?.classList.add('hidden');
  }

  static showOnboarding() {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById('onboarding-section')?.classList.remove('hidden');

    document.getElementById('auth-buttons')?.classList.add('hidden');
    document.getElementById('user-menu')?.classList.remove('hidden');

    const userName = document.getElementById('user-name');
    if (userName && currentUser) userName.textContent = `Ciao, ${currentUser.fullName || currentUser.email}!`;
  }

  static showDashboard() {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
    document.getElementById('dashboard-section')?.classList.remove('hidden');

    document.getElementById('auth-buttons')?.classList.add('hidden');
    document.getElementById('user-menu')?.classList.remove('hidden');

    const userName = document.getElementById('user-name');
    if (userName && currentUser) userName.textContent = `Ciao, ${currentUser.fullName || currentUser.email}!`;

    WorkoutManager.loadWorkouts();
  }
}

// =====================
// Profile / Workout manager
// =====================
class Profile {
  static async completeOnboarding(profileData) {
    try {
      Utils.showLoading();
      await Utils.apiRequest('/profile/onboarding', { method: 'POST', body: profileData });
      Utils.showAlert('Profilo configurato con successo!', 'success');
      Auth.showDashboard();
    } catch (e) {
      console.error('Errore onboarding:', e);
      Utils.showAlert('Errore durante la configurazione: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }
}

class WorkoutManager {
  static async loadWorkouts() {
    try {
      Utils.showLoading();
      const response = await Utils.apiRequest('/workouts');
      currentWorkouts = response.workoutPlans || [];
      this.renderWorkouts();
    } catch (e) {
      console.error('Errore caricamento schede:', e);
      Utils.showAlert('Errore nel caricamento delle schede: ' + e.message, 'error');
      currentWorkouts = [];
      this.renderWorkouts();
    } finally {
      Utils.hideLoading();
    }
  }

  static renderWorkouts() {
    const grid = document.getElementById('workouts-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid || !emptyState) return;

    if (currentWorkouts.length === 0) {
      grid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = currentWorkouts.map(workout => `
      <div class="card" onclick="WorkoutManager.showWorkoutDetail('${workout.id}')">
        <div class="card-header">
          <h3>${workout.name}</h3>
          ${workout.description ? `<p class="text-secondary">${workout.description}</p>` : ''}
        </div>
        <div class="card-body">
          <div class="flex justify-between items-center">
            <span class="text-secondary">
              <i class="fas fa-list"></i>
              ${workout.exercises.length} esercizi
            </span>
            <span class="text-secondary text-sm">
              ${Utils.formatDate(workout.created_at)}
            </span>
          </div>
        </div>
        <div class="card-footer">
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm flex-1" onclick="event.stopPropagation(); WorkoutManager.showWorkoutDetail('${workout.id}')">
              <i class="fas fa-eye"></i> Visualizza
            </button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); WorkoutManager.deleteWorkout('${workout.id}', '${workout.name}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  static async showWorkoutDetail(workoutId) {
    try {
      Utils.showLoading();
      const response = await Utils.apiRequest(`/workouts/${workoutId}`);
      currentWorkout = response.workoutPlan;

      document.getElementById('dashboard-section')?.classList.add('hidden');
      document.getElementById('workout-detail-section')?.classList.remove('hidden');

      document.getElementById('workout-title').textContent = currentWorkout.name;
      document.getElementById('workout-description').textContent = currentWorkout.description || '';

      this.renderExercises();
    } catch (e) {
      console.error('Errore visualizzazione scheda:', e);
      Utils.showAlert('Errore nel caricamento della scheda: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static renderExercises() {
    const container = document.getElementById('exercises-list');
    if (!container) return;

    if (!currentWorkout.exercises || currentWorkout.exercises.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4">
          <i class="fas fa-plus-circle text-4xl text-secondary mb-4"></i>
          <h4>Nessun esercizio</h4>
          <p class="text-secondary mb-4">Aggiungi il primo esercizio a questa scheda</p>
          <button onclick="Utils.showModal('add-exercise-modal')" class="btn btn-primary">
            <i class="fas fa-plus"></i> Aggiungi Esercizio
          </button>
        </div>`;
      return;
    }

    container.innerHTML = currentWorkout.exercises.map(exercise => `
      <div class="exercise-item">
        <div class="exercise-info">
          <h4>${exercise.name}</h4>
          <p>${exercise.sets} serie × ${exercise.reps} ripetizioni</p>
          ${exercise.notes ? `<p class="text-sm text-secondary"><i class="fas fa-sticky-note"></i> ${exercise.notes}</p>` : ''}
        </div>
        <div class="exercise-actions">
          <button class="btn btn-secondary btn-sm" onclick="WorkoutManager.editExercise('${exercise.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="WorkoutManager.deleteExercise('${exercise.id}', '${exercise.name}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  static async createWorkout(workoutData) {
    try {
      Utils.showLoading();
      await Utils.apiRequest('/workouts', { method: 'POST', body: workoutData });
      Utils.hideModal('new-workout-modal');
      Utils.showAlert('Scheda creata con successo!', 'success');
      await this.loadWorkouts();

      // reset mini-form
      const form = document.getElementById('new-workout-form');
      if (form) form.reset();
      const container = document.getElementById('exercises-container');
      if (container) {
        container.innerHTML = `
          <div class="exercise-form">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <input type="text" class="form-input exercise-name" placeholder="Nome esercizio (es. Panca piana)">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <select class="form-select exercise-sets">
                  <option value="">Serie</option>
                  <option value="1">1 serie</option>
                  <option value="2">2 serie</option>
                  <option value="3">3 serie</option>
                  <option value="4">4 serie</option>
                  <option value="5">5 serie</option>
                  <option value="6">6 serie</option>
                </select>
                <select class="form-select exercise-reps">
                  <option value="">Reps</option>
                  <option value="5">5 reps</option>
                  <option value="6">6 reps</option>
                  <option value="8">8 reps</option>
                  <option value="10">10 reps</option>
                  <option value="12">12 reps</option>
                  <option value="15">15 reps</option>
                  <option value="20">20 reps</option>
                </select>
              </div>
            </div>
          </div>`;
      }
    } catch (e) {
      console.error('Errore creazione scheda:', e);
      Utils.showAlert('Errore nella creazione della scheda: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static async deleteWorkout(id, name) {
    if (!confirm(`Sei sicuro di voler eliminare la scheda "${name}"?`)) return;
    try {
      Utils.showLoading();
      await Utils.apiRequest(`/workouts/${id}`, { method: 'DELETE' });
      Utils.showAlert('Scheda eliminata con successo!', 'success');
      await this.loadWorkouts();
    } catch (e) {
      console.error('Errore eliminazione scheda:', e);
      Utils.showAlert('Errore nell\'eliminazione della scheda: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static async addExercise(exerciseData) {
    if (!currentWorkout) return;
    try {
      Utils.showLoading();
      await Utils.apiRequest(`/workouts/${currentWorkout.id}/exercises`, { method: 'POST', body: exerciseData });
      Utils.hideModal('add-exercise-modal');
      Utils.showAlert('Esercizio aggiunto con successo!', 'success');
      document.getElementById('add-exercise-form-single')?.reset();
      await this.showWorkoutDetail(currentWorkout.id);
    } catch (e) {
      console.error('Errore nell\'aggiunta dell\'esercizio:', e);
      Utils.showAlert('Errore nell\'aggiunta dell\'esercizio: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static async deleteExercise(exerciseId, exerciseName) {
    if (!confirm(`Eliminare l'esercizio "${exerciseName}"?`)) return;
    try {
      Utils.showLoading();
      await Utils.apiRequest(`/workouts/${currentWorkout.id}/exercises/${exerciseId}`, { method: 'DELETE' });
      Utils.showAlert('Esercizio eliminato con successo!', 'success');
      await this.showWorkoutDetail(currentWorkout.id);
    } catch (e) {
      console.error('Errore eliminazione esercizio:', e);
      Utils.showAlert('Errore nell\'eliminazione dell\'esercizio: ' + e.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  }

  static backToDashboard() {
    document.getElementById('workout-detail-section')?.classList.add('hidden');
    document.getElementById('dashboard-section')?.classList.remove('hidden');
    currentWorkout = null;
  }

  static addExerciseForm() {
    const container = document.getElementById('exercises-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'exercise-form';
    div.innerHTML = `
      <div class="grid grid-cols-2 gap-4 mb-4" style="position: relative;">
        <div><input type="text" class="form-input exercise-name" placeholder="Nome esercizio"></div>
        <div class="grid grid-cols-2 gap-4">
          <select class="form-select exercise-sets">
            <option value="">Serie</option><option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
          </select>
          <select class="form-select exercise-reps">
            <option value="">Reps</option><option value="5">5</option><option value="6">6</option><option value="8">8</option>
            <option value="10">10</option><option value="12">12</option><option value="15">15</option><option value="20">20</option>
          </select>
        </div>
        <button type="button" class="remove-exercise" style="position:absolute;top:0;right:-2rem;background:var(--danger-color);color:#fff;border:none;border-radius:50%;width:1.5rem;height:1.5rem;cursor:pointer;font-size:.75rem;">&times;</button>
      </div>`;
    div.querySelector('.remove-exercise').addEventListener('click', () => div.remove());
    container.appendChild(div);
  }

  static editExercise(exerciseId) {
    console.log('✏️ Modifica esercizio:', exerciseId);
    Utils.showAlert('Funzionalità in arrivo!', 'info');
  }
}

// =====================
// Supabase init + hash session
// =====================
function initializeSupabase() {
  try {
    if (typeof supabase === 'undefined') throw new Error('Supabase CDN non caricato');
    if (typeof supabase.createClient !== 'function') throw new Error('createClient non disponibile');
    
    // Usa la configurazione caricata dinamicamente
    if (!window.SUPABASE_CONFIG) throw new Error('Configurazione non caricata');
    
    supabaseClient = supabase.createClient(
      window.SUPABASE_CONFIG.SUPABASE_URL, 
      window.SUPABASE_CONFIG.SUPABASE_ANON_KEY
    );
  window.supabaseClient = supabaseClient;  // <— così lo vedi dalla console
  console.log('✅ Supabase inizializzato correttamente');
  // Avvia la gestione della sessione da hash (conferma email)
  hydrateSessionFromHash();
  return true;
  } catch (e) {
    console.error('❌ Errore inizializzazione Supabase:', e);
    return false;
  }
}

// Beve i token dall'hash (#access_token=...&refresh_token=...)
async function hydrateSessionFromHash() {
  const hash = window.location.hash?.slice(1);
  if (!hash || !hash.includes('access_token=')) {
    console.log('[Supabase] Nessun access_token trovato nella hash.');
    return;
  }
  const p = new URLSearchParams(hash);
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  const type = p.get('type');

  console.log(`[Supabase] hydrateSessionFromHash: access_token=${access_token}, refresh_token=${refresh_token}, type=${type}`);

  try {
    if (access_token) {
      await supabaseClient.auth.setSession({ access_token, refresh_token });
      localStorage.setItem('supabase_token', access_token);
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) {
        console.error('[Supabase] Errore getUser dopo conferma:', error);
        Utils.showAlert('Errore durante la conferma email. Riprova il login.', 'error');
      }
      if (user) {
        localStorage.setItem('supabase_user', JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email
        }));
        Utils.showAlert('Email confermata! Benvenuto.', 'success');
        // Avvia onboarding automatico e redirect
        try {
          await Utils.apiRequest('/profile/onboarding', {
            method: 'POST',
            body: { id: user.id, email: user.email, fullName: user.user_metadata?.full_name || user.email }
          });
          Utils.showAlert('Profilo creato! Verrai reindirizzato all’onboarding.', 'success');
          setTimeout(() => {
            window.location.href = '/nicola/onboarding.html';
          }, 1200);
        } catch (err) {
          console.error('Errore onboarding automatico:', err);
          Utils.showAlert('Errore creazione profilo. Puoi riprovare dalla dashboard.', 'warning');
        }
      } else {
        Utils.showAlert('Conferma email riuscita, ma nessun utente trovato. Effettua il login.', 'warning');
      }
      history.replaceState(null, '', window.location.pathname); // pulisci URL
    }
  } catch (e) {
    console.error('hydrateSessionFromHash failed:', e);
    Utils.showAlert('Errore di sessione dopo conferma email. Riprova il login.', 'error');
  }
}

// =====================
// Event listeners & bootstrap
// =====================
function setupEventListeners() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const heroLoginBtn = document.getElementById('hero-login-btn');
  const heroSignupBtn = document.getElementById('hero-signup-btn');
  const logoutBtn = document.getElementById('logout-btn');

  loginBtn?.addEventListener('click', () => Utils.showModal('login-modal'));
  signupBtn?.addEventListener('click', () => Utils.showModal('signup-modal'));
  heroLoginBtn?.addEventListener('click', () => Utils.showModal('login-modal'));
  heroSignupBtn?.addEventListener('click', () => Utils.showModal('signup-modal'));
 logoutBtn?.addEventListener('click', () => Auth.logout());

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) Utils.hideModal(modal.id);
    });
  });

  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');
  showSignupLink?.addEventListener('click', (e) => { e.preventDefault(); Utils.hideModal('login-modal'); Utils.showModal('signup-modal'); });
  showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); Utils.hideModal('signup-modal'); Utils.showModal('login-modal'); });

  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    if (email && password) Auth.login(email, password);
  });

  const signupForm = document.getElementById('signup-form');
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const fullName = document.getElementById('signup-name')?.value;
    if (email && password) Auth.signup(email, password, fullName);
  });

  const onboardingForm = document.getElementById('onboarding-form');
  onboardingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('full-name')?.value;
    const age = document.getElementById('age')?.value;
    const fitnessLevel = document.getElementById('fitness-level')?.value;
    const goals = document.getElementById('goals')?.value;
    if (age && fitnessLevel) Profile.completeOnboarding({
      full_name: fullName,
      age: parseInt(age),
      fitness_level: fitnessLevel,
      goals
    });
  });

  const newWorkoutBtn = document.getElementById('new-workout-btn');
  const emptyNewWorkoutBtn = document.getElementById('empty-new-workout-btn');
  newWorkoutBtn?.addEventListener('click', () => Utils.showModal('new-workout-modal'));
  emptyNewWorkoutBtn?.addEventListener('click', () => Utils.showModal('new-workout-modal'));

  const newWorkoutForm = document.getElementById('new-workout-form');
  newWorkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('workout-name')?.value;
    const description = document.getElementById('workout-description-input')?.value;

    const exercises = [];
    document.querySelectorAll('.exercise-form').forEach(form => {
      const n = form.querySelector('.exercise-name')?.value;
      const s = form.querySelector('.exercise-sets')?.value;
      const r = form.querySelector('.exercise-reps')?.value;
      if (n && s && r) exercises.push({ name: n, sets: parseInt(s), reps: parseInt(r) });
    });

    if (name) WorkoutManager.createWorkout({ name, description, exercises });
  });

  const addExerciseFormBtn = document.getElementById('add-exercise-form');
  addExerciseFormBtn?.addEventListener('click', WorkoutManager.addExerciseForm);

  const backToDashboardBtn = document.getElementById('back-to-dashboard');
  const addExerciseBtn = document.getElementById('add-exercise-btn');
  backToDashboardBtn?.addEventListener('click', WorkoutManager.backToDashboard);
  addExerciseBtn?.addEventListener('click', () => Utils.showModal('add-exercise-modal'));

  const addExerciseFormSingle = document.getElementById('add-exercise-form-single');
  addExerciseFormSingle?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('single-exercise-name')?.value;
    const sets = document.getElementById('single-exercise-sets')?.value;
    const reps = document.getElementById('single-exercise-reps')?.value;
    const notes = document.getElementById('single-exercise-notes')?.value;
    if (name && sets && reps) WorkoutManager.addExercise({
      name, sets: parseInt(sets), reps: parseInt(reps), notes
    });
  });
}

// =====================
// Bootstrap
// =====================
document.addEventListener('DOMContentLoaded', async function () {
  console.log('🚀 GymTracker DOM loaded!');
  try {
    // Carica configurazione dal server
    const config = await ConfigLoader.loadConfig();
    // Sovrascrivi API_BASE solo se non sei in locale
    if (!isLocalhost && config.API_BASE) {
      API_BASE = config.API_BASE;
      console.log(`[API] API_BASE sovrascritto da config: ${API_BASE}`);
    }

    // Inizializza Supabase con la config caricata
    if (!initializeSupabase()) return;

    // Listener UI
    setupEventListeners();

    // Importa eventuale sessione dall'hash (post conferma email)
    if (window.location.hash.includes('access_token=')) {
      await hydrateSessionFromHash();
    }

    // Avvio auth/dashboard
    await Auth.init();
    console.log('✅ GymTracker avviato con successo!');
  } catch (error) {
    console.error('💥 Errore avvio app:', error);
    Utils?.showAlert?.('Errore di inizializzazione. Ricarica la pagina.', 'error');
  }
});

// =====================
// CSS animazioni + handlers globali
// =====================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOutRight{ from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

window.addEventListener('error', (event) => {
  console.error('💥 Errore JavaScript:', event.error);
  if (Utils?.showAlert) Utils.showAlert('Si è verificato un errore. Ricarica la pagina se persiste.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Promise rejection non gestita:', event.reason);
  if (Utils?.showAlert) Utils.showAlert('Errore di connessione. Controlla la rete e riprova.', 'error');
});
