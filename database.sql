-- Tabelle per l'applicazione GymTracker
-- Da eseguire nel Query Editor di Supabase

-- 1. Tabella per i profili utente (estende auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    age INTEGER,
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella per le schede di allenamento
CREATE TABLE public.workout_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella per gli esercizi delle schede
CREATE TABLE public.exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL CHECK (sets > 0),
    reps INTEGER NOT NULL CHECK (reps > 0),
    weight DECIMAL(5,2),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabella per i log degli allenamenti
CREATE TABLE public.workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    sets_completed INTEGER NOT NULL,
    reps_completed INTEGER NOT NULL,
    weight_used DECIMAL(5,2),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Indici per ottimizzazione
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_exercises_workout_plan_id ON public.exercises(workout_plan_id);
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_completed_at ON public.workout_logs(completed_at);

-- RLS (Row Level Security) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Policy per user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per workout_plans
CREATE POLICY "Users can view own workout plans" ON public.workout_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create workout plans" ON public.workout_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" ON public.workout_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" ON public.workout_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Policy per exercises
CREATE POLICY "Users can view exercises from own workout plans" ON public.exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workout_plans 
            WHERE workout_plans.id = exercises.workout_plan_id 
            AND workout_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create exercises for own workout plans" ON public.exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_plans 
            WHERE workout_plans.id = exercises.workout_plan_id 
            AND workout_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update exercises from own workout plans" ON public.exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workout_plans 
            WHERE workout_plans.id = exercises.workout_plan_id 
            AND workout_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete exercises from own workout plans" ON public.exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workout_plans 
            WHERE workout_plans.id = exercises.workout_plan_id 
            AND workout_plans.user_id = auth.uid()
        )
    );

-- Policy per workout_logs
CREATE POLICY "Users can view own workout logs" ON public.workout_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create workout logs" ON public.workout_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs" ON public.workout_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs" ON public.workout_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();