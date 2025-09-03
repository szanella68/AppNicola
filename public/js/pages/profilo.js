// Profilo (User Profile) Page Logic
// Handles user profile management, settings, and account operations

class Profilo {
    constructor() {
        this.currentUser = null;
        this.profile = null;
        this.stats = null;
        this.settings = {
            notifications: true,
            emailUpdates: true,
            darkMode: false,
            autoSave: true
        };
        this.initialized = false;
    }

    // ===== INITIALIZATION =====
    async init() {
        if (this.initialized) return;
        
        try {
            await this.bindEvents();
            await this.loadUserData();
            await this.renderProfile();
            this.initialized = true;
            
            console.log('✅ Profilo page initialized');
        } catch (error) {
            console.error('❌ Profilo initialization failed:', error);
            Utils.showError('Errore nell\'inizializzazione della pagina');
        }
    }

    // Bind event listeners
    bindEvents() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#profileForm')) {
                e.preventDefault();
                this.handleProfileUpdate(e);
            } else if (e.target.matches('#passwordForm')) {
                e.preventDefault();
                this.handlePasswordChange(e);
            }
        });

        // Settings toggles
        document.addEventListener('change', (e) => {
            if (e.target.matches('.setting-toggle')) {
                this.handleSettingChange(e);
            }
        });

        // Password strength checking
        document.addEventListener('input', (e) => {
            if (e.target.matches('#newPassword')) {
                this.checkPasswordStrength(e.target.value);
            }
        });

        // Dangerous actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('#deleteAccountBtn')) {
                this.confirmAccountDeletion();
            } else if (e.target.matches('#exportDataBtn')) {
                this.exportUserData();
            }
        });

        // Avatar upload
        document.addEventListener('click', (e) => {
            if (e.target.matches('.avatar-circle') || e.target.matches('.avatar-upload')) {
                this.handleAvatarUpload();
            }
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.closeModal();
            }
        });
    }

    // ===== DATA LOADING =====
    async loadUserData() {
        try {
            // Load current user info
            const userResponse = await window.API.getCurrentUser();
            this.currentUser = userResponse.user;
            this.profile = userResponse.profile;

            // Load user statistics
            this.stats = await window.API.getUserStats();

            console.log('✅ User data loaded:', this.currentUser);
        } catch (error) {
            console.error('Failed to load user data:', error);
            Utils.showError('Errore nel caricamento dei dati utente');
        }
    }

    // ===== RENDERING =====
    async renderProfile() {
        await this.renderUserInfo();
        await this.renderStats();
        await this.renderSettings();
        this.populateProfileForm();
    }

    renderUserInfo() {
        const container = Utils.$('#userInfo');
        if (!container) return;

        const initials = this.getInitials(this.currentUser.fullName || this.currentUser.email);
        
        container.innerHTML = `
            <div class="profile-avatar">
                <div class="avatar-circle" title="Clicca per cambiare avatar">
                    ${initials}
                    <div class="avatar-upload">📷</div>
                </div>
                <div class="profile-name">${this.currentUser.fullName || 'Utente'}</div>
                <div class="profile-email">${this.currentUser.email}</div>
            </div>

            <form id="profileForm" class="profile-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="fullName">Nome Completo</label>
                        <input type="text" id="fullName" name="fullName" class="form-input" 
                               value="${this.currentUser.fullName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="age">Età</label>
                        <input type="number" id="age" name="age" class="form-input" 
                               value="${this.profile?.age || ''}" min="13" max="120">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="fitnessLevel">Livello Fitness</label>
                        <select id="fitnessLevel" name="fitnessLevel" class="form-select">
                            <option value="">Seleziona livello</option>
                            <option value="beginner" ${this.profile?.fitness_level === 'beginner' ? 'selected' : ''}>
                                Principiante
                            </option>
                            <option value="intermediate" ${this.profile?.fitness_level === 'intermediate' ? 'selected' : ''}>
                                Intermedio
                            </option>
                            <option value="advanced" ${this.profile?.fitness_level === 'advanced' ? 'selected' : ''}>
                                Avanzato
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email">Email</label>
                        <input type="email" id="email" name="email" class="form-input" 
                               value="${this.currentUser.email}" readonly 
                               style="background: #f9fafb; color: #6b7280;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="weightKg">Peso (kg)</label>
                        <input type="number" id="weightKg" name="weight_kg" class="form-input"
                               value="${this.profile?.weight_kg ?? ''}" min="0" max="500" step="0.1" placeholder="Es: 72.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="heightCm">Altezza (cm)</label>
                        <input type="number" id="heightCm" name="height_cm" class="form-input"
                               value="${this.profile?.height_cm ?? ''}" min="0" max="300" step="0.1" placeholder="Es: 178">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="gender">Genere</label>
                        <select id="gender" name="gender" class="form-select">
                            <option value="">Non specificato</option>
                            <option value="M" ${this.profile?.gender === 'M' ? 'selected' : ''}>Maschio</option>
                            <option value="F" ${this.profile?.gender === 'F' ? 'selected' : ''}>Femmina</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="injuries">Infortuni / Limitazioni</label>
                        <textarea id="injuries" name="injuries_limitations" class="form-textarea" placeholder="Descrivi eventuali infortuni o limitazioni...">${this.profile?.injuries_limitations || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="medications">Medicinali assunti</label>
                        <textarea id="medications" name="medications" class="form-textarea" placeholder="Elenca eventuali medicinali...">${this.profile?.medications || ''}</textarea>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="goals">Obiettivi Fitness</label>
                    <textarea id="goals" name="goals" class="form-textarea" 
                              placeholder="Descrivi i tuoi obiettivi di allenamento...">${this.profile?.goals || ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        💾 Salva Modifiche
                    </button>
                </div>
            </form>
        `;
    }

    renderStats() {
        const container = Utils.$('#statsSection');
        if (!container) return;

        const stats = this.stats || {
            totalWorkouts: 0,
            completedSessions: 0,
            totalExercises: 0,
            streakDays: 0
        };

        container.innerHTML = `
            <div class="stats-dashboard">
                <div class="stat-item">
                    <div class="stat-number">${stats.totalWorkouts}</div>
                    <div class="stat-label">Sessioni Create</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.completedSessions}</div>
                    <div class="stat-label">Allenamenti Completati</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalExercises}</div>
                    <div class="stat-label">Esercizi Totali</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.streakDays}</div>
                    <div class="stat-label">Giorni Consecutivi</div>
                </div>
            </div>

            <div class="achievements-list">
                ${this.renderAchievements()}
            </div>
        `;
    }

    renderAchievements() {
        const achievements = this.getAchievements();
        
        if (achievements.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <p>🏆 I tuoi traguardi appariranno qui</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Completa allenamenti e crea sessioni per sbloccare i primi achievement!
                    </p>
                </div>
            `;
        }

        return achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderSettings() {
        const container = Utils.$('#settingsSection');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-panel">
                <div class="settings-group">
                    <div class="settings-title">🔔 Notifiche</div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-name">Promemoria Allenamenti</div>
                            <div class="setting-desc">Ricevi notifiche per i tuoi allenamenti programmati</div>
                        </div>
                        <div class="toggle-switch ${this.settings.notifications ? 'active' : ''}" 
                             data-setting="notifications">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-name">Aggiornamenti via Email</div>
                            <div class="setting-desc">Ricevi email sui tuoi progressi settimanali</div>
                        </div>
                        <div class="toggle-switch ${this.settings.emailUpdates ? 'active' : ''}" 
                             data-setting="emailUpdates">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-title">⚙️ Preferenze App</div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-name">Salvataggio Automatico</div>
                            <div class="setting-desc">Salva automaticamente le modifiche alle sessioni</div>
                        </div>
                        <div class="toggle-switch ${this.settings.autoSave ? 'active' : ''}" 
                             data-setting="autoSave">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-title">🔐 Sicurezza</div>
                    
                    <form id="passwordForm" class="password-form">
                        <div class="form-group">
                            <label class="form-label" for="currentPassword">Password Attuale</label>
                            <input type="password" id="currentPassword" name="currentPassword" 
                                   class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="newPassword">Nuova Password</label>
                            <input type="password" id="newPassword" name="newPassword" 
                                   class="form-input" required>
                            <div class="password-strength" id="passwordStrength">
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                            </div>
                            <div class="password-requirements">
                                <div class="requirement-item unmet" data-req="length">
                                    <span>•</span> Almeno 8 caratteri
                                </div>
                                <div class="requirement-item unmet" data-req="uppercase">
                                    <span>•</span> Una lettera maiuscola
                                </div>
                                <div class="requirement-item unmet" data-req="lowercase">
                                    <span>•</span> Una lettera minuscola
                                </div>
                                <div class="requirement-item unmet" data-req="number">
                                    <span>•</span> Un numero
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="confirmPassword">Conferma Nuova Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" 
                                   class="form-input" required>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                🔑 Cambia Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="danger-zone">
                <div class="danger-title">
                    ⚠️ Zona Pericolosa
                </div>
                <div class="danger-desc">
                    Le azioni seguenti sono irreversibili. Procedi con cautela.
                </div>
                <div class="danger-actions">
                    <button class="btn-secondary" id="exportDataBtn">
                        📥 Esporta Dati
                    </button>
                    <button class="btn-danger" id="deleteAccountBtn">
                        🗑️ Elimina Account
                    </button>
                </div>
            </div>
        `;

        // Bind toggle switches
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const setting = toggle.dataset.setting;
                const isActive = toggle.classList.contains('active');
                
                toggle.classList.toggle('active');
                this.settings[setting] = !isActive;
                
                // TODO: Save settings to backend
                console.log('Setting changed:', setting, this.settings[setting]);
            });
        });
    }

    // ===== FORM HANDLING =====
    async handleProfileUpdate(event) {
        const formData = new FormData(event.target);
        const profileData = {
            full_name: formData.get('fullName').trim(),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            fitness_level: formData.get('fitnessLevel') || null,
            goals: formData.get('goals').trim(),
            weight_kg: formData.get('weight_kg') ? parseFloat(formData.get('weight_kg')) : null,
            height_cm: formData.get('height_cm') ? parseFloat(formData.get('height_cm')) : null,
            gender: formData.get('gender') || null,
            injuries_limitations: formData.get('injuries_limitations')?.trim() || null,
            medications: formData.get('medications')?.trim() || null
        };

        // Validation
        if (!profileData.full_name) {
            Utils.showFieldError(Utils.$('#fullName'), 'Nome completo obbligatorio');
            return;
        }

        if (profileData.age && (profileData.age < 13 || profileData.age > 120)) {
            Utils.showFieldError(Utils.$('#age'), 'Età deve essere tra 13 e 120 anni');
            return;
        }

        try {
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Salvando...';
            submitBtn.disabled = true;

            await window.API.updateProfile(profileData);
            
            // Update local data
            this.currentUser.fullName = profileData.full_name;
            this.profile = { ...this.profile, ...profileData };
            
            // Re-render user info
            this.renderUserInfo();
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Profile update failed:', error);
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = '💾 Salva Modifiche';
            submitBtn.disabled = false;
        }
    }

    async handlePasswordChange(event) {
        const formData = new FormData(event.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        // Validation
        if (!this.isPasswordStrong(newPassword)) {
            Utils.showError('La nuova password non soddisfa i requisiti di sicurezza');
            return;
        }

        if (newPassword !== confirmPassword) {
            Utils.showFieldError(Utils.$('#confirmPassword'), 'Le password non coincidono');
            return;
        }

        try {
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Cambiando...';
            submitBtn.disabled = true;

            // TODO: Implement password change API
            // await window.API.changePassword(currentPassword, newPassword);
            
            // For now, simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Utils.showSuccess('Password cambiata con successo!');
            event.target.reset();
            this.resetPasswordStrength();
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Password change failed:', error);
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = '🔑 Cambia Password';
            submitBtn.disabled = false;
        }
    }

    // ===== PASSWORD STRENGTH ===== 
    checkPasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password)
        };

        // Update requirement indicators
        Object.keys(requirements).forEach(req => {
            const element = Utils.$(`[data-req="${req}"]`);
            if (element) {
                element.className = `requirement-item ${requirements[req] ? 'met' : 'unmet'}`;
            }
        });

        // Update strength bars
        const metCount = Object.values(requirements).filter(Boolean).length;
        const strengthBars = Utils.$$('.strength-bar');
        
        strengthBars.forEach((bar, index) => {
            bar.className = 'strength-bar';
            if (index < metCount) {
                bar.classList.add('active');
                if (metCount <= 1) bar.classList.add('weak');
                else if (metCount <= 2) bar.classList.add('medium');
                else bar.classList.add('strong');
            }
        });

        return metCount === 4;
    }

    isPasswordStrong(password) {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password);
    }

    resetPasswordStrength() {
        Utils.$$('.strength-bar').forEach(bar => {
            bar.className = 'strength-bar';
        });
        
        Utils.$$('.requirement-item').forEach(item => {
            item.className = 'requirement-item unmet';
        });
    }

    // ===== DANGEROUS OPERATIONS =====
    confirmAccountDeletion() {
        const modalHtml = `
            <div class="modal confirmation-modal" id="confirmModal">
                <div class="modal-content">
                    <div class="confirmation-icon">⚠️</div>
                    <div class="confirmation-title">Elimina Account</div>
                    <div class="confirmation-message">
                        Sei sicuro di voler eliminare il tuo account?<br>
                        Tutti i tuoi dati, sessioni e progressi verranno persi per sempre.<br>
                        <strong>Questa azione non può essere annullata.</strong>
                    </div>
                    <div class="confirmation-actions">
                        <button class="btn-secondary" onclick="profilo.closeModal()">
                            Annulla
                        </button>
                        <button class="btn-danger" onclick="profilo.deleteAccount()">
                            Elimina Account
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = Utils.$('#confirmModal');
        setTimeout(() => modal.classList.add('show'), 10);
    }

    async deleteAccount() {
        try {
            // TODO: Implement account deletion API
            // await window.API.deleteAccount();
            
            Utils.showSuccess('Account eliminato. Verrai disconnesso tra poco...');
            
            setTimeout(() => {
                Auth.logout();
                window.location.href = 'home.html';
            }, 2000);
            
        } catch (error) {
            console.error('Account deletion failed:', error);
        }
        
        this.closeModal();
    }

    async exportUserData() {
        try {
            Utils.showInfo('Preparazione esportazione dati...');
            
            // Collect user data
            const exportData = {
                profile: this.profile,
                workouts: await window.API.getWorkouts(),
                stats: this.stats,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gymtracker-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            Utils.showSuccess('Dati esportati con successo!');
            
        } catch (error) {
            console.error('Data export failed:', error);
            Utils.showError('Errore nell\'esportazione dei dati');
        }
    }

    handleAvatarUpload() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processAvatarUpload(file);
            }
        };
        input.click();
    }

    processAvatarUpload(file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Utils.showError('Immagine troppo grande. Massimo 2MB');
            return;
        }

        // Read and display image
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarCircle = Utils.$('.avatar-circle');
            if (avatarCircle) {
                avatarCircle.style.backgroundImage = `url(${e.target.result})`;
                avatarCircle.style.backgroundSize = 'cover';
                avatarCircle.style.backgroundPosition = 'center';
                avatarCircle.innerHTML = '<div class="avatar-upload">📷</div>';
            }
            
            // TODO: Upload to server
            Utils.showSuccess('Avatar aggiornato!');
        };
        reader.readAsDataURL(file);
    }

    // ===== UTILITY METHODS =====
    getInitials(name) {
        if (!name) return '👤';
        
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }

    getAchievements() {
        const achievements = [];
        const stats = this.stats || {};

        if (stats.totalWorkouts >= 1) {
            achievements.push({
                icon: '🏋️',
                title: 'Primo Allenamento',
                description: 'Hai creato la tua prima sessione!'
            });
        }

        if (stats.completedSessions >= 5) {
            achievements.push({
                icon: '🔥',
                title: 'In Forma',
                description: 'Hai completato 5 allenamenti!'
            });
        }

        if (stats.streakDays >= 7) {
            achievements.push({
                icon: '📅',
                title: 'Settimana Perfetta',
                description: '7 giorni consecutivi di allenamento!'
            });
        }

        return achievements;
    }

    populateProfileForm() {
        // Form is already populated in renderUserInfo
    }

    closeModal() {
        const modals = Utils.$$('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }
}

// Initialize page-specific functionality
const profilo = new Profilo();

// Page initialization function (called by base template)
async function initPage() {
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }
    
    await profilo.init();
}

// Make profilo instance globally available for inline event handlers
window.profilo = profilo;
