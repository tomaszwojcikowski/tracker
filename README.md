# OnePlus 12 Pro Tracker

A progressive web app for tracking workouts with AI-powered coaching feedback.

## Production Build Setup

This project uses a modern build pipeline to ensure optimal production performance:

- **Tailwind CSS**: Properly installed as a PostCSS plugin (not via CDN)
- **React**: Pre-compiled with Babel (no in-browser transformation)
- **Vite**: Fast build tool for bundling and optimization

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173/`

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The production build outputs to the `dist/` directory and includes:
- Minified and bundled JavaScript
- Optimized CSS with Tailwind utilities
- Static assets (JSON files, CSS variables)

### Build Output

- `dist/index.html` - Optimized HTML entry point
- `dist/assets/` - Bundled JS and CSS files
- `dist/*.json` - Data files (schedule and exercises)
- `dist/colors.css` - CSS custom properties

### Technology Stack

- **React 18** - UI framework
- **Tailwind CSS 3** - Utility-first CSS framework
- **Vite 5** - Build tool and dev server
- **Lucide Icons** - Icon library
- **Google Gemini AI** - Optional AI coaching integration

## Features

- Workout tracking with set completion
- Exercise history and progress tracking
- AI-powered coaching feedback (optional)
- URL-based routing and state persistence
- Responsive design optimized for mobile
