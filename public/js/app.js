/* app.js */

const App = {
  currentPage: 'hub',
  isInitialized: false,
  
  // Initialize app
  init() {
    this.checkAuth();
    this.loadStats();
    this.bindEvents();
    this.isInitialized = true;
  },
  
  // Check authentication
  checkAuth() {
    const user = Auth.getCurrentUser();
    if (!user && !window.location.pathname.includes('home.html')) {
      // Redirect to home if not authenticated and not already there
      window.location.href = 'home.html';
      return;
    }
  },
  
  // Bind app events
  bindEvents() {
    // Update menu component to use App.navigate
    window.originalMenuGoto = Menu.goto;
    Menu.goto = (page) => {
      Menu.close();
      Menu.setActive(page);
      App.navigate(page);
    };
  },
  
  // Navigate to page
  navigate(page) {
    this.currentPage = page;
    
    // For now, just show different content in the hub
    // Later we'll add separate page files
    const pageContent = this.getPageContent(page);
    this.showPageContent(pageContent);
    
    // Update browser URL (optional)
    // window.history.pushState({page}, '', `#${page}`);
  },
  
  // Get page content
  getPageContent(page) {
    const contents = {
      hub: this.getHubContent(),
      schede: this.getSchedeContent(), 
      calendario: this.getCalendarioContent(),
      profilo: this.getProfiloContent()
    };
    
    return contents[page] || contents.hub;
  },
  
  // Show page content
  showPageContent(content) {
    const hubSection = document.querySelector('.welcome').parentElement;
    const pageContentDiv = document.getElementById('pageContent');
    
    if (this.currentPage === 'hub') {
      // Show hub sections
      hubSection.style.display = 'block';
      pageContentDiv.style.display = 'none';
    } else {
      // Show page content
      hubSection.style.display = 'none';
      pageContentDiv.style.display = 'block';
      pageContentDiv.innerHTML = content;
    }
  },
  
  // Hub content (default view)
  getHubContent() {
    return ''; // Hub is already in the HTML
  },
  
  // Schede content
  getSchedeContent() {
    return `
      <div class="page-content">
        <div class="page-header">
          <h1>💪 Le Mie Schede di Allenamento</h1>
          <button class="primary-button" onclick="App.createScheda()">
            + Nuova Scheda
          </button>
        </div>
        
        <div class="schede-grid" id="schedeList">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Nessuna scheda ancora</h3>
            <p>Crea la tua prima scheda di allenamento personalizzata!</p>
            <button class="primary-button" onclick="App.createScheda()">
              Crea Prima Scheda
            </button>
          </div>
        </div>
      </div>
      
      <style>
        .page-content { padding: 2rem 0; }
        .page-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 2rem;
        }
        .page-header h1 { margin: 0; }
        .primary-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
        .empty-state h3 { margin-bottom: 1rem; }
        .empty-state p { color: #6b7280; margin-bottom: 2rem; }
      </style>
    `;
  },
  
  // Calendario content
  getCalendarioContent() {
    return `
      <div class="page-content">
        <div class="page-header">
          <h1>📅 Calendario Allenamenti</h1>
          <button class="primary-button" onclick="App.scheduleWorkout()">
            + Pianifica Allenamento
          </button>
        </div>
        
        <div class="calendar-view">
          <div class="calendar-placeholder">
            <div class="placeholder-icon">📅</div>
            <h3>Calendario in Sviluppo</h3>
            <p>Presto potrai pianificare i tuoi allenamenti settimana per settimana!</p>
            
            <div class="feature-list">
              <div class="feature-item">✅ Pianificazione settimanale</div>
              <div class="feature-item">✅ Reminder automatici</div>
              <div class="feature-item">✅ Tracking costanza</div>
              <div class="feature-item">✅ Statistiche mensili</div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .calendar-placeholder {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .placeholder-icon { font-size: 4rem; margin-bottom: 1rem; }
        .feature-list { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
          text-align: left;
        }
        .feature-item {
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 8px;
          color: #1e40af;
        }
      </style>
    `;
  },
  
  // Profilo content
  getProfiloContent() {
    const user = Auth.getCurrentUser();
    return `
      <div class="page-content">
        <div class="page-header">
          <h1>👤 Il Tuo Profilo</h1>
        </div>
        
        <div class="profile-sections">
          <div class="profile-card">
            <h3>Informazioni Personali</h3>
            <div class="profile-field">
              <label>Nome</label>
              <input type="text" value="${user?.name || ''}" placeholder="Il tuo nome">
            </div>
            <div class="profile-field">
              <label>Email</label>
              <input type="email" value="${user?.email || ''}" placeholder="La tua email">
            </div>
            <button class="primary-button">Salva Modifiche</button>
          </div>
          
          <div class="profile-card">
            <h3>Preferenze Allenamento</h3>
            <div class="profile-field">
              <label>Livello Fitness</label>
              <select>
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzato</option>
              </select>
            </div>
            <div class="profile-field">
              <label>Obiettivi</label>
              <textarea placeholder="I tuoi obiettivi fitness..."></textarea>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .profile-sections {
          display: grid;
          gap: 2rem;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        }
        .profile-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .profile-card h3 { margin-bottom: 1.5rem; }
        .profile-field { margin-bottom: 1rem; }
        .profile-field label { 
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: 500; 
        }
        .profile-field input, .profile-field select, .profile-field textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
      </style>
    `;
  },
  
  // Load user stats
  loadStats() {
    // Simulate loading stats
    setTimeout(() => {
      const stats = {
        totalSchede: Math.floor(Math.random() * 10) + 1,
        totalEsercizi: Math.floor(Math.random() * 50) + 10,
        weeklyWorkouts: Math.floor(Math.random() * 7) + 1
      };
      
      document.getElementById('totalSchede').textContent = stats.totalSchede;
      document.getElementById('totalEsercizi').textContent = stats.totalEsercizi;
      document.getElementById('weeklyWorkouts').textContent = stats.weeklyWorkouts;
    }, 1000);
  },
  
  // Placeholder functions for buttons
  createScheda() {
    alert('Funzione "Crea Scheda" in sviluppo!');
  },
  
  scheduleWorkout() {
    alert('Funzione "Pianifica Allenamento" in sviluppo!');
  }
};