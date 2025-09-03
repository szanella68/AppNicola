const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
// dietro Apache reverse proxy
app.set('trust proxy', true);
const PORT = process.env.PORT || 3007;

// Middleware per sicurezza e performance
app.use(helmet({
  contentSecurityPolicy: false, // Disabilitato per sviluppo
}));


app.use(cors({
  origin: [
    'http://localhost:3007',
    'https://zanserver.sytes.net',
    process.env.FRONTEND_URL || 'https://zanserver.sytes.net'
  ],
  credentials: true,
}));



// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // massimo 100 richieste per IP ogni 15 minuti
});
app.use('/api/', limiter);

// Middleware per parsing e compressione
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Servire file statici
app.use(express.static(path.join(__dirname, 'public')));
// Servire file statici anche sotto /nicola/ per compatibilità con base href
app.use('/nicola', express.static(path.join(__dirname, 'public')));

// Favicon handler (evita 404 in assenza di file)
app.get('/favicon.ico', (req, res) => {
  const svgPath = path.join(__dirname, 'public', 'favicon.svg');
  res.sendFile(svgPath, (err) => {
    if (err) {
      res.status(204).end();
    }
  });
});

// API Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const workoutRoutes = require('./routes/workouts');
const scheduleRoutes = require('./routes/schedule');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/schedule', scheduleRoutes);

/* ======== AGGIUNTA HEALTH ======== */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'nicola',
    node: process.version,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    time: new Date().toISOString()
  });
});
/* ======== /AGGIUNTA HEALTH ======== */

/* ======== CONFIG PUBBLICA ======== */
app.get('/api/config/public', (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    API_BASE: 'api',
    NODE_ENV: process.env.NODE_ENV,
    VERSION: '1.0.0'
  });
});
/* ======== /CONFIG PUBBLICA ======== */

// Route principale per servire l'app (redirect relativo per preservare path proxy, es. /nicola)
app.get('/', (req, res) => {
  res.redirect('home.html');
});

// Catch all per SPA routing (solo per percorsi non esistenti)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Qualcosa è andato storto!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Errore interno del server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`🚀 GymTracker Server in esecuzione su porta ${PORT}`);
  console.log(`📱 Applicazione disponibile su: http://localhost:${PORT}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
