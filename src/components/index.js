// Navigation components
export { NavigationBar, TabContent } from './navigation';

// Modal components
export { ConfirmDialog } from './modals';

// Skeleton components
export {
    ExerciseCardSkeleton,
    HistoryEntrySkeleton,
    StatsCardSkeleton,
    ExerciseLibraryItemSkeleton,
    ChatMessageSkeleton,
    WorkoutDaySkeleton,
    SkeletonList,
} from './skeletons';

// Feedback components
export {
    EmptyState,
    EmptyWorkoutHistory,
    EmptyExerciseHistory,
    EmptySearchResults,
    EmptyChatHistory,
} from './feedback';

// Error handling
export { ErrorBoundary } from './ErrorBoundary';

// PWA components
export { PWAPrompt } from './PWAPrompt';
export { PWAWrapper } from './PWAWrapper';

// Sync components
export { SyncStatusIndicator } from './SyncStatusIndicator';

// Data visualization
export { VolumeCard, VolumeTrendBadge, VolumeComparisonCard } from './VolumeCard';

// Animation components (P2)
export { AnimatedNumber, AnimatedCounter } from './animations';

// Progress indicator components (P2)
export {
    WorkoutProgress,
    WeightChangeIndicator,
    TimerRing,
    ProgressRing,
} from './progress';

// UX enhancement components (P3)
export { PullToRefresh } from './PullToRefresh';
export { FloatingTimer } from './FloatingTimer';
export { SwipeIndicator } from './SwipeIndicator';
