const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
    return typeof email === 'string' && emailRegex.test(email);
}

function isValidPassword(pw) {
    return typeof pw === 'string' && pw.length >= 6;
}

function sanitizeText(text, maxLength = 2000) {
    if (!text && text !== 0) return '';
    const s = String(text).trim();
    // semplice rimozione tag HTML
    return s.replace(/<[^>]*>/g, '').substring(0, maxLength);
}

function isValidAge(age) {
    const n = Number(age);
    return Number.isInteger(n) && n >= 13 && n <= 120;
}

function isValidFitnessLevel(level) {
    const valid = ['beginner', 'intermediate', 'advanced'];
    return typeof level === 'string' && valid.includes(level.toLowerCase());
}

function isValidSets(sets) {
    const n = Number(sets);
    return Number.isInteger(n) && n >= 1 && n <= 50;
}

function isValidReps(reps) {
    const n = Number(reps);
    return Number.isInteger(n) && n >= 1 && n <= 1000;
}

function isValidWeight(weight) {
    if (weight === null || weight === undefined || weight === '') return true;
    const n = Number(weight);
    return !Number.isNaN(n) && n >= 0 && n <= 1000;
}

function validateExerciseData(ex) {
    const errors = [];
    if (!ex || typeof ex !== 'object') {
        errors.push('Invalid exercise data');
        return { isValid: false, errors };
    }
    const name = sanitizeText(ex.name || '');
    if (!name) errors.push('Nome esercizio obbligatorio');
    if (name.length > 200) errors.push('Nome esercizio troppo lungo');
    if (!isValidSets(ex.sets)) errors.push('Serie non valide');
    if (!isValidReps(ex.reps)) errors.push('Ripetizioni non valide');
    if (!isValidWeight(ex.weight)) errors.push('Peso non valido');
    if (ex.notes && sanitizeText(ex.notes, 1000).length > 1000) errors.push('Note troppo lunghe');
    return { isValid: errors.length === 0, errors };
}

function validateWorkoutData(workout) {
    const errors = [];
    if (!workout || typeof workout !== 'object') {
        errors.push('Dati workout non validi');
        return { isValid: false, errors };
    }
    const name = sanitizeText(workout.name || '');
    if (!name) errors.push('Nome workout obbligatorio');
    if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) {
        errors.push('Deve esserci almeno un esercizio');
    } else {
        workout.exercises.forEach((ex, i) => {
            const r = validateExerciseData(ex);
            if (!r.isValid) errors.push(`Esercizio ${i + 1}: ${r.errors.join('; ')}`);
        });
    }
    return { isValid: errors.length === 0, errors };
}

function validateProfileData(profile) {
    const errors = [];
    if (!profile || typeof profile !== 'object') {
        errors.push('Profilo non valido');
        return { isValid: false, errors };
    }
    const name = sanitizeText(profile.name || '');
    if (!name) errors.push('Nome obbligatorio');
    if (profile.age !== undefined && !isValidAge(profile.age)) errors.push('Età non valida');
    if (profile.fitnessLevel !== undefined && !isValidFitnessLevel(profile.fitnessLevel)) errors.push('Livello fitness non valido');
    return { isValid: errors.length === 0, errors };
}

function createResponse(status = 'ok', data = null, message = '') {
    return { status, data, message };
}

module.exports = {
    isValidEmail,
    isValidPassword,
    sanitizeText,
    isValidAge,
    isValidFitnessLevel,
    isValidSets,
    isValidReps,
    isValidWeight,
    validateExerciseData,
    validateWorkoutData,
    validateProfileData,
    createResponse,
};