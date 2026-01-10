# Action Logger Quick Reference

This guide provides quick examples for using the action logging system throughout the app.

## Using the Hook (React Components)

### Basic Usage

```typescript
import { useActionLogger } from '@/hooks';

function MyComponent() {
  const logger = useActionLogger({ component: 'MyComponent' });

  const handleClick = () => {
    logger.logUI('button_click', 'User clicked submit');
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### With Lifecycle Logging

```typescript
function MyComponent() {
  const logger = useActionLogger({
    component: 'MyComponent',
    logLifecycle: true  // Logs mount/unmount
  });

  // Component code...
}
```

### Category-Specific Convenience Methods

```typescript
const logger = useActionLogger({ component: 'WorkoutPlayer' });

// Navigation
logger.logNavigation('tab_change', 'Changed to history tab');
logger.logNavigation('view_change', 'Entered workout mode');

// Workout
logger.logWorkout('workout_start', 'Started Day 1 workout');
logger.logWorkout('workout_complete', 'Completed workout');

// Exercise
logger.logExercise('set_complete', 'Completed set 1', {
  workoutContext: { week: 5, day: 1, exerciseId: 'squats', setIndex: 0 }
});

// Timer
logger.logTimer('rest_timer_start', 'Started 60s rest timer', {
  timerContext: { timerType: 'rest', duration: 60 }
});

// Settings
logger.logSettings('theme_change', 'Changed to dark mode', {
  settingsContext: { setting: 'theme', oldValue: 'light', newValue: 'dark' }
});

// Data operations
logger.logData('data_export', 'Exported workout history');

// UI interactions
logger.logUI('modal_open', 'Opened exercise details modal', {
  uiContext: { component: 'ExerciseDetailModal' }
});

// Errors
logger.logError('error_caught', 'Failed to save workout', {
  errorContext: { severity: 'high', component: 'WorkoutPlayer' }
});
```

## Direct Utility Usage (Non-React Code)

```typescript
import { logAction } from '@/utils/actionLogger';

// Log directly without hook
logAction('workout', 'set_complete', 'Completed set', {
  workoutContext: {
    week: 5,
    day: 1,
    exerciseId: 'squats',
    setIndex: 0
  }
});

// Batch log multiple actions
import { logActions } from '@/utils/actionLogger';

logActions([
  { category: 'navigation', type: 'tab_change', description: 'Tab 1' },
  { category: 'navigation', type: 'tab_change', description: 'Tab 2' },
]);
```

## Metadata Examples

### View Context

```typescript
logger.log('navigation', 'tab_change', 'Changed tab', {
  viewContext: {
    viewMode: 'tab',
    activeTab: 'train',
    currentWeek: 5,
    activeDay: 1,
    programId: 'integrated-strength-v1'
  }
});
```

### Workout Context

```typescript
logger.logExercise('weight_change', 'Changed weight to 135kg', {
  workoutContext: {
    week: 5,
    day: 1,
    exerciseId: 'squats',
    exerciseName: 'Back Squats',
    setIndex: 2,
    elapsedTime: 1200  // seconds
  }
});
```

### UI Context

```typescript
logger.logUI('swipe_gesture', 'Swiped to next exercise', {
  uiContext: {
    component: 'ExerciseCard',
    elementType: 'card',
    gesture: 'swipe-left',
    duration: 250  // milliseconds
  }
});
```

### Timer Context

```typescript
logger.logTimer('rest_timer_complete', 'Rest timer finished', {
  timerContext: {
    timerType: 'rest',
    duration: 60,
    remaining: 0
  }
});
```

### Error Context

```typescript
logger.logError('storage_error', 'Failed to save to localStorage', {
  errorContext: {
    message: 'QuotaExceededError',
    component: 'WorkoutPlayer',
    severity: 'high'
  }
});
```

## Configuration Management

```typescript
import {
  getActionLogConfig,
  updateActionLogConfig,
  resetActionLogConfig
} from '@/utils/actionLogger';

// Get current config
const config = getActionLogConfig();

// Update config
updateActionLogConfig({
  enabled: true,
  maxLogs: 5000,
  maxAgeDays: 14,
  samplingRate: 0.5,  // Log 50% of actions
  excludeCategories: ['ui']  // Don't log UI interactions
});

