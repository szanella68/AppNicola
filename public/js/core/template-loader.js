/* template-loader.js - Professional Template System */

const TemplateLoader = {
  loadedComponents: new Map(),
  pageType: 'public',
  
  // Initialize template system
  async init(pageType = 'public') {
    this.pageType = pageType;
    
    try {
      // Load components in parallel
      await Promise.all([
        this.loadHeader(),
        this.loadFooter()
      ]);
      
      // Initialize core systems after components loaded
      this.initializeSystems();
      
      console.log('✅ Template system initialized successfully');
    } catch (error) {
      console.error('❌ Template system initialization failed:', error);
      this.handleLoadError();
    }
  },
  
  // Load header component
  async loadHeader() {
    const headerHTML = await this.loadComponent('header');
    const headerContainer = document.getElementById('headerComponent');
    
    if (headerContainer && headerHTML) {
      // Replace template variables
      const processedHTML = headerHTML.replace('{{PAGE_TYPE}}', this.pageType);
      headerContainer.innerHTML = processedHTML;
    }
  },
  
  // Load footer component
  async loadFooter() {
    const footerHTML = await this.loadComponent('footer');
    const footerContainer = document.getElementById('footerComponent');
    
    if (footerContainer && footerHTML) {
      footerContainer.innerHTML = footerHTML;
    }
  },
  
  // Load component with caching
  async loadComponent(componentName) {
    // Check cache first
    if (this.loadedComponents.has(componentName)) {
      return this.loadedComponents.get(componentName);
    }
    
    try {
      const response = await fetch(`components/${componentName}.html`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${componentName}: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Cache the component
      this.loadedComponents.set(componentName, html);
      
      return html;
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
      return this.getFallbackComponent(componentName);
    }
  },
  
  // Initialize core systems after components are loaded
  initializeSystems() {
    // Initialize systems in order
    if (window.Menu && typeof Menu.init === 'function') {
      Menu.init();
    }
    
    if (window.Auth && typeof Auth.init === 'function') {
      Auth.init();
    }
    
    // Initialize page-specific systems
    this.initializePageSystems();
  },
  
  // Initialize page-specific systems
  initializePageSystems() {
    // Check for page-specific initialization
    if (window.PageApp && typeof PageApp.init === 'function') {
      PageApp.init();
    }
    
    // Auto-detect and initialize based on page
    const pageName = this.detectPageName();
    const pageInitializer = window[`${pageName}Page`];
    
    if (pageInitializer && typeof pageInitializer.init === 'function') {
      pageInitializer.init();
    }
  },
  
  // Detect current page name
  detectPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    
    // Convert to camelCase
    return filename.charAt(0).toUpperCase() + filename.slice(1);
  },
  
  // Get fallback component if loading fails
  getFallbackComponent(componentName) {
    const fallbacks = {
      header: `
        <header class="app-header fallback">
          <div class="header-content">
            <div class="brand">
              <a href="home.html" class="brand-link">🏋️ GymTracker</a>
            </div>
            <div class="fallback-notice">
              <span>Menu temporaneamente non disponibile</span>
            </div>
          </div>
        </header>
      `,
      footer: `
        <footer class="app-footer fallback">
          <div class="footer-content">
            <p>&copy; 2025 GymTracker. Sistema in caricamento...</p>
          </div>
        </footer>
      `
    };
    
    return fallbacks[componentName] || '';
  },
  
  // Handle load error
  handleLoadError() {
    console.warn('Using fallback template system');
    
    // Show user-friendly error
    const errorNotice = document.createElement('div');
    errorNotice.className = 'system-notice';
    errorNotice.innerHTML = `
      <div class="notice-content">
        ⚠️ Alcuni componenti sono in caricamento. L'applicazione potrebbe non funzionare completamente.
        <button onclick="location.reload()">Ricarica Pagina</button>
      </div>
    `;
    
    document.body.insertBefore(errorNotice, document.body.firstChild);
  },
  
  // Reload component (for debugging)
  async reloadComponent(componentName) {
    this.loadedComponents.delete(componentName);
    
    if (componentName === 'header') {
      await this.loadHeader();
    } else if (componentName === 'footer') {
      await this.loadFooter();
    }
  },
  
  // Get component status
  getStatus() {
    return {
      pageType: this.pageType,
      loadedComponents: Array.from(this.loadedComponents.keys()),
      cacheSize: this.loadedComponents.size
    };
  }
};

// Expose globally for debugging
window.TemplateLoader = TemplateLoader;