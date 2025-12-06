// Navigation components
export { NavigationBar, TabContent } from './navigation';
export type { NavigationBarProps } from './navigation/NavigationBar';
export type { TabContentProps } from './navigation/TabContent';

// Modal components
export { ConfirmDialog, ExerciseDetailModal } from './modals';
export type { ConfirmDialogProps, ConfirmDialogVariant } from './modals/ConfirmDialog';
export type { ExerciseDetailModalProps } from './modals/ExerciseDetailModal';

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

// Onboarding components
export { Onboarding, hasCompletedOnboarding, markOnboardingComplete, resetOnboarding } from './Onboarding';
export type { OnboardingProps } from './Onboarding';

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
export { FullscreenRestTimer } from './FullscreenRestTimer';
export { FullscreenTimer } from './FullscreenTimer';
export { SwipeIndicator } from './SwipeIndicator';
export { WorkoutTimerDisplay } from './WorkoutTimerDisplay';
export type { PullToRefreshProps } from './PullToRefresh';
export type { FloatingTimerProps } from './FloatingTimer';
export type { FullscreenRestTimerProps } from './FullscreenRestTimer';
export type { FullscreenTimerProps, TimerMode } from './FullscreenTimer';
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

// Compact view components
export { CompactExerciseRow } from './CompactExerciseRow';
export type { CompactExerciseRowProps } from './CompactExerciseRow';
export { CompactSetButtons } from './CompactSetButtons';
export type { CompactSetButtonsProps } from './CompactSetButtons';

// Superset group component
export { SupersetGroup } from './SupersetGroup';
export type { SupersetGroupProps, SupersetExercise } from './SupersetGroup';

// RPE components
export { RPESelector, RPEBadge } from './RPESelector';
export type { RPESelectorProps, RPEBadgeProps } from './RPESelector';

// Gesture hints
export { GestureHint, useGestureHint } from './GestureHint';
export type { GestureHintProps } from './GestureHint';

// Recent exercises
export { RecentExercisesList, getRecentExercises, addRecentExercise, clearRecentExercises } from './RecentExercises';
export type { RecentExercisesListProps, RecentExercise } from './RecentExercises';

// Exercise selector components (extracted from WorkoutPlayer)
export { ExerciseListItem } from './ExerciseListItem';
export type { ExerciseListItemProps } from './ExerciseListItem';

// Exercise card components (extracted from WorkoutPlayer)
export { ExerciseCard } from './ExerciseCard';
export type { ExerciseCardProps } from './ExerciseCard';
export type { LoadRange } from '../workout-plan-utils';

export { AddedExerciseCard } from './AddedExerciseCard';
export type { AddedExerciseCardProps } from './AddedExerciseCard';

export { ExerciseSelectorModal } from './ExerciseSelectorModal';
export type { ExerciseSelectorModalProps } from './ExerciseSelectorModal';

// Program selector component
export { ProgramSelector } from './ProgramSelector';
export type { ProgramSelectorProps } from './ProgramSelector';

// MD3 Bottom Sheet component
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps } from './BottomSheet';

// MD3 Snackbar component
export { Snackbar } from './Snackbar';

// Focus view component
export { FocusView } from './FocusView';
export type { FocusViewProps, FocusItem } from './FocusView';

// Workout summary component (P1 - Point 10)
export { WorkoutSummary } from './WorkoutSummary';
export type { WorkoutSummaryProps, ExerciseSummaryItem } from './WorkoutSummary';

// Workout flow indicator component (P1 - Point 6)
export { WorkoutFlowIndicator } from './WorkoutFlowIndicator';
export type { WorkoutFlowIndicatorProps, SectionProgress } from './WorkoutFlowIndicator';

// PR Highlights component (P1 - Point 8)
export { PRHighlights, calculateStreak, findRecentPRs } from './PRHighlights';
export type { PRHighlightsProps, PRRecord } from './PRHighlights';