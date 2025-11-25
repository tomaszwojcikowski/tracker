import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { 
    ExerciseCardSkeleton,
    HistoryEntrySkeleton,
    StatsCardSkeleton,
    ExerciseLibraryItemSkeleton,
    ChatMessageSkeleton,
    WorkoutDaySkeleton,
    SkeletonList,
} from '../components/skeletons';

describe('Skeleton Components', () => {
    describe('ExerciseCardSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<ExerciseCardSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has animate-pulse class for loading animation', () => {
            const { container } = render(<ExerciseCardSkeleton />);
            expect(container.firstChild).toHaveClass('animate-pulse');
        });

        it('has proper structure with placeholder elements', () => {
            const { container } = render(<ExerciseCardSkeleton />);
            // Should have icon placeholder, title, and set buttons
            const placeholders = container.querySelectorAll('.bg-sys-surfaceHigh');
            expect(placeholders.length).toBeGreaterThan(0);
        });
    });

    describe('HistoryEntrySkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<HistoryEntrySkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has animate-pulse class', () => {
            const { container } = render(<HistoryEntrySkeleton />);
            expect(container.firstChild).toHaveClass('animate-pulse');
        });
    });

    describe('StatsCardSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<StatsCardSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has rounded corners styling', () => {
            const { container } = render(<StatsCardSkeleton />);
            expect(container.firstChild).toHaveClass('rounded-2xl');
        });
    });

    describe('ExerciseLibraryItemSkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<ExerciseLibraryItemSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('has proper layout structure', () => {
            const { container } = render(<ExerciseLibraryItemSkeleton />);
            expect(container.querySelector('.flex-shrink-0')).toBeInTheDocument();
        });
    });

    describe('ChatMessageSkeleton', () => {
        it('renders AI message skeleton by default', () => {
            const { container } = render(<ChatMessageSkeleton />);
            expect(container.firstChild).toBeInTheDocument();
            expect(container.firstChild).toHaveClass('animate-pulse');
        });

        it('renders user message skeleton when isAi is false', () => {
            const { container } = render(<ChatMessageSkeleton isAi={false} />);
            expect(container.firstChild).toHaveClass('flex-row-reverse');
        });
    });

    describe('WorkoutDaySkeleton', () => {
        it('renders without crashing', () => {
            const { container } = render(<WorkoutDaySkeleton />);
            expect(container.firstChild).toBeInTheDocument();
        });

        it('includes multiple exercise card skeletons', () => {
            const { container } = render(<WorkoutDaySkeleton />);
            // Should have 3 exercise cards
            const cards = container.querySelectorAll('.rounded-3xl');
            expect(cards.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('SkeletonList', () => {
        it('renders the specified number of skeletons', () => {
            const { container } = render(
                <SkeletonList skeleton={ExerciseCardSkeleton} count={5} />
            );
            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBe(5);
        });

        it('renders 3 skeletons by default', () => {
            const { container } = render(
                <SkeletonList skeleton={ExerciseCardSkeleton} />
            );
            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBe(3);
        });

        it('has aria-busy attribute for accessibility', () => {
            const { container } = render(
                <SkeletonList skeleton={ExerciseCardSkeleton} />
            );
            expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
        });

        it('has aria-label for accessibility', () => {
            const { container } = render(
                <SkeletonList skeleton={ExerciseCardSkeleton} />
            );
            expect(container.firstChild).toHaveAttribute('aria-label', 'Loading content');
        });

        it('applies custom className', () => {
            const { container } = render(
                <SkeletonList 
                    skeleton={ExerciseCardSkeleton} 
                    className="custom-class" 
                />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });
    });
});
