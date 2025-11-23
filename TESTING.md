# Manual Testing Guide for State Management & URL Routing

## Features Implemented

1. **Remember Last Workout State**: The app saves and restores the last viewed workout/tab
2. **URL-Based Routing**: URLs reflect current app state and can be shared/bookmarked
3. **Browser History Support**: Back/forward buttons work correctly
4. **Workout Notes**: Free-text notes for each workout session
5. **RPE Tracking**: Rate of Perceived Exertion tracking per set (scale 6-10)

## Test Scenarios

### Scenario 0: Training & Logging Enhancements
#### Workout Notes
1. Open any workout (e.g., Week 1, Day 1)
2. **Expected**: See "Workout Notes" section at the top with a text area
3. Type some notes (e.g., "Felt strong today, good form on pull-ups")
4. Navigate away and come back
5. **Expected**: Notes should be persisted

#### RPE Tracking
1. Complete a set by clicking on a set button
2. **Expected**: An RPE dropdown appears below the completed set
3. Select an RPE value (6-10)
4. Complete the workout and check History
5. **Expected**: RPE values should be displayed for each set (e.g., "S1: 8, S2: 9")

#### History View - Notes & RPE
1. Complete a workout with notes and RPE data
2. Navigate to History tab
3. Expand the completed workout entry
4. **Expected**: 
   - Workout notes should be displayed in a separate section
   - RPE values should be shown for each exercise with format "S1: 8, S2: 9"

#### Coach/AI View - Enhanced Data
1. Configure Gemini API key in Settings
2. Complete a workout with notes and RPE
3. Navigate to Coach tab
4. **Expected**: AI feedback should reference the workout notes and RPE values you provided

### Scenario 1: History & Analytics Improvements
#### Timeline View Enhancements
1. Complete 2-3 workouts over different days
2. Navigate to History tab
3. **Expected**: 
   - Timeline showing completed workouts by date
   - Week/day labels clearly visible
   - Expandable entries showing exercise details

#### Stats View
1. In History tab, click the "Stats" toggle button
2. **Expected**:
   - View switches from timeline to statistics
   - Shows list of all exercises with history
   - Each exercise shows: total workouts, max weight, estimated 1RM

#### Per-Exercise Statistics
1. In Stats view, click on any exercise
2. **Expected**:
   - Expands to show detailed stats grid:
     - Total Workouts
     - Max Sets
     - Max Weight
     - Estimated 1RM
   - Shows simple weight progress graph (last 10 workouts)
   - Shows recent history (last 5 sessions)

#### Progress Graphs
1. Complete same exercise multiple times with different weights
2. Check Stats view for that exercise
3. **Expected**: 
   - Weight progress graph showing trend line
   - Min and max weight labels
   - Data points for each workout

### Scenario 2: Coach (Gemini) Integration UX
#### Settings - API Key Configuration
1. Navigate to Settings tab
2. Enter a Gemini API key
3. Click "Test" button
4. **Expected**:
   - Shows "Testing..." while validating
   - Shows "✓ API key is valid" if key is valid
   - Shows "✗ Invalid API key" if key is invalid
5. Click "Validate & Save"
6. **Expected**: 
   - Validates key again
   - Shows success message if valid
   - Saves to localStorage

#### Settings - Auto-sync Toggle
1. In Settings, find "Auto-sync with Coach AI" toggle
2. Toggle it on/off
3. **Expected**:
   - Toggle switches between green (on) and gray (off)
   - Setting persists after page reload
4. Complete a workout with auto-sync disabled
5. **Expected**: 
   - No Gemini sync toast appears
   - Workout completes normally

#### Auto-sync During Workout Completion
1. Enable auto-sync in Settings
2. Complete a workout
3. Click "Finish"
4. **Expected**:
   - Toast shows "Syncing with AI Coach..."
   - After sync: shows "✓ Synced successfully" or error message
   - Toast is non-blocking (can be dismissed with X)

#### Coach Tab - Viewing AI Feedback
1. Complete workouts with auto-sync enabled
2. Navigate to Coach tab
3. **Expected**:
   - Shows list of workouts with AI feedback
   - Each entry displays: Week/Day, Date, AI feedback content
   - Feedback is formatted with markdown (bold, lists, etc.)

#### Coach Tab - Asking Questions
1. In Coach tab, find "Ask the Coach" section
2. Type a question (e.g., "How can I improve my pull-ups?")
3. Click "Ask Question"
4. **Expected**:
   - Button shows "Asking..." with spinner
   - Response appears below in green box
   - Response is formatted with markdown
   - Question adds to Gemini chat history (maintains context)

### Scenario 1: State Persistence on Reload
1. Open the app: `http://localhost:8080/`
2. Navigate to Week 5, Day 3 workout
3. Reload the page (F5)
4. **Expected**: App should return to Week 5, Day 3 workout

### Scenario 2: URL Deep Linking - Workout
1. Open: `http://localhost:8080/?view=workout&week=10&day=2`
2. **Expected**: App should open directly to Week 10, Day 2 workout

### Scenario 3: URL Deep Linking - Tab View
1. Open: `http://localhost:8080/?tab=library&week=7`
2. **Expected**: App should open Library tab with week 7 selected

### Scenario 4: URL Updates on Navigation
1. Open the app
2. Navigate to different tabs (Library, History, etc.)
3. Check URL in address bar
4. **Expected**: URL should change to reflect current tab (e.g., `?tab=library`)

### Scenario 5: Browser Back Button
1. Open the app (Dashboard)
2. Navigate to Library tab
3. Navigate to History tab
4. Click browser back button twice
5. **Expected**: Should go back through Library tab to Dashboard

### Scenario 6: State Priority
1. Save state by navigating to Week 5
2. Close browser
3. Open with URL: `http://localhost:8080/?week=10`
4. **Expected**: URL parameter (week 10) takes priority over saved state

## URL Format Reference

- **Dashboard (Train tab)**: `?tab=train` or `?tab=train&week=5`
- **Library tab**: `?tab=library`
- **History tab**: `?tab=history`
- **Coach tab**: `?tab=coach`
- **Settings tab**: `?tab=profile`
- **Workout view**: `?view=workout&week=5&day=3`

## Implementation Details

### State Storage
- **localStorage key**: `tracker_app_state`
- **Stored data**: `{ viewMode, activeTab, currentWeek, activeDay }`
- **Backward compatibility**: `tracker_week` key still maintained

### URL Parameters
- `view`: "workout" for workout player
- `tab`: Tab name (train, library, history, coach, profile)
- `week`: Current week (1-21)
- `day`: Current day (1, 2, 3, 5) - Note: Day 4 is rest day and not included

### Priority Order
1. URL query parameters (highest priority)
2. localStorage saved state
3. Default values (lowest priority)
