import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    WorkoutProgress,
    WeightChangeIndicator,
    TimerRing,
    ProgressRing,
} from '../components/progress/ProgressIndicators';
import { WeeklyProgressRing } from '../components/progress/WeeklyProgressRing';

describe('WorkoutProgress', () => {
    it('should display completed and total sets', () => {
        render(<WorkoutProgress completedSets={5} totalSets={15} />);

        expect(screen.getByText('5/15 sets')).toBeInTheDocument();
    });

    it('should calculate correct percentage', () => {
        render(<WorkoutProgress completedSets={10} totalSets={20} />);

        // 10/20 = 50%
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('should have accessible progress bar', () => {
        render(<WorkoutProgress completedSets={3} totalSets={10} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '30');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should handle zero total sets', () => {
        render(<WorkoutProgress completedSets={0} totalSets={0} />);

        expect(screen.getByText('0/0 sets')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle completed workout', () => {
        render(<WorkoutProgress completedSets={12} totalSets={12} />);

        expect(screen.getByText('12/12 sets')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(
            <WorkoutProgress completedSets={5} totalSets={10} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
});

describe('WeightChangeIndicator', () => {
    it('should show positive weight change', () => {
        render(<WeightChangeIndicator current={80} previous={75} />);

        expect(screen.getByText('+5kg')).toBeInTheDocument();
    });

    it('should show negative weight change', () => {
        render(<WeightChangeIndicator current={70} previous={75} />);

        expect(screen.getByText('-5kg')).toBeInTheDocument();
    });

    it('should return null for no change', () => {
        const { container } = render(
            <WeightChangeIndicator current={75} previous={75} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when no previous value', () => {
        const { container } = render(
            <WeightChangeIndicator current={75} previous={null} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when previous is undefined', () => {
        const { container } = render(
            <WeightChangeIndicator current={75} previous={undefined} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should handle custom unit', () => {
        render(<WeightChangeIndicator current={180} previous={175} unit="lb" />);

        expect(screen.getByText('+5lb')).toBeInTheDocument();
    });

    it('should handle decimal changes', () => {
        render(<WeightChangeIndicator current={77.5} previous={75} />);

        expect(screen.getByText('+2.5kg')).toBeInTheDocument();
    });

    it('should have correct color classes', () => {
        const { rerender } = render(
            <WeightChangeIndicator current={80} previous={75} />
        );

        expect(screen.getByText('+5kg')).toHaveClass('text-sys-success');

        rerender(<WeightChangeIndicator current={70} previous={75} />);

        expect(screen.getByText('-5kg')).toHaveClass('text-sys-error');
    });

    it('should have accessible label', () => {
        render(<WeightChangeIndicator current={80} previous={75} />);

        expect(screen.getByText('+5kg')).toHaveAttribute(
            'aria-label',
            'Weight increased by 5kg'
        );
    });

    it('should apply custom className', () => {
        render(
            <WeightChangeIndicator
                current={80}
                previous={75}
                className="custom-indicator"
            />
        );

        expect(screen.getByText('+5kg')).toHaveClass('custom-indicator');
    });
});

describe('TimerRing', () => {
    it('should render SVG element', () => {
        render(<TimerRing current={45} total={90} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.tagName).toBe('svg');
    });

    it('should have correct size', () => {
        render(<TimerRing current={30} total={60} size={200} />);

        const svg = screen.getByRole('progressbar');
        expect(svg).toHaveAttribute('width', '200');
        expect(svg).toHaveAttribute('height', '200');
    });

    it('should render children in center', () => {
        render(
            <TimerRing current={45} total={90}>
                <span>0:45</span>
            </TimerRing>
        );

        expect(screen.getByText('0:45')).toBeInTheDocument();
    });

    it('should have accessible attributes', () => {
        render(<TimerRing current={30} total={60} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '30');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '60');
    });

    it('should have accessible label', () => {
        render(<TimerRing current={45} total={90} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute(
            'aria-label',
            'Timer: 45 seconds remaining'
        );
    });

    it('should render two circles (background and progress)', () => {
        const { container } = render(<TimerRing current={30} total={60} />);

        const circles = container.querySelectorAll('circle');
        expect(circles).toHaveLength(2);
    });

    it('should apply custom className', () => {
        const { container } = render(
            <TimerRing current={30} total={60} className="custom-timer" />
        );

        expect(container.firstChild).toHaveClass('custom-timer');
    });

    it('should handle zero total', () => {
        render(<TimerRing current={0} total={0} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
    });
});

describe('ProgressRing', () => {
    it('should render SVG element', () => {
        render(<ProgressRing percentage={50} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.tagName).toBe('svg');
    });

    it('should have default size of 48', () => {
        render(<ProgressRing percentage={50} />);

        const svg = screen.getByRole('progressbar');
        expect(svg).toHaveAttribute('width', '48');
        expect(svg).toHaveAttribute('height', '48');
    });

    it('should respect custom size', () => {
        render(<ProgressRing percentage={50} size={100} />);

        const svg = screen.getByRole('progressbar');
        expect(svg).toHaveAttribute('width', '100');
        expect(svg).toHaveAttribute('height', '100');
    });

    it('should have accessible percentage', () => {
        render(<ProgressRing percentage={75} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render two circles', () => {
        const { container } = render(<ProgressRing percentage={50} />);

        const circles = container.querySelectorAll('circle');
        expect(circles).toHaveLength(2);
    });

    it('should handle 0%', () => {
        render(<ProgressRing percentage={0} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100%', () => {
        render(<ProgressRing percentage={100} />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should apply custom className', () => {
        render(<ProgressRing percentage={50} className="custom-ring" />);

        const svg = screen.getByRole('progressbar');
        expect(svg).toHaveClass('custom-ring');
    });
});

describe('WeeklyProgressRing', () => {
    it('should display current week', () => {
        render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={5} />
        );

        expect(screen.getByText('Week 5')).toBeInTheDocument();
    });

    it('should display completed and total workouts', () => {
        render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={1} />
        );

        expect(screen.getByText('2 of 4 workouts completed')).toBeInTheDocument();
    });

    it('should calculate and display correct percentage (0%)', () => {
        render(
            <WeeklyProgressRing completedWorkouts={0} totalWorkouts={4} currentWeek={1} />
        );

        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate and display correct percentage (50%)', () => {
        render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={1} />
        );

        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should calculate and display correct percentage (100%)', () => {
        render(
            <WeeklyProgressRing completedWorkouts={4} totalWorkouts={4} currentWeek={1} />
        );

        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle zero total workouts', () => {
        render(
            <WeeklyProgressRing completedWorkouts={0} totalWorkouts={0} currentWeek={1} />
        );

        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 of 0 workouts completed')).toBeInTheDocument();
    });

    it('should render workout indicator bars matching total workouts', () => {
        const { container } = render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={1} />
        );

        // Find the indicator bars container (last div with gap-1)
        const indicatorBars = container.querySelectorAll('.rounded-full.h-1\\.5');
        expect(indicatorBars).toHaveLength(4);
    });

    it('should apply completed class to completed workout indicators', () => {
        const { container } = render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={1} />
        );

        const indicatorBars = container.querySelectorAll('.rounded-full.h-1\\.5');
        
        // First 2 should be completed (bg-sys-accent)
        expect(indicatorBars[0]).toHaveClass('bg-sys-accent');
        expect(indicatorBars[1]).toHaveClass('bg-sys-accent');
        
        // Last 2 should be incomplete (bg-sys-surfaceHigh)
        expect(indicatorBars[2]).toHaveClass('bg-sys-surfaceHigh');
        expect(indicatorBars[3]).toHaveClass('bg-sys-surfaceHigh');
    });

    it('should render all indicators as completed when all workouts are done', () => {
        const { container } = render(
            <WeeklyProgressRing completedWorkouts={4} totalWorkouts={4} currentWeek={1} />
        );

        const indicatorBars = container.querySelectorAll('.rounded-full.h-1\\.5');
        
        indicatorBars.forEach(bar => {
            expect(bar).toHaveClass('bg-sys-accent');
        });
    });

    it('should render all indicators as incomplete when no workouts are done', () => {
        const { container } = render(
            <WeeklyProgressRing completedWorkouts={0} totalWorkouts={4} currentWeek={1} />
        );

        const indicatorBars = container.querySelectorAll('.rounded-full.h-1\\.5');
        
        indicatorBars.forEach(bar => {
            expect(bar).toHaveClass('bg-sys-surfaceHigh');
        });
    });

    it('should render SVG with two circles (background and progress)', () => {
        const { container } = render(
            <WeeklyProgressRing completedWorkouts={2} totalWorkouts={4} currentWeek={1} />
        );

        const circles = container.querySelectorAll('circle');
        expect(circles).toHaveLength(2);
    });

    it('should cap percentage at 100% when completed exceeds total', () => {
        render(
            <WeeklyProgressRing completedWorkouts={5} totalWorkouts={4} currentWeek={1} />
        );

        // Should show 100% due to Math.min in the component
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle partial completion (3/4)', () => {
        render(
            <WeeklyProgressRing completedWorkouts={3} totalWorkouts={4} currentWeek={10} />
        );

        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('3 of 4 workouts completed')).toBeInTheDocument();
        expect(screen.getByText('Week 10')).toBeInTheDocument();
    });

    it('should display correct week number for different weeks', () => {
        const { rerender } = render(
            <WeeklyProgressRing completedWorkouts={1} totalWorkouts={4} currentWeek={1} />
        );

        expect(screen.getByText('Week 1')).toBeInTheDocument();

        rerender(
            <WeeklyProgressRing completedWorkouts={1} totalWorkouts={4} currentWeek={21} />
        );

        expect(screen.getByText('Week 21')).toBeInTheDocument();
    });
});
