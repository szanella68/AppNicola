/**
 * Configurazione deployment per GymTracker
 * Supporta PM2, Docker, e deployment su cloud
 */

module.exports = {
  apps: [
    {
      name: 'gymtracker-app',
      script: 'server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        LOG_LEVEL: 'warn'
      },

      // PM2 configuration
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,

      // Restart configuration
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',

      // Health check
      health_check_grace_period: 3000,
      health_check_interval: 30000,

      // Advanced configuration
      merge_logs: true,
      autorestart: true,
      vizion: false,
      
      // Environment specific settings
      node_args: process.env.NODE_ENV === 'production' 
        ? '--optimize_for_size --max_old_space_size=460 --gc_interval=100' 
        : '',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Cron restart (opzionale - restart ogni giorno alle 3:00)
      cron_restart: process.env.NODE_ENV === 'production' ? '0 3 * * *' : null
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/gymtracker.git',
      path: '/var/www/gymtracker',
      
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install nodejs npm git -y'
    },

    staging: {
      user: 'deploy',
      host: ['staging-server.com'], 
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/gymtracker.git',
      path: '/var/www/gymtracker-staging',
      
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging && pm2 save'
    }
  }
};

// Configurazione per Docker (se necessario)
const dockerConfig = {
  // Dockerfile content as string per reference
  dockerfile: `
FROM node:18-alpine

# Crea directory app
WORKDIR /usr/src/app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production && npm cache clean --force

# Copia codice sorgente
COPY . .

# Crea utente non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gymtracker -u 1001

# Cambia ownership
RUN chown -R gymtracker:nodejs /usr/src/app
USER gymtracker

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Comando di avvio
CMD ["node", "server.js"]
`,

  // Docker Compose per sviluppo
  dockerCompose: `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/usr/src/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
`
};

// Configurazione Nginx per reverse proxy
const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream gymtracker {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

        # API rate limiting
        location /api/auth/signin {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://gymtracker;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://gymtracker;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files with caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://gymtracker;
        }

        # Main app
        location / {
            proxy_pass http://gymtracker;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support (se necessario)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
`;

// Script di deployment automatizzato
const deployScript = `#!/bin/bash
# Deploy script per GymTracker

set -e

echo "🚀 Starting GymTracker deployment..."

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Functions
log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# Check prerequisites
command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }

# Environment setup
if [ ! -f .env ]; then
    log_warn ".env file not found. Creating from template..."
    cp .env.example .env
    log_warn "Please update .env file with your configuration"
fi

# Install dependencies
log_info "Installing dependencies..."
npm ci --only=production

# Database setup (if needed)
if [ "$1" = "--setup-db" ]; then
    log_info "Setting up database..."
    # Add your database setup commands here
fi

# Build assets (if needed)
if [ -f "webpack.config.js" ]; then
    log_info "Building assets..."
    npm run build
fi

# Start application
if command -v pm2 >/dev/null 2>&1; then
    log_info "Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
else
    log_info "Starting with Node.js..."
    NODE_ENV=production node server.js
fi

log_info "Deployment completed! 🎉"
`;

// Configurazione per piattaforme cloud specifiche

// Replit configuration
const replitConfig = {
  ".replit": `
run = "npm start"
entrypoint = "server.js"

[packager]
language = "nodejs"

[packager.features]
packageSearch = true
guessImports = true

[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"

[unitTest]
language = "nodejs"

[debugger]
support = true

[debugger.interactive]
transport = "localhost:0"
startCommand = ["dap-node"]

[debugger.interactive.initializeMessage]
command = "initialize"
type = "request"

[debugger.interactive.launchMessage]
command = "launch"
type = "request"
`,

  "replit.nix": `
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.nodePackages.pm2
  ];
}
`
};

// Heroku configuration
const herokuConfig = {
  "Procfile": "web: node server.js",
  "app.json": {
    "name": "GymTracker",
    "description": "Personal trainer digitale per gestione schede allenamento",
    "repository": "https://github.com/your-username/gymtracker",
    "logo": "https://your-domain.com/logo.png",
    "keywords": ["fitness", "gym", "workout", "nodejs", "supabase"],
    "image": "heroku/nodejs",
    "stack": "heroku-22",
    "buildpacks": [
      {
        "url": "heroku/nodejs"
      }
    ],
    "formation": {
      "web": {
        "quantity": 1,
        "size": "free"
      }
    },
    "addons": [
      {
        "plan": "heroku-postgresql:hobby-dev"
      }
    ],
    "env": {
      "NODE_ENV": "production",
      "SUPABASE_URL": {
        "description": "Your Supabase project URL",
        "required": true
      },
      "SUPABASE_ANON_KEY": {
        "description": "Your Supabase anon key", 
        "required": true
      }
    }
  }
};

// Railway configuration  
const railwayConfig = {
  "railway.json": {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS"
    },
    "deploy": {
      "numReplicas": 1,
      "sleepApplication": false,
      "restartPolicyType": "ON_FAILURE"
    }
  }
};

// Health check endpoint per monitoring
const healthCheck = `
// Aggiungi questo al server.js
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
});
`;

module.exports = {
  dockerConfig,
  nginxConfig,
  deployScript,
  replitConfig,
  herokuConfig,
  railwayConfig,
  healthCheck
};