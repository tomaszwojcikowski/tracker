# OnePlus 12 Pro Tracker

A progressive web app for tracking workouts with AI-powered coaching feedback. Built with React, Tailwind CSS, and optional Google Gemini AI integration for personalized training insights.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/tomaszwojcikowski/tracker.git
cd tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

Visit `http://localhost:5173/` to start tracking your workouts!

## Deployment

This repository includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages on every push to the `main` branch. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions and configuration options.

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
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **Lucide Icons** - Icon library
- **Google Gemini AI** - Optional AI coaching integration

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

The test suite includes 90+ comprehensive tests covering:
- **Storage Utilities**: LocalStorage operations with error handling
- **Schedule Building**: Auto-generation of warmup/cooldown protocols
- **Exercise History**: Workout tracking, statistics, and 1RM calculations
- **URL Routing**: State management, URL parsing, and navigation
- **Set Toggle Logic**: Workout progress tracking and RPE data management

For detailed manual testing scenarios, see [TESTING.md](TESTING.md).

## Features

### 🏋️ Workout Tracking & Logging
- **Progressive Set Tracking**: Mark sets as complete with visual feedback and haptic responses
- **Weight & RPE Logging**: Track weight lifted and Rate of Perceived Exertion (RPE scale 6-10) for each set
- **Workout Notes**: Add free-text notes to document your workout sessions, training observations, and form cues
- **Rest Timer**: Built-in countdown timer with notifications to optimize rest periods between sets
- **Dynamic Exercise Addition**: Add custom exercises from the library during your workout
- **Auto-generated Protocols**: Automatic warmup and cooldown routines for weeks 2-21 based on workout type
- **Session Persistence**: Your workout progress is automatically saved and survives page reloads

### 📊 Exercise History & Analytics
- **Comprehensive History View**: Timeline of all completed workouts with expandable details
- **Exercise Statistics**: Track total workouts, max sets, max weight, and estimated 1RM for each exercise
- **Progress Graphs**: Visual weight progression charts showing your strength gains over time
- **Personal Records**: Automatically calculated and tracked for all exercises
- **Per-Exercise Details**: Detailed history showing weight, sets, reps, and RPE for each session
- **1RM Estimation**: Brzycki formula used to estimate one-rep max from your working sets

### 🤖 AI-Powered Coaching (Optional)
- **Google Gemini Integration**: Connect with Gemini AI for personalized workout feedback
- **Auto-sync on Completion**: Automatically sync completed workouts to receive AI analysis
- **Contextual Feedback**: AI considers your workout notes, RPE values, and performance history
- **Interactive Q&A**: Ask your AI coach questions about form, programming, or recovery
- **Chat History**: Maintains conversation context for more relevant coaching advice
- **Configurable**: Enable/disable auto-sync and test API connectivity from Settings

### 🗂️ Exercise Library
- **Comprehensive Database**: 50+ exercises with detailed information
- **Smart Filtering**: Filter by muscle groups (pull, push, legs, core)
- **Search Functionality**: Quick search to find exercises by name
- **Exercise Details**: View primary/secondary muscles, equipment needed, and available variations
- **Exercise History Access**: View historical performance directly from the library

### 🧭 State Management & Navigation
- **URL-Based Routing**: Shareable URLs that deep-link to specific workouts or tabs
- **Browser History Support**: Back/forward buttons work correctly throughout the app
- **State Persistence**: Last viewed workout/tab is remembered across sessions
- **Multi-Tab Navigation**: Switch between Train, Library, History, Coach, and Settings tabs
- **URL Priority**: URL parameters override saved state for reliable deep linking

### 📱 Progressive Web App
- **Mobile-First Design**: Optimized touch targets and responsive layout for phone use
- **Offline Support**: LocalStorage-based persistence works without internet connection
- **Fast Performance**: Built with Vite for optimal load times and bundle size
- **Haptic Feedback**: Physical vibration feedback for set completions and timer alerts
- **Installable**: Can be added to home screen as a standalone app

### 🎯 Program Structure
- **21-Week Program**: Structured training plan with 4 training days per week (Days 1, 2, 3, 5)
- **Week-Based Navigation**: Easy navigation through program weeks
- **Section Organization**: Workouts divided into Warm-up, Main Work, and Cool-down sections
- **Progress Tracking**: Visual indicators show completion status for each section
- **Collapsible Exercises**: Compact view for completed exercises to reduce scrolling

### ⚡ User Experience
- **Fast Interactions**: Debounced search inputs and optimized rendering
- **Keyboard Shortcuts**: Escape key to dismiss toasts and modals
- **Visual Progress**: Mini progress bars and completion percentages throughout
- **Toast Notifications**: Non-blocking notifications for sync status and timer completion
- **Error Handling**: Graceful degradation with helpful error messages

## Configuration

### AI Coaching Setup (Optional)

To enable AI-powered coaching feedback:

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini

2. **Configure in App**:
   - Navigate to Settings tab
   - Enter your Gemini API key
   - Click "Test" to validate the key
   - Click "Validate & Save" to store it
   - Toggle "Auto-sync with Coach AI" on/off as desired

3. **Using AI Coaching**:
   - Complete workouts with auto-sync enabled for automatic feedback
   - View AI analysis in the Coach tab
   - Ask questions to get personalized training advice
   - AI considers your workout notes, RPE values, and exercise history

**Note**: The Gemini API key is stored locally in your browser's localStorage and is never sent to any server other than Google's Gemini API.