// Reset to defaults
resetActionLogConfig();
```

## Querying Logs

```typescript
import {
  getActionLogs,
  getLogsByCategory,
  getLogsByType,
  getLogsBySession,
  getLogsByDateRange,
  getActionLogStats
} from '@/utils/actionLogger';

// Get all logs
const allLogs = getActionLogs();

// Filter by category
const workoutLogs = getLogsByCategory('workout');

// Filter by type
const setCompletions = getLogsByType('set_complete');

// Filter by session
const sessionLogs = getLogsBySession('session_1234_abc');

// Filter by date
const start = new Date('2024-01-01');
const end = new Date('2024-01-31');
const januaryLogs = getLogsByDateRange(start, end);

// Get statistics
const stats = getActionLogStats();
console.log(`Total logs: ${stats.totalLogs}`);
console.log(`Storage used: ${stats.storageBytes} bytes`);
console.log(`Oldest log: ${stats.oldestLog}`);
console.log(`Top action types:`, stats.topTypes);
```

## Exporting Logs

```typescript
import {
  exportLogsToCSV,
  downloadLogsAsCSV
} from '@/utils/actionLogger';

// Export to CSV string
const csv = exportLogsToCSV(undefined, true);  // Include metadata

// Download as file
downloadLogsAsCSV('my-logs.csv', undefined, true);
```

## Session Management

```typescript
import { getSessionId, startNewSession } from '@/utils/actionLogger';

// Get current session ID (automatically generated)
const sessionId = getSessionId();

// Start a new session (useful for testing or session boundaries)
const newSessionId = startNewSession();
```

## Common Patterns

### Logging User Flows

```typescript
// User starts workout
logger.logNavigation('view_change', 'Started Day 1 workout', {
  viewContext: { viewMode: 'workout', currentWeek: 5, activeDay: 1 }
});

// User completes first set
logger.logExercise('set_complete', 'Completed set 1 of squats', {
  workoutContext: { week: 5, day: 1, exerciseId: 'squats', setIndex: 0 }
});

// User changes weight
logger.logExercise('weight_change', 'Changed weight to 100kg', {
  workoutContext: { week: 5, day: 1, exerciseId: 'squats', setIndex: 1 }
});

// User finishes workout
logger.logWorkout('workout_complete', 'Completed Day 1 workout', {
  workoutContext: { week: 5, day: 1, elapsedTime: 3600 }
});
```

### Logging Errors with Context

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.logError('error_caught', `Failed: ${error.message}`, {
    errorContext: {
      message: error.message,
      component: 'MyComponent',
      severity: 'high'
    }
  });
}
```

### Logging Performance Metrics

```typescript
const startTime = performance.now();
await heavyOperation();
const duration = performance.now() - startTime;

logger.log('performance', 'api_call', 'Fetched workout data', {
  performanceContext: {
    metric: 'api_response_time',
    value: duration,
    unit: 'milliseconds'
  }
});
```

## Action Categories

- `navigation` - Tab changes, view switches, deep links
- `workout` - Session lifecycle (start, pause, complete)
- `exercise` - Set completion, weight/RPE changes
- `timer` - Timer actions (start, pause, stop)
- `settings` - Configuration changes
- `data` - Import, export, sync operations
- `ui` - Modal interactions, gestures
- `error` - Error events
- `performance` - Performance metrics
- `other` - Miscellaneous actions

## Best Practices

1. **Be Descriptive**: Use clear, human-readable descriptions
2. **Include Context**: Add relevant metadata for analysis
3. **Be Consistent**: Use the same action types for similar actions
4. **Don't Log PII**: The system filters it, but avoid logging sensitive data
5. **Use Categories**: Use the appropriate category for each action
6. **Log Key Events**: Focus on important user interactions
7. **Consider Privacy**: Only log what's necessary for UX analysis
8. **Test Logging**: Verify logs are being created correctly

## Troubleshooting

**Logs not appearing?**
- Check if logging is enabled in Settings > Logs
- Verify sampling rate is not too low
- Check if category is excluded in config

**Storage full?**
- Increase max logs limit
- Decrease max age
- Clear old logs manually
- Adjust sampling rate

**Sensitive data in logs?**
- Verify `includeSensitiveData` is false (default)
- Review metadata being passed
- Use action logger's built-in PII filtering
