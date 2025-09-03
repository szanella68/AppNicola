# 📋 GymTracker Development Roadmap & Status
## Linea Guida per Continuazione Progetto

> **Last Updated:** Gennaio 2025  
> **Project:** GymTracker - Personal Trainer Digitale  
> **Architecture:** Multi-Page Professional Approach  
> **Current Status:** Step 1-2 Completati, Step 3 Next  

---

## 🎯 **STRATEGIA GENERALE DECISA**

### **Architecture Decision: SEPARATE PAGES (Approccio Professionale)**
- ❌ **NON Single Page Application (SPA)**
- ✅ **Multi-Page Architecture** con template condivisi
- ✅ **Separation of Concerns** → Ogni funzione = pagina dedicata
- ✅ **Scalable & Maintainable** → Team development ready

### **Technology Stack Mantenuto:**
- **Backend:** Node.js Express su porta 3007
- **Database:** Supabase (auth + PostgreSQL + RLS policies)
- **Proxy:** Apache HTTPS reverse proxy (già configurato)
- **Frontend:** Vanilla JS + Template System (no framework)
- **URL Base:** `https://zanserver.sytes.net/nicola/`

---

## 📁 **ARCHITETTURA FILE STRUCTURE**

```
📁 public/
├── 🏠 home.html              ✅ FATTO - Landing + Auth
├── 🎯 app.html               ✅ FATTO - Hub post-login  
├── 💪 schede.html            ⏳ TODO - Workout management
├── 📅 calendario.html        ⏳ TODO - Calendar planning
├── 👤 profilo.html           ⏳ TODO - User profile
├── 📋 terms.html             ⏳ TODO - Legal (enhanced)
├── 🔒 privacy.html           ⏳ TODO - Privacy (enhanced) 
├── ✉️ contatti.html          ⏳ TODO - Support (enhanced)
├── templates/
│   └── base-template.html    ✅ FATTO - HTML base structure
├── components/  
│   ├── header.html           ✅ FATTO - Shared navigation
│   └── footer.html           ✅ FATTO - Shared footer
├── css/
│   ├── shared.css            ✅ FATTO - Global styles
│   ├── menu-component.css    ✅ FATTO - Menu dropdown
│   ├── schede.css            ⏳ TODO - Page-specific
│   ├── calendario.css        ⏳ TODO - Page-specific  
│   └── profilo.css           ⏳ TODO - Page-specific
└── js/
    ├── core/
    │   ├── template-loader.js ✅ FATTO - Template system
    │   ├── menu-component.js  ✅ FATTO - Professional nav
    │   ├── auth.js            ✅ FATTO - Login/Register
    │   ├── api.js             ⏳ TODO - Supabase integration
    │   └── utils.js           ⏳ TODO - Shared utilities
    └── pages/
        ├── schede.js          ⏳ TODO - Workout logic
        ├── calendario.js      ⏳ TODO - Calendar logic
        └── profilo.js         ⏳ TODO - Profile logic
```

---

## ✅ **STATUS ATTUALE: STEP 1-2 COMPLETATI**

### **STEP 1 ✅ COMPLETED: Menu Update Professionale**
- [x] **home.html** → Login/Register funzionanti + menu base
- [x] **app.html** → Hub dashboard + menu dropdown completo  
- [x] **js/menu-component.js** → Navigation tra pagine + active states
- [x] Menu dropdown con 3 sezioni organizzate:
  - Core App Functions (Hub, Schede, Calendario, Profilo)
  - Legal & Support (Terms, Privacy, Contatti)  
  - Logout

### **STEP 2 ✅ COMPLETED: Template System Foundation**
- [x] **templates/base-template.html** → HTML structure riusabile
- [x] **components/header.html** → Navigation component condiviso
- [x] **components/footer.html** → Footer component condiviso  
- [x] **js/core/template-loader.js** → Sistema caricamento template
- [x] **css/shared.css** → Stili globali + design system

### **Funzionalità Testate e Funzionanti:**
- ✅ Login/Logout flow completo
- ✅ Menu dropdown responsive
- ✅ Navigation tra home.html e app.html
- ✅ Template system caricamento componenti
- ✅ Auth state persistence (localStorage)

---

## 📋 **ROADMAP DETTAGLIATO REMAINING STEPS**

### **🚀 STEP 3 - IMMEDIATE NEXT: Core Pages Creation**
**Priority: HIGH | Estimated: 2-3 giorni**

#### **A) schede.html (Workout Management)**
**File da creare:** `public/schede.html`

**Contenuto richiesto:**
- Lista schede esistenti (da Supabase)  
- CRUD completo: Create, Read, Update, Delete schede
- Gestione esercizi dentro ogni scheda
- Form validazione professionale
- Stati loading/empty/error
- Mobile responsive

**API Endpoints necessari:**
```javascript
GET /api/workouts        // Lista schede utente
POST /api/workouts       // Crea nuova scheda  
PUT /api/workouts/:id    // Modifica scheda
DELETE /api/workouts/:id // Elimina scheda
POST /api/workouts/:id/exercises     // Aggiungi esercizio
DELETE /api/workouts/:workoutId/exercises/:exerciseId // Rimuovi esercizio
```

