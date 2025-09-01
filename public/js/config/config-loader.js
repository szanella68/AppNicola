/**
 * Security-First Configuration Loader
 * Carica configurazione dal server per evitare chiavi hardcoded
 */
class ConfigLoader {
  static async loadConfig() {
      try {
        console.log('🔧 Caricamento config dal server...');
        // Usa endpoint locale corretto
        const response = await fetch('http://localhost:3007/api/config/public');
      
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
        const config = await response.json();
      
        // Validation
        if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
          throw new Error('Config incompleta dal server');
        }
      
        window.SUPABASE_CONFIG = config;
        console.log('✅ Config caricata:', config.SUPABASE_URL.substring(0, 30) + '...');
        return config;
      
      } catch (error) {
        console.warn('⚠️ Fallback a config locale:', error.message);
        return this.getLocalConfig();
      }
  }

  static getLocalConfig() {
    // Solo per sviluppo locale
    const config = {
      SUPABASE_URL: 'https://oyetlgzmnhdnjfucdtrj.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZXRsZ3ptbmhkbmpmdWNkdHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODk2NDcsImV4cCI6MjA3MjA2NTY0N30.uzlAepV22MM5Ik9tf-9dI5SgrRTx70asaMAgHFYkJM0',
      API_BASE: 'api'
    };
    
    window.SUPABASE_CONFIG = config;
    return config;
  }
}

window.ConfigLoader = ConfigLoader;