import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseDetailModal } from '../components/modals/ExerciseDetailModal';
import type { ExerciseDetailMetadata } from '../types/workout';
import type { ExerciseOption } from '../workout-plan-utils';

// Mock custom icons module
vi.mock('../components/icons', () => ({
    X: () => <span data-testid="icon-x">✕</span>,
    TrendingUp: () => <span data-testid="icon-trending-up">📈</span>,
    Calendar: () => <span data-testid="icon-calendar">📅</span>,
    Dumbbell: () => <span data-testid="icon-dumbbell">🏋️</span>,
    Trophy: () => <span data-testid="icon-trophy">🏆</span>,
    Activity: () => <span data-testid="icon-activity">📊</span>,
    ArrowRightLeft: () => <span data-testid="icon-arrow-right-left">↔</span>,
    Timer: () => <span data-testid="icon-timer">⏱</span>,
    ClipboardList: () => <span data-testid="icon-clipboard-list">📋</span>,
    FileText: () => <span data-testid="icon-file-text">📄</span>,
    Edit3: () => <span data-testid="icon-edit3">✏️</span>,
    Save: () => <span data-testid="icon-save">💾</span>,
    XCircle: () => <span data-testid="icon-x-circle">⊗</span>,
    Gauge: () => <span data-testid="icon-gauge">⏲️</span>,
}));

// Mock BottomSheet component
vi.mock('../components/BottomSheet', () => ({
    BottomSheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => (
        <div data-testid="bottom-sheet" style={{ display: isOpen ? 'block' : 'none' }}>
            {children}
        </div>
    ),
}));

/**
 * Tests for cues display in ExerciseDetailModal
 */
describe('Exercise Detail Cues Display', () => {
    const defaultProps = {
        exerciseName: 'Dead Bug',
        historyLookupName: 'Dead Bug',
        originalName: 'Dead Bug',
        isSwapped: false,
        onClose: vi.fn(),
        isOpen: true,
    };

    it('should display main exercise cues when no option is selected', () => {
        const metadata: ExerciseDetailMetadata = {
            prescription: '3x10 per side',
            cues: [
                'Lower back stays glued to floor throughout',
                'Move slowly and with control',
                'Exhale as you extend limbs',
                'Stop before your back arches',
            ],
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        expect(screen.getByText('Coaching Cues')).toBeInTheDocument();
        expect(screen.getByText('Lower back stays glued to floor throughout')).toBeInTheDocument();
        expect(screen.getByText('Move slowly and with control')).toBeInTheDocument();
        expect(screen.getByText('Exhale as you extend limbs')).toBeInTheDocument();
        expect(screen.getByText('Stop before your back arches')).toBeInTheDocument();
    });

    it('should display option-specific cues when an option is selected', () => {
        const exerciseOptions: ExerciseOption[] = [
            {
                optionName: 'Lateral: Eccentric Wrist Extension (DB)',
                description: 'Palm down. Start in extension (hand up), lower toward flexion over 4 seconds.',
                cues: [
                    'Forearm supported on bench/box, wrist over edge',
                    'No swinging; keep the movement isolated at the wrist',
                    'Lower smoothly for full 4 seconds',
                ],
            },
            {
                optionName: 'Medial: Eccentric Wrist Flexion (DB)',
                description: 'Palm up. Start in flexion (hand up), lower toward extension over 4 seconds.',
            },
        ];

        const metadata: ExerciseDetailMetadata = {
            prescription: '3x15',
            cues: [
                'Main exercise cue 1',
                'Main exercise cue 2',
            ],
            exerciseOptions,
        };

        render(
            <ExerciseDetailModal
                {...defaultProps}
                metadata={metadata}
                selectedOption="Lateral: Eccentric Wrist Extension (DB)"
            />
        );

        // Should show option-specific label
        expect(screen.getByText('Lateral: Eccentric Wrist Extension (DB) - Cues')).toBeInTheDocument();

        // Should show option-specific cues
        expect(screen.getByText('Forearm supported on bench/box, wrist over edge')).toBeInTheDocument();
        expect(screen.getByText('No swinging; keep the movement isolated at the wrist')).toBeInTheDocument();
        expect(screen.getByText('Lower smoothly for full 4 seconds')).toBeInTheDocument();

        // Should NOT show main exercise cues
        expect(screen.queryByText('Main exercise cue 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Main exercise cue 2')).not.toBeInTheDocument();
    });

    it('should fall back to main cues if selected option has no cues', () => {
        const exerciseOptions: ExerciseOption[] = [
            {
                optionName: 'Option Without Cues',
                description: 'An option without cues defined',
            },
        ];

        const metadata: ExerciseDetailMetadata = {
            prescription: '3x10',
            cues: [
                'Fallback cue 1',
                'Fallback cue 2',
            ],
            exerciseOptions,
        };

        render(
            <ExerciseDetailModal
                {...defaultProps}
                metadata={metadata}
                selectedOption="Option Without Cues"
            />
        );

        // Should show main exercise cues label
        expect(screen.getByText('Coaching Cues')).toBeInTheDocument();

        // Should show main exercise cues
        expect(screen.getByText('Fallback cue 1')).toBeInTheDocument();
        expect(screen.getByText('Fallback cue 2')).toBeInTheDocument();
    });

    it('should not display cues section when no cues are available', () => {
        const metadata: ExerciseDetailMetadata = {
            prescription: '3x8 reps',
            notes: 'Some notes',
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        expect(screen.queryByText('Coaching Cues')).not.toBeInTheDocument();
    });

    it('should not display cues section when cues array is empty', () => {
        const metadata: ExerciseDetailMetadata = {
            prescription: '3x8 reps',
            cues: [],
        };

        render(<ExerciseDetailModal {...defaultProps} metadata={metadata} />);

        expect(screen.queryByText('Coaching Cues')).not.toBeInTheDocument();
    });

    it('should handle multiple exercise options with different cues', () => {
        const exerciseOptions: ExerciseOption[] = [
            {
                optionName: 'Couch Stretch',
                description: 'Deep hip flexor and quad stretch',
                cues: ['Rear shin on couch/wall', 'Front foot forward', 'Push hips forward'],
            },
            {
                optionName: 'Kneeling Hip Flexor Stretch',
                description: 'Classic hip flexor stretch',
                cues: ['Rear knee down', 'Front foot forward', 'Squeeze rear glute'],
            },
        ];

        const metadata: ExerciseDetailMetadata = {
            prescription: '1x90s per side',
            exerciseOptions,
        };

        const { rerender } = render(
            <ExerciseDetailModal
                {...defaultProps}
                metadata={metadata}
                selectedOption="Couch Stretch"
            />
        );

        // Should show first option cues
        expect(screen.getByText('Couch Stretch - Cues')).toBeInTheDocument();
        expect(screen.getByText('Rear shin on couch/wall')).toBeInTheDocument();
        expect(screen.getByText('Front foot forward')).toBeInTheDocument();

        // Change to second option
        rerender(
            <ExerciseDetailModal
                {...defaultProps}
                metadata={metadata}
                selectedOption="Kneeling Hip Flexor Stretch"
            />
        );

        // Should show second option cues
        expect(screen.getByText('Kneeling Hip Flexor Stretch - Cues')).toBeInTheDocument();
        expect(screen.getByText('Rear knee down')).toBeInTheDocument();
        expect(screen.getByText('Squeeze rear glute')).toBeInTheDocument();

        // Should NOT show first option cues
        expect(screen.queryByText('Rear shin on couch/wall')).not.toBeInTheDocument();
    });
});
