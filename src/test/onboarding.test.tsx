import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding, hasCompletedOnboarding, markOnboardingComplete, resetOnboarding } from '../components/Onboarding';

describe('Onboarding Component', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('hasCompletedOnboarding', () => {
        it('should return false when onboarding not completed', () => {
            expect(hasCompletedOnboarding()).toBe(false);
        });

        it('should return true when onboarding is completed', () => {
            markOnboardingComplete();
            expect(hasCompletedOnboarding()).toBe(true);
        });

        it('should handle storage errors gracefully', () => {
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            expect(hasCompletedOnboarding()).toBe(false);

            localStorage.getItem = originalGetItem;
        });
    });

    describe('markOnboardingComplete', () => {
        it('should set onboarding completed flag in localStorage', () => {
            markOnboardingComplete();
            expect(localStorage.getItem('tracker_onboarding_completed')).toBe('true');
        });

        it('should handle storage errors gracefully', () => {
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            // Should not throw
            expect(() => markOnboardingComplete()).not.toThrow();

            localStorage.setItem = originalSetItem;
        });
    });

    describe('resetOnboarding', () => {
        it('should remove onboarding completed flag from localStorage', () => {
            markOnboardingComplete();
            expect(hasCompletedOnboarding()).toBe(true);

            resetOnboarding();
            expect(hasCompletedOnboarding()).toBe(false);
        });
    });

    describe('Onboarding UI', () => {
        it('should render first step on mount', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            expect(screen.getByText('Welcome to Tracker')).toBeInTheDocument();
            expect(screen.getByText(/Your personal workout companion/)).toBeInTheDocument();
        });

        it('should show all step indicators', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Should have 4 step indicator buttons
            const buttons = screen.getAllByRole('button', { name: /go to step/i });
            expect(buttons).toHaveLength(4);
        });

        it('should navigate to next step when Next is clicked', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Click Next button
            const nextButton = screen.getByRole('button', { name: /next step/i });
            fireEvent.click(nextButton);

            // Should show second step
            expect(screen.getByText('21-Week Program')).toBeInTheDocument();
        });

        it('should navigate through all steps', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Navigate to step 2
            fireEvent.click(screen.getByRole('button', { name: /next step/i }));
            expect(screen.getByText('21-Week Program')).toBeInTheDocument();

            // Navigate to step 3
            fireEvent.click(screen.getByRole('button', { name: /next step/i }));
            expect(screen.getByText('Track Your Progress')).toBeInTheDocument();

            // Navigate to step 4
            fireEvent.click(screen.getByRole('button', { name: /next step/i }));
            expect(screen.getByText('Sync Across Devices')).toBeInTheDocument();
        });

        it('should show "Get Started" button on last step', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Navigate to last step
            for (let i = 0; i < 3; i++) {
                fireEvent.click(screen.getByRole('button', { name: /next step/i }));
            }

            expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
        });

        it('should call onComplete and mark as complete when Get Started is clicked', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Navigate to last step
            for (let i = 0; i < 3; i++) {
                fireEvent.click(screen.getByRole('button', { name: /next step/i }));
            }

            // Click Get Started
            fireEvent.click(screen.getByRole('button', { name: /get started/i }));

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(hasCompletedOnboarding()).toBe(true);
        });

        it('should allow skipping onboarding', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Click Skip button
            const skipButton = screen.getByRole('button', { name: /skip onboarding/i });
            fireEvent.click(skipButton);

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(hasCompletedOnboarding()).toBe(true);
        });

        it('should allow navigating to specific step by clicking indicator', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Click on step 3 indicator
            const stepButtons = screen.getAllByRole('button', { name: /go to step/i });
            fireEvent.click(stepButtons[2]);

            expect(screen.getByText('Track Your Progress')).toBeInTheDocument();
        });

        it('should have proper aria labels for accessibility', () => {
            const onComplete = vi.fn();
            render(<Onboarding onComplete={onComplete} />);

            // Check dialog role
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Check step indicators have aria-current
            const stepButtons = screen.getAllByRole('button', { name: /go to step/i });
            expect(stepButtons[0]).toHaveAttribute('aria-current', 'step');
            expect(stepButtons[1]).not.toHaveAttribute('aria-current');
        });
    });
});
