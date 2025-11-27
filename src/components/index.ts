// Navigation components
export { NavigationBar, TabContent } from './navigation';
export type { NavigationBarProps } from './navigation/NavigationBar';
export type { TabContentProps } from './navigation/TabContent';

// Modal components
export { ConfirmDialog } from './modals';
export type { ConfirmDialogProps, ConfirmDialogVariant } from './modals/ConfirmDialog';

// Skeleton components
export {
    ExerciseCardSkeleton,
    HistoryEntrySkeleton,
    StatsCardSkeleton,
    ExerciseLibraryItemSkeleton,
    WorkoutDaySkeleton,
    SkeletonList,
} from './skeletons';
export type { SkeletonListProps } from './skeletons/Skeletons';

// Feedback components
export {
    EmptyState,
    EmptyWorkoutHistory,
    EmptyExerciseHistory,
    EmptySearchResults,
} from './feedback';
export type { EmptyStateProps, EmptyWorkoutHistoryProps, EmptyExerciseHistoryProps, EmptySearchResultsProps } from './feedback/EmptyState';

// Error handling
export { ErrorBoundary } from './ErrorBoundary';

// PWA components
export { default as PWAPrompt, UpdatePrompt, OfflineBanner } from './PWAPrompt';
export { PWAWrapper } from './PWAWrapper';
export type { UpdatePromptProps, OfflineBannerProps } from './PWAPrompt';
export type { PWAWrapperProps } from './PWAWrapper';

// Sync components
export { SyncStatusIndicator, InlineSyncStatus } from './SyncStatusIndicator';
export type { SyncStatusIndicatorProps, InlineSyncStatusProps } from './SyncStatusIndicator';

// Data visualization
export { VolumeCard, VolumeTrendBadge, VolumeStatsCard } from './VolumeCard';
export type { VolumeCardProps, VolumeTrendBadgeProps, VolumeStatsCardProps, VolumeTrend } from './VolumeCard';

// Animation components (P2)
export { AnimatedNumber, AnimatedCounter } from './animations';
export type { AnimatedNumberProps, AnimatedCounterProps } from './animations/AnimatedNumber';

// Progress indicator components (P2)
export {
    WorkoutProgress,
    WeightChangeIndicator,
    TimerRing,
    ProgressRing,
} from './progress';
export type { WorkoutProgressProps, WeightChangeIndicatorProps, TimerRingProps, ProgressRingProps } from './progress/ProgressIndicators';

// UX enhancement components (P3)
export { PullToRefresh } from './PullToRefresh';
export { FloatingTimer } from './FloatingTimer';
export { SwipeIndicator } from './SwipeIndicator';
export type { PullToRefreshProps } from './PullToRefresh';
export type { FloatingTimerProps } from './FloatingTimer';
export type { SwipeIndicatorProps } from './SwipeIndicator';

// Settings components
export { ThemeSelector } from './ThemeSelector';
export type { ThemeSelectorProps } from './ThemeSelector';

// Accessibility components
export { SkipLink } from './SkipLink';
export type { SkipLinkProps } from './SkipLink';

// App bar components
export { TopAppBar } from './TopAppBar';
export { ActionBar } from './ActionBar';
export type { TopAppBarProps } from './TopAppBar';
export type { ActionBarProps, TimerState, EmomState } from './ActionBar';

// Screen components
export { LoadingScreen, ErrorScreen } from './screens';
export type { LoadingScreenProps, ErrorScreenProps } from './screens';
