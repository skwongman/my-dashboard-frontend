# My Dashboard Frontend

A comprehensive Vue 3 dashboard application built with modern web technologies, featuring personal productivity tools, news feeds, transport information, and more.

## Features

### Authentication System
- JWT-based authentication with secure token storage
- Persistent login state across browser sessions
- User profile management (avatar upload, username/password updates)
- Automatic route protection for dashboard access

### Core Modules

#### Task Management
- Todo list with completion tracking
- Mobile-responsive design with grid/list views
- Auto-scroll to today's date in mobile view

#### Weather Information
- Current weather display with location-based data
- Responsive weather cards and forecasts

#### News Feeds
- **HK News**: Hong Kong news aggregation
- **JP News**: Japan news feed integration
- Real-time news updates and categorization

#### Personal Diary
- Rich text journaling capabilities
- Date-based entry organization
- Search and filter functionality

#### Financial Tracking
- Asset portfolio monitoring
- Weight/fitness tracking charts
- Interactive data visualization

#### Transport Information
- **MTR Station Info**: Real-time train information
- **KMB Bus Routes**: Kowloon Motor Bus schedule lookup
- ETA calculations and route comparisons
- Multi-modal transport planning

#### Entertainment
- **TV Schedule**: Television program guide
- Program search and favorites
- Channel and time-based filtering

## Tech Stack

### Frontend Framework
- **Vue 3** with Composition API and `<script setup>` syntax
- **Pinia** for state management (Vuex successor)
- **Vue Router 4** with hash history for navigation

### UI & Styling
- **Ant Design Vue 4.x** component library
- **Tailwind CSS** utility-first styling
- Custom SCSS for enhanced theming
- Responsive design with mobile-first approach

### Data Visualization
- **Chart.js** with vue-chartjs wrapper
- Interactive charts and graphs for data presentation

### Development Tools
- **Vite** build tool and development server
- **ESLint** and **Prettier** for code quality
- **Dayjs** with UTC plugin for date/time handling
- **vuedraggable** for drag-and-drop functionality

## Project Structure

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
│   └── Register.vue    # User registration page
├── stores/             # Pinia state management
│   └── auth.js         # Authentication state and user management
├── router/             # Vue Router configuration
│   ├── index.js        # Route definitions and basic navigation
│   └── auth-guard.js   # Authentication middleware
├── utils/              # Utility functions
│   ├── tver.js         # TV schedule data processing
│   └── intersect.js    # Intersection Observer directive for lazy loading
└── main.js             # Application entry point
```

## Key Features & Components

### Dashboard Shell
- Collapsible sidebar navigation with drag-and-drop reordering
- Responsive design (mobile-first approach)
- Dark theme sidebar with Ant Design icons
- Menu persistence using localStorage
- User avatar upload functionality

### State Management Patterns
- Centralized state using Pinia stores
- LocalStorage persistence for user preferences and auth tokens
- Reactive computed properties for derived state
- Form validation and error handling

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

## Getting Started

### Prerequisites
- Node.js (version 16 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-dashboard-frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Deployment

Deploy to GitHub Pages:
```bash
npm run deploy
```

## Configuration

### Environment Variables

The application uses environment variables for API endpoint configuration:

- `VITE_API_URL_LOCAL`: Local development API URL
- `VITE_API_URL_LIVE`: Production API URL

Create a `.env.local` file for local development:
```env
VITE_API_URL_LOCAL=http://localhost:3000/api
```

### Vite Proxy

During development, API requests are proxied through Vite:
- `/api` requests are routed to the configured API endpoint

## Styling Approach

- **Tailwind CSS** for utility-first responsive design
- **Ant Design Vue** components with custom theming
- **Scoped CSS** for component-specific styles
- **Mobile-First** responsive breakpoints (600px threshold)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Create a feature branch from `main`
2. Make your changes and ensure tests pass
3. Submit a pull request with a clear description of changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Ant Design Vue](https://antdv.com/) - UI component library
- [Pinia](https://pinia.vuejs.org/) - Intuitive, type safe store for Vue 3