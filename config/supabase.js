// config/supabase.js - FILE COMPLETO 1
// Fix per RLS policies + client autenticato

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Variabili ambiente Supabase mancanti. Controlla il file .env');
}

// Client Supabase per operazioni pubbliche
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'gymtracker-nodejs@1.0.0',
      },
    },
  }
);

// *** FIX: Funzione per creare client autenticato ***
const createAuthenticatedClient = async (accessToken) => {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'gymtracker-nodejs@1.0.0',
        },
      },
    }
  );

  // *** QUESTO È IL FIX CHIAVE: Imposta la sessione invece di solo l'header ***
  await client.auth.setSession({
    access_token: accessToken,
    refresh_token: null // Non necessario per operazioni server-side
  });

  return client;
};

// Middleware per autenticazione AGGIORNATO
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[authN] Missing or malformed Authorization header:', authHeader ? 'present' : 'absent');
      return res.status(401).json({ error: 'Token di autenticazione mancante' });
    }

    const token = authHeader.substring(7);
    console.log('[authN] Verifying token, length:', token?.length || 0);
    const { user, error } = await verifyToken(token);

    if (error || !user) {
      console.warn('[authN] Token invalid:', error?.message || 'no user');
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }

    req.user = user;
    // *** FIX: Crea client autenticato con setSession ***
    req.supabaseAuth = await createAuthenticatedClient(token);
    next();
  } catch (error) {
    console.error('Errore autenticazione:', error);
    res.status(500).json({ error: 'Errore interno di autenticazione' });
  }
};

// dbHelpers con supporto client autenticato
const dbHelpers = {
  // Crea nuova sessione di allenamento CON AUTENTICAZIONE
  async createWorkoutPlan(userId, planData, authClient = supabase) {
    const { data, error } = await authClient
      .from('workout_plans')
      .insert({ user_id: userId, ...planData })
      .select()
      .single();
    
    return { data, error };
  },

  // Ottieni sessioni di allenamento utente CON AUTENTICAZIONE  
  async getUserWorkoutPlans(userId, authClient = supabase) {
    const { data, error } = await authClient
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
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Aggiungi esercizio CON AUTENTICAZIONE
  async addExercise(workoutPlanId, exerciseData, authClient = supabase) {
    const { data, error } = await authClient
      .from('exercises')
      .insert({ workout_plan_id: workoutPlanId, ...exerciseData })
      .select()
      .single();
    
    return { data, error };
  },

  // Altri metodi esistenti rimangono invariati...
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async upsertUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single();
    
    return { data, error };
  },

  async deleteWorkoutPlan(userId, planId, authClient = supabase) {
    const { error } = await authClient
      .from('workout_plans')
      .update({ is_active: false })
      .eq('id', planId)
      .eq('user_id', userId);
    
    return { error };
  },

  async logWorkout(userId, logData, authClient = supabase) {
    const { data, error } = await authClient
      .from('workout_logs')
      .insert({ user_id: userId, ...logData })
      .select()
      .single();
    
    return { data, error };
  }
};

// Verifica token JWT
const verifyToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Client admin (se disponibile)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public',
      }
    }
  ) : null;

module.exports = {
  supabase,
  supabaseAdmin,
  authenticateUser,
  verifyToken,
  dbHelpers,
  createAuthenticatedClient  // Export per testing
};