const express = require('express');
const { authenticateUser, dbHelpers, supabase } = require('../config/supabase');
const router = express.Router();

// GET /api/workouts - Ottieni tutte le schede di allenamento dell'utente
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await dbHelpers.getUserWorkoutPlans(userId);

    if (error) {
      console.error('Errore recupero schede:', error);
      return res.status(500).json({ error: 'Errore nel recupero delle schede di allenamento' });
    }

    // Ordina gli esercizi per order_index
    const workoutPlans = data?.map(plan => ({
      ...plan,
      exercises: plan.exercises?.sort((a, b) => a.order_index - b.order_index) || []
    })) || [];

    res.status(200).json({ workoutPlans });
  } catch (error) {
    console.error('Errore interno recupero schede:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/workouts/:id - Ottieni una scheda specifica
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
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
          order_index
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Scheda di allenamento non trovata' });
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
    const { name, description, exercises } = req.body;

    // Validazione
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Il nome della scheda è obbligatorio' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Il nome della scheda non può superare i 100 caratteri' });
    }

    // Crea la scheda
    const planData = {
      name: name.trim(),
      description: description?.trim() || null
    };

    const { data: workoutPlan, error: planError } = await dbHelpers.createWorkoutPlan(userId, planData);

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

        const { data: exerciseResult, error: exerciseError } = await dbHelpers.addExercise(workoutPlan.id, exerciseData);
        
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
    console.error('Errore interno creazione scheda:', error);
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
    const { data: existingPlan, error: checkError } = await supabase
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
    const { data, error } = await supabase
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

    const { error } = await dbHelpers.deleteWorkoutPlan(userId, id);

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
    const { name, sets, reps, weight, notes } = req.body;

    // Verifica proprietà scheda
    const { data: existingPlan, error: checkError } = await supabase
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
    const { data: exercises, error: countError } = await supabase
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
      order_index: nextOrderIndex
    };

    const { data, error } = await dbHelpers.addExercise(id, exerciseData);

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
    const { data: exercise, error: checkError } = await supabase
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

    const { data, error } = await supabase
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
    const { data: exercise, error: checkError } = await supabase
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

    const { error } = await supabase
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

        const { data: log, error: logError } = await dbHelpers.logWorkout(userId, logData);
        
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