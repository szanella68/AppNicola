const express = require('express');
const { authenticateUser } = require('../config/supabase');
const router = express.Router();

// Helper to parse date strings safely
function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// GET /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    let q = req.supabaseAuth
      .from('scheduled_workouts')
      .select(`
        id, user_id, workout_plan_id, date, time, status, notes, created_at, updated_at,
        workout:workout_plans ( id, name, description )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: true });

    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);

    const { data, error } = await q;
    if (error) throw error;
    res.status(200).json({ scheduled: data || [] });
  } catch (error) {
    console.error('Errore GET schedule:', error);
    res.status(500).json({ error: 'Errore nel recupero degli eventi' });
  }
});

// POST /api/schedule
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workout_id, date, time, notes } = req.body || {};
    if (!workout_id || !date) {
      return res.status(400).json({ error: 'workout_id e date sono obbligatori' });
    }

    // Verifica proprietà workout
    const { data: plan, error: planErr } = await req.supabaseAuth
      .from('workout_plans')
      .select('id, user_id, name, description')
      .eq('id', workout_id)
      .eq('user_id', userId)
      .single();
    if (planErr || !plan) {
      return res.status(404).json({ error: 'Scheda non trovata' });
    }

    const insert = {
      user_id: userId,
      workout_plan_id: workout_id,
      date,
      time: time || null,
      status: 'scheduled',
      notes: notes || null,
    };

    const { data, error } = await req.supabaseAuth
      .from('scheduled_workouts')
      .insert(insert)
      .select(`id, user_id, workout_plan_id, date, time, status, notes, created_at, updated_at`)
      .single();
    if (error) throw error;

    res.status(201).json({
      scheduled: {
        ...data,
        workout: { id: plan.id, name: plan.name, description: plan.description }
      }
    });
  } catch (error) {
    console.error('Errore POST schedule:', error);
    res.status(500).json({ error: 'Errore nella pianificazione' });
  }
});

// PUT /api/schedule/:id
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, time, notes, status } = req.body || {};

    const patch = {};
    if (date !== undefined) patch.date = date;
    if (time !== undefined) patch.time = time;
    if (notes !== undefined) patch.notes = notes;
    if (status !== undefined) patch.status = status;

    const { data, error } = await req.supabaseAuth
      .from('scheduled_workouts')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;

    res.status(200).json({ scheduled: data });
  } catch (error) {
    console.error('Errore PUT schedule:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento' });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await req.supabaseAuth
      .from('scheduled_workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;

    res.status(200).json({ message: 'Evento rimosso' });
  } catch (error) {
    console.error('Errore DELETE schedule:', error);
    res.status(500).json({ error: 'Errore nella cancellazione' });
  }
});

// POST /api/schedule/:id/complete
router.post('/:id/complete', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { exercises = [], notes } = req.body || {};

    // Recupera evento + piano
    const { data: sched, error: schedErr } = await req.supabaseAuth
      .from('scheduled_workouts')
      .select('id, workout_plan_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (schedErr || !sched) return res.status(404).json({ error: 'Evento non trovato' });

    // Aggiorna stato
    const { error: upErr } = await req.supabaseAuth
      .from('scheduled_workouts')
      .update({ status: 'completed', notes: notes || null })
      .eq('id', id)
      .eq('user_id', userId);
    if (upErr) throw upErr;

    // Salva log opzionali
    const logs = [];
    for (const ex of exercises) {
      if (!ex.exercise_id || !ex.sets_completed || !ex.reps_completed) continue;
      const { data: log, error: logErr } = await req.supabaseAuth
        .from('workout_logs')
        .insert({
          user_id: userId,
          workout_plan_id: sched.workout_plan_id,
          exercise_id: ex.exercise_id,
          sets_completed: parseInt(ex.sets_completed),
          reps_completed: parseInt(ex.reps_completed),
          weight_used: ex.weight_used ? parseFloat(ex.weight_used) : null,
          notes: ex.notes || null
        })
        .select()
        .single();
      if (!logErr && log) logs.push(log);
    }

    res.status(200).json({ message: 'Completato', logs });
  } catch (error) {
    console.error('Errore COMPLETE schedule:', error);
    res.status(500).json({ error: 'Errore nel completamento' });
  }
});

// POST /api/schedule/:id/miss
router.post('/:id/miss', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await req.supabaseAuth
      .from('scheduled_workouts')
      .update({ status: 'missed' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;

    res.status(200).json({ message: 'Impostato come mancato' });
  } catch (error) {
    console.error('Errore MISS schedule:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento' });
  }
});

module.exports = router;

