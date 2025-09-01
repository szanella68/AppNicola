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
      persistSession: false, // Gestita dal frontend
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

// Client admin per operazioni privilegiate
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

// Funzione helper per verificare e decodificare il token JWT
const verifyToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Middleware per autenticazione
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token di autenticazione mancante' });
    }

    const token = authHeader.substring(7);
    const { user, error } = await verifyToken(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Errore autenticazione:', error);
    res.status(500).json({ error: 'Errore interno di autenticazione' });
  }
};

// Funzioni helper per il database
const dbHelpers = {
  // Ottieni profilo utente
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  // Crea o aggiorna profilo utente
  async upsertUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single();
    
    return { data, error };
  },

  // Ottieni schede di allenamento utente
  async getUserWorkoutPlans(userId) {
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
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Crea nuova scheda di allenamento
  async createWorkoutPlan(userId, planData) {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({ user_id: userId, ...planData })
      .select()
      .single();
    
    return { data, error };
  },

  // Aggiungi esercizio a scheda
  async addExercise(workoutPlanId, exerciseData) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ workout_plan_id: workoutPlanId, ...exerciseData })
      .select()
      .single();
    
    return { data, error };
  },

  // Elimina scheda di allenamento
  async deleteWorkoutPlan(userId, planId) {
    const { error } = await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('id', planId)
      .eq('user_id', userId);
    
    return { error };
  },

  // Salva log allenamento
  async logWorkout(userId, logData) {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, ...logData })
      .select()
      .single();
    
    return { data, error };
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  authenticateUser,
  verifyToken,
  dbHelpers
};