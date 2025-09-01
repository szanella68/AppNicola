/**
 * Profile Module - Gestione profilo utente e onboarding
 */
class ProfileModule {
  constructor() {
    this.currentProfile = null;
  }

  async completeOnboarding(profileData) {
    try {
      DOMUtils.showLoading();
      
      await window.apiUtils.profile('onboarding', profileData, 'POST');
      
      DOMUtils.showAlert('Profilo configurato con successo!', 'success');
      
      // Mostra la dashboard dopo l'onboarding
      if (window.authModule) {
        window.authModule.showDashboard();
      }
    } catch (e) {
      console.error('Errore onboarding:', e);
      DOMUtils.showAlert('Errore durante la configurazione: ' + e.message, 'error');
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async loadProfile() {
    try {
      const response = await window.apiUtils.profile();
      this.currentProfile = response.profile;
      return this.currentProfile;
    } catch (e) {
      console.error('Errore caricamento profilo:', e);
      throw e;
    }
  }

  async updateProfile(profileData) {
    try {
      DOMUtils.showLoading();
      
      const response = await window.apiUtils.profile('', profileData, 'PUT');
      this.currentProfile = response.profile;
      
      DOMUtils.showAlert('Profilo aggiornato con successo!', 'success');
      return this.currentProfile;
    } catch (e) {
      console.error('Errore aggiornamento profilo:', e);
      DOMUtils.showAlert('Errore durante l\'aggiornamento: ' + e.message, 'error');
      throw e;
    } finally {
      DOMUtils.hideLoading();
    }
  }

  async getStats() {
    try {
      const response = await window.apiUtils.profile('stats');
      return response.stats;
    } catch (e) {
      console.error('Errore caricamento statistiche:', e);
      throw e;
    }
  }

  // Validazioni lato client
  validateOnboardingData(data) {
    const errors = [];

    if (!data.age || data.age < 13 || data.age > 120) {
      errors.push('L\'età deve essere compresa tra 13 e 120 anni');
    }

    if (!data.fitness_level || !['beginner', 'intermediate', 'advanced'].includes(data.fitness_level)) {
      errors.push('Seleziona un livello di fitness valido');
    }

    if (data.full_name && data.full_name.length > 100) {
      errors.push('Il nome non può superare i 100 caratteri');
    }

    if (data.goals && data.goals.length > 1000) {
      errors.push('Gli obiettivi non possono superare i 1000 caratteri');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Getter per il profilo corrente
  get profile() {
    return this.currentProfile;
  }

  // Reset del modulo
  reset() {
    this.currentProfile = null;
  }
}

window.ProfileModule = ProfileModule;