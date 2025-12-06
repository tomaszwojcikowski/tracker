/**
 * SetCompletionAnimation Component
 *
 * Micro-animation wrapper for set completion visual feedback.
 * Shows ripple effect and checkmark animation on set completion.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface SetCompletionAnimationProps {
    /** Whether the set is completed */
    isCompleted: boolean;
    /** Whether all sets are complete */
    allComplete?: boolean;
    /** Set number (1-based) */
    setNumber: number;
    /** Click handler */
    onClick: () => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Animated set button with ripple and checkmark effects
 */
export const SetCompletionAnimation: React.FC<SetCompletionAnimationProps> = ({
    isCompleted,
    allComplete = false,
    setNumber,
    onClick,
    className = '',
}) => {
    const [showRipple, setShowRipple] = useState(false);
    const [wasCompleted, setWasCompleted] = useState(isCompleted);

    // Detect transition from incomplete to complete
    useEffect(() => {
        if (isCompleted && !wasCompleted) {
            setShowRipple(true);
            const timer = setTimeout(() => setShowRipple(false), 400);
            return () => clearTimeout(timer);
        }
        setWasCompleted(isCompleted);
    }, [isCompleted, wasCompleted]);

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.9 }}
            className={`relative set-button h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center text-sm font-bold transition-all overflow-hidden ${
                isCompleted
                    ? allComplete
                        ? 'bg-sys-success text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-sys-accent text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'bg-sys-surfaceHigh text-sys-onSurfaceVar hover:bg-white/10'
            } ${className}`}
            aria-label={`Set ${setNumber}${isCompleted ? ' completed' : ''}`}
        >
            {/* Ripple effect */}
            <AnimatePresence>
                {showRipple && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`absolute inset-0 rounded-xl ${
                            allComplete ? 'bg-sys-success' : 'bg-sys-accent'
                        }`}
                    />
                )}
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">
                {isCompleted ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 25,
                        }}
                    >
                        <Check size={18} strokeWidth={3} />
                    </motion.div>
                ) : (
                    <motion.span
                        key="number"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {setNumber}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

/**
 * Weight input with saved animation feedback
 */
export interface WeightSavedAnimationProps {
    /** Whether to show the saved animation */
    showSaved: boolean;
    /** Children to wrap */
    children: React.ReactNode;
}

export const WeightSavedAnimation: React.FC<WeightSavedAnimationProps> = ({
    showSaved,
    children,
}) => {
    return (
        <motion.div
            animate={showSaved ? {
                scale: [1, 1.02, 1],
                boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                    '0 0 12px 4px rgba(34, 197, 94, 0.3)',
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                ],
            } : {}}
            transition={{ duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
};

/**
 * PR celebration animation with confetti-like effect
 */
export interface PRCelebrationProps {
    /** Whether to show the PR celebration */
    show: boolean;
    /** Children to wrap */
    children: React.ReactNode;
}

export const PRCelebration: React.FC<PRCelebrationProps> = ({
    show,
    children,
}) => {
    return (
        <motion.div
            animate={show ? {
                scale: [1, 1.15, 1.1, 1.12, 1.08, 1],
                rotate: [0, -3, 3, -2, 1, 0],
            } : {}}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
        >
            {children}

            {/* Star particles */}
            <AnimatePresence>
                {show && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    scale: 0,
                                    x: 0,
                                    y: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    scale: [0, 1, 0],
                                    x: Math.cos(i * 60 * Math.PI / 180) * 40,
                                    y: Math.sin(i * 60 * Math.PI / 180) * 40,
                                    opacity: [1, 1, 0],
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                                className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1"
                            >
                                <div className="w-full h-full bg-yellow-400 rounded-full" />
                            </motion.div>
                        ))}
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * Timer warning animation - pulsing effect when timer is low
 */
export interface TimerWarningAnimationProps {
    /** Seconds remaining */
    seconds: number;
    /** Warning threshold in seconds */
    threshold?: number;
    /** Children to wrap */
    children: React.ReactNode;
}

export const TimerWarningAnimation: React.FC<TimerWarningAnimationProps> = ({
    seconds,
    threshold = 10,
    children,
}) => {
    const isWarning = seconds > 0 && seconds <= threshold;

    return (
        <motion.div
            animate={isWarning ? {
                scale: [1, 1.05, 1],
                opacity: [1, 0.8, 1],
            } : {}}
            transition={{
                duration: 0.5,
                repeat: isWarning ? Infinity : 0,
                repeatType: 'loop',
            }}
        >
            {children}
        </motion.div>
    );
};

export default SetCompletionAnimation;
