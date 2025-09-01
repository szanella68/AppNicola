/**
 * DOM Utilities - Gestione interfaccia utente
 * Tutte le funzioni che manipolano il DOM
 */
class DOMUtils {
  static showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alertId = 'alert-' + Date.now();
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${type}" style="margin-bottom: 1rem; animation: slideInRight 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${message}</span>
          <button onclick="DOMUtils.closeAlert('${alertId}')" style="background: none; border: none; cursor: pointer; color: inherit; font-size: 1.2rem; padding-left: 1rem;">&times;</button>
        </div>
      </div>`;
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => DOMUtils.closeAlert(alertId), 5000);
  }

  static closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }
  }

  static showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  static hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  static hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  static hideAllSections() {
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
  }

  static showSection(sectionId) {
    this.hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) section.classList.remove('hidden');
  }

  static toggleAuthUI(showAuth = true) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (showAuth) {
      authButtons?.classList.remove('hidden');
      userMenu?.classList.add('hidden');
    } else {
      authButtons?.classList.add('hidden');
      userMenu?.classList.remove('hidden');
    }
  }

  static updateUserName(userName) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = `Ciao, ${userName}!`;
  }

  static resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// Esponi globalmente per backward compatibility
window.DOMUtils = DOMUtils;