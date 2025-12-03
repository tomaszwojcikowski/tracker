# User Notes Feature

## Overview

The user notes feature allows users to add personal notes to individual exercises within a workout session. These notes are separate from the coaching notes that come from the workout plan.

## User Experience

### Viewing and Editing Notes

1. **Access**: User notes can only be viewed and edited from the Exercise Detail Modal
2. **Location**: The modal is accessed by clicking on an exercise during a workout
3. **UI**: User notes appear in a dedicated "My Notes" section, separate from "Coaching Notes"

### Note Editing Flow

1. Click on an exercise to open the Exercise Detail Modal
2. Locate the "My Notes" section (only visible during an active workout)
3. Click the "Edit" button to enter edit mode
4. Type your notes in the textarea
5. Click "Save" to persist the notes or "Cancel" to discard changes

### Note Persistence

- **Local Storage**: Notes are immediately saved to localStorage when you click Save
- **Cloud Sync**: Notes are automatically synced to Firebase (if configured)
- **Exercise History**: Notes are included in exercise history when a workout is completed

## Technical Implementation

### Data Structure

User notes are stored in the `WorkoutSessionData` structure:

```typescript
interface ExerciseLogEntry {
    sets?: boolean[];
    weight?: string;
    rpe?: RPEData;
    userNotes?: string;  // User's personal notes
    notes?: string;      // @deprecated Legacy field
}

interface WorkoutSessionData {
    exercises?: Record<string, ExerciseLogEntry>;
    // ... other fields
}
```

### Storage

1. **localStorage**: Stored in session keys like `session_w1d1`
2. **Exercise History**: Saved when workout is completed
3. **Firebase**: Synced via the existing sync infrastructure

### Key Features

- **Per-workout, per-exercise**: Each exercise in each workout session has its own notes
- **Backward compatible**: Uses legacy `notes` field as fallback
- **Type-safe**: Full TypeScript support
- **Tested**: 14 comprehensive tests covering all functionality

## API

### Components

#### ExerciseDetailModal

New props:
- `exerciseId?: string` - ID of the exercise for looking up notes
- `currentUserNotes?: string` - Current notes value
- `onUpdateUserNotes?: (exerciseId: string, notes: string) => void` - Callback for saving notes

#### WorkoutPlayer

New handler:
- `handleUpdateUserNotes(exerciseId: string, notes: string): void` - Saves notes to session data and triggers sync

### Types

#### ExerciseLogEntry

```typescript
interface ExerciseLogEntry {
    userNotes?: string;  // User's personal notes for this exercise
    // ... other fields
}
```

#### ExerciseDetailRequest

```typescript
interface ExerciseDetailRequest {
    exerciseId?: string;           // Exercise ID for note lookup
    currentUserNotes?: string;     // Current note value
    onUpdateUserNotes?: (exerciseId: string, notes: string) => void;
    // ... other fields
}
```

## Testing

The feature includes comprehensive tests in `src/test/userNotes.test.tsx`:

- UI visibility tests
- Edit mode functionality
- Save/cancel behavior
- Storage integration
- Exercise history integration
- Data synchronization

Run tests with:
```bash
npm test -- userNotes
```

## Future Enhancements

Possible improvements:
- Rich text formatting
- Voice-to-text input
- Note templates
- Note history/versioning
- Export notes to external apps
- Note search and filtering
