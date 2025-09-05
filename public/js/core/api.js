// Supabase API Integration for GymTracker
// Handles all backend API calls with proper error handling and user feedback

class API {
    constructor() {
        // Dynamic base URL detection for development vs production
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        this.baseURL = isLocalhost ? '/api' : '/nicola/api';
        
        console.log(`[API] Hostname: ${window.location.hostname}, BaseURL: ${this.baseURL}`);
        
        this.supabase = null;
        this.initialized = false;
    }

    // Initialize Supabase client
    async init() {
        if (this.initialized) return;
        
        try {
            // Get public config from server
            const response = await fetch(`${this.baseURL}/config/public`);
            if (!response.ok) throw new Error('Failed to get config');
            
            const config = await response.json();
            
            // Initialize Supabase client (if available globally)
            if (typeof createClient !== 'undefined') {
                this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('API initialization failed:', error);
            throw error;
        }
    }

    // Get current user session token
    getAuthToken() {
        try {
            // Preferred: session stored by core Auth
            const session = (typeof Auth !== 'undefined' && typeof Auth.getSession === 'function')
                ? Auth.getSession()
                : null;
            let token = session?.access_token || null;
            // Fallback: legacy token from app flows
            if (!token) {
                try {
                    const legacy = localStorage.getItem('supabase_token');
                    if (legacy) token = legacy;
                } catch (_) {}
            }
            return token || null;
        } catch (e) {
            console.warn('[API] getAuthToken error:', e);
            return null;
        }
    }

    // Generic API request handler
    async request(endpoint, options = {}) {
        try {
            const token = this.getAuthToken();
            if (!token && !endpoint.startsWith('/auth')) {
                console.warn('[API] Missing access token');
            }
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            };

            const requestOptions = {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            };

            if (!token && !endpoint.startsWith('/auth')) {
                console.warn('[API] No token attached for', endpoint);
            } else {
                console.log('[API] Request', endpoint, {
                    hasToken: !!token,
                    method: requestOptions.method || 'GET'
                });
            }
            const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed [${endpoint}]:`, error);
            await this.handleAPIError(error);
            throw error;
        }
    }

    // AUTH MANAGEMENT
    async login(email, password) {
        try {
            const response = await this.request('/auth/signin', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (response.session) {
                Auth.setSession(response.session);
                Utils.showSuccess('Login effettuato con successo!');
                return response;
            }
            
            throw new Error('Login failed - no session');
        } catch (error) {
            Utils.showError(`Errore login: ${error.message}`);
            throw error;
        }
    }

    async register(email, password, userData = {}) {
        try {
            const response = await this.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ 
                    email, 
                    password, 
                    fullName: userData.fullName || '' 
                })
            });
            
            if (response.needsConfirmation) {
                Utils.showInfo('Controlla la tua email per confermare l\'account');
                return response;
            }
            
            if (response.session) {
                Auth.setSession(response.session);
                Utils.showSuccess('Registrazione completata con successo!');
                return response;
            }
            
            return response;
        } catch (error) {
            Utils.showError(`Errore registrazione: ${error.message}`);
            throw error;
        }
    }

    async logout() {
        try {
            await this.request('/auth/signout', { method: 'POST' });
            Auth.clearSession();
            Utils.showSuccess('Logout effettuato con successo');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local session even if server request fails
            Auth.clearSession();
        }
    }

    async getCurrentUser() {
        try {
            return await this.request('/auth/user');
        } catch (error) {
            console.error('Get current user failed:', error);
            throw error;
        }
    }

    async refreshSession() {
        try {
            const session = Auth.getSession();
            if (!session?.refresh_token) throw new Error('No refresh token');
            
            const response = await this.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            
            if (response.session) {
                Auth.setSession(response.session);
                return response.session;
            }
            
            throw new Error('Session refresh failed');
        } catch (error) {
            console.error('Session refresh failed:', error);
            Auth.clearSession();
            throw error;
        }
    }

    // WORKOUT MANAGEMENT
    async getWorkouts() {
        try {
            const response = await this.request('/workouts');
            return response.workoutPlans || [];
        } catch (error) {
            Utils.showError('Errore nel caricamento delle sessioni');
            throw error;
        }
    }

    async createWorkout(workoutData) {
        try {
            const response = await this.request('/workouts', {
                method: 'POST',
                body: JSON.stringify(workoutData)
            });
            
            Utils.showSuccess(`Sessione "${workoutData.name}" creata con successo!`);
            return response;
        } catch (error) {
            Utils.showError(`Errore nella creazione della sessione: ${error.message}`);
            throw error;
        }
    }

    async updateWorkout(id, workoutData) {
        try {
            const response = await this.request(`/workouts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(workoutData)
            });
            
