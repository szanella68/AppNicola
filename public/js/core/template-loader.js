/* js/core/template-loader.js - Professional Template System */

const TemplateLoader = {
  loadedTemplates: new Map(),
  isInitialized: false,
  
  // Initialize template system
  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.loadAllTemplates();
      this.isInitialized = true;
      console.log('✅ Template system initialized successfully');
    } catch (error) {
      console.error('❌ Template system initialization failed:', error);
      throw error;
    }
  },
  
  // Load all required templates
  async loadAllTemplates() {
    const templates = [
      { name: 'header', path: 'components/header.html', container: '#headerContainer' },
      { name: 'footer', path: 'components/footer.html', container: '#footerContainer' }
    ];
    
    // Load templates in parallel for better performance
    const loadPromises = templates.map(template => this.loadTemplate(template));
    await Promise.all(loadPromises);
  },
  
  // Load single template
  async loadTemplate({ name, path, container }) {
    try {
      console.log(`🔄 Loading template: ${name}`);
      
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${name}: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      this.loadedTemplates.set(name, html);
      
      // Insert into container if it exists
      const containerEl = document.querySelector(container);
      if (containerEl) {
        containerEl.innerHTML = html;
        console.log(`✅ Template ${name} loaded and inserted`);
      } else {
        console.warn(`⚠️ Container ${container} not found for template ${name}`);
      }
      
      return html;
    } catch (error) {
      console.error(`❌ Failed to load template ${name}:`, error);
      // Fallback: show error message in container
      const containerEl = document.querySelector(container);
      if (containerEl) {
        containerEl.innerHTML = `
          <div style="padding: 1rem; background: #fee2e2; color: #dc2626; border-radius: 8px;">
            ⚠️ Error loading ${name} template. Please refresh the page.
          </div>
        `;
      }
      throw error;
    }
  },
  
  // Get loaded template by name
  getTemplate(name) {
    return this.loadedTemplates.get(name);
  },
  
  // Initialize page after templates loaded
  async initializePage() {
    try {
      // Wait for templates to load
      await this.init();
      
      // Initialize core systems in correct order: Menu FIRST, then Auth
      if (window.Menu && typeof Menu.init === 'function') {
        Menu.init();
        console.log('✅ Menu system initialized');
        
        // Small delay to ensure Menu is fully ready
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (window.Auth && typeof Auth.init === 'function') {
        Auth.init();
        console.log('✅ Auth system initialized');
      }
      
      // Trigger custom page initialization if exists
      if (window.PageInit && typeof PageInit === 'function') {
        PageInit();
        console.log('✅ Page-specific initialization completed');
      }
      
      console.log('🚀 Page fully initialized');
      
    } catch (error) {
      console.error('❌ Page initialization failed:', error);
      this.showInitializationError(error);
    }
  },
  
  // Show initialization error to user
  showInitializationError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      color: #dc2626;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 300px;
    `;
    errorContainer.innerHTML = `
      <strong>⚠️ Initialization Error</strong><br>
      <small>Please refresh the page. If the problem persists, check your connection.</small>
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: #dc2626; cursor: pointer; font-size: 18px;">&times;</button>
    `;
    document.body.appendChild(errorContainer);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (errorContainer.parentElement) {
        errorContainer.remove();
      }
    }, 10000);
  },
  
  // Utility: Create template containers in page
  createTemplateContainers() {
    const containers = [
      { id: 'headerContainer', insertBefore: 'main' },
      { id: 'footerContainer', insertAfter: 'main' }
    ];
    
    containers.forEach(({ id, insertBefore, insertAfter }) => {
      if (document.getElementById(id)) return; // Already exists
      
      const container = document.createElement('div');
      container.id = id;
      
      if (insertBefore) {
        const target = document.querySelector(insertBefore);
        if (target) {
          target.parentNode.insertBefore(container, target);
        } else {
          document.body.insertAdjacentElement('afterbegin', container);
        }
      } else if (insertAfter) {
        const target = document.querySelector(insertAfter);
        if (target) {
          target.parentNode.insertBefore(container, target.nextSibling);
        } else {
          document.body.appendChild(container);
        }
      }
    });
  },
  
  // Utility: Reload single template
  async reloadTemplate(name) {
    const templateConfig = {
      'header': { name: 'header', path: 'components/header.html', container: '#headerContainer' },
      'footer': { name: 'footer', path: 'components/footer.html', container: '#footerContainer' }
    };
    
    const config = templateConfig[name];
    if (!config) {
      console.error(`❌ Template ${name} not found in configuration`);
      return;
    }
    
    await this.loadTemplate(config);
    
    // Re-initialize systems if needed
    if (name === 'header') {
      if (window.Menu && typeof Menu.init === 'function') {
        Menu.init();
      }
      if (window.Auth && typeof Auth.checkAuthState === 'function') {
        Auth.checkAuthState();
      }
    }
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create template containers automatically
  TemplateLoader.createTemplateContainers();
  
  // Initialize templates and page
  TemplateLoader.initializePage().catch(error => {
    console.error('❌ Failed to initialize page:', error);
  });
});

// Export for global access
window.TemplateLoader = TemplateLoader;