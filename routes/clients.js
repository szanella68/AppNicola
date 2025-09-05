const express = require('express');
const { authenticateUser, supabase, supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// GET /api/clients?status=active|inactive|all&search=...
router.get('/', authenticateUser, async (req, res) => {
  try {
    const callerId = req.user.id;

    // Verify caller role via RLS-safe query (self profile)
    const { data: me, error: meErr } = await supabase
      .from('user_profiles')
      .select('id, user_type')
      .eq('id', callerId)
      .single();
    if (meErr || !me) {
      return res.status(403).json({ error: 'Profilo non disponibile' });
    }
    if ((me.user_type || 'standard') !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server non configurato per elencare i clienti (service role mancante)' });
    }

    const status = (req.query.status || 'all').toLowerCase();
    const includeAdmins = String(req.query.includeAdmins || '0') === '1';
    const search = (req.query.search || '').trim();

    let q = supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, gender, user_type, utente_attivo')
      .order('full_name', { ascending: true });

    if (includeAdmins) {
      q = q.in('user_type', ['standard', 'admin']);
    } else {
      q = q.eq('user_type', 'standard');
    }

    if (search) {
      q = q.ilike('full_name', `%${search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    // For now, compute active=true for all (until a real flag exists)
    let clients = (data || []).map(c => ({
      id: c.id,
      name: c.full_name || c.email,
      email: c.email,
      gender: c.gender || null,
      user_type: c.user_type,
      active: c.user_type === 'admin' ? true : (c.utente_attivo === true)
    }));

    if (status === 'active') clients = clients.filter(c => c.active);
    else if (status === 'inactive') clients = clients.filter(c => !c.active);

    res.status(200).json({ clients });
  } catch (err) {
    console.error('Errore elenco clienti:', err);
    res.status(500).json({ error: 'Errore nel recupero dei clienti' });
  }
});

module.exports = router;
