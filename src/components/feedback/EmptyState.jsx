import React from 'react';

/**
 * EmptyState - Placeholder UI for empty content areas
 * 
 * Displays a friendly message with optional action when there's no content to show.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Descriptive text
 * @param {Function} [props.action] - Optional action callback
 * @param {string} [props.actionLabel] - Label for action button
 * @param {string} [props.className] - Additional CSS classes
 */
export const EmptyState = ({ 
    icon, 
    title, 
    description, 
    action,
    actionLabel,
    className = '',
}) => (
    <div 
        className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
        role="status"
        aria-label={title}
    >
        {/* Icon container */}
        <div 
            className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mb-4"
            aria-hidden="true"
        >
            {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2">
            {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-sys-onSurfaceVar mb-6 max-w-xs leading-relaxed">
            {description}
        </p>
        
        {/* Optional action button */}
        {action && actionLabel && (
            <button 
                onClick={action}
                className="h-12 px-6 rounded-xl bg-sys-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sys-black"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

/**
 * Pre-configured empty states for common use cases
 */
export const EmptyWorkoutHistory = ({ onStartWorkout }) => (
    <EmptyState
        icon={
            <svg className="w-8 h-8 text-sys-onSurfaceVar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        }
        title="No workouts yet"
        description="Start your first workout to see your training history here."
        action={onStartWorkout}
        actionLabel="Start Training"
    />
);

export const EmptyExerciseHistory = ({ exerciseName }) => (
    <EmptyState
        icon={
            <svg className="w-8 h-8 text-sys-onSurfaceVar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        }
        title="No history yet"
        description={`Complete ${exerciseName || 'this exercise'} in a workout to see your progress.`}
    />
);

export const EmptySearchResults = ({ query, onClear }) => (
    <EmptyState
        icon={
            <svg className="w-8 h-8 text-sys-onSurfaceVar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        }
        title="No results found"
        description={query ? `No exercises match "${query}". Try a different search term.` : 'Try searching for an exercise name or muscle group.'}
        action={onClear}
        actionLabel="Clear Search"
    />
);

export const EmptyChatHistory = () => (
    <EmptyState
        icon={
            <svg className="w-8 h-8 text-sys-onSurfaceVar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        }
        title="Start a conversation"
        description="Ask your AI coach for workout tips, form advice, or progress analysis."
    />
);

export default EmptyState;
