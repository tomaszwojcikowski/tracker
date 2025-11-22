# Manual Testing Guide for State Management & URL Routing

## Features Implemented

1. **Remember Last Workout State**: The app saves and restores the last viewed workout/tab
2. **URL-Based Routing**: URLs reflect current app state and can be shared/bookmarked
3. **Browser History Support**: Back/forward buttons work correctly

## Test Scenarios

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
- `day`: Current day (1, 2, 3, 5)

### Priority Order
1. URL query parameters (highest priority)
2. localStorage saved state
3. Default values (lowest priority)
