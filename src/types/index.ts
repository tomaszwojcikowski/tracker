/**
 * Core Type Definitions for OnePlus 12 Pro Tracker
 *
 * This file contains TypeScript interfaces and types for the main data structures
 * used throughout the application.
 */

// ============================================================================
// EXERCISE TYPES
// ============================================================================

/**
 * Muscle groups that can be targeted by exercises
 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'hip_flexors'
  | 'adductors'
  | 'abductors'
  | 'traps'
  | 'neck'
  | 'full_body';

/**
 * Equipment types used in exercises
 */
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'bar'
  | 'rings'
  | 'bands'
  | 'bench'
  | 'box'
  | 'foam_roller'
  | 'mat'
  | 'none';

/**
 * Exercise categories for filtering
 */
export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'mobility'
  | 'warmup'
  | 'cooldown'
  | 'compound'
  | 'isolation';

/**
 * Exercise definition from the exercise library
 */
export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment[];
  category: ExerciseCategory;
  isBodyweight: boolean;
  /** Suggested load for weighted exercises (e.g., "5-10kg", "light band") */
  suggestedLoad?: string;
  variations?: string[];
  instructions?: string[];
  tips?: string[];
}

// ============================================================================
// WORKOUT SCHEDULE TYPES
// ============================================================================

/**
 * Valid training days (Day 4 is always rest)
 */
export type TrainingDay = 1 | 2 | 3 | 5;

/**
 * All possible days including rest
 */
export type WeekDay = 1 | 2 | 3 | 4 | 5;

/**
 * Week number in the 21-week program
 */
export type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

/**
 * Exercise prescription within a workout
 */
export interface ExercisePrescription {
  id: string;
  name: string;
  sets: number;
  reps: string | number;
  notes?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
}

/**
 * Warmup or cooldown protocol
 */
export interface WarmupCooldown {
  exercises: ExercisePrescription[];
  duration?: number;
  notes?: string;
}

/**
 * A single workout day in the schedule
 */
export interface ScheduleDay {
  week: WeekNumber;
  day: TrainingDay;
  focus?: string;
  warmup?: WarmupCooldown;
  exercises: ExercisePrescription[];
  cooldown?: WarmupCooldown;
  notes?: string;
}

// ============================================================================
// WORKOUT TRACKING TYPES
// ============================================================================

/**
 * RPE (Rate of Perceived Exertion) scale values
 */
export type RPEValue = '6' | '7' | '8' | '9' | '10';

/**
 * RPE data for sets, keyed by set index
 */
export type RPEData = Record<number, RPEValue>;

/**
 * Exercise history entry for tracking completed workouts
 */
export interface ExerciseHistoryEntry {
  date: string;           // ISO date string (YYYY-MM-DD)
  week: WeekNumber;
  day: TrainingDay;
  prescription: string;   // e.g., "3x8 reps"
  sets: boolean[];        // Set completion status
  weight?: string | number;
  rpe?: RPEData;
  notes?: string;
}

/**
 * Map of exercise ID to array of history entries
 */
export type ExerciseHistory = Record<string, ExerciseHistoryEntry[]>;

/**
 * Session storage key format
 */
export type SessionKey = `session_w${WeekNumber}d${TrainingDay}`;

/**
 * Session data stored in localStorage
 */
export interface SessionData {
  week: WeekNumber;
  day: TrainingDay;
  completedSets: Record<string, boolean[]>;
  weights: Record<string, string | number>;
  rpeData: Record<string, RPEData>;
  notes: Record<string, string>;
  lastModified: string;   // ISO timestamp
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

/**
 * Navigation tabs
 */
export type TabId = 'train' | 'library' | 'history' | 'coach' | 'profile';

/**
 * View modes
 */
export type ViewMode = 'tab' | 'workout';

/**
 * Application state stored in URL/localStorage
 */
export interface AppState {
  viewMode: ViewMode;
  activeTab: TabId;
  currentWeek: WeekNumber;
  activeDay: TrainingDay;
}

/**
 * User settings
 */
export interface UserSettings {
  hapticFeedback: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  restTimerDefault: number;
  geminiApiKey?: string;
  showRPE: boolean;
  compactMode: boolean;
}

// ============================================================================
// FIREBASE / CLOUD SYNC TYPES
// ============================================================================

/**
 * Cloud data structure for sync
 */
export interface CloudData {
  sessions?: Record<SessionKey, SessionData>;
  exerciseHistory?: ExerciseHistory;
  settings?: UserSettings;
  lastSyncTime?: string;
}

/**
 * Firebase user info
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Statistics for a single exercise
 */
export interface ExerciseStats {
  totalWorkouts: number;
  totalSets: number;
  maxWeight: number | null;
  maxSets: number;
  estimated1RM: number | null;
  lastWorkout: string | null;
  progressTrend: 'up' | 'down' | 'stable' | 'insufficient_data';
}

/**
 * Volume metrics for a workout or time period
 */
export interface VolumeMetrics {
  totalSets: number;
  totalReps: number;
  totalVolume: number;  // sets * reps * weight
  byMuscleGroup: Record<MuscleGroup, number>;
  byExercise: Record<string, number>;
}

// ============================================================================
// UI COMPONENT PROPS TYPES
// ============================================================================

/**
 * Navigation item configuration
 */
export interface NavItem {
  id: TabId;
  icon: string;
  label: string;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification data
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Valid day type for component props (includes day 4 for completeness)
 */
export type ValidDay = 1 | 2 | 3 | 5;

/**
 * Valid tab type alias for TabId
 */
export type ValidTab = TabId;

/**
 * WorkoutPlayer component props
 */
export interface WorkoutPlayerProps {
  week: number;
  day: ValidDay;
  onComplete: () => void;
  exerciseLibrary: Exercise[];
}

/**
 * Dashboard component props
 */
export interface DashboardProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onStartWorkout: (day: ValidDay) => void;
}

/**
 * TopAppBar component props
 */
export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

/**
 * Timer state for ActionBar
 */
export interface TimerState {
  time: number;
}

/**
 * EMOM timer state
 */
export interface EmomState {
  active: boolean;
  seconds: number;
  interval: number;
}

/**
 * ActionBar component props
 */
export interface ActionBarProps {
  timerState: TimerState;
  setTimerActive: (active: boolean) => void;
  setTimerSeconds: (seconds: number | ((prev: number) => number)) => void;
  emomState: EmomState;
  setEmomActive: (active: boolean) => void;
  setEmomSeconds: (seconds: number) => void;
  setEmomInterval: (interval: number | ((prev: number) => number)) => void;
}

/**
 * FloatingTimer component props
 */
export interface FloatingTimerProps {
  seconds: number;
  active: boolean;
  onStop: () => void;
  onAddTime: () => void;
}

/**
 * SwipeIndicator component props
 */
export interface SwipeIndicatorProps {
  direction: 'left' | 'right' | null;
  progress: number;
  leftLabel?: string | null;
  rightLabel?: string | null;
}

/**
 * ThemeSelector component props
 */
export interface ThemeSelectorProps {
  theme: string;
  setTheme: (theme: string) => void;
  themes: Array<{ id: string; name: string; colors: Record<string, string> }>;
}

/**
 * PullToRefresh component props
 */
export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * ConfirmDialog component props
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * NavigationBar component props
 */
export interface NavigationBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/**
 * TabContent component props
 */
export interface TabContentProps {
  activeTab: TabId;
  children: React.ReactNode;
}

/**
 * VolumeCard component props
 */
export interface VolumeCardProps {
  current: number;
  previous?: number;
  label: string;
  unit?: string;
}

/**
 * AnimatedNumber component props
 */
export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
}

/**
 * ErrorBoundary component props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PWAPrompt component props
 */
export interface PWAPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

/**
 * SyncStatusIndicator component props
 */
export interface SyncStatusIndicatorProps {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSync?: Date | null;
}

/**
 * Exercise logs state in WorkoutPlayer
 */
export interface ExerciseLogs {
  completed?: boolean;
  workoutNotes?: string;
  addedExercises?: AddedExercise[];
  completedAt?: string;
  lastModified?: string;
  week?: number;
  day?: number;
  [exerciseId: string]: boolean[] | string | number | boolean | RPEData | AddedExercise[] | undefined;
}

/**
 * Added exercise in WorkoutPlayer
 */
export interface AddedExercise {
  id: string;
  name: string;
  sets: number;
  weight?: string;
  rest?: number; // Rest time in seconds, defaults to 90
  isBodyweight: boolean;
  equipment: string[];
  primaryMuscles: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Storage operation result
 */
export type StorageResult<T> = Result<T, string>;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
