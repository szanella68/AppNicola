const express = require('express');
const { authenticateUser, supabase, supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// Helper: ensure caller is admin
async function ensureAdmin(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', userId)
    .single();
  if (error || !data) return false;
  return (data.user_type || 'standard') === 'admin';
}

// GET /api/schede?user_id=...
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!await ensureAdmin(userId)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server non configurato (service role mancante)' });
    }
    const targetUser = req.query.user_id;
    if (!targetUser) return res.status(400).json({ error: 'user_id richiesto' });

    const includeDeleted = String(req.query.includeDeleted || '0') === '1';
    const onlyDeleted = String(req.query.onlyDeleted || '0') === '1';
    let q = supabaseAdmin
      .from('schede')
      .select('id, user_id, titolo, descrizione, autore, data_creazione, durata_settimane, sessioni_settimana, attiva, cancellata, note')
      .eq('user_id', targetUser)
      .order('data_creazione', { ascending: false });
    if (onlyDeleted) q = q.eq('cancellata', true);
    else if (!includeDeleted) q = q.eq('cancellata', false);
    const { data, error } = await q;
    if (error) throw error;
    res.status(200).json({ schede: data || [] });
  } catch (err) {
    console.error('Errore GET schede:', err);
    res.status(500).json({ error: 'Errore nel recupero delle schede' });
  }
});

// POST /api/schede
router.post('/', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server non configurato' });
    }
    const { user_id, titolo, descrizione, autore, durata_settimane, sessioni_settimana, attiva, note } = req.body || {};
    if (!user_id || !titolo || String(titolo).trim().length === 0) {
      return res.status(400).json({ error: 'user_id e titolo sono obbligatori' });
    }

    const insert = {
      user_id,
      titolo: String(titolo).trim(),
      descrizione: descrizione?.trim() || null,
      autore: autore?.trim() || null,
      durata_settimane: durata_settimane ? parseInt(durata_settimane) : null,
      sessioni_settimana: sessioni_settimana ? parseInt(sessioni_settimana) : null,
      attiva: (attiva === true || attiva === 'true'),
      cancellata: false,
      note: note?.trim() || null
    };

    const { data, error } = await supabaseAdmin
      .from('schede')
      .insert(insert)
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ scheda: data });
  } catch (err) {
    console.error('Errore POST schede:', err);
    res.status(500).json({ error: 'Errore nella creazione della scheda' });
  }
});

// PUT /api/schede/:id
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server non configurato' });
    const { id } = req.params;
    const patch = {};
    const fields = ['titolo','descrizione','autore','durata_settimane','sessioni_settimana','attiva','note','cancellata'];
    for (const f of fields) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    if (patch.titolo) patch.titolo = String(patch.titolo).trim();
    if (patch.descrizione !== undefined) patch.descrizione = patch.descrizione ? String(patch.descrizione).trim() : null;
    if (patch.autore !== undefined) patch.autore = patch.autore ? String(patch.autore).trim() : null;
    if (patch.durata_settimane !== undefined) patch.durata_settimane = patch.durata_settimane ? parseInt(patch.durata_settimane) : null;
    if (patch.sessioni_settimana !== undefined) patch.sessioni_settimana = patch.sessioni_settimana ? parseInt(patch.sessioni_settimana) : null;
    if (patch.attiva !== undefined) patch.attiva = (patch.attiva === true || patch.attiva === 'true');
    if (patch.note !== undefined) patch.note = patch.note ? String(patch.note).trim() : null;

    const { data, error } = await supabaseAdmin
      .from('schede')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    res.status(200).json({ scheda: data });
  } catch (err) {
    console.error('Errore PUT schede:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della scheda' });
  }
});

// DELETE /api/schede/:id (soft delete -> attiva=false)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server non configurato' });
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('schede')
      .update({ cancellata: true, attiva: false })
      .eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Scheda disattivata' });
  } catch (err) {
    console.error('Errore DELETE schede:', err);
    res.status(500).json({ error: 'Errore nella disattivazione della scheda' });
  }
});

// POST /api/schede/:id/clone
router.post('/:id/clone', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server non configurato' });
    const { id } = req.params;
    const { data: original, error: getErr } = await supabaseAdmin
      .from('schede')
      .select('*')
      .eq('id', id)
      .single();
    if (getErr || !original) return res.status(404).json({ error: 'Scheda non trovata' });

    const copy = { ...original };
    delete copy.id;
    copy.titolo = `${original.titolo} (copia)`;
    copy.data_creazione = new Date().toISOString();
    copy.cancellata = false;

    const { data: created, error: insErr } = await supabaseAdmin
      .from('schede')
      .insert(copy)
      .select('*')
      .single();
    if (insErr) throw insErr;
    res.status(201).json({ scheda: created });
  } catch (err) {
    console.error('Errore CLONE schede:', err);
    res.status(500).json({ error: 'Errore nella clonazione della scheda' });
  }
});

module.exports = router;

// =============== NESTED: SESSIONI (workout_plans) & ESERCIZI ===============
// Nota: tutte le route nested richiedono admin e usano supabaseAdmin

