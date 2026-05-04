import React, { useState, useCallback } from 'react';
import { Dumbbell, Calendar, TrendingUp, Cloud, ChevronRight, X } from '../icons';

/**
 * Onboarding step definition
 */
interface OnboardingStep {
    title: string;
    description: string;
    icon: React.ReactNode;
}

/**
 * Available onboarding steps
 */
const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        title: 'Welcome to Tracker',
        description: 'Your personal workout companion for progressive strength training.',
        icon: <Dumbbell size={48} className="text-sys-primary" />,
    },
    {
        title: '21-Week Program',
        description: 'Follow a structured training plan with 4 workout days per week. Track sets and weight with ease.',
        icon: <Calendar size={48} className="text-sys-primary" />,
    },
    {
        title: 'Track Your Progress',
        description: 'View detailed exercise history, personal records, and estimated 1RM calculations.',
        icon: <TrendingUp size={48} className="text-sys-primary" />,
    },
    {
        title: 'Sync Across Devices',
        description: 'Sign in with Google to backup your data and access it anywhere. Optional but recommended.',
        icon: <Cloud size={48} className="text-sys-primary" />,
    },
];

const STORAGE_KEY = 'tracker_onboarding_completed';

export interface OnboardingProps {
    onComplete: () => void;
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Mark onboarding as completed
 */
export function markOnboardingComplete(): void {
    try {
        localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
        // Ignore storage errors
    }
}

/**
 * Reset onboarding state (for testing)
 */
export function resetOnboarding(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore storage errors
    }
}

/**
 * Onboarding flow component for first-time users
 * Shows a series of steps explaining the app's features
 */
export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = ONBOARDING_STEPS.length;
    const isLastStep = currentStep === totalSteps - 1;
    const step = ONBOARDING_STEPS[currentStep];

    const handleNext = useCallback(() => {
        if (isLastStep) {
            markOnboardingComplete();
            onComplete();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    }, [isLastStep, onComplete]);

    const handleSkip = useCallback(() => {
        markOnboardingComplete();
        onComplete();
    }, [onComplete]);

    const handleDotClick = useCallback((index: number) => {
        setCurrentStep(index);
    }, []);

    return (
        <div
            className="fixed inset-0 modal-onboarding z-[60] flex flex-col safe-pt safe-pb"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
        >
            {/* Skip button */}
            <div className="flex justify-end p-4">
                <button
                    onClick={handleSkip}
                    className="flex items-center gap-1 text-sm text-sys-onSurfaceVar hover:text-sys-onSurface transition-colors px-3 py-2 rounded-lg"
                    aria-label="Skip onboarding"
                >
                    Skip
                    <X size={16} />
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                {/* Icon with animated entrance - decorative, hidden from screen readers */}
                <div
                    className="h-28 w-28 rounded-md bg-sys-surfaceContainerLow border border-sys-outlineVariant flex items-center justify-center mb-8 animate-fade-in"
                    key={currentStep}
                    aria-hidden="true"
                >
                    {step.icon}
                </div>

                {/* Title and description with animated entrance */}
                <div className="animate-fade-in" key={`text-${currentStep}`}>
                    <h2
                        id="onboarding-title"
                        className="text-2xl font-bold text-sys-onSurface mb-4"
                    >
                        {step.title}
                    </h2>
                    <p className="text-sys-onSurfaceVar text-base leading-relaxed max-w-xs mx-auto">
                        {step.description}
                    </p>
                </div>
            </div>

            {/* Progress dots - using buttons with aria-current for step indication */}
            <div className="flex justify-center gap-2 pb-8" role="group" aria-label="Onboarding progress">
                {ONBOARDING_STEPS.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`h-2 rounded-sm transition-all duration-300 ${
                            index === currentStep
                                ? 'w-8 bg-sys-onSurface'
                                : 'w-2 bg-sys-surfaceContainerHigh hover:bg-sys-onSurfaceVariant'
                        }`}
                        aria-current={index === currentStep ? 'step' : undefined}
                        aria-label={`Go to step ${index + 1} of ${totalSteps}${index === currentStep ? ' (current)' : ''}`}
                    />
                ))}
            </div>

            {/* Action button */}
            <div className="px-6 pb-6">
                <button
                    onClick={handleNext}
                    className="w-full h-14 rounded-md bg-sys-primary text-sys-onPrimary font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
                    aria-label={isLastStep ? 'Get Started' : 'Next step'}
                >
                    {isLastStep ? 'Get Started' : 'Next'}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};
