# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project
GymTracker is a Node.js web application for managing gym workout plans, built with Express.js, Supabase authentication, and vanilla JavaScript frontend using a **Multi-Page Architecture** approach.

## Current Development Status
**Project Status:** ROADMAP COMPLETE ✅ (as of January 2025)
- ✅ **Step 1-2:** Professional menu system and navigation complete
- ✅ **Step 3:** Foundation implementation with template system and core APIs
- ✅ **Step 4A:** Calendar functionality with drag-drop scheduling 
- ✅ **Step 4B:** Profile management with achievements and settings
- ✅ **Step 5:** Integration testing and polish - Full functionality verified

**Implementation Results:** All core functionality has been successfully implemented and tested:
- Template system foundation with `public/templates/base-template.html`
- Complete API integration with `public/js/core/api.js` and `public/js/core/utils.js`
- All page-specific JavaScript logic in `public/js/pages/*.js`
- Professional responsive CSS styling for all pages
- Mobile-first design with 16 comprehensive @media queries
- Cross-page navigation and authentication flow working seamlessly

## Development Commands

### Starting the Application
- `npm start` - Run the server in production mode
- `npm run dev` - Run the server with nodemon for development
- `start_server.bat` - Windows batch file to start both Apache and the Node.js server
- `stop_server.bat` - Windows batch file to stop the server

### Database Management
- Database schema is defined in `database.sql`
- Run the SQL script in Supabase Query Editor to set up the database
- The application uses Supabase for authentication and PostgreSQL database

## Architecture Overview

### Architecture Decision: Multi-Page Professional Approach
- **❌ NOT Single Page Application (SPA)**
- **✅ Multi-Page Architecture** with shared templates
- **✅ Separation of Concerns** → Each function = dedicated page
- **✅ Scalable & Maintainable** → Team development ready

### Backend Structure
- **server.js** - Main Express server with middleware configuration, CORS, rate limiting, and static file serving
- **routes/** - API route handlers:
  - `auth.js` - User authentication (signup, signin, signout, password reset)
  - `profile.js` - User profile management  
  - `workouts.js` - Workout plans and exercise management
- **config/supabase.js** - Supabase client configuration and database helpers with authenticated client support
- **middleware/validation.js** - Request validation middleware

### Frontend Structure (Multi-Page) - IMPLEMENTATION COMPLETE
```
public/
├── home.html              ✅ Landing + Auth
├── app.html               ✅ Hub post-login  
├── schede.html            ✅ Full workout management functionality
├── calendario.html        ✅ Complete calendar with drag-drop scheduling
├── profilo.html           ✅ Profile management with achievements
├── terms.html             🔶 HTML exists, needs enhancement
├── privacy.html           🔶 HTML exists, needs enhancement
├── contatti.html          🔶 HTML exists, needs enhancement
├── templates/             ✅ IMPLEMENTED
│   └── base-template.html ✅ Template foundation with placeholder system
├── components/  
│   ├── header.html        ✅ Shared navigation
│   └── footer.html        ✅ Shared footer
├── css/
│   ├── shared.css         ✅ Global styles
│   ├── menu-component.css ✅ Menu dropdown  
│   ├── content-pages.css  ✅ Additional styling found
│   ├── schede.css         ✅ Professional workout page styling
│   ├── calendario.css     ✅ Calendar styling with drag-drop support
│   └── profilo.css        ✅ Profile page styling with responsive design
└── js/
    ├── core/
    │   ├── template-loader.js ✅ Template system
    │   ├── menu-component.js  ✅ Professional nav
    │   ├── auth.js            ✅ Login/Register
    │   ├── api.js             ✅ Comprehensive Supabase integration
    │   └── utils.js           ✅ Utilities and notification system
    ├── pages/
    │   ├── schede.js          ✅ Complete workout CRUD functionality
    │   ├── calendario.js      ✅ Full calendar with monthly/weekly views
    │   └── profilo.js         ✅ Profile management with settings
    ├── modules/               ✅ UNEXPECTED - Additional structure found
    ├── utils/                 ✅ UNEXPECTED - Additional utilities found
    └── config/                ✅ UNEXPECTED - Additional config found
```

### Database Schema
The application uses these main tables with Row Level Security:
- `user_profiles` - Extended user information linked to Supabase auth
- `workout_plans` - User workout plans with `user_id` restrictions
- `exercises` - Individual exercises within workout plans
- `workout_logs` - Historical workout completion data

### Authentication Flow
1. Frontend authenticates with Supabase Auth
2. Access tokens are passed via Authorization header (`Bearer <token>`)
3. `authenticateUser` middleware verifies tokens and creates authenticated Supabase client
4. Row Level Security (RLS) policies ensure data isolation per user
5. Protected pages check auth status and redirect to home.html if unauthenticated

## Configuration
- Environment variables are defined in `.env` file
- Key configurations:
  - `PORT=3007` - Server port
  - `SUPABASE_URL` and `SUPABASE_ANON_KEY` - Supabase connection
  - `FRONTEND_URL=https://zanserver.sytes.net/nicola` - CORS and redirect configuration
  - Rate limiting and security headers are configured in server.js

## Roadmap Implementation Summary

### ✅ Step 3: Foundation Implementation (COMPLETED)
- Created `public/templates/base-template.html` - Template system foundation
- Created `public/js/core/api.js` - Comprehensive Supabase integration
- Created `public/js/core/utils.js` - Utilities and notification system
- Created `public/css/schede.css` - Professional workout page styling
- Created `public/js/pages/schede.js` - Complete workout CRUD functionality
- Updated `schede.html` to use template system

### ✅ Step 4A: Calendar Implementation (COMPLETED)
- Created `public/css/calendario.css` - Calendar styling with drag-drop support
- Created `public/js/pages/calendario.js` - Full calendar functionality
- Updated `calendario.html` with template system

### ✅ Step 4B: Profile Implementation (COMPLETED)
- Created `public/css/profilo.css` - Profile page styling with responsive design
- Created `public/js/pages/profilo.js` - Complete profile management
- Updated `profilo.html` with template system

### ✅ Step 5: Integration Testing & Polish (COMPLETED)

**Full Implementation Testing Results:**

**✅ End-to-End Workflow Testing:**
- All pages load correctly with proper template integration
- Authentication flow works seamlessly across pages
- CRUD operations functional for workouts and profiles
- Calendar scheduling and drag-drop functionality operational

**✅ Cross-Page Navigation:**
- Menu component loads consistently across all pages
- Navigation between schede.html, calendario.html, and profilo.html works
- Template system properly loads headers and footers
- No broken links or missing components

**✅ Mobile Responsiveness:**
- 16 comprehensive @media queries across 6 CSS files
- Viewport meta tags present in all HTML files
- Grid layouts adapt properly to mobile screens
- Touch-friendly interface elements for mobile users

**✅ Performance Optimization:**
- Compression middleware active in server.js:40
- Express rate limiting configured for API routes
- Static file caching enabled with proper headers
- Morgan logging for performance monitoring
- Clean separation of concerns in JavaScript architecture

**✅ Server Configuration:**
- Fixed root route redirect from index.html to home.html
- Apache reverse proxy ready (trust proxy: true)
- Environment variables properly configured
- Health endpoint available at /api/health

**Technical Architecture Summary:**
- Multi-page application (NOT SPA) with shared components
- Supabase authentication with Row Level Security
- Professional responsive CSS with mobile-first design
- Comprehensive error handling and user feedback
- Template system for consistent UI across pages

**🎯 ROADMAP COMPLETE** - All core functionality implemented and tested successfully.

### API Endpoints for Workout Management
```javascript
GET /api/workouts        // Lista schede utente
POST /api/workouts       // Crea nuova scheda  
PUT /api/workouts/:id    // Modifica scheda
DELETE /api/workouts/:id // Elimina scheda
POST /api/workouts/:id/exercises     // Aggiungi esercizio
DELETE /api/workouts/:workoutId/exercises/:exerciseId // Rimuovi esercizio
```

### Code Standards
- **Vanilla JavaScript** - No frameworks
- **Template System** - Use existing `template-loader.js`
- **CSS Architecture** - `shared.css` + page-specific CSS files
- **Authentication Pattern** - Check auth status on protected pages
- **Mobile-First** - Responsive design required
- **Error Handling** - Professional user feedback and error management

## Production Environment
- Server runs behind Apache reverse proxy in production
- Base URL: `https://zanserver.sytes.net/nicola/`
- Local development: `http://localhost:3007/`
- Uses helmet for security headers and express-rate-limit for API protection
- SSL certificates managed by win-acme

## Testing Requirements
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsive (320px → 1920px+)
- Navigation flow between all pages
- Auth flow: login → logout → re-login
- CRUD operations for workout management
- Error handling for network and validation errors