# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to GitHub Pages

### Package Management
- `npm install` - Install dependencies from package.json
- `npm update` - Update all packages
- `npm audit fix` - Fix security vulnerabilities

## Architecture Overview

### Tech Stack
- **Frontend Framework**: Vue 3 with Composition API and `<script setup>`
- **Build Tool**: Vite
- **State Management**: Pinia (Vuex successor)
- **Routing**: Vue Router 4 with hash history
- **UI Library**: Ant Design Vue 4.x
- **Charts**: Chart.js with vue-chartjs wrapper
- **Date Handling**: dayjs with UTC plugin
- **Drag & Drop**: vuedraggable
- **Styling**: Tailwind CSS + custom SCSS

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Asset.vue       # Financial asset tracking
│   ├── Diary.vue       # Personal diary/journal
│   ├── HKNews.vue      # Hong Kong news feed
│   ├── JPNews.vue      # Japan news feed
│   ├── Kmb.vue         # Kowloon Motor Bus info
│   ├── Mtr.vue         # MTR station information
│   ├── ProgramCard.vue # TV program display card
│   ├── TvSchedule.vue  # TV schedule viewer
│   ├── Todo.vue        # Task management
│   ├── Transportation.vue # Transport comparison tool
│   ├── Weather.vue     # Weather information
│   └── Weight.vue      # Weight tracking chart
├── views/              # Page-level components
│   ├── Dashboard.vue   # Main application shell with sidebar navigation
│   ├── Login.vue       # User authentication page
│   └── Register.vue    # User registration page (currently redirects to login)
├── stores/             # Pinia state management
│   └── auth.js         # Authentication state and user management
├── router/             # Vue Router configuration
│   ├── index.js        # Route definitions and basic navigation
│   └── auth-guard.js   # Authentication middleware
├── utils/              # Utility functions
│   ├── tver.js         # TV schedule data processing
│   └── intersect.js    # Intersection Observer directive for lazy loading
└── main.js             # Application entry point

### Key Features & Components

#### Authentication System
- JWT-based authentication with token storage in localStorage
- Automatic route protection for dashboard access
- User profile management (avatar, username, password updates)
- Persistent login state across browser sessions

#### Dashboard Shell
- Collapsible sidebar navigation with drag-and-drop reordering
- Responsive design (mobile-first approach)
- User avatar upload functionality
- Menu persistence using localStorage
- Dark theme sidebar with Ant Design icons

#### Core Modules
1. **Todo** - Task management with completion tracking
2. **Weather** - Current weather information display
3. **News Feeds** - HK and JP news aggregation
4. **Diary** - Personal journal with rich text capabilities
5. **Asset Tracking** - Financial portfolio monitoring
6. **Transport** - MTR/KMB bus route comparisons with ETA calculations
7. **Weight Tracking** - Health/fitness weight logging with charts
8. **TV Schedule** - Television program guide with search

### State Management Patterns
- **Pinia Stores**: Centralized state for authentication (`useAuthStore`)
- **LocalStorage Persistence**: User preferences, menu order, and auth tokens
- **Computed Properties**: Derived state from store data (user profile display)
- **Reactive Forms**: Profile editing with form validation

### API Integration
- RESTful API communication via axios
- Environment-based API endpoints (local vs production)
- Authorization headers with Bearer tokens
- Error handling with Ant Design message notifications

### Routing & Navigation
- Hash-based routing for GitHub Pages compatibility
- Authentication guards preventing unauthorized dashboard access
- Redirect logic for authenticated users accessing login page
- Dynamic menu system based on component availability

### Styling Approach
- **Tailwind CSS** for utility-first responsive design
- **Ant Design Vue** components with custom theming
- **Scoped CSS** for component-specific styles
- **Mobile-First** responsive breakpoints (600px threshold)

### Data Flow
1. User authentication → Token stored in localStorage and Pinia store
2. Dashboard loads with persisted menu order and collapsed state
3. Component selection triggers dynamic content rendering
4. API calls use environment variables for endpoint configuration
5. Form submissions update both local state and backend data

### Configuration
- **Vite Proxy**: Routes `/api` requests to production API during development
- **Environment Variables**: `VITE_API_URL_LOCAL` and `VITE_API_URL_LIVE`
- **Base Path**: Configured for GitHub Pages deployment (`/my-dashboard-frontend/`)

### Development Notes
- All components use `<script setup>` syntax for Composition API
- Intersection Observer directive (`v-intersect`) used for performance optimization
- Drag-and-drop functionality for customizable sidebar navigation
- Image upload handled client-side with FileReader API
- Mobile-responsive design includes overlay sidebar and touch-friendly controls