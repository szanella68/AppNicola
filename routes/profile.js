const express = require('express');
const { authenticateUser, dbHelpers } = require('../config/supabase');
const router = express.Router();

// GET /api/profile - Ottieni profilo utente
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await dbHelpers.getUserProfile(userId);

    if (error) {
      console.error('Errore ottenimento profilo:', error);
      return res.status(500).json({ error: 'Errore nel recupero del profilo' });
    }

    // Se il profilo non esiste, restituisci dati base dall'auth
    if (!data) {
      return res.status(200).json({
        profile: {
          id: userId,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          age: null,
          fitness_level: null,
          goals: null,
          created_at: req.user.created_at
        }
      });
    }

    res.status(200).json({ profile: data });
  } catch (error) {
    console.error('Errore interno ottenimento profilo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/profile - Aggiorna profilo utente
router.put('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, age, fitness_level, goals, weight_kg, height_cm, gender, injuries_limitations, medications } = req.body;

    // Validazione dati
    const updateData = {
      email: req.user.email // Manteniamo sempre l'email aggiornata
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (age !== undefined) {
      if (age < 13 || age > 120) {
        return res.status(400).json({ error: 'Età deve essere compresa tra 13 e 120 anni' });
      }
      updateData.age = parseInt(age);
    }
    if (fitness_level !== undefined) {
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(fitness_level)) {
        return res.status(400).json({ error: 'Livello fitness non valido' });
      }
      updateData.fitness_level = fitness_level;
    }
    if (goals !== undefined) updateData.goals = goals;

    // New optional fields with basic validation
    if (weight_kg !== undefined) {
      const w = parseFloat(weight_kg);
      if (weight_kg === null || weight_kg === '') updateData.weight_kg = null;
      else if (!Number.isNaN(w) && w >= 0 && w <= 500) updateData.weight_kg = w;
      else return res.status(400).json({ error: 'Peso non valido' });
    }
    if (height_cm !== undefined) {
      const h = parseFloat(height_cm);
      if (height_cm === null || height_cm === '') updateData.height_cm = null;
      else if (!Number.isNaN(h) && h >= 0 && h <= 300) updateData.height_cm = h;
      else return res.status(400).json({ error: 'Altezza non valida' });
    }
    if (gender !== undefined) {
      if (gender === null || gender === '') updateData.gender = null;
      else if (['M','F'].includes(gender)) updateData.gender = gender;
      else return res.status(400).json({ error: 'Genere non valido' });
    }
    if (injuries_limitations !== undefined) updateData.injuries_limitations = injuries_limitations || null;
    if (medications !== undefined) updateData.medications = medications || null;

    const { data, error } = await dbHelpers.upsertUserProfile(userId, updateData);

    if (error) {
      console.error('Errore aggiornamento profilo:', error);
      return res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
    }

    res.status(200).json({
      message: 'Profilo aggiornato con successo!',
      profile: data
    });
  } catch (error) {
    console.error('Errore interno aggiornamento profilo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/profile/onboarding - Completa onboarding iniziale
router.post('/onboarding', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { age, fitness_level, goals, full_name } = req.body;

    // Validazione dati obbligatori per onboarding
    if (!age || !fitness_level) {
      return res.status(400).json({ 
        error: 'Età e livello di fitness sono obbligatori per completare la configurazione' 
      });
    }

    if (age < 13 || age > 120) {
      return res.status(400).json({ error: 'Età deve essere compresa tra 13 e 120 anni' });
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(fitness_level)) {
      return res.status(400).json({ error: 'Livello fitness non valido' });
    }

    const onboardingData = {
      email: req.user.email,
      age: parseInt(age),
      fitness_level,
      goals: goals || '',
      full_name: full_name || req.user.user_metadata?.full_name || ''
    };

    const { data, error } = await dbHelpers.upsertUserProfile(userId, onboardingData);

    if (error) {
      console.error('Errore onboarding:', error);
      return res.status(500).json({ error: 'Errore durante la configurazione iniziale' });
    }

    res.status(200).json({
      message: 'Configurazione iniziale completata con successo!',
      profile: data
    });
  } catch (error) {
    console.error('Errore interno onboarding:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/profile/stats - Ottieni statistiche utente
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Query per ottenere statistiche aggregate
    // NOTE: usare il client autenticato (RLS) per evitare 401/ambiguità lato Supabase
    const { data: workoutPlans, error: plansError } = await dbHelpers.getUserWorkoutPlans(userId, req.supabaseAuth);
    
    if (plansError) {
      console.error('Errore statistiche:', plansError);
      return res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
    }

    const stats = {
      total_workout_plans: workoutPlans?.length || 0,
      total_exercises: workoutPlans?.reduce((acc, plan) => acc + (plan.exercises?.length || 0), 0) || 0,
      favorite_exercises: [], // Potresti implementare questa logica
      recent_activity: workoutPlans?.slice(0, 3) || []
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Errore interno statistiche:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/profile - Elimina profilo utente (soft delete)
router.delete('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirm } = req.body;

    if (!confirm || confirm !== 'DELETE_MY_PROFILE') {
      return res.status(400).json({ 
        error: 'Conferma richiesta. Invia { "confirm": "DELETE_MY_PROFILE" } per procedere' 
      });
    }

    // Prima disattiva tutte le sessioni di allenamento
   const { error: plansError } = await req.supabaseAuth
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (plansError) {
      console.error('Errore disattivazione sessioni:', plansError);
      return res.status(500).json({ error: 'Errore nella cancellazione dei dati' });
    }

    // Poi "soft delete" del profilo (mantenendo i dati per eventuali analisi)
    const { error: profileError } = await dbHelpers.upsertUserProfile(userId, {
      full_name: '[DELETED]',
      goals: null,
      age: null,
      fitness_level: null
    });

    if (profileError) {
      console.error('Errore cancellazione profilo:', profileError);
      return res.status(500).json({ error: 'Errore nella cancellazione del profilo' });
    }

    res.status(200).json({
      message: 'Profilo cancellato con successo. I tuoi dati sono stati anonimizzati.'
    });
  } catch (error) {
    console.error('Errore interno cancellazione profilo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
