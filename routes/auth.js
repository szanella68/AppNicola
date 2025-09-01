const express = require('express');
const { supabase, authenticateUser, dbHelpers } = require('../config/supabase');
const router = express.Router();

// POST /api/auth/signup - Registrazione utente
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
    }

    // Registrazione con Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        }
      }
    });

    if (error) {
      console.error('Errore registrazione:', error);
      return res.status(400).json({ error: error.message });
    }

    // Se la registrazione è andata a buon fine ma richiede conferma email
    if (data.user && !data.session) {
      return res.status(200).json({
        message: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
        needsConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email
        }
      });
    }

    // Se la registrazione è completa con sessione attiva
    if (data.user && data.session) {
      // Crea il profilo utente
      const profileResult = await dbHelpers.upsertUserProfile(data.user.id, {
        email: data.user.email,
        full_name: fullName || ''
      });

      if (profileResult.error) {
        console.error('Errore creazione profilo:', profileResult.error);
      }

      res.status(201).json({
        message: 'Registrazione completata con successo!',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: fullName
        },
        session: data.session
      });
    }
  } catch (error) {
    console.error('Errore interno registrazione:', error);
    res.status(500).json({ error: 'Errore interno del server durante la registrazione' });
  }
});

// POST /api/auth/signin - Accesso utente
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' });
    }

    // Login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Errore login:', error);
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Login fallito' });
    }

    // Ottieni o crea il profilo utente
    let profileResult = await dbHelpers.getUserProfile(data.user.id);
    
    if (profileResult.error || !profileResult.data) {
      // Se il profilo non esiste, crealo
      profileResult = await dbHelpers.upsertUserProfile(data.user.id, {
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || ''
      });
    }

    res.status(200).json({
      message: 'Login effettuato con successo!',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profileResult.data?.full_name || ''
      },
      session: data.session,
      profile: profileResult.data
    });
  } catch (error) {
    console.error('Errore interno login:', error);
    res.status(500).json({ error: 'Errore interno del server durante il login' });
  }
});

// POST /api/auth/signout - Logout utente
router.post('/signout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Errore logout:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logout effettuato con successo!' });
  } catch (error) {
    console.error('Errore interno logout:', error);
    res.status(500).json({ error: 'Errore interno del server durante il logout' });
  }
});

// GET /api/auth/user - Ottieni informazioni utente corrente
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Ottieni il profilo completo dell'utente
    const profileResult = await dbHelpers.getUserProfile(userId);

    res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: profileResult.data?.full_name || ''
      },
      profile: profileResult.data
    });
  } catch (error) {
    console.error('Errore ottenimento utente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/auth/refresh - Rinnova token di accesso
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token mancante' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      console.error('Errore refresh token:', error);
      return res.status(401).json({ error: 'Token non valido' });
    }

    res.status(200).json({
      message: 'Token aggiornato con successo',
      session: data.session
    });
  } catch (error) {
    console.error('Errore interno refresh:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email è obbligatoria' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      console.error('Errore reset password:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Email di reset password inviata! Controlla la tua casella di posta.'
    });
  } catch (error) {
    console.error('Errore interno reset password:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;