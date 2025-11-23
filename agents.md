# Agent Capabilities and Documentation

This document describes the capabilities of AI agents that can interact with the OnePlus 12 Pro Tracker codebase.

## Project Overview

**Repository**: tomaszwojcikowski/tracker  
**Type**: Progressive Web Application (PWA)  
**Framework**: React 18 + Vite 5  
**Testing**: Vitest + Testing Library  
**Styling**: Tailwind CSS 3  

## Codebase Structure

```
tracker/
├── src/
│   ├── App.jsx           # Main application component (3,688 lines)
│   ├── main.jsx          # Application entry point
│   ├── main.css          # Global styles
│   └── test/             # Test suite
│       ├── setup.js      # Test configuration
│       ├── toggleSet.test.jsx
│       ├── storageUtils.test.jsx
│       ├── scheduleUtils.test.jsx
│       ├── exerciseHistory.test.jsx
│       └── urlRouting.test.jsx
├── public/               # Static assets
├── exercises.json        # Exercise library data (50+ exercises)
├── full-schedule.json    # 21-week training program
├── colors.css            # CSS custom properties
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── vite.config.js        # Build configuration
├── vitest.config.js      # Test configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

## Key Capabilities for Agents

### 1. Code Understanding

**Main Application File**: `src/App.jsx` is organized into 11 logical sections:
1. Global State & Data Structures
2. LocalStorage Utilities
3. Schedule Utilities
4. Custom Hooks
5. Application Constants & Program Data
6. UI Components
7. Gemini Integration Utilities
8. Exercise History & Stats Utilities
9. Main Application Components
10. URL & State Management Utilities
11. Application Initialization

**Critical Functions to Understand**:
- `safeGetJSON`, `safeSetJSON`, `safeRemove` - localStorage utilities with error handling
- `buildCompleteSchedule` - Auto-generates warmup/cooldown protocols for weeks 2-21
- `toggleSet` - Handles set completion with RPE data management
- `updateExerciseHistory` - Tracks workout performance
- `calculateExerciseStats` - Computes statistics and 1RM estimates
- `getUrlParams`, `updateUrl`, `saveAppState`, `loadAppState` - State management

### 2. Testing

**Test Suite**: 91 tests covering core functionality

**Test Categories**:
- Storage utilities (14 tests)
- Schedule building (15 tests)
- Exercise history (23 tests)
- URL routing (27 tests)
- Set toggle logic (11 tests)
- Plus 1 additional test from recent changes

**Running Tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
```

**Test Philosophy**:
- All tests use mocked localStorage
- Tests mirror actual implementation logic
- Error handling is explicitly tested
- Integration scenarios are covered

### 3. Build and Development

**Development Commands**:
```bash
npm install           # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

**Build Output**:
- `dist/index.html` - Optimized entry point
- `dist/assets/` - Bundled JS (231KB) and CSS (25KB)
- `dist/*.json` - Data files
- `dist/colors.css` - CSS variables

### 4. Feature Implementation Areas

#### Workout Tracking
- Set completion with visual feedback
- Weight and RPE (6-10 scale) logging
- Workout notes (free-text)
- Rest timer with notifications
- Auto-save to localStorage

#### Exercise History & Analytics
- Timeline view of completed workouts
- Exercise statistics (total workouts, max weight, max sets)
- 1RM estimation using Brzycki formula
- Progress graphs with visual weight trends
- Per-exercise detailed history

#### AI Integration (Optional)
- Google Gemini API integration
- Auto-sync on workout completion
- Contextual feedback with workout data
- Interactive Q&A
- Chat history maintenance

#### State Management
- URL-based routing with deep linking
- Browser history support
- localStorage persistence
- State validation and error handling

### 5. Code Modification Guidelines

**When Adding Features**:
1. Follow the 11-section structure in App.jsx
2. Add corresponding tests in `src/test/`
3. Use existing utilities (safeGetJSON, etc.)
4. Maintain error handling patterns
5. Update README.md if user-facing

**When Fixing Bugs**:
1. Write a failing test first
2. Fix the issue minimally
3. Verify all tests pass
4. Check production build works

**When Refactoring**:
1. Maintain existing test coverage
2. Run tests before and after
3. Keep backward compatibility
4. Update comments if behavior changes

### 6. Data Models

#### Exercise History Entry
```javascript
{
  date: "2024-01-15",           // ISO date string
  week: 5,                      // Week number (1-21)
  day: 1,                       // Day number (1, 2, 3, or 5)
  prescription: "3x8 reps",     // Exercise prescription
  sets: [true, true, true],     // Set completion status
  weight: "50kg",               // Weight used (string or number)
  rpe: { 0: "8", 1: "8", 2: "9" } // RPE per set (optional)
}
```

#### App State
```javascript
{
  viewMode: "tab" | "workout",  // Current view mode
  activeTab: "train" | "library" | "history" | "coach" | "profile",
  currentWeek: 1-21,            // Current week
  activeDay: 1 | 2 | 3 | 5      // Active day (4 is rest)
}
```

#### Exercise Definition
```javascript
{
  id: "pull_ups",
  name: "Pull-Ups",
  primaryMuscles: ["lats", "upper_back"],
  secondaryMuscles: ["biceps", "forearms"],
  equipment: ["bar", "rings"],
  category: "pull",
  isBodyweight: true,
  variations: ["Weighted Pull-Ups", ...]
}
```

### 7. Common Tasks for Agents

#### Task: Add a new test
```bash
# Create test file
touch src/test/newFeature.test.jsx

# Import vitest and setup
import { describe, it, expect, beforeEach, vi } from 'vitest';

# Write tests following existing patterns
# Run: npm test
```

#### Task: Add a new utility function
```javascript
// Add to appropriate section in App.jsx
// Add corresponding tests
// Document with JSDoc comments
// Test error cases
```

#### Task: Update dependencies
```bash
# Check current versions
npm outdated

# Update (be cautious with breaking changes)
npm update

# Test thoroughly
npm test && npm run build
```

#### Task: Debug localStorage issues
```javascript
// Use safe utilities for all localStorage access
const data = safeGetJSON('key', defaultValue);
const success = safeSetJSON('key', value);
const removed = safeRemove('key');

// Check localStorage in browser DevTools
localStorage.getItem('tracker_app_state');
```

### 8. Deployment

**Automatic Deployment**:
- GitHub Actions workflow on push to `main`
- Deploys to GitHub Pages
- See DEPLOYMENT.md for details

**Manual Deployment**:
```bash
npm run build
# Deploy dist/ directory to hosting provider
```

### 9. Known Constraints

**Limitations**:
- Day 4 is always a rest day (not in VALID_DAYS array)
- Week range is 1-21 only
- RPE scale is 6-10 (standard Borg scale)
- localStorage has ~5-10MB limit (browser-dependent)
- Gemini API requires user-provided key

**Browser Compatibility**:
- Modern browsers with ES6+ support
- localStorage API required
- Optional: Vibration API for haptic feedback

### 10. Documentation References

- **README.md** - User-facing features and setup
- **TESTING.md** - Manual testing scenarios
- **DEPLOYMENT.md** - Deployment instructions
- **agents.md** (this file) - Agent capabilities and guidelines

## Best Practices for AI Agents

1. **Read First**: Always examine existing code patterns before implementing changes
2. **Test Everything**: Write tests for new functionality, run all tests before completing
3. **Minimal Changes**: Make the smallest possible changes to achieve goals
4. **Error Handling**: Use try-catch blocks and provide meaningful error messages
5. **Documentation**: Update README.md for user-facing changes
6. **Validation**: Validate inputs (week ranges, day values, tab names, etc.)
7. **Backward Compatibility**: Don't break existing functionality
8. **Performance**: Consider bundle size and runtime performance
9. **Security**: Never commit API keys or sensitive data
10. **Code Style**: Follow existing patterns (2-space indent, JSDoc comments)

## Agent Interaction Examples

### Example 1: Adding a New Feature Test
```javascript
// Agent should:
// 1. Create test file in src/test/
// 2. Import necessary testing utilities
// 3. Follow existing test structure
// 4. Mock localStorage appropriately
// 5. Test happy path and error cases
// 6. Run npm test to verify
```

### Example 2: Fixing a Bug
```javascript
// Agent should:
// 1. Locate the bug in App.jsx
// 2. Write a failing test that reproduces the bug
// 3. Fix the bug minimally
// 4. Verify the test now passes
// 5. Run full test suite
// 6. Check production build
```

### Example 3: Updating Documentation
```markdown
// Agent should:
// 1. Read existing README.md structure
// 2. Add content in appropriate section
// 3. Use consistent formatting (emojis, bullets)
// 4. Include code examples if relevant
// 5. Verify markdown renders correctly
```

## Conclusion

This codebase is well-structured with comprehensive test coverage. Agents should leverage existing utilities and patterns, maintain test coverage, and follow the established code organization. The application is production-ready with automatic deployment and requires careful attention to data persistence and state management.

For questions or clarifications, refer to the code comments, existing tests, and documentation files.