            Utils.showSuccess('Sessione aggiornata con successo!');
            return response;
        } catch (error) {
            Utils.showError(`Errore nell'aggiornamento della sessione: ${error.message}`);
            throw error;
        }
    }

    async deleteWorkout(id) {
        try {
            await this.request(`/workouts/${id}`, { method: 'DELETE' });
            Utils.showSuccess('Sessione eliminata con successo!');
        } catch (error) {
            Utils.showError(`Errore nell'eliminazione della sessione: ${error.message}`);
            throw error;
        }
    }

    // EXERCISE MANAGEMENT
    async addExercise(workoutId, exerciseData) {
        try {
            const response = await this.request(`/workouts/${workoutId}/exercises`, {
                method: 'POST',
                body: JSON.stringify(exerciseData)
            });
            
            Utils.showSuccess(`Esercizio "${exerciseData.name}" aggiunto!`);
            return response;
        } catch (error) {
            Utils.showError(`Errore nell'aggiunta dell'esercizio: ${error.message}`);
            throw error;
        }
    }

    async updateExercise(workoutId, exerciseId, exerciseData) {
        try {
            const response = await this.request(`/workouts/${workoutId}/exercises/${exerciseId}`, {
                method: 'PUT',
                body: JSON.stringify(exerciseData)
            });
            
            Utils.showSuccess('Esercizio aggiornato!');
            return response;
        } catch (error) {
            Utils.showError(`Errore nell'aggiornamento dell'esercizio: ${error.message}`);
            throw error;
        }
    }

    async removeExercise(workoutId, exerciseId) {
        try {
            await this.request(`/workouts/${workoutId}/exercises/${exerciseId}`, {
                method: 'DELETE'
            });
            
            Utils.showSuccess('Esercizio rimosso!');
        } catch (error) {
            Utils.showError(`Errore nella rimozione dell'esercizio: ${error.message}`);
            throw error;
        }
    }

    // PROFILE MANAGEMENT
    async getProfile() {
        try {
            const response = await this.request('/profile');
            return response.profile;
        } catch (error) {
            Utils.showError('Errore nel caricamento del profilo');
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await this.request('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            Utils.showSuccess('Profilo aggiornato con successo!');
            return response;
        } catch (error) {
            Utils.showError(`Errore nell'aggiornamento del profilo: ${error.message}`);
            throw error;
        }
    }

    async getUserStats() {
        try {
            const response = await this.request('/profile/stats');
            const s = response?.stats || {};
            let normalized = {
                totalWorkouts: s.totalWorkouts ?? s.total_workout_plans ?? 0,
                totalExercises: s.totalExercises ?? s.total_exercises ?? 0,
                completedSessions: s.completedSessions ?? s.completed_sessions ?? 0,
                streakDays: s.streakDays ?? s.streak_days ?? 0,
            };
            // Fallback: if totals look missing, compute from workouts
            if (!normalized.totalWorkouts || !normalized.totalExercises) {
                try {
                    const workouts = await this.getWorkouts();
                    normalized.totalWorkouts = workouts.length;
                    normalized.totalExercises = workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0);
                } catch (_) {}
            }
            return normalized;
        } catch (error) {
            console.error('Get user stats failed:', error);
            return { totalWorkouts: 0, totalExercises: 0, completedSessions: 0, streakDays: 0 };
        }
    }

    // ERROR HANDLING
    async handleAPIError(error) {
        // Handle specific error cases
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            // Token expired, try refresh
            try {
                await this.refreshSession();
                Utils.showInfo('Sessione rinnovata, riprova l\'operazione');
            } catch (refreshError) {
                Utils.showError('Sessione scaduta, effettua nuovamente il login');
                Auth.logout();
            }
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            Utils.showError('Errore di connessione. Controlla la tua connessione internet.');
        } else if (error.message.includes('400')) {
            Utils.showError('Dati non validi. Controlla i campi inseriti.');
        } else if (error.message.includes('500')) {
            Utils.showError('Errore del server. Riprova più tardi.');
        }
    }

    // HEALTH CHECK
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) throw new Error('Health check failed');
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return null;
        }
    }

    // SCHEDULING (CALENDAR)
    async getScheduled(from, to) {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const qs = params.toString() ? `?${params.toString()}` : '';
        const response = await this.request(`/schedule${qs}`);
        return response.scheduled || [];
    }

    async scheduleWorkout({ workout_id, date, time, notes }) {
        const payload = { workout_id, date, ...(time && { time }), ...(notes && { notes }) };
        const response = await this.request('/schedule', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response.scheduled;
    }

    async updateScheduled(id, { date, time, notes, status }) {
        const response = await this.request(`/schedule/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                ...(date !== undefined ? { date } : {}),
                ...(time !== undefined ? { time } : {}),
                ...(notes !== undefined ? { notes } : {}),
                ...(status !== undefined ? { status } : {})
            })
        });
        return response.scheduled;
    }

    async deleteScheduled(id) {
        await this.request(`/schedule/${id}`, { method: 'DELETE' });
        return true;
    }

    async completeScheduled(id, { exercises = [], notes } = {}) {
        const response = await this.request(`/schedule/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ exercises, ...(notes ? { notes } : {}) })
        });
        return response;
    }

    async missScheduled(id) {
        const response = await this.request(`/schedule/${id}/miss`, { method: 'POST' });
        return response;
    }
}

// Create global API instance
const api = new API();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await api.init();
    } catch (error) {
        console.error('API initialization failed:', error);
    }
});

// Export for use in other modules
window.API = api;