// helper per ottenere scheda e relativo user_id
async function getSchedaById(id){
  const { data, error } = await supabaseAdmin
    .from('schede')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

// GET /api/schede/:id/sessioni
router.get('/:id/sessioni', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server non configurato' });
    const { id } = req.params;
    const scheda = await getSchedaById(id);
    if (!scheda) return res.status(404).json({ error: 'Scheda non trovata' });
    const { data, error } = await supabaseAdmin
      .from('workout_plans')
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .eq('scheda_id', id)
      .eq('user_id', scheda.user_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ sessioni: data || [] });
  } catch (err) {
    console.error('Errore GET sessioni scheda:', err);
    res.status(500).json({ error: 'Errore nel recupero delle sessioni' });
  }
});

// POST /api/schede/:id/sessioni
router.post('/:id/sessioni', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server non configurato' });
    const { id } = req.params;
    const { name, description } = req.body || {};
    if (!name || String(name).trim().length === 0) return res.status(400).json({ error: 'name obbligatorio' });
    const scheda = await getSchedaById(id);
    if (!scheda) return res.status(404).json({ error: 'Scheda non trovata' });
    const insert = {
      user_id: scheda.user_id,
      name: String(name).trim(),
      description: description?.trim() || null,
      is_active: true,
      scheda_id: id
    };
    const { data, error } = await supabaseAdmin
      .from('workout_plans')
      .insert(insert)
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    res.status(201).json({ sessione: data });
  } catch (err) {
    console.error('Errore POST sessioni scheda:', err);
    res.status(500).json({ error: 'Errore nella creazione della sessione' });
  }
});

// PUT /api/schede/:id/sessioni/:sid
router.put('/:id/sessioni/:sid', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { id, sid } = req.params;
    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.description !== undefined) patch.description = req.body.description ? String(req.body.description).trim() : null;
    if (req.body.is_active !== undefined) patch.is_active = !!req.body.is_active;
    const { data, error } = await supabaseAdmin
      .from('workout_plans')
      .update(patch)
      .eq('id', sid)
      .eq('scheda_id', id)
      .select('id, user_id, name, description, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    res.status(200).json({ sessione: data });
  } catch (err) {
    console.error('Errore PUT sessioni scheda:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della sessione' });
  }
});

// DELETE /api/schede/:id/sessioni/:sid
router.delete('/:id/sessioni/:sid', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { id, sid } = req.params;
    const { error } = await supabaseAdmin
      .from('workout_plans')
      .delete()
      .eq('id', sid)
      .eq('scheda_id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Sessione eliminata' });
  } catch (err) {
    console.error('Errore DELETE sessioni scheda:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della sessione' });
  }
});

// ESERCIZI nested: /api/schede/:id/sessioni/:sid/exercises
router.get('/:id/sessioni/:sid/exercises', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { id, sid } = req.params;
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .select('id, name, sets, reps, weight, notes, recovery_seconds, intensity, media_url, order_index')
      .eq('workout_plan_id', sid)
      .order('order_index', { ascending: true });
    if (error) throw error;
    res.status(200).json({ exercises: data || [] });
  } catch (err) {
    console.error('Errore GET exercises sessione:', err);
    res.status(500).json({ error: 'Errore nel recupero esercizi' });
  }
});

router.post('/:id/sessioni/:sid/exercises', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { sid } = req.params;
    const { name, sets, reps, weight, notes, recovery_seconds, intensity, media_url } = req.body || {};
    if (!name || !sets || !reps) return res.status(400).json({ error: 'name, sets, reps obbligatori' });
    const insert = {
      workout_plan_id: sid,
      name: String(name).trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : null,
      notes: notes?.trim() || null,
      recovery_seconds: recovery_seconds ? parseInt(recovery_seconds) : null,
      intensity: intensity ? parseInt(intensity) : null,
      media_url: media_url?.trim() || null,
      order_index: req.body.order_index ? parseInt(req.body.order_index) : 0
    };
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .insert(insert)
      .select('id, name, sets, reps, weight, notes, recovery_seconds, intensity, media_url, order_index')
      .single();
    if (error) throw error;
    res.status(201).json({ exercise: data });
  } catch (err) {
    console.error('Errore POST exercises:', err);
    res.status(500).json({ error: 'Errore creazione esercizio' });
  }
});

router.put('/:id/sessioni/:sid/exercises/:eid', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { eid } = req.params;
    const patch = {};
    const fns = ['name','sets','reps','weight','notes','recovery_seconds','intensity','media_url','order_index'];
    fns.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .update(patch)
      .eq('id', eid)
      .select('id, name, sets, reps, weight, notes, recovery_seconds, intensity, media_url, order_index')
      .single();
    if (error) throw error;
    res.status(200).json({ exercise: data });
  } catch (err) {
    console.error('Errore PUT exercises:', err);
    res.status(500).json({ error: 'Errore aggiornamento esercizio' });
  }
});

router.delete('/:id/sessioni/:sid/exercises/:eid', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;
    if (!await ensureAdmin(callerId)) return res.status(403).json({ error: 'Accesso negato' });
    const { eid } = req.params;
    const { error } = await supabaseAdmin
      .from('exercises')
      .delete()
      .eq('id', eid);
    if (error) throw error;
    res.status(200).json({ message: 'Esercizio eliminato' });
  } catch (err) {
    console.error('Errore DELETE exercises:', err);
    res.status(500).json({ error: 'Errore eliminazione esercizio' });
  }
});
