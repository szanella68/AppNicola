// Calendario (Calendar Planning) Page Logic
// Handles calendar functionality, workout scheduling, and drag & drop

class Calendario {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month'; // 'month' or 'week'
        this.selectedDate = null;
        this.workouts = [];
        this.scheduledWorkouts = [];
        this.draggedWorkout = null;
        this.initialized = false;
    }

    // ===== INITIALIZATION =====
    async init() {
        if (this.initialized) return;
        
        try {
            await this.bindEvents();
            await this.loadWorkouts();
            await this.loadScheduledWorkouts();
            this.renderCalendar();
            this.renderWorkoutsSidebar();
            this.initialized = true;
            
            console.log('✅ Calendario page initialized');
        } catch (error) {
            console.error('❌ Calendario initialization failed:', error);
            Utils.showError('Errore nell\'inizializzazione della pagina');
        }
    }

    // Bind event listeners
    bindEvents() {
        // Navigation controls
        const prevBtn = Utils.$('#prevMonth');
        const nextBtn = Utils.$('#nextMonth');
        const todayBtn = Utils.$('#todayBtn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateMonth(1));
        if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Calendar cell clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.day-cell') || e.target.closest('.day-cell')) {
                const dayCell = e.target.matches('.day-cell') ? e.target : e.target.closest('.day-cell');
                this.handleDayClick(dayCell);
            }
        });

        // Drag and drop events
        this.bindDragEvents();

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.closeModal();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#eventForm')) {
                e.preventDefault();
                this.handleEventSubmit(e);
            }
        });
    }

    // ===== DATA LOADING =====
    async loadWorkouts() {
        try {
            this.workouts = await window.API.getWorkouts();
        } catch (error) {
            console.error('Load workouts failed:', error);
            this.workouts = [];
        }
    }

    async loadScheduledWorkouts() {
        try {
            // TODO: Implement API endpoint for scheduled workouts
            // For now, use mock data
            this.scheduledWorkouts = [
                {
                    id: '1',
                    workout_id: '1',
                    date: '2025-01-20',
                    time: '10:00',
                    status: 'scheduled',
                    workout: { name: 'Push Pull Legs', description: 'Upper body focus' }
                },
                {
                    id: '2',
                    workout_id: '2',
                    date: '2025-01-22',
                    time: '18:00',
                    status: 'completed',
                    workout: { name: 'Cardio Session', description: 'High intensity' }
                }
            ];
        } catch (error) {
            console.error('Load scheduled workouts failed:', error);
            this.scheduledWorkouts = [];
        }
    }

    // ===== CALENDAR RENDERING =====
    renderCalendar() {
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
        this.updateCurrentMonthDisplay();
    }

    renderMonthView() {
        const container = Utils.$('#monthView');
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and calculate grid
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        const calendar = [];
        
        // Generate 6 weeks of calendar
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                calendar.push(currentDate);
            }
        }

        // Render calendar grid
        container.innerHTML = `
            <div class="month-grid">
                ${['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => `
                    <div class="day-header">${day}</div>
                `).join('')}
                ${calendar.map(date => this.renderDayCell(date, month, today)).join('')}
            </div>
        `;
    }

    renderDayCell(date, currentMonth, today) {
        const isToday = this.isSameDay(date, today);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isSelected = this.selectedDate && this.isSameDay(date, this.selectedDate);
        const dateStr = this.formatDate(date);
        
        const dayEvents = this.scheduledWorkouts.filter(event => 
            event.date === dateStr
        );

        const classes = [
            'day-cell',
            !isCurrentMonth && 'other-month',
            isToday && 'today',
            isSelected && 'selected'
        ].filter(Boolean).join(' ');

        return `
            <div class="${classes}" data-date="${dateStr}">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-events">
                    ${dayEvents.map(event => this.renderDayEvent(event)).join('')}
                </div>
            </div>
        `;
    }

    renderDayEvent(event) {
        const statusClass = event.status === 'completed' ? 'completed' : 
                           event.status === 'missed' ? 'missed' : '';
        
        return `
            <div class="day-event ${statusClass}" 
                 data-event-id="${event.id}"
                 title="${event.workout.name} - ${event.time}">
                ${event.time} ${event.workout.name}
            </div>
        `;
    }

    renderWeekView() {
        const container = Utils.$('#weekView');
        if (!container) return;

        // Get start of week
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            weekDays.push(day);
        }

        const timeSlots = this.generateTimeSlots();
        const today = new Date();

        container.innerHTML = `
            <div class="week-grid">
                <div class="time-slot"></div>
                ${weekDays.map(day => `
                    <div class="week-day-header ${this.isSameDay(day, today) ? 'today' : ''}">
                        <div>${['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][day.getDay()]}</div>
                        <div>${day.getDate()}</div>
                    </div>
                `).join('')}
                
                ${timeSlots.map(time => `
                    <div class="time-slot">${time}</div>
                    ${weekDays.map(day => `
                        <div class="week-cell" data-date="${this.formatDate(day)}" data-time="${time}">
                            ${this.renderWeekEvents(day, time)}
                        </div>
                    `).join('')}
                `).join('')}
            </div>
        `;
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 6; hour < 23; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }

    renderWeekEvents(date, time) {
        const dateStr = this.formatDate(date);
        const events = this.scheduledWorkouts.filter(event => 
            event.date === dateStr && event.time.startsWith(time.split(':')[0])
        );
        
        return events.map(event => this.renderDayEvent(event)).join('');
    }

    // ===== WORKOUTS SIDEBAR =====
    renderWorkoutsSidebar() {
        const container = Utils.$('#workoutsList');
        if (!container) return;

        if (this.workouts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <p>Nessuna scheda disponibile</p>
                    <a href="schede.html" class="btn-primary btn-sm" style="margin-top: 1rem;">
                        Crea Prima Scheda
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.workouts.map(workout => `
            <div class="workout-item" 
                 draggable="true" 
                 data-workout-id="${workout.id}">
                <div class="workout-name">${workout.name}</div>
                <div class="workout-exercises">
                    ${workout.exercises ? workout.exercises.length : 0} esercizi
                </div>
            </div>
        `).join('');
    }

    // ===== NAVIGATION =====
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
    }

    switchView(view) {
        if (view === this.currentView) return;
        
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide views
        document.querySelectorAll('.calendar-view').forEach(viewElement => {
            viewElement.classList.toggle('active', viewElement.id === `${view}View`);
        });
        
        this.renderCalendar();
    }

    updateCurrentMonthDisplay() {
        const monthNames = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        
        const display = Utils.$('#currentMonth');
        if (display) {
            display.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    // ===== DRAG & DROP =====
    bindDragEvents() {
        // Workout items drag start
        document.addEventListener('dragstart', (e) => {
            if (e.target.matches('.workout-item')) {
                this.handleDragStart(e);
            }
        });

        // Calendar cells drag over/drop
        document.addEventListener('dragover', (e) => {
            if (e.target.matches('.day-cell') || e.target.closest('.day-cell')) {
                e.preventDefault();
                this.handleDragOver(e);
            }
        });

        document.addEventListener('dragleave', (e) => {
            if (e.target.matches('.day-cell') || e.target.closest('.day-cell')) {
                this.handleDragLeave(e);
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.matches('.day-cell') || e.target.closest('.day-cell')) {
                e.preventDefault();
                this.handleDrop(e);
            }
        });
    }

    handleDragStart(e) {
        this.draggedWorkout = {
            id: e.target.dataset.workoutId,
            element: e.target
        };
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    }

    handleDragOver(e) {
        const dayCell = e.target.matches('.day-cell') ? e.target : e.target.closest('.day-cell');
        if (dayCell && !dayCell.classList.contains('other-month')) {
            dayCell.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const dayCell = e.target.matches('.day-cell') ? e.target : e.target.closest('.day-cell');
        if (dayCell) {
            dayCell.classList.remove('drag-over');
        }
    }

    async handleDrop(e) {
        const dayCell = e.target.matches('.day-cell') ? e.target : e.target.closest('.day-cell');
        
        if (!dayCell || !this.draggedWorkout) return;
        
        dayCell.classList.remove('drag-over');
        
        if (this.draggedWorkout.element) {
            this.draggedWorkout.element.classList.remove('dragging');
        }

        const date = dayCell.dataset.date;
        if (!date || dayCell.classList.contains('other-month')) {
            this.draggedWorkout = null;
            return;
        }

        // Show scheduling modal
        this.showScheduleModal(this.draggedWorkout.id, date);
        this.draggedWorkout = null;
    }

    // ===== EVENT HANDLING =====
    handleDayClick(dayCell) {
        if (dayCell.classList.contains('other-month')) return;
        
        const date = dayCell.dataset.date;
        this.selectedDate = new Date(date);
        
        // Update visual selection
        document.querySelectorAll('.day-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        dayCell.classList.add('selected');
        
        // Show day events or schedule modal
        const existingEvents = this.scheduledWorkouts.filter(event => event.date === date);
        if (existingEvents.length === 0) {
            this.showScheduleModal(null, date);
        }
    }

    // ===== MODAL MANAGEMENT =====
    showScheduleModal(workoutId = null, date = null) {
        const selectedWorkout = workoutId ? this.workouts.find(w => w.id === workoutId) : null;
        const formattedDate = date ? this.formatDateForInput(new Date(date)) : '';
        
        const modalHtml = `
            <div class="modal" id="eventModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Pianifica Allenamento</h2>
                        <button class="modal-close" onclick="calendario.closeModal()">×</button>
                    </div>
                    
                    <form id="eventForm">
                        <div class="event-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Data</label>
                                    <input type="date" name="date" class="form-input" 
                                           value="${formattedDate}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Orario</label>
                                    <input type="time" name="time" class="form-input" 
                                           value="18:00" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Seleziona Scheda</label>
                                <div class="workout-select">
                                    ${this.workouts.map(workout => `
                                        <div class="workout-option ${selectedWorkout?.id === workout.id ? 'selected' : ''}" 
                                             data-workout-id="${workout.id}">
                                            <div class="workout-option-name">${workout.name}</div>
                                            <div class="workout-option-desc">
                                                ${workout.description || `${workout.exercises?.length || 0} esercizi`}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Note (opzionale)</label>
                                <textarea name="notes" class="form-textarea" 
                                          placeholder="Note aggiuntive per questo allenamento..."></textarea>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="calendario.closeModal()">
                                Annulla
                            </button>
                            <button type="submit" class="btn-primary">
                                Pianifica Allenamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = Utils.$('#eventModal');
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Bind workout selection
        document.querySelectorAll('.workout-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.workout-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                option.classList.add('selected');
            });
        });
    }

    async handleEventSubmit(event) {
        const formData = new FormData(event.target);
        const selectedWorkout = Utils.$('.workout-option.selected');
        
        if (!selectedWorkout) {
            Utils.showError('Seleziona una scheda di allenamento');
            return;
        }

        const eventData = {
            workout_id: selectedWorkout.dataset.workoutId,
            date: formData.get('date'),
            time: formData.get('time'),
            notes: formData.get('notes'),
            status: 'scheduled'
        };

        try {
            // TODO: Implement API endpoint for scheduling workouts
            console.log('Scheduling workout:', eventData);
            
            // For now, add to local array
            const workout = this.workouts.find(w => w.id === eventData.workout_id);
            this.scheduledWorkouts.push({
                id: Date.now().toString(),
                ...eventData,
                workout: workout
            });
            
            this.closeModal();
            this.renderCalendar();
            Utils.showSuccess('Allenamento pianificato con successo!');
        } catch (error) {
            console.error('Schedule workout failed:', error);
        }
    }

    closeModal() {
        const modals = Utils.$$('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    // ===== UTILITY METHODS =====
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Initialize page-specific functionality
const calendario = new Calendario();

// Page initialization function (called by base template)
async function initPage() {
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }
    
    await calendario.init();
}

// Make calendario instance globally available for inline event handlers
window.calendario = calendario;
