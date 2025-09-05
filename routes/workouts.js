const express = require('express');
const { authenticateUser, dbHelpers, supabase, supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// GET /api/workouts - Ottieni tutte le sessioni di allenamento dell'utente
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    // *** FIX: Usa client autenticato ***
    const { data, error } = await dbHelpers.getUserWorkoutPlans(userId, req.supabaseAuth);

    if (error) {
      console.error('Errore recupero sessioni:', error);
      return res.status(500).json({ error: 'Errore nel recupero delle sessioni di allenamento' });
    }

    // Ordina gli esercizi per order_index
    const workoutPlans = data?.map(plan => ({
      ...plan,
      exercises: plan.exercises?.sort((a, b) => a.order_index - b.order_index) || []
    })) || [];

    res.status(200).json({ workoutPlans });
  } catch (error) {
    console.error('Errore interno recupero sessioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/workouts/:id - Ottieni una sessione specifica
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // *** FIX: Usa client autenticato ***
    const { data, error } = await req.supabaseAuth
      .from('workout_plans')
      .select(`
        *,
        exercises (
          id,
          name,
          sets,
          reps,
          weight,
          notes,
          recovery_seconds,
          intensity,
          media_url,
          order_index
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Sessione di allenamento non trovata' });
      }
      console.error('Errore recupero scheda:', error);
      return res.status(500).json({ error: 'Errore nel recupero della scheda' });
    }

    // Ordina gli esercizi
    const workoutPlan = {
      ...data,
      exercises: data.exercises?.sort((a, b) => a.order_index - b.order_index) || []
    };

    res.status(200).json({ workoutPlan });
  } catch (error) {
    console.error('Errore interno recupero scheda:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/workouts - Crea una nuova scheda di allenamento
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, exercises, scheda_id: bodySchedaId } = req.body;

    console.log('🔍 User ID:', userId); // Debug
    console.log('🔍 Request body:', { name, description, exercises: exercises?.length }); // Debug

    // Validazione
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Il nome della scheda è obbligatorio' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Il nome della scheda non può superare i 100 caratteri' });
    }

    // Determina la scheda di appartenenza (obbligatoria in DB)
    let schedaId = (bodySchedaId && String(bodySchedaId).trim()) || null;

    // Se non è stata passata, prova a recuperare/creare una scheda personale
    if (!schedaId) {
      try {
        // 1) prova a cercare una scheda 'Personale' dell'utente via client autenticato (RLS)
        const { data: found } = await req.supabaseAuth
          .from('schede')
          .select('id')
          .eq('user_id', userId)
          .eq('titolo', 'Personale')
          .eq('cancellata', false)
          .limit(1)
          .maybeSingle();
        if (found?.id) schedaId = found.id;
      } catch (_) { /* ignore */ }

      if (!schedaId) {
        try {
          // 2) prova a crearla come utente (se le policy lo consentono)
          const { data: created, error: createErr } = await req.supabaseAuth
            .from('schede')
            .insert({ user_id: userId, titolo: 'Personale', descrizione: null, attiva: true, cancellata: false })
            .select('id')
            .single();
          if (created?.id) schedaId = created.id;
          if (createErr) throw createErr;
        } catch (_) {
          // 3) fallback: se disponibile, crea con service role
          if (supabaseAdmin) {
            const { data: createdAdmin } = await supabaseAdmin
              .from('schede')
              .insert({ user_id: userId, titolo: 'Personale', descrizione: null, attiva: true, cancellata: false })
              .select('id')
              .single();
            if (createdAdmin?.id) schedaId = createdAdmin.id;
          }
        }
      }
    }

    if (!schedaId) {
      return res.status(400).json({ error: 'Scheda non specificata. Crea o seleziona una scheda prima di creare una sessione.' });
    }

    // Crea la sessione (workout plan) legandola alla scheda
    const planData = {
      name: name.trim(),
      description: description?.trim() || null,
      scheda_id: schedaId
    };

    // *** FIX: Usa client autenticato ***
    const { data: workoutPlan, error: planError } = await dbHelpers.createWorkoutPlan(userId, planData, req.supabaseAuth);

    if (planError) {
      console.error('Errore creazione scheda:', planError);
      return res.status(500).json({ error: 'Errore nella creazione della scheda' });
    }

    // Aggiungi gli esercizi se forniti
    const createdExercises = [];
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        
        // Validazione esercizio
        if (!exercise.name || exercise.name.trim().length === 0) {
          continue; // Salta esercizi senza nome
        }

        if (!exercise.sets || exercise.sets < 1 || exercise.sets > 50) {
          return res.status(400).json({ 
            error: `Numero di serie non valido per l'esercizio "${exercise.name}". Deve essere tra 1 e 50.` 
          });
        }

        if (!exercise.reps || exercise.reps < 1 || exercise.reps > 100) {
          return res.status(400).json({ 
            error: `Numero di ripetizioni non valido per l'esercizio "${exercise.name}". Deve essere tra 1 e 100.` 
          });
        }

        const exerciseData = {
          name: exercise.name.trim(),
          sets: parseInt(exercise.sets),
          reps: parseInt(exercise.reps),
          weight: exercise.weight ? parseFloat(exercise.weight) : null,
          notes: exercise.notes?.trim() || null,
          order_index: i
        };

        // *** FIX: Usa client autenticato ***
        const { data: exerciseResult, error: exerciseError } = await dbHelpers.addExercise(workoutPlan.id, exerciseData, req.supabaseAuth);
        
        if (exerciseError) {
          console.error('Errore aggiunta esercizio:', exerciseError);
          // Continua con gli altri esercizi invece di fallire completamente
          continue;
        }

        createdExercises.push(exerciseResult);
      }
    }

    res.status(201).json({
      message: 'Scheda di allenamento creata con successo!',
      workoutPlan: {
        ...workoutPlan,
        exercises: createdExercises
      }
    });
  } catch (error) {
    console.error('💥 Errore completo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/workouts/:id - Aggiorna una scheda di allenamento
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description } = req.body;

    // Validazione
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Il nome della scheda è obbligatorio' });
    }

    // Verifica proprietà
    // *** FIX: Usa client autenticato ***
    const { data: existingPlan, error: checkError } = await req.supabaseAuth
      .from('workout_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (checkError || !existingPlan) {
      return res.status(404).json({ error: 'Scheda non trovata' });
    }

    // Aggiorna
    // *** FIX: Usa client autenticato ***
    const { data, error } = await req.supabaseAuth
      .from('workout_plans')
      .update({
        name: name.trim(),
        description: description?.trim() || null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Errore aggiornamento scheda:', error);
      return res.status(500).json({ error: 'Errore nell\'aggiornamento della scheda' });
    }

    res.status(200).json({
      message: 'Scheda aggiornata con successo!',
      workoutPlan: data
    });
  } catch (error) {
    console.error('Errore interno aggiornamento scheda:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/workouts/:id - Elimina una scheda di allenamento
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // *** FIX: Usa client autenticato ***
    const { error } = await dbHelpers.deleteWorkoutPlan(userId, id, req.supabaseAuth);

    if (error) {
      console.error('Errore eliminazione scheda:', error);
      return res.status(500).json({ error: 'Errore nell\'eliminazione della scheda' });
    }

    res.status(200).json({ message: 'Scheda eliminata con successo!' });
  } catch (error) {
    console.error('Errore interno eliminazione scheda:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/workouts/:id/exercises - Aggiungi esercizio a una scheda
router.post('/:id/exercises', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, sets, reps, weight, notes, recovery_seconds, intensity, media_url } = req.body;

    // Verifica proprietà scheda
    // *** FIX: Usa client autenticato ***
    const { data: existingPlan, error: checkError } = await req.supabaseAuth
      .from('workout_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (checkError || !existingPlan) {
      return res.status(404).json({ error: 'Scheda non trovata' });
    }

    // Validazione esercizio
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Il nome dell\'esercizio è obbligatorio' });
    }

    if (!sets || sets < 1 || sets > 50) {
      return res.status(400).json({ error: 'Il numero di serie deve essere tra 1 e 50' });
    }

    if (!reps || reps < 1 || reps > 100) {
      return res.status(400).json({ error: 'Il numero di ripetizioni deve essere tra 1 e 100' });
    }

    // Ottieni il prossimo order_index
    // *** FIX: Usa client autenticato ***
    const { data: exercises, error: countError } = await req.supabaseAuth
      .from('exercises')
      .select('order_index')
      .eq('workout_plan_id', id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = exercises && exercises.length > 0 ? exercises[0].order_index + 1 : 0;

    const exerciseData = {
      name: name.trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : null,
      notes: notes?.trim() || null,
      recovery_seconds: recovery_seconds !== undefined && recovery_seconds !== null && recovery_seconds !== ''
        ? parseInt(recovery_seconds) : null,
      intensity: intensity !== undefined && intensity !== null && intensity !== ''
        ? parseInt(intensity) : null,
      media_url: media_url?.trim() || null,
      order_index: nextOrderIndex
    };

    // *** FIX: Usa client autenticato ***
    const { data, error } = await dbHelpers.addExercise(id, exerciseData, req.supabaseAuth);

    if (error) {
      console.error('Errore aggiunta esercizio:', error);
      return res.status(500).json({ error: 'Errore nell\'aggiunta dell\'esercizio' });
    }

    res.status(201).json({
      message: 'Esercizio aggiunto con successo!',
      exercise: data
    });
  } catch (error) {
    console.error('Errore interno aggiunta esercizio:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/workouts/:workoutId/exercises/:exerciseId - Modifica esercizio
router.put('/:workoutId/exercises/:exerciseId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutId, exerciseId } = req.params;
    const { name, sets, reps, weight, notes } = req.body;

    // Verifica proprietà
    // *** FIX: Usa client autenticato ***
    const { data: exercise, error: checkError } = await req.supabaseAuth
      .from('exercises')
      .select(`
        id,
        workout_plans!inner (
          id,
          user_id
        )
      `)
      .eq('id', exerciseId)
      .eq('workout_plan_id', workoutId)
      .single();

    if (checkError || !exercise || exercise.workout_plans.user_id !== userId) {
      return res.status(404).json({ error: 'Esercizio non trovato' });
    }

    // Validazione
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: 'Il nome dell\'esercizio non può essere vuoto' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (sets) {
      if (sets < 1 || sets > 50) {
        return res.status(400).json({ error: 'Il numero di serie deve essere tra 1 e 50' });
      }
      updateData.sets = parseInt(sets);
    }
    if (reps) {
      if (reps < 1 || reps > 100) {
        return res.status(400).json({ error: 'Il numero di ripetizioni deve essere tra 1 e 100' });
      }
      updateData.reps = parseInt(reps);
    }
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (req.body.recovery_seconds !== undefined) {
      const rs = parseInt(req.body.recovery_seconds);
      updateData.recovery_seconds = (req.body.recovery_seconds === null || req.body.recovery_seconds === '') ? null
        : (!Number.isNaN(rs) && rs >= 0 ? rs : updateData.recovery_seconds);
    }
    if (req.body.intensity !== undefined) {
      const it = parseInt(req.body.intensity);
      updateData.intensity = (req.body.intensity === null || req.body.intensity === '') ? null
        : (!Number.isNaN(it) && it >= 0 && it <= 5 ? it : updateData.intensity);
    }
    if (req.body.media_url !== undefined) {
      updateData.media_url = req.body.media_url?.trim() || null;
    }

    // *** FIX: Usa client autenticato ***
    const { data, error } = await req.supabaseAuth
      .from('exercises')
      .update(updateData)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) {
      console.error('Errore modifica esercizio:', error);
      return res.status(500).json({ error: 'Errore nella modifica dell\'esercizio' });
    }

    res.status(200).json({
      message: 'Esercizio modificato con successo!',
      exercise: data
    });
  } catch (error) {
    console.error('Errore interno modifica esercizio:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/workouts/:workoutId/exercises/:exerciseId - Elimina esercizio
router.delete('/:workoutId/exercises/:exerciseId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutId, exerciseId } = req.params;

    // Verifica proprietà
    // *** FIX: Usa client autenticato ***
    const { data: exercise, error: checkError } = await req.supabaseAuth
      .from('exercises')
      .select(`
        id,
        workout_plans!inner (
          id,
          user_id
        )
      `)
      .eq('id', exerciseId)
      .eq('workout_plan_id', workoutId)
      .single();

    if (checkError || !exercise || exercise.workout_plans.user_id !== userId) {
      return res.status(404).json({ error: 'Esercizio non trovato' });
    }

    // *** FIX: Usa client autenticato ***
    const { error } = await req.supabaseAuth
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error('Errore eliminazione esercizio:', error);
      return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'esercizio' });
    }

    res.status(200).json({ message: 'Esercizio eliminato con successo!' });
  } catch (error) {
    console.error('Errore interno eliminazione esercizio:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/workouts/:id/log - Registra un allenamento completato
router.post('/:id/log', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { exercises, notes } = req.body;

    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'Dati degli esercizi completati richiesti' });
    }

    const logs = [];
    for (const exercise of exercises) {
      if (exercise.exercise_id && exercise.sets_completed && exercise.reps_completed) {
        const logData = {
          workout_plan_id: id,
          exercise_id: exercise.exercise_id,
          sets_completed: parseInt(exercise.sets_completed),
          reps_completed: parseInt(exercise.reps_completed),
          weight_used: exercise.weight_used ? parseFloat(exercise.weight_used) : null,
          notes: exercise.notes?.trim() || null
        };

        // *** FIX: Usa client autenticato ***
        const { data: log, error: logError } = await dbHelpers.logWorkout(userId, logData, req.supabaseAuth);
        
        if (!logError) {
          logs.push(log);
        }
      }
    }

    res.status(201).json({
      message: 'Allenamento registrato con successo!',
      logs
    });
  } catch (error) {
    console.error('Errore interno registrazione allenamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
