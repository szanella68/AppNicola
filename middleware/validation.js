/**
 * Middleware di validazione per GymTracker
 * Validazione input, sanitizzazione e controlli di sicurezza
 */

const {
    isValidEmail,
    isValidPassword,
    validateWorkoutData,
    validateExerciseData,
    validateProfileData,
    createResponse,
    sanitizeText
} = require('../utils/helpers');

// Middleware per validazione registrazione
const validateSignup = (req, res, next) => {
    const { email, password, fullName } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email è obbligatoria');
    } else if (!isValidEmail(email)) {
        errors.push('Formato email non valido');
    }

    if (!password) {
        errors.push('Password è obbligatoria');
    } else if (!isValidPassword(password)) {
        errors.push('La password deve essere di almeno 6 caratteri');
    }

    if (fullName && fullName.length > 100) {
        errors.push('Il nome completo non può superare i 100 caratteri');
    }

    if (errors.length > 0) {
        return res.status(400).json(createResponse(
            false,
            'Dati di registrazione non validi',
            null,
            errors
        ));
    }

    // Sanitizza i dati
    req.body.email = email.toLowerCase().trim();
    req.body.fullName = fullName ? sanitizeText(fullName, 100) : '';

    next();
};

// Middleware per validazione login
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email è obbligatoria');
    } else if (!isValidEmail(email)) {
        errors.push('Formato email non valido');
    }

    if (!password) {
        errors.push('Password è obbligatoria');
    }

    if (errors.length > 0) {
        return res.status(400).json(createResponse(
            false,
            'Credenziali non valide',
            null,
            errors
        ));
    }

    // Sanitizza email
    req.body.email = email.toLowerCase().trim();

    next();
};

// Middleware per validazione dati profilo
const validateProfile = (req, res, next) => {
    const validation = validateProfileData(req.body);

    if (!validation.isValid) {
        return res.status(400).json(createResponse(
            false,
            'Dati profilo non validi',
            null,
            validation.errors
        ));
    }

    // Sanitizza i dati
    if (req.body.full_name) {
        req.body.full_name = sanitizeText(req.body.full_name, 100);
    }
    if (req.body.goals) {
        req.body.goals = sanitizeText(req.body.goals, 1000);
    }

    next();
};

// Middleware per validazione onboarding
const validateOnboarding = (req, res, next) => {
    const { age, fitness_level } = req.body;
    const errors = [];

    if (!age) {
        errors.push('Età è obbligatoria per completare la configurazione');
    }

    if (!fitness_level) {
        errors.push('Livello di fitness è obbligatorio per completare la configurazione');
    }

    if (errors.length > 0) {
        return res.status(400).json(createResponse(
            false,
            'Dati onboarding incompleti',
            null,
            errors
        ));
    }

    // Usa la validazione generale del profilo per il resto
    validateProfile(req, res, next);
};

// Middleware per validazione scheda allenamento
const validateWorkout = (req, res, next) => {
    const validation = validateWorkoutData(req.body);

    if (!validation.isValid) {
        return res.status(400).json(createResponse(
            false,
            'Dati scheda non validi',
            null,
            validation.errors
        ));
    }

    // Sanitizza i dati
    req.body.name = sanitizeText(req.body.name, 100);
    if (req.body.description) {
        req.body.description = sanitizeText(req.body.description, 500);
    }

    // Valida gli esercizi se presenti
    if (req.body.exercises && Array.isArray(req.body.exercises)) {
        const exerciseErrors = [];
        
        req.body.exercises.forEach((exercise, index) => {
            const exerciseValidation = validateExerciseData(exercise);
            if (!exerciseValidation.isValid) {
                exerciseErrors.push(`Esercizio ${index + 1}: ${exerciseValidation.errors.join(', ')}`);
            } else {
                // Sanitizza i dati dell'esercizio
                exercise.name = sanitizeText(exercise.name, 100);
                if (exercise.notes) {
                    exercise.notes = sanitizeText(exercise.notes, 500);
                }
            }
        });

        if (exerciseErrors.length > 0) {
            return res.status(400).json(createResponse(
                false,
                'Errori negli esercizi',
                null,
                exerciseErrors
            ));
        }
    }

    next();
};

// Middleware per validazione singolo esercizio
const validateExercise = (req, res, next) => {
    const validation = validateExerciseData(req.body);

    if (!validation.isValid) {
        return res.status(400).json(createResponse(
            false,
            'Dati esercizio non validi',
            null,
            validation.errors
        ));
    }

    // Sanitizza i dati
    req.body.name = sanitizeText(req.body.name, 100);
    if (req.body.notes) {
        req.body.notes = sanitizeText(req.body.notes, 500);
    }

    next();
};

// Middleware per validazione UUID
const validateUUID = (paramName) => {
    return (req, res, next) => {
        const uuid = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuid || !uuidRegex.test(uuid)) {
            return res.status(400).json(createResponse(
                false,
                'ID non valido',
                null,
                [`Il parametro ${paramName} deve essere un UUID valido`]
            ));
        }

        next();
    };
};

// Middleware per limitazione dimensione body
const limitBodySize = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length']);
        const maxBytes = parseSize(maxSize);

        if (contentLength && contentLength > maxBytes) {
            return res.status(413).json(createResponse(
                false,
                'Payload troppo grande',
                null,
                [`La richiesta supera il limite di ${maxSize}`]
            ));
        }

        next();
    };
};

// Helper per parsing dimensioni
const parseSize = (size) => {
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
    if (!match) throw new Error('Invalid size format');

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';

    return value * units[unit];
};

// Middleware per controllo Content-Type
const requireContentType = (expectedType = 'application/json') => {
    return (req, res, next) => {
        const contentType = req.headers['content-type'];

        if (req.method !== 'GET' && req.method !== 'DELETE') {
            if (!contentType || !contentType.includes(expectedType)) {
                return res.status(400).json(createResponse(
                    false,
                    'Content-Type non supportato',
                    null,
                    [`Content-Type deve essere ${expectedType}`]
                ));
            }
        }

        next();
    };
};

// Middleware per validazione campi obbligatori generici
const requireFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => {
            return req.body[field] === undefined || req.body[field] === null || req.body[field] === '';
        });

        if (missingFields.length > 0) {
            return res.status(400).json(createResponse(
                false,
                'Campi obbligatori mancanti',
                null,
                missingFields.map(field => `Il campo '${field}' è obbligatorio`)
            ));
        }

        next();
    };
};

// Middleware per sanitizzazione generale
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                // Rimuovi caratteri potenzialmente pericolosi
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            } else {
                sanitized[key] = value;
            }
        }
        
        req.body = sanitized;
    }

    next();
};

// Middleware per logging delle validazioni fallite
const logValidationErrors = (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            console.warn(`Validation failed for ${req.method} ${req.path}:`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: req.body,
                params: req.params,
                query: req.query,
                response: data
            });
        }
        
        originalSend.call(this, data);
    };

    next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateProfile,
    validateOnboarding,
    validateWorkout,
    validateExercise,
    validateUUID,
    limitBodySize,
    requireContentType,
    requireFields,
    sanitizeBody,
    logValidationErrors
};