import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Dashboard } from '../components/views/Dashboard';

const mocks = vi.hoisted(() => ({
  tick: vi.fn(),
  bump: vi.fn(),
  swipe: vi.fn(),
  safeGetJSON: vi.fn(),
  getInProgressWorkout: vi.fn(),
  getWorkoutProgress: vi.fn(),
  getWeekCompletionStatus: vi.fn(),
  getCompleteSchedule: vi.fn(),
  getBlockForWeek: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useHaptic: () => ({
    tick: mocks.tick,
    bump: mocks.bump,
    swipe: mocks.swipe,
    success: vi.fn(),
    error: vi.fn(),
  }),
  useScrollToElement: vi.fn(),
}));

vi.mock('../context/ProgramContext', () => ({
  useProgram: () => ({
    currentProgram: { durationWeeks: 10 },
    metadata: { durationWeeks: 10 },
    currentProgramId: 'power-clean-bench-10-week',
  }),
}));

vi.mock('../data/programData', () => ({
  getBlockForWeek: mocks.getBlockForWeek,
}));

vi.mock('../utils/schedule', () => ({
  getCompleteSchedule: mocks.getCompleteSchedule,
}));

vi.mock('../utils/storage', () => ({
  safeGetJSON: mocks.safeGetJSON,
  getInProgressWorkout: mocks.getInProgressWorkout,
  getWorkoutProgress: mocks.getWorkoutProgress,
  getWeekCompletionStatus: mocks.getWeekCompletionStatus,
}));

vi.mock('../services/storageNamespace', () => ({
  getSessionKey: (week: number, day: number) => `session_${week}_${day}`,
  getGlobalHistoryKey: () => 'global_history',
}));

vi.mock('../components/ProgramSelector', () => ({
  ProgramSelector: () => <div data-testid="program-selector" />,
}));

vi.mock('../components/progress', () => ({
  WeeklyProgressRing: () => <div data-testid="weekly-progress-ring" />,
}));

vi.mock('../components/StatusPill', () => ({
  StatusPill: ({ status }: { status: string }) => <div>{status}</div>,
}));

vi.mock('../components/WeekPills', () => ({
  WeekPills: () => <div data-testid="week-pills" />,
}));

vi.mock('../components/ContinueWorkoutCard', () => ({
  ContinueWorkoutCard: () => <div data-testid="continue-workout-card" />,
}));

vi.mock('../components/BottomSheet', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="bottom-sheet">{children}</div> : null,
}));

vi.mock('../components/modals', () => ({
  WorkoutDetailModal: () => null,
}));

describe('Dashboard hero card', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getBlockForWeek.mockReturnValue({ name: 'Base Block', id: 'base-block', weeks: [1] });
    mocks.getCompleteSchedule.mockReturnValue([
      { w: 1, d: 1, ex: 'Bench Press', s: 4, r: '8', load: '60kg', category: 'main' },
      { w: 1, d: 2, ex: 'Easy Run', s: 1, r: '20 min', category: 'main' },
    ]);
    mocks.safeGetJSON.mockImplementation((_key: string, defaultValue: unknown) => defaultValue);
    mocks.getInProgressWorkout.mockReturnValue(null);
    mocks.getWorkoutProgress.mockReturnValue(null);
    mocks.getWeekCompletionStatus.mockReturnValue({ completedCount: 0, totalCount: 2, isComplete: false });
  });

  it('renders the next-up card as a non-button container while keeping the preview action as a button', () => {
    render(
      <Dashboard
        currentWeek={1}
        setCurrentWeek={vi.fn()}
        onStartWorkout={vi.fn()}
      />
    );

    const heroCard = screen.getByRole('button', { name: 'Start Day 1 workout' });
    const previewButton = screen.getByRole('button', { name: 'Preview Day 1 workout' });

    expect(heroCard.tagName).toBe('DIV');
    expect(heroCard).toContainElement(previewButton);
    expect(previewButton.parentElement?.closest('button')).toBeNull();
  });

  it('keeps hero-card keyboard activation and prevents preview interactions from starting the workout', () => {
    const onStartWorkout = vi.fn();

    render(
      <Dashboard
        currentWeek={1}
        setCurrentWeek={vi.fn()}
        onStartWorkout={onStartWorkout}
      />
    );

    const heroCard = screen.getByRole('button', { name: 'Start Day 1 workout' });
    const previewButton = screen.getByRole('button', { name: 'Preview Day 1 workout' });

    fireEvent.keyDown(heroCard, { key: 'Enter' });
    expect(onStartWorkout).toHaveBeenCalledWith(1);

    onStartWorkout.mockClear();

    fireEvent.keyDown(previewButton, { key: 'Enter' });
    expect(onStartWorkout).not.toHaveBeenCalled();

    fireEvent.click(previewButton);
    expect(onStartWorkout).not.toHaveBeenCalled();
    expect(screen.getByText('Day 1 Preview')).toBeInTheDocument();
  });
});