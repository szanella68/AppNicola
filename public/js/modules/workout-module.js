/**
 * Workout Module - Gestione completa schede di allenamento e esercizi
 */
class WorkoutModule {
  constructor() {
    this.currentWorkouts = [];
    this.currentWorkout = null;
  }

  async loadWorkouts() {
    try {
      DOMUtils.showLoading();
      
      const response = await window.apiUtils.workouts();
      this.currentWorkouts = response.workoutPlans || [];
      
      this.renderWorkouts();
    } catch (e) {
      console.error('Errore caricamento schede:', e);
      DOMUtils.showAlert('Errore nel caricamento delle schede: ' + e.message, 'error');
      this.currentWorkouts = [];
      this.renderWorkouts();
    } finally {
      DOMUtils.hideLoading();
    }
  }

  renderWorkouts() {
    const grid = document.getElementById('workouts-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid || !emptyState) return;

    if (this.currentWorkouts.length === 0) {
      grid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = this.currentWorkouts.map(workout => `
      <div class="card" onclick="window.workoutModule.showWorkoutDetail('${workout.id}')">
        <div class="card-header">
          <h3>${workout.name}</h3>
          ${workout.description ? `<p class="text-secondary">${workout.description}</p>` : ''}
        </div>
        <div class="card-body">
          <div class="flex justify-between items-center">
            <span class="text-secondary">
              <i class="fas fa-list"></i>
              ${workout.exercises?.length || 0} esercizi
            </span>
            <span class="text-secondary text-sm">
              ${DOMUtils.formatDate(workout.created_at)}
            </span>
          </div>
        </div>
        <div class="card-footer">
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm flex-1" onclick="event.stopPropagation(); window.workoutModule.showWorkoutDetail('${workout.id}')">
              <i class="fas fa-eye"></i> Visualizza
            </button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); window.workoutModule.deleteWorkout('${workout.id}', '${workout.name}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async showWorkoutDetail(workoutId) {
    try {
      DOMUtils.showLoading();
      
      const response = await window.apiUtils.workouts(workoutId);
      this.currentWorkout = response.workoutPlan;

      DOMUtils.showSection('workout-detail-section');

      // Popola i dettagli
      const titleElement = document.getElementById('workout-title');
      const descriptionElement = document.getElementById('workout-description');
      
      if (titleElement) titleElement.textContent = this.currentWorkout.name;
      if (descriptionElement) descriptionElement.textContent = this.currentWorkout.description || '';

      this.renderExercises();
    } catch (e) {
      console.error('Errore visualizzazione scheda:', e);
      DOMUtils.showAlert('Errore nel caricamento della scheda: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  renderExercises() {
    const container = document.getElementById('exercises-list');
    if (!container) return;

    if (!this.currentWorkout.exercises || this.currentWorkout.exercises.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4">
          <i class="fas fa-plus-circle text-4xl text-secondary mb-4"></i>
          <h4>Nessun esercizio</h4>
          <p class="text-secondary mb-4">Aggiungi il primo esercizio a questa scheda</p>
          <button onclick="DOMUtils.showModal('add-exercise-modal')" class="btn btn-primary">
            <i class="fas fa-plus"></i> Aggiungi Esercizio
          </button>
        </div>`;
      return;
    }

    container.innerHTML = this.currentWorkout.exercises.map(exercise => `
      <div class="exercise-item">
        <div class="exercise-info">
          <h4>${exercise.name}</h4>
          <p>${exercise.sets} serie × ${exercise.reps} ripetizioni</p>
          ${exercise.notes ? `<p class="text-sm text-secondary"><i class="fas fa-sticky-note"></i> ${exercise.notes}</p>` : ''}
        </div>
        <div class="exercise-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.workoutModule.editExercise('${exercise.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.workoutModule.deleteExercise('${exercise.id}', '${exercise.name}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  async createWorkout(workoutData) {
    try {
      DOMUtils.showLoading();
      
      await window.apiUtils.workouts('', workoutData, 'POST');
      
      DOMUtils.hideModal('new-workout-modal');
      DOMUtils.showAlert('Scheda creata con successo!', 'success');
      await this.loadWorkouts();

      // Reset del form
      this.resetNewWorkoutForm();
    } catch (e) {
      console.error('Errore creazione scheda:', e);
      DOMUtils.showAlert('Errore nella creazione della scheda: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async deleteWorkout(id, name) {
    if (!confirm(`Sei sicuro di voler eliminare la scheda "${name}"?`)) return;
    
    try {
      DOMUtils.showLoading();
      
      await window.apiUtils.workouts(id, null, 'DELETE');
      
      DOMUtils.showAlert('Scheda eliminata con successo!', 'success');
      await this.loadWorkouts();
    } catch (e) {
      console.error('Errore eliminazione scheda:', e);
      DOMUtils.showAlert('Errore nell\'eliminazione della scheda: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async addExercise(exerciseData) {
    if (!this.currentWorkout) return;
    
    try {
      DOMUtils.showLoading();
      
      await window.apiUtils.exercises(this.currentWorkout.id, '', exerciseData, 'POST');
      
      DOMUtils.hideModal('add-exercise-modal');
      DOMUtils.showAlert('Esercizio aggiunto con successo!', 'success');
      DOMUtils.resetForm('add-exercise-form-single');
      await this.showWorkoutDetail(this.currentWorkout.id);
    } catch (e) {
      console.error('Errore nell\'aggiunta dell\'esercizio:', e);
      DOMUtils.showAlert('Errore nell\'aggiunta dell\'esercizio: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async deleteExercise(exerciseId, exerciseName) {
    if (!confirm(`Eliminare l'esercizio "${exerciseName}"?`)) return;
    
    try {
      DOMUtils.showLoading();
      
      await window.apiUtils.exercises(this.currentWorkout.id, exerciseId, null, 'DELETE');
      
      DOMUtils.showAlert('Esercizio eliminato con successo!', 'success');
      await this.showWorkoutDetail(this.currentWorkout.id);
    } catch (e) {
      console.error('Errore eliminazione esercizio:', e);
      DOMUtils.showAlert('Errore nell\'eliminazione dell\'esercizio: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  backToDashboard() {
    DOMUtils.showSection('dashboard-section');
    this.currentWorkout = null;
  }

  addExerciseForm() {
    const container = document.getElementById('exercises-container');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'exercise-form';
    div.innerHTML = `
      <div class="grid grid-cols-2 gap-4 mb-4" style="position: relative;">
        <div><input type="text" class="form-input exercise-name" placeholder="Nome esercizio"></div>
        <div class="grid grid-cols-2 gap-4">
          <select class="form-select exercise-sets">
            <option value="">Serie</option>
            <option value="1">1</option><option value="2">2</option>
            <option value="3">3</option><option value="4">4</option>
            <option value="5">5</option><option value="6">6</option>
          </select>
          <select class="form-select exercise-reps">
            <option value="">Reps</option>
            <option value="5">5</option><option value="6">6</option><option value="8">8</option>
            <option value="10">10</option><option value="12">12</option><option value="15">15</option><option value="20">20</option>
          </select>
        </div>
        <button type="button" class="remove-exercise" style="position:absolute;top:0;right:-2rem;background:var(--danger-color);color:#fff;border:none;border-radius:50%;width:1.5rem;height:1.5rem;cursor:pointer;font-size:.75rem;">&times;</button>
      </div>`;
    
    div.querySelector('.remove-exercise').addEventListener('click', () => div.remove());
    container.appendChild(div);
  }

  editExercise(exerciseId) {
    console.log('✏️ Modifica esercizio:', exerciseId);
    DOMUtils.showAlert('Funzionalità in arrivo!', 'info');
  }

  resetNewWorkoutForm() {
    DOMUtils.resetForm('new-workout-form');
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
  }

  // Getter per dati correnti
  get workouts() {
    return this.currentWorkouts;
  }

  get currentWorkoutData() {
    return this.currentWorkout;
  }

  // Reset del modulo
  reset() {
    this.currentWorkouts = [];
    this.currentWorkout = null;
  }
}

window.WorkoutModule = WorkoutModule;