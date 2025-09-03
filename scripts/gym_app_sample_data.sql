-- Dati di esempio per GymTracker
-- Eseguire DOPO aver creato lo schema principale
-- ATTENZIONE: Questi sono dati di test, non utilizzare in produzione!

-- Inserimento profili utente di esempio
-- NOTA: Gli ID utente devono corrispondere a utenti reali creati tramite Supabase Auth

-- Esempio di profilo utente (sostituisci con ID reale)
INSERT INTO public.user_profiles (id, email, full_name, age, fitness_level, goals, created_at, updated_at) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo@gymtracker.com', 'Mario Rossi', 28, 'intermediate', 'Aumentare massa muscolare e migliorare la forza generale', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'sarah@example.com', 'Sarah Johnson', 24, 'beginner', 'Perdere peso e migliorare la resistenza cardiovascolare', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'alex@fitness.com', 'Alex Thompson', 35, 'advanced', 'Preparazione per competizione powerlifting', NOW(), NOW());

-- Schede di allenamento di esempio
INSERT INTO public.workout_plans (id, user_id, name, description, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Petto e Tricipiti', 'Allenamento focalizzato su petto e tricipiti, ideale per il lunedì', true, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'Schiena e Bicipiti', 'Sessione completa per sviluppo dorsali e bicipiti', true, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000001', 'Gambe', 'Allenamento intenso per quadricipiti, femorali e glutei', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000002', 'Full Body Principianti', 'Allenamento completo per tutto il corpo, perfetto per iniziare', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Cardio e Tonificazione', 'Mix di esercizi cardiovascolari e tonificazione muscolare', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000003', 'Powerlifting - Forza', 'Allenamento specifico per i tre alzate del powerlifting', true, NOW(), NOW());

-- Esercizi per la scheda "Petto e Tricipiti"
INSERT INTO public.exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)
VALUES 
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Panca Piana con Bilanciere', 4, 8, 80.0, 'Mantenere i piedi ben piantati a terra', 0, NOW()),
  ('aaaa1111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Panca Inclinata con Manubri', 3, 10, 35.0, 'Angolo 30-45 gradi, movimento controllato', 1, NOW()),
  ('aaaa1111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Croci su Panca Piana', 3, 12, 20.0, 'Focus sulla contrazione del petto', 2, NOW()),
  ('aaaa1111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Dip alle Parallele', 3, 10, NULL, 'Se troppo facili, aggiungere peso', 3, NOW()),
  ('aaaa1111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 'French Press', 3, 12, 30.0, 'Movimento lento e controllato', 4, NOW()),
  ('aaaa1111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111111', 'Pushdown ai Cavi', 3, 15, 40.0, 'Gomiti fermi, solo avambracci in movimento', 5, NOW());

-- Esercizi per la scheda "Schiena e Bicipiti"  
INSERT INTO public.exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)
VALUES 
  ('bbbb2222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111112', 'Trazioni alla Sbarra', 4, 6, NULL, 'Se impossibili, usare assistenza o lat machine', 0, NOW()),
  ('bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Rematore con Bilanciere', 4, 8, 70.0, 'Schiena dritta, tirare verso ombelico', 1, NOW()),
  ('bbbb2222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112', 'Lat Machine', 3, 10, 60.0, 'Tirare verso il petto, non dietro la nuca', 2, NOW()),
  ('bbbb2222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111112', 'Curl con Bilanciere', 3, 10, 30.0, 'Movimento pulito, senza slanci', 3, NOW()),
  ('bbbb2222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', 'Curl Martello', 3, 12, 15.0, 'Manubri in posizione neutra', 4, NOW());

-- Esercizi per la sessione "Gambe"
INSERT INTO public.exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)
VALUES 
  ('cccc3333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111113', 'Squat con Bilanciere', 4, 8, 100.0, 'Scendere fino a coscie parallele al pavimento', 0, NOW()),
  ('cccc3333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111113', 'Stacchi Rumeni', 4, 10, 80.0, 'Focus sui femorali, schiena dritta', 1, NOW()),
  ('cccc3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', 'Leg Press', 3, 12, 200.0, 'Range completo di movimento', 2, NOW()),
  ('cccc3333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111113', 'Affondi con Manubri', 3, 10, 20.0, '10 per gamba, alternati', 3, NOW()),
  ('cccc3333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111113', 'Calf Raises', 4, 15, 50.0, 'Contrazione massima in alto', 4, NOW());

-- Esercizi per "Full Body Principianti"
INSERT INTO public.exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)
VALUES 
  ('dddd4444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 'Squat a Corpo Libero', 3, 15, NULL, 'Imparare la tecnica prima di aggiungere peso', 0, NOW()),
  ('dddd4444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222221', 'Push-up sulle Ginocchia', 3, 10, NULL, 'Progredire verso push-up classici', 1, NOW()),
  ('dddd4444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222221', 'Plank', 3, 30, NULL, 'Mantenere posizione per 30 secondi', 2, NOW()),
  ('dddd4444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222221', 'Lat Machine Assistita', 3, 12, 30.0, 'Movimento controllato, sentire i dorsali', 3, NOW()),
  ('dddd4444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222221', 'Leg Press Leggera', 3, 15, 80.0, 'Focus sulla tecnica', 4, NOW());

-- Esercizi per "Powerlifting - Forza"
INSERT INTO public.exercises (id, workout_plan_id, name, sets, reps, weight, notes, order_index, created_at)
VALUES 
  ('eeee5555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', 'Squat Competition Style', 5, 3, 140.0, 'Tecnica da gara, pausa in buca', 0, NOW()),
  ('eeee5555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333331', 'Panca Competition Style', 5, 3, 120.0, 'Pausa sul petto, comando arbitro simulato', 1, NOW()),
  ('eeee5555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333331', 'Stacco da Terra', 5, 1, 180.0, 'Singole pesanti, tecnica perfetta', 2, NOW()),
  ('eeee5555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333331', 'Squat Box', 3, 5, 110.0, 'Lavoro accessorio per esplosività', 3, NOW());

-- Log di allenamenti completati (esempi)
INSERT INTO public.workout_logs (id, user_id, workout_plan_id, exercise_id, sets_completed, reps_completed, weight_used, completed_at, notes)
VALUES 
  ('ffff6666-6666-6666-6666-666666666661', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 4, 8, 82.5, NOW() - INTERVAL '2 days', 'Aumentato peso di 2.5kg'),
  ('ffff6666-6666-6666-6666-666666666662', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111112', 3, 10, 35.0, NOW() - INTERVAL '2 days', 'Buona esecuzione'),
  ('ffff6666-6666-6666-6666-666666666663', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111112', 'bbbb2222-2222-2222-2222-222222222221', 4, 6, NULL, NOW() - INTERVAL '1 day', 'Riuscito a fare tutte le serie'),
  ('ffff6666-6666-6666-6666-666666666664', '00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222221', 'dddd4444-4444-4444-4444-444444444441', 3, 15, NULL, NOW() - INTERVAL '1 day', 'Prima sessione completata!');

-- Inserimento dati statistici aggiuntivi per demo
-- Views per statistiche rapide (opzionale)

CREATE OR REPLACE VIEW user_workout_stats AS
SELECT 
    up.id as user_id,
    up.full_name,
    COUNT(DISTINCT wp.id) as total_workouts,
    COUNT(DISTINCT e.id) as total_exercises,
    COUNT(wl.id) as total_logs,
    MAX(wl.completed_at) as last_workout
FROM user_profiles up
LEFT JOIN workout_plans wp ON up.id = wp.user_id AND wp.is_active = true
LEFT JOIN exercises e ON wp.id = e.workout_plan_id  
LEFT JOIN workout_logs wl ON up.id = wl.user_id
GROUP BY up.id, up.full_name;

-- View per esercizi più popolari
CREATE OR REPLACE VIEW popular_exercises AS
SELECT 
    e.name,
    COUNT(*) as usage_count,
    AVG(e.sets) as avg_sets,
    AVG(e.reps) as avg_reps,
    AVG(e.weight) as avg_weight
FROM exercises e
JOIN workout_plans wp ON e.workout_plan_id = wp.id
WHERE wp.is_active = true
GROUP BY e.name
HAVING COUNT(*) > 1
ORDER BY usage_count DESC;

-- Funzione per ottenere raccomandazioni semplici
CREATE OR REPLACE FUNCTION get_user_recommendations(user_uuid UUID)
RETURNS TABLE(
    recommendation_type TEXT,
    title TEXT,
    description TEXT
) AS $$
DECLARE
    user_level TEXT;
    total_workouts INTEGER;
BEGIN
    -- Ottieni livello utente e conteggio sessioni
    SELECT fitness_level, 
           (SELECT COUNT(*) FROM workout_plans WHERE user_id = user_uuid AND is_active = true)
    INTO user_level, total_workouts
    FROM user_profiles 
    WHERE id = user_uuid;

    -- Raccomandazioni basate su livello e attività
    IF total_workouts = 0 THEN
        RETURN QUERY SELECT 'getting_started'::TEXT, 'Crea la tua prima sessione'::TEXT, 'Inizia il tuo percorso fitness creando una sessione di allenamento personalizzata'::TEXT;
    END IF;

    IF user_level = 'beginner' AND total_workouts < 3 THEN
        RETURN QUERY SELECT 'progression'::TEXT, 'Aggiungi varietà'::TEXT, 'Prova a creare sessioni per diversi gruppi muscolari'::TEXT;
    END IF;

    IF user_level = 'intermediate' THEN
        RETURN QUERY SELECT 'advanced'::TEXT, 'Progressione avanzata'::TEXT, 'Considera di aumentare intensità e complessità degli esercizi'::TEXT;
    END IF;

    -- Raccomandazione generale
    RETURN QUERY SELECT 'motivation'::TEXT, 'Continua così!'::TEXT, 'Stai facendo un ottimo lavoro con i tuoi allenamenti'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Commenti informativi
COMMENT ON TABLE user_profiles IS 'Profili estesi degli utenti con informazioni fitness';
COMMENT ON TABLE workout_plans IS 'Sessioni di allenamento create dagli utenti';  
COMMENT ON TABLE exercises IS 'Esercizi specifici all''interno delle sessioni';
COMMENT ON TABLE workout_logs IS 'Log degli allenamenti completati per tracking progressi';

COMMENT ON VIEW user_workout_stats IS 'Statistiche aggregate per utente';
COMMENT ON VIEW popular_exercises IS 'Esercizi più utilizzati nell''app';
COMMENT ON FUNCTION get_user_recommendations IS 'Genera raccomandazioni personalizzate per l''utente';

-- Trigger per logging automatico delle modifiche (opzionale)
CREATE OR REPLACE FUNCTION log_workout_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO workout_logs (user_id, workout_plan_id, exercise_id, sets_completed, reps_completed, weight_used, notes)
        VALUES (NEW.user_id, NEW.id, NULL, 0, 0, NULL, 'Scheda modificata: ' || OLD.name || ' → ' || NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applicare il trigger (commentato per default)
-- CREATE TRIGGER workout_plan_changes 
--     AFTER UPDATE ON workout_plans 
--     FOR EACH ROW 
--     EXECUTE FUNCTION log_workout_changes();