#### **B) calendario.html (Workout Planning)**  
**File da creare:** `public/calendario.html`

**Contenuto richiesto:**
- Calendar widget interattivo (settimanale/mensile)
- Drag & drop schede su giorni
- Vista pianificazione allenamenti
- Integration con schede esistenti
- Reminder/notification system placeholder

#### **C) profilo.html (User Management)**
**File da creare:** `public/profilo.html`

**Contenuto richiesto:**  
- Form dati personali (nome, email, età, livello fitness)
- Obiettivi fitness e note
- Statistiche utente (schede create, allenamenti fatti)
- Settings applicazione
- Password change
- Account deletion

### **🔧 STEP 4: JavaScript Core Pages**
**Priority: HIGH | Estimated: 2-3 giorni**

#### **A) js/core/api.js - Supabase Integration**
**File da creare:** `public/js/core/api.js`

**Funzioni richieste:**
```javascript
// Auth management
async login(email, password)
async register(email, password, userData)  
async logout()
async getCurrentUser()
async refreshSession()

// Workout management
async getWorkouts()
async createWorkout(workoutData)
async updateWorkout(id, workoutData)
async deleteWorkout(id)

// Exercise management  
async addExercise(workoutId, exerciseData)
async updateExercise(workoutId, exerciseId, exerciseData)
async removeExercise(workoutId, exerciseId)

// Profile management
async getProfile()
async updateProfile(profileData)
async getUserStats()

// Error handling + user feedback
async handleAPIError(error)
showSuccessMessage(message)
showErrorMessage(message)
```

#### **B) js/pages/schede.js - Workout Logic**
**File da creare:** `public/js/pages/schede.js`

**Funzioni richieste:**
```javascript
// Page initialization
init()
bindEvents()

// Workout management
loadWorkouts()
renderWorkouts(workouts)
showCreateWorkoutForm()
handleCreateWorkout(event)
handleEditWorkout(workoutId)
handleDeleteWorkout(workoutId)

// Exercise management
showAddExerciseForm(workoutId)
handleAddExercise(event)
handleRemoveExercise(workoutId, exerciseId)

// UI utilities
showLoading()
hideLoading()
showEmptyState()
validateWorkoutForm(formData)
```

#### **C) js/pages/calendario.js + profilo.js**
**Files da creare:** 
- `public/js/pages/calendario.js`
- `public/js/pages/profilo.js`

**Funzioni calendario:**
```javascript
// Calendar rendering
renderCalendar(date)
renderWorkoutEvents(events)
handleDateClick(date)
handleWorkoutDrag(workoutId, newDate)

// Planning
scheduleWorkout(workoutId, date, time)
getScheduledWorkouts(dateRange)
```

**Funzioni profilo:**
```javascript
// Profile management
loadProfile()
handleProfileUpdate(event)
handlePasswordChange(event)
handleAccountDeletion()

// Stats
loadUserStats()
renderStatsCharts(stats)
```

### **🎨 STEP 5: Page-Specific Styling**
**Priority: MEDIUM | Estimated: 1-2 giorni**

#### **CSS Files da creare:**

**A) public/css/schede.css**
```css
/* Workout forms + cards + responsive tables */
.workout-grid { }
.workout-card { }
.exercise-form { }
.workout-form { }
.empty-state { }
```

**B) public/css/calendario.css**
```css
/* Calendar grid + events + drag states */
.calendar-grid { }
.calendar-event { }
.drag-active { }
.date-cell { }
```

**C) public/css/profilo.css**  
```css
/* Profile forms + stats dashboard + settings */
.profile-sections { }
.stats-dashboard { }
.profile-form { }
.settings-panel { }
```

### **📄 STEP 6: Content Pages Enhancement**  
**Priority: LOW | Estimated: 1 giorno**

#### **Enhance Existing Static Pages:**
- **terms.html** → Professional legal content + styling
- **privacy.html** → GDPR compliant + user rights + contacts
- **contatti.html** → Support forms + FAQ + contact info

### **🔍 STEP 7: Testing & Polish**
**Priority: HIGH | Estimated: 1-2 giorni**

#### **Testing Checklist:**
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive (320px → 1920px+)  
- [ ] Navigation flow completo (tutte le pagine)
- [ ] Auth flow: login → logout → re-login
- [ ] CRUD operations: Create scheda → Add esercizi → Edit → Delete
- [ ] Error handling: network errors, validation errors
- [ ] Performance: page load times, API response times
- [ ] Accessibility: keyboard navigation, screen readers

---

## 🚨 **CRITICAL INTEGRATION POINTS**

### **1. Supabase Database Schema**
**Tabelle esistenti da verificare:**
```sql
-- User profiles
user_profiles (id, email, full_name, age, fitness_level, goals, created_at, updated_at)

-- Workout plans  
workout_plans (id, user_id, name, description, is_active, created_at, updated_at)

-- Exercises
exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)

-- Workout logs (optional)
workout_logs (id, user_id, workout_plan_id, exercise_id, sets_completed, reps_completed, weight_used, completed_at, notes)
```

**RLS Policies da verificare:**
```sql
-- VERIFY che le policies esistenti funzionino con:
workout_plans: user_id restrictions
exercises: via workout_plans.user_id join
user_profiles: profile access  
workout_logs: user_id restrictions (se implementato)
```

### **2. Apache Reverse Proxy Configuration**
**File:** `httpd-ssl.conf`

**ENSURE che tutte le nuove pagine funzionino con:**
```apache
https://zanserver.sytes.net/nicola/schede.html → localhost:3007/schede.html
https://zanserver.sytes.net/nicola/calendario.html → localhost:3007/calendario.html  
https://zanserver.sytes.net/nicola/profilo.html → localhost:3007/profilo.html
```

### **3. Authentication Flow Consistency**
```javascript
// MAINTAIN consistency:  
// Public pages → home.html solo
// Protected pages → Require login, redirect se necessario
// Session persistence → localStorage + Supabase session
// Menu states → Public vs Private menu appropriati
```

**Auth Check Pattern:**
```javascript
// In ogni pagina protetta (schede.html, calendario.html, profilo.html)
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }
    // Initialize page...
});
```

---

## 🎯 **IMMEDIATE ACTION PLAN**

### **NEXT SESSION START HERE:**

**Resume Message per nuova chat:**
> "Sto continuando il progetto GymTracker da STEP 3. Ho completato Step 1-2 (menu professionale + template system). Ora devo creare schede.html con CRUD completo per workout management. Seguendo architettura separate pages professionale. Posso procedere con schede.html?"

### **Immediate Tasks Priorità:**

1. **Create schede.html** usando template system già creato
2. **Implement basic Supabase API calls** in js/core/api.js  
3. **Build workout CRUD forms** in schede.html
4. **Test workflow**: Login → Hub → Schede → Create workout → Success

### **Success Criteria Step 3:**
- ✅ User può creare una nuova scheda di allenamento
- ✅ User può aggiungere esercizi alla scheda  
- ✅ Data viene salvata in Supabase correttamente
- ✅ Lista schede viene mostrata dopo creazione
- ✅ Navigation menu funziona tra tutte le pagine

### **File da creare FIRST (in ordine):**
```
1. public/js/core/api.js        // Supabase integration
2. public/schede.html          // Main workout page  
3. public/js/pages/schede.js   // Workout logic
4. public/css/schede.css       // Workout styling
```

---

## 📚 **REFERENCE LINKS & DOCUMENTATION**

### **Supabase Documentation:**
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

### **Project Structure References:**
- **Base URL:** `https://zanserver.sytes.net/nicola/`
- **Local Development:** `http://localhost:3007/`
- **Apache Config:** `/xampp/apache/conf/extra/httpd-ssl.conf`
- **SSL Certificates:** `C:/ProgramData/win-acme/`

### **Environment Variables (.env):**
```bash
PORT=3007
NODE_ENV=production
FRONTEND_URL=https://zanserver.sytes.net/nicola
SUPABASE_URL=https://oyetlgzmnhdnjfucdtrj.supabase.co
SUPABASE_ANON_KEY=[key_already_configured]
```

---

## 🏆 **FINAL VISION**

### **End Goal:** 
Professional fitness app con:
- ✅ Scalable multi-page architecture  
- ✅ Complete workout management system
- ✅ Interactive calendar planning
- ✅ Professional user profiles  
- ✅ Full Supabase integration
- ✅ Mobile-first responsive design
- ✅ Production-ready Apache deployment

### **User Journey Target:**
```
1. User lands on home.html → Sees professional landing
2. User clicks Register → Modal signup → Auto redirect to app.html
3. User sees Hub with stats + service cards
4. User clicks "Schede" → Goes to schede.html  
5. User creates workout → Adds exercises → Saves to Supabase
6. User clicks "Calendario" → Plans workout sessions
7. User clicks "Profilo" → Manages account settings
8. Navigation between all pages smooth and professional
```

---

## ⚠️ **IMPORTANT NOTES**

### **Development Approach:**
- **STRATEGIA MANTENUTA:** Approccio professionale, step by step, con testing parziale ad ogni fase
- **Quality over Speed:** Ogni step deve essere completo e testato prima di procedere
- **Mobile-First:** Ogni pagina deve funzionare perfettamente su mobile
- **Error Handling:** Gestione professionale degli errori in ogni funzione

### **Code Standards:**
- **Vanilla JavaScript:** No frameworks, keep it simple
- **Template System:** Use existing template-loader.js
- **CSS Architecture:** shared.css + page-specific css files
- **Supabase Integration:** Consistent error handling + user feedback
- **Responsive Design:** Mobile-first approach always

### **Testing Requirements:**
- Test ogni funzione prima di procedere al passo successivo
- Verify navigation flow between all pages
- Check mobile responsiveness on all breakpoints
- Test error scenarios (network failure, invalid data, etc.)

---

**READY TO CONTINUE FROM STEP 3: schede.html Creation** 🚀