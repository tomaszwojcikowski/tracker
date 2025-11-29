/**
 * Gesture Hint Component
 *
 * Shows animated hints for swipe gestures on first use.
 * Persists shown state to localStorage.
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

export interface GestureHintProps {
    /** Type of gesture to hint */
    type: 'swipe-left' | 'swipe-right' | 'swipe-horizontal';
    /** Storage key for tracking if hint was shown */
    storageKey: string;
    /** Text to display with the hint */
    message?: string;
    /** Callback when hint is dismissed */
    onDismiss?: () => void;
    /** Force show the hint (ignores storage) */
    forceShow?: boolean;
}

const ANIMATION_DURATION = 3000; // Auto-dismiss after 3 seconds

/**
 * Gesture Hint - Animated swipe gesture tutorial overlay
 */
export const GestureHint: React.FC<GestureHintProps> = ({
    type,
    storageKey,
    message,
    onDismiss,
    forceShow = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        // Check if hint was already shown
        const wasShown = safeGetJSON<boolean>(`gesture_hint_${storageKey}`, false);

        if (forceShow || !wasShown) {
            setIsVisible(true);

            // Mark as shown
            if (!forceShow) {
                safeSetJSON(`gesture_hint_${storageKey}`, true);
            }

            // Auto-dismiss after animation
            const timer = setTimeout(() => {
                handleDismiss();
            }, ANIMATION_DURATION);

            return () => clearTimeout(timer);
        }
    }, [storageKey, forceShow]);

    const handleDismiss = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss?.();
        }, 200);
    };

    if (!isVisible) return null;

    const defaultMessage = type === 'swipe-left'
        ? 'Swipe left to go forward'
        : type === 'swipe-right'
            ? 'Swipe right to go back'
            : 'Swipe to navigate';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleDismiss}
            role="dialog"
            aria-label="Gesture tutorial"
        >
            <div className="flex flex-col items-center gap-6 p-8">
                {/* Animated hand with swipe gesture */}
                <div className="relative h-24 w-48 flex items-center justify-center">
                    {/* Swipe trail effect */}
                    <div
                        className={`absolute inset-0 flex items-center ${
                            type === 'swipe-left' ? 'justify-end' : type === 'swipe-right' ? 'justify-start' : 'justify-center'
                        }`}
                    >
                        <div
                            className={`h-1 bg-gradient-to-r from-transparent via-sys-accent to-transparent rounded-full ${
                                type === 'swipe-horizontal' ? 'w-32' : 'w-24'
                            } animate-pulse`}
                        />
                    </div>

                    {/* Hand icon with animation */}
                    <div
                        className={`relative flex items-center gap-2 ${
                            type === 'swipe-right'
                                ? 'animate-[swipeRight_1.5s_ease-in-out_infinite]'
                                : type === 'swipe-left'
                                    ? 'animate-[swipeLeft_1.5s_ease-in-out_infinite]'
                                    : 'animate-[swipeHorizontal_2s_ease-in-out_infinite]'
                        }`}
                    >
                        {type !== 'swipe-left' && (
                            <ChevronLeft size={24} className="text-sys-accent opacity-60" />
                        )}
                        <div className="h-14 w-14 rounded-full bg-sys-accent/20 border-2 border-sys-accent flex items-center justify-center">
                            <Hand size={28} className="text-sys-accent" />
                        </div>
                        {type !== 'swipe-right' && (
                            <ChevronRight size={24} className="text-sys-accent opacity-60" />
                        )}
                    </div>
                </div>

                {/* Message */}
                <p className="text-white text-center text-lg font-medium max-w-xs">
                    {message || defaultMessage}
                </p>

                {/* Tap to dismiss hint */}
                <p className="text-sys-onSurfaceVar text-sm">
                    Tap anywhere to dismiss
                </p>
            </div>
        </div>
    );
};

/**
 * Hook to check if a gesture hint should be shown
 */
export const useGestureHint = (storageKey: string): {
    shouldShow: boolean;
    markAsShown: () => void;
    reset: () => void;
} => {
    const [shouldShow, setShouldShow] = useState(() => {
        return !safeGetJSON<boolean>(`gesture_hint_${storageKey}`, false);
    });

    const markAsShown = () => {
        safeSetJSON(`gesture_hint_${storageKey}`, true);
        setShouldShow(false);
    };

    const reset = () => {
        safeSetJSON(`gesture_hint_${storageKey}`, false);
        setShouldShow(true);
    };

    return { shouldShow, markAsShown, reset };
};

export default GestureHint;
