/**
 * Event Manager - Gestione centralizzata di tutti gli eventi DOM
 */
class EventManager {
  static setupEventListeners(authModule, profileModule, workoutModule) {
    // =====================
    // Auth & Navigation Events
    // =====================
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const heroLoginBtn = document.getElementById('hero-login-btn');
    const heroSignupBtn = document.getElementById('hero-signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    loginBtn?.addEventListener('click', () => DOMUtils.showModal('login-modal'));
    signupBtn?.addEventListener('click', () => DOMUtils.showModal('signup-modal'));
    heroLoginBtn?.addEventListener('click', () => DOMUtils.showModal('login-modal'));
    heroSignupBtn?.addEventListener('click', () => DOMUtils.showModal('signup-modal'));
    logoutBtn?.addEventListener('click', () => authModule.logout());

    // =====================
    // Modal Controls
    // =====================
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) DOMUtils.hideModal(modal.id);
      });
    });

    // Modal links (switch tra login/signup)
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    
    showSignupLink?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      DOMUtils.hideModal('login-modal'); 
      DOMUtils.showModal('signup-modal'); 
    });
    
    showLoginLink?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      DOMUtils.hideModal('signup-modal'); 
      DOMUtils.showModal('login-modal'); 
    });

    // =====================
    // Form Submissions
    // =====================
    
    // Login Form
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value;
      const password = document.getElementById('login-password')?.value;
      if (email && password) authModule.login(email, password);
    });

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email')?.value;
      const password = document.getElementById('signup-password')?.value;
      const fullName = document.getElementById('signup-name')?.value;
      if (email && password) authModule.signup(email, password, fullName);
    });

    // Onboarding Form
    const onboardingForm = document.getElementById('onboarding-form');
    onboardingForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('full-name')?.value;
      const age = document.getElementById('age')?.value;
      const fitnessLevel = document.getElementById('fitness-level')?.value;
      const goals = document.getElementById('goals')?.value;
      
      if (age && fitnessLevel) {
        const profileData = {
          full_name: fullName,
          age: parseInt(age),
          fitness_level: fitnessLevel,
          goals
        };
        
        // Validazione lato client
        const validation = profileModule.validateOnboardingData(profileData);
        if (!validation.isValid) {
          DOMUtils.showAlert('Errori nei dati: ' + validation.errors.join(', '), 'error');
          return;
        }
        
        profileModule.completeOnboarding(profileData);
      }
    });

    // =====================
    // Workout Management Events
    // =====================
    
    // New Workout Buttons
    const newWorkoutBtn = document.getElementById('new-workout-btn');
    const emptyNewWorkoutBtn = document.getElementById('empty-new-workout-btn');
    newWorkoutBtn?.addEventListener('click', () => DOMUtils.showModal('new-workout-modal'));
    emptyNewWorkoutBtn?.addEventListener('click', () => DOMUtils.showModal('new-workout-modal'));

    // New Workout Form
    const newWorkoutForm = document.getElementById('new-workout-form');
    newWorkoutForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('workout-name')?.value;
      const description = document.getElementById('workout-description-input')?.value;

      // Raccogli esercizi dal form dinamico
      const exercises = [];
      document.querySelectorAll('.exercise-form').forEach(form => {
        const exerciseName = form.querySelector('.exercise-name')?.value;
        const sets = form.querySelector('.exercise-sets')?.value;
        const reps = form.querySelector('.exercise-reps')?.value;
        
        if (exerciseName && sets && reps) {
          exercises.push({
            name: exerciseName,
            sets: parseInt(sets),
            reps: parseInt(reps)
          });
        }
      });

      if (name) {
        workoutModule.createWorkout({ name, description, exercises });
      }
    });

    // Add Exercise Form Button (in new workout modal)
    const addExerciseFormBtn = document.getElementById('add-exercise-form');
    addExerciseFormBtn?.addEventListener('click', () => workoutModule.addExerciseForm());

    // =====================
    // Workout Detail Events
    // =====================
    
    // Back to Dashboard
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    backToDashboardBtn?.addEventListener('click', () => workoutModule.backToDashboard());

    // Add Single Exercise
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    addExerciseBtn?.addEventListener('click', () => DOMUtils.showModal('add-exercise-modal'));

    // Add Exercise Form (single exercise in workout detail)
    const addExerciseFormSingle = document.getElementById('add-exercise-form-single');
    addExerciseFormSingle?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('single-exercise-name')?.value;
      const sets = document.getElementById('single-exercise-sets')?.value;
      const reps = document.getElementById('single-exercise-reps')?.value;
      const notes = document.getElementById('single-exercise-notes')?.value;
      
      if (name && sets && reps) {
        const exerciseData = {
          name,
          sets: parseInt(sets),
          reps: parseInt(reps),
          notes
        };
        workoutModule.addExercise(exerciseData);
      }
    });

    // =====================
    // Global Modal Events
    // =====================
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          DOMUtils.hideModal(modal.id);
        }
      });
    });

    // =====================
    // Keyboard Shortcuts
    // =====================
    
    document.addEventListener('keydown', (e) => {
      // ESC chiude modal attivo
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          DOMUtils.hideModal(activeModal.id);
        }
      }
      
      // Ctrl+N nuova scheda (solo se autenticato e in dashboard)
      if (e.ctrlKey && e.key === 'n' && authModule.isAuthenticated) {
        e.preventDefault();
        const dashboardVisible = !document.getElementById('dashboard-section')?.classList.contains('hidden');
        if (dashboardVisible) {
          DOMUtils.showModal('new-workout-modal');
        }
      }
    });

    console.log('✅ Event Listeners configurati');
  }

  // =====================
  // Utility Methods
  // =====================
  
  static setupGlobalErrorHandlers() {
    // Gestione errori JavaScript globali
    window.addEventListener('error', (event) => {
      console.error('💥 Errore JavaScript:', event.error);
      if (DOMUtils?.showAlert) {
        DOMUtils.showAlert('Si è verificato un errore. Ricarica la pagina se persiste.', 'error');
      }
    });

    // Gestione Promise rejections non gestite
    window.addEventListener('unhandledrejection', (event) => {
      console.error('💥 Promise rejection non gestita:', event.reason);
      if (DOMUtils?.showAlert) {
        DOMUtils.showAlert('Errore di connessione. Controlla la rete e riprova.', 'error');
      }
    });
  }

  static setupAnimations() {
    // Aggiungi CSS animations se non esistono già
    if (!document.getElementById('gymtracker-animations')) {
      const style = document.createElement('style');
      style.id = 'gymtracker-animations';
      style.textContent = `
        @keyframes slideInRight { 
          from { transform: translateX(100%); opacity: 0; } 
          to { transform: translateX(0); opacity: 1; } 
        }
        @keyframes slideOutRight { 
          from { transform: translateX(0); opacity: 1; } 
          to { transform: translateX(100%); opacity: 0; } 
        }
      `;
      document.head.appendChild(style);
    }
  }
}

window.EventManager = EventManager;