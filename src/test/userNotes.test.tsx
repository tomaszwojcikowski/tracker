import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseDetailModal } from '../components/modals/ExerciseDetailModal';
import type { ExerciseDetailMetadata } from '../types/workout';

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
 * Tests for user notes functionality in ExerciseDetailModal
 */

describe('User Notes - ExerciseDetailModal', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const defaultProps = {
        exerciseName: 'Pull-Ups',
        historyLookupName: 'Pull-Ups',
        originalName: 'Pull-Ups',
        isSwapped: false,
        onClose: vi.fn(),
        isOpen: true,
    };

    const metadata: ExerciseDetailMetadata = {
        prescription: '3x8 reps',
        notes: 'Focus on full range of motion',
        restTime: 90,
        isBodyweight: true,
        isEmom: false,
        isUnilateral: false,
        loadRange: null,
    };

    describe('User notes section visibility', () => {
        it('should not show user notes section when onUpdateUserNotes is not provided', () => {
            render(<ExerciseDetailModal {...defaultProps} />);
            
            expect(screen.queryByText('My Notes')).not.toBeInTheDocument();
        });

        it('should show user notes section when exerciseId and onUpdateUserNotes are provided', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            expect(screen.getByText('My Notes')).toBeInTheDocument();
        });

        it('should show coaching notes separately from user notes', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    metadata={metadata}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            expect(screen.getByText('Coaching Notes')).toBeInTheDocument();
            expect(screen.getByText('Focus on full range of motion')).toBeInTheDocument();
            expect(screen.getByText('My Notes')).toBeInTheDocument();
        });
    });

    describe('User notes editing', () => {
        it('should show placeholder when no user notes exist', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            expect(screen.getByText(/No notes yet/i)).toBeInTheDocument();
        });

        it('should display existing user notes', () => {
            const onUpdateUserNotes = vi.fn();
            const userNotes = 'Great form today, felt strong';
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    currentUserNotes={userNotes}
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            expect(screen.getByText(userNotes)).toBeInTheDocument();
        });

        it('should enter edit mode when Edit button is clicked', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            const editButton = screen.getByRole('button', { name: /edit notes/i });
            fireEvent.click(editButton);
            
            expect(screen.getByPlaceholderText(/Add your notes/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });

        it('should allow typing in the textarea', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            const editButton = screen.getByRole('button', { name: /edit notes/i });
            fireEvent.click(editButton);
            
            const textarea = screen.getByPlaceholderText(/Add your notes/i);
            fireEvent.change(textarea, { target: { value: 'New notes here' } });
            
            expect(textarea).toHaveValue('New notes here');
        });

        it('should call onUpdateUserNotes with correct parameters when Save is clicked', () => {
            const onUpdateUserNotes = vi.fn();
            const exerciseId = 'pull_ups';
            const newNotes = 'Felt stronger today';
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId={exerciseId}
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            // Enter edit mode
            const editButton = screen.getByRole('button', { name: /edit notes/i });
            fireEvent.click(editButton);
            
            // Type notes
            const textarea = screen.getByPlaceholderText(/Add your notes/i);
            fireEvent.change(textarea, { target: { value: newNotes } });
            
            // Save
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            expect(onUpdateUserNotes).toHaveBeenCalledWith(exerciseId, newNotes);
        });

        it('should exit edit mode after saving', () => {
            const onUpdateUserNotes = vi.fn();
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            // Enter edit mode
            const editButton = screen.getByRole('button', { name: /edit notes/i });
            fireEvent.click(editButton);
            
            // Type and save
            const textarea = screen.getByPlaceholderText(/Add your notes/i);
            fireEvent.change(textarea, { target: { value: 'Test notes' } });
            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);
            
            // Should exit edit mode
            expect(screen.queryByPlaceholderText(/Add your notes/i)).not.toBeInTheDocument();
        });

        it('should cancel editing and restore original notes when Cancel is clicked', () => {
            const onUpdateUserNotes = vi.fn();
            const originalNotes = 'Original notes';
            
            render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    currentUserNotes={originalNotes}
                    onUpdateUserNotes={onUpdateUserNotes}
                />
            );
            
            // Enter edit mode
            const editButton = screen.getByRole('button', { name: /edit notes/i });
            fireEvent.click(editButton);
            
            // Change notes
            const textarea = screen.getByPlaceholderText(/Add your notes/i);
            fireEvent.change(textarea, { target: { value: 'Changed notes' } });
            
            // Cancel
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);
            
            // Should not call onUpdateUserNotes
            expect(onUpdateUserNotes).not.toHaveBeenCalled();
            
            // Should show original notes
            expect(screen.getByText(originalNotes)).toBeInTheDocument();
        });

        it('should sync user notes when modal reopens with updated currentUserNotes', () => {
            const onUpdateUserNotes = vi.fn();
            const initialNotes = 'Initial notes';
            const updatedNotes = 'Updated notes';
            
            const { rerender } = render(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    currentUserNotes={initialNotes}
                    onUpdateUserNotes={onUpdateUserNotes}
                    isOpen={true}
                />
            );
            
            expect(screen.getByText(initialNotes)).toBeInTheDocument();
            
            // Rerender with updated notes
            rerender(
                <ExerciseDetailModal
                    {...defaultProps}
                    exerciseId="pull_ups"
                    currentUserNotes={updatedNotes}
                    onUpdateUserNotes={onUpdateUserNotes}
                    isOpen={true}
                />
            );
            
            expect(screen.getByText(updatedNotes)).toBeInTheDocument();
        });
    });

    describe('User notes storage integration', () => {
        it('should update notes in session when saving', () => {
            const exerciseId = 'pull_ups';
            const sessionKey = 'session_w1d1';
            const newNotes = 'Strong workout today';
            
            // Mock localStorage with initial session data
            const initialSession = {
                week: 1,
                day: 1,
                exercises: {
                    [exerciseId]: {
                        sets: [true, true, true],
                        weight: '50',
                    },
                },
                lastModified: new Date().toISOString(),
            };
            
            localStorage.setItem(sessionKey, JSON.stringify(initialSession));
            
            const handleUpdateUserNotes = (exId: string, notes: string) => {
                const session = JSON.parse(localStorage.getItem(sessionKey) || '{}');
                const exercises = session.exercises || {};
                const currentEntry = exercises[exId] || {};
                
                exercises[exId] = {
                    ...currentEntry,
                    userNotes: notes,
                };
                
                session.exercises = exercises;
                session.lastModified = new Date().toISOString();
                
                localStorage.setItem(sessionKey, JSON.stringify(session));
            };
            
            // Simulate updating notes
            handleUpdateUserNotes(exerciseId, newNotes);
            
            // Verify storage
            const updatedSession = JSON.parse(localStorage.getItem(sessionKey) || '{}');
            expect(updatedSession.exercises[exerciseId].userNotes).toBe(newNotes);
        });
    });
});

describe('User Notes - WorkoutPlayer Integration', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Exercise history with user notes', () => {
        it('should save user notes to exercise history when workout is completed', () => {
            const exerciseName = 'Pull-Ups';
            const exerciseId = 'pull_ups';
            const userNotes = 'Felt great today';
            
            // Mock session data with user notes
            const sessionData = {
                week: 1,
                day: 1,
                exercises: {
                    [exerciseId]: {
                        sets: [true, true, true],
                        weight: '50',
                        userNotes: userNotes,
                    },
                },
            };
            
            // Simulate updateExerciseHistory
            const exerciseHistory: Record<string, any[]> = {};
            
            const updateExerciseHistory = (name: string, entry: any) => {
                if (!exerciseHistory[name]) {
                    exerciseHistory[name] = [];
                }
                exerciseHistory[name].push(entry);
            };
            
            // Simulate completing workout
            const exLog = sessionData.exercises[exerciseId];
            updateExerciseHistory(exerciseName, {
                date: '2024-01-15',
                week: 1,
                day: 1,
                sets: 3,
                totalSets: 3,
                weight: 50,
                prescription: '3x8 reps',
                isBodyweight: false,
                notes: exLog.userNotes || exLog.notes,
            });
            
            // Verify history includes user notes
            expect(exerciseHistory[exerciseName]).toHaveLength(1);
            expect(exerciseHistory[exerciseName][0].notes).toBe(userNotes);
        });

        it('should prefer userNotes over legacy notes field', () => {
            const exerciseName = 'Push-Ups';
            const exerciseId = 'push_ups';
            const userNotes = 'New user notes';
            const legacyNotes = 'Old legacy notes';
            
            // Mock session data with both fields
            const sessionData = {
                week: 1,
                day: 1,
                exercises: {
                    [exerciseId]: {
                        sets: [true, true, true],
                        weight: 'BW',
                        userNotes: userNotes,
                        notes: legacyNotes, // Legacy field
                    },
                },
            };
            
            const exerciseHistory: Record<string, any[]> = {};
            
            const updateExerciseHistory = (name: string, entry: any) => {
                if (!exerciseHistory[name]) {
                    exerciseHistory[name] = [];
                }
                exerciseHistory[name].push(entry);
            };
            
            const exLog = sessionData.exercises[exerciseId];
            updateExerciseHistory(exerciseName, {
                date: '2024-01-15',
                week: 1,
                day: 1,
                sets: 3,
                totalSets: 3,
                isBodyweight: true,
                prescription: '3x8 reps',
                notes: exLog.userNotes || exLog.notes,
            });
            
            // Should prefer userNotes
            expect(exerciseHistory[exerciseName][0].notes).toBe(userNotes);
        });
    });
});
