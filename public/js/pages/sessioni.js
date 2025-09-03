// Schede (Workout Plans) Page Logic
// Handles all workout management functionality

class Schede {
    constructor() {
        this.workouts = [];
        this.currentWorkout = null;
        this.editingExercise = null;
        this.initialized = false;
    }

    // ===== INITIALIZATION =====
    async init() {
        if (this.initialized) return;
        
        try {
            await this.bindEvents();
            await this.loadWorkouts();
            this.initialized = true;
            
            console.log('✅ Sessioni page initialized');
        } catch (error) {
            console.error('❌ Sessioni initialization failed:', error);
            Utils.showError('Errore nell\'inizializzazione della pagina');
        }
    }

    // Bind event listeners
    bindEvents() {
        // New workout button
        const newWorkoutBtn = Utils.$('#newWorkoutBtn');
        if (newWorkoutBtn) {
            newWorkoutBtn.addEventListener('click', () => this.showCreateWorkoutForm());
        }

        // Refresh button
        const refreshBtn = Utils.$('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWorkouts());
        }

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#workoutForm')) {
                e.preventDefault();
                this.handleWorkoutSubmit(e);
            } else if (e.target.matches('#exerciseForm')) {
                e.preventDefault();
                this.handleExerciseSubmit(e);
            }
        });

        // Dynamic event delegation for workout cards
        document.addEventListener('click', (e) => {
            const workoutCard = e.target.closest('.workout-card');
            const workoutId = workoutCard?.dataset.workoutId;

            if (e.target.matches('.btn-edit-workout') && workoutId) {
                this.showEditWorkoutForm(workoutId);
            } else if (e.target.matches('.btn-delete-workout') && workoutId) {
                this.confirmDeleteWorkout(workoutId);
            } else if (e.target.matches('.btn-add-exercise') && workoutId) {
                this.showAddExerciseForm(workoutId);
            } else if (e.target.matches('.btn-edit-exercise')) {
                const exerciseId = e.target.dataset.exerciseId;
                this.showEditExerciseForm(workoutId, exerciseId);
            } else if (e.target.matches('.btn-delete-exercise')) {
                const exerciseId = e.target.dataset.exerciseId;
                this.confirmDeleteExercise(workoutId, exerciseId);
            }
        });
    }

    // ===== WORKOUT LOADING =====
    async loadWorkouts() {
        try {
            Utils.showLoading(Utils.$('#workoutsContainer'), 'Caricamento sessioni...');
            
            // Check if API is available
            if (!window.API || typeof window.API.getWorkouts !== 'function') {
                throw new Error('API not initialized or getWorkouts method not available');
            }
            
            this.workouts = await window.API.getWorkouts();
            this.renderWorkouts();
            
            Utils.hideLoading(Utils.$('#workoutsContainer'));
        } catch (error) {
            Utils.hideLoading(Utils.$('#workoutsContainer'));
            console.error('Load workouts failed:', error);
            this.renderEmptyState('Errore nel caricamento delle sessioni');
        }
    }

    // ===== RENDERING =====
    renderWorkouts() {
        const container = Utils.$('#workoutsContainer');
        if (!container) return;

        if (this.workouts.length === 0) {
            this.renderEmptyState();
            return;
        }

        container.innerHTML = `
            <div class="workouts-grid">
                ${this.workouts.map(workout => this.renderWorkoutCard(workout)).join('')}
            </div>
        `;
    }

    renderWorkoutCard(workout) {
        const exercisesCount = workout.exercises?.length || 0;
        const lastUpdated = Utils.getRelativeTime(workout.updated_at);
        
        return `
            <div class="workout-card" data-workout-id="${workout.id}">
                <div class="workout-card-header">
                    <h3 class="workout-title">${Utils.capitalize(workout.name)}</h3>
                    <div class="workout-actions">
                        <button class="btn-icon edit btn-edit-workout" title="Modifica sessione">
                            ✏️
                        </button>
                        <button class="btn-icon delete btn-delete-workout" title="Elimina sessione">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${workout.description ? `
                    <p class="workout-description">${workout.description}</p>
                ` : ''}
                
                <div class="workout-meta">
                    <span class="workout-date">Aggiornata ${lastUpdated}</span>
                    <span class="workout-exercises-count">
                        ${exercisesCount} esercizi
                    </span>
                </div>
                
                <div class="exercises-list">
                    <div class="exercises-header">
                        <span class="exercises-title">Esercizi</span>
                        <button class="btn-add-exercise" title="Aggiungi esercizio">
                            ➕
                        </button>
                    </div>
                    
                    ${exercisesCount > 0 ? `
                        <div class="exercises">
                            ${workout.exercises.map(exercise => this.renderExerciseItem(workout.id, exercise)).join('')}
                        </div>
                    ` : `
                        <p style="color: #6b7280; font-style: italic; font-size: 0.9rem;">
                            Nessun esercizio ancora aggiunto
                        </p>
                    `}
                </div>
            </div>
        `;
    }

    renderExerciseItem(workoutId, exercise) {
        return `
            <div class="exercise-item">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-details">
                        ${exercise.sets} serie × ${exercise.reps} rip${exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                        ${exercise.recovery_seconds ? ` • rec ${exercise.recovery_seconds}s` : ''}
                        ${Number.isInteger(exercise.intensity) ? ` • int ${exercise.intensity}/5` : ''}
                    </div>
                </div>
                <div class="exercise-actions">
                    <button class="btn-icon edit btn-edit-exercise" 
                            data-exercise-id="${exercise.id}" title="Modifica esercizio">
                        ✏️
                    </button>
                    <button class="btn-icon delete btn-delete-exercise" 
                            data-exercise-id="${exercise.id}" title="Rimuovi esercizio">
                        ❌
                    </button>
                    ${exercise.media_url ? `<a class="btn-icon" href="${exercise.media_url}" target="_blank" title="Apri media">🔗</a>` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyState(message = null) {
        const container = Utils.$('#workoutsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💪</div>
                <h3 class="empty-state-title">
            ${message || 'Nessuna sessione ancora creata'}
                </h3>
                <p class="empty-state-description">
                    ${message ? 'Riprova più tardi' : 'Crea la tua prima sessione di allenamento per iniziare'}
                </p>
                ${!message ? `
                    <button class="btn-primary" onclick="schede.showCreateWorkoutForm()">
                        ➕ Crea Prima Sessione
                    </button>
                ` : ''}
            </div>
        `;
    }

    // ===== WORKOUT FORM MANAGEMENT =====
    showCreateWorkoutForm() {
        this.currentWorkout = null;
        this.showWorkoutModal('Crea Nuova Sessione', {
            name: '',
            description: ''
        });
    }

    showEditWorkoutForm(workoutId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        if (!workout) {
            Utils.showError('Sessione non trovata');
            return;
        }

        this.currentWorkout = workout;
        this.showWorkoutModal('Modifica Sessione', {
            name: workout.name,
            description: workout.description || ''
        });
    }

    showWorkoutModal(title, data) {
        const modalHtml = `
            <div class="modal" id="workoutModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close" onclick="schede.closeModal()">×</button>
                    </div>
                    
                    <form id="workoutForm">
                        <div class="form-group">
                            <label class="form-label" for="workoutName">Nome Sessione *</label>
                            <input type="text" id="workoutName" name="name" class="form-input" 
                                   value="${data.name}" placeholder="Es: Allenamento Pettorali" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="workoutDescription">Descrizione</label>
                            <textarea id="workoutDescription" name="description" class="form-textarea" 
                                      placeholder="Descrizione opzionale della sessione...">${data.description}</textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="schede.closeModal()">
                                Annulla
                            </button>
                            <button type="submit" class="btn-primary">
                                ${this.currentWorkout ? 'Aggiorna' : 'Crea'} Sessione
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = Utils.$('#workoutModal');
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Focus first input
        Utils.$('#workoutName').focus();
    }

    async handleWorkoutSubmit(event) {
        const formData = new FormData(event.target);
        const workoutData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };

        // Validation
        if (!workoutData.name) {
            Utils.showFieldError(Utils.$('#workoutName'), 'Nome sessione obbligatorio');
            return;
        }

        try {
            if (this.currentWorkout) {
                // Update existing workout
                await window.API.updateWorkout(this.currentWorkout.id, workoutData);
            } else {
                // Create new workout
                await window.API.createWorkout(workoutData);
            }

            this.closeModal();
            await this.loadWorkouts();
        } catch (error) {
            console.error('Workout submit failed:', error);
        }
    }

    async confirmDeleteWorkout(workoutId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        if (!workout) return;

        const confirmed = confirm(`Sei sicuro di voler eliminare la sessione "${workout.name}"?\n\nQuesta azione non può essere annullata.`);
        
        if (confirmed) {
            try {
                await window.API.deleteWorkout(workoutId);
                await this.loadWorkouts();
            } catch (error) {
                console.error('Delete workout failed:', error);
            }
        }
    }

    // ===== EXERCISE FORM MANAGEMENT =====
    showAddExerciseForm(workoutId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        if (!workout) return;

        this.currentWorkout = workout;
        this.editingExercise = null;
        
        this.showExerciseModal('Aggiungi Esercizio', {
            name: '',
            sets: 3,
            reps: 12,
            weight: '',
            notes: '',
            recovery_seconds: '',
            intensity: '',
            media_url: ''
        });
    }

    showEditExerciseForm(workoutId, exerciseId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        const exercise = workout?.exercises?.find(e => e.id === exerciseId);
        
        if (!workout || !exercise) {
            Utils.showError('Esercizio non trovato');
            return;
        }

        this.currentWorkout = workout;
        this.editingExercise = exercise;
        
        this.showExerciseModal('Modifica Esercizio', {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || '',
            notes: exercise.notes || '',
            recovery_seconds: exercise.recovery_seconds || '',
            intensity: exercise.intensity ?? '',
            media_url: exercise.media_url || ''
        });
    }

    showExerciseModal(title, data) {
        const modalHtml = `
            <div class="modal" id="exerciseModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close" onclick="schede.closeModal()">×</button>
                    </div>
                    
                    <form id="exerciseForm">
                        <div class="form-group">
                            <label class="form-label" for="exerciseName">Nome Esercizio *</label>
                            <input type="text" id="exerciseName" name="name" class="form-input" 
                                   value="${data.name}" placeholder="Es: Panca Piana" required>
                        </div>
                        
                        <div class="form-row-3">
                            <div class="form-group">
                                <label class="form-label" for="exerciseSets">Serie *</label>
                                <input type="number" id="exerciseSets" name="sets" class="form-input" 
                                       value="${data.sets}" min="1" max="20" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="exerciseReps">Ripetizioni *</label>
                                <input type="number" id="exerciseReps" name="reps" class="form-input" 
                                       value="${data.reps}" min="1" max="100" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="exerciseWeight">Peso (kg)</label>
                                <input type="number" id="exerciseWeight" name="weight" class="form-input" 
                                       value="${data.weight}" min="0" step="0.5" placeholder="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="exerciseNotes">Note</label>
                            <textarea id="exerciseNotes" name="notes" class="form-textarea" 
                                      placeholder="Note aggiuntive sull'esercizio...">${data.notes}</textarea>
                        </div>

                        <div class="form-row-3">
                            <div class="form-group">
                                <label class="form-label" for="exerciseRecovery">Recupero (sec)</label>
                                <input type="number" id="exerciseRecovery" name="recovery_seconds" class="form-input"
                                       value="${data.recovery_seconds}" min="0" step="1" placeholder="Es: 60">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="exerciseIntensity">Intensità (0-5)</label>
                                <input type="number" id="exerciseIntensity" name="intensity" class="form-input"
                                       value="${data.intensity}" min="0" max="5" step="1" placeholder="0-5">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="exerciseMedia">Media (URL)</label>
                                <input type="url" id="exerciseMedia" name="media_url" class="form-input"
                                       value="${data.media_url}" placeholder="https://...">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="schede.closeModal()">
                                Annulla
                            </button>
                            <button type="submit" class="btn-primary">
                                ${this.editingExercise ? 'Aggiorna' : 'Aggiungi'} Esercizio
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = Utils.$('#exerciseModal');
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Focus first input
        Utils.$('#exerciseName').focus();
    }

    async handleExerciseSubmit(event) {
        const formData = new FormData(event.target);
        const exerciseData = {
            name: formData.get('name').trim(),
            sets: parseInt(formData.get('sets')),
            reps: parseInt(formData.get('reps')),
            weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
            notes: formData.get('notes').trim(),
            recovery_seconds: formData.get('recovery_seconds') ? parseInt(formData.get('recovery_seconds')) : null,
            intensity: formData.get('intensity') ? parseInt(formData.get('intensity')) : null,
            media_url: formData.get('media_url') ? formData.get('media_url').trim() : null
        };

        // Validation
        const errors = Utils.validateRequired({
            name: exerciseData.name,
            sets: exerciseData.sets,
            reps: exerciseData.reps
        });

        if (errors) {
            Object.keys(errors).forEach(field => {
                const element = Utils.$(`#exercise${Utils.capitalize(field)}`);
                if (element) {
                    Utils.showFieldError(element, errors[field]);
                }
            });
            return;
        }

        try {
            if (this.editingExercise) {
                // Update existing exercise
                await window.API.updateExercise(this.currentWorkout.id, this.editingExercise.id, exerciseData);
            } else {
                // Add new exercise
                await window.API.addExercise(this.currentWorkout.id, exerciseData);
            }

            this.closeModal();
            await this.loadWorkouts();
        } catch (error) {
            console.error('Exercise submit failed:', error);
        }
    }

    async confirmDeleteExercise(workoutId, exerciseId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        const exercise = workout?.exercises?.find(e => e.id === exerciseId);
        
        if (!exercise) return;

        const confirmed = confirm(`Rimuovere l'esercizio "${exercise.name}" dalla sessione?`);
        
        if (confirmed) {
            try {
                await window.API.removeExercise(workoutId, exerciseId);
                await this.loadWorkouts();
            } catch (error) {
                console.error('Delete exercise failed:', error);
            }
        }
    }

    // ===== MODAL MANAGEMENT =====
    closeModal() {
        const modals = Utils.$$('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        // Clear form errors
        Utils.$$('.field-error').forEach(error => error.remove());
        Utils.$$('.form-input.error, .form-textarea.error').forEach(field => {
            field.classList.remove('error');
        });
    }
}

// Initialize page-specific functionality
const schede = new Schede();

// Page initialization function (called by base template)
async function initPage() {
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }
    
    await schede.init();
}

// Make schede instance globally available for inline event handlers
window.schede = schede;
