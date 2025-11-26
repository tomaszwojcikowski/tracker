import React from 'react';
import { ChevronLeft, ChevronRight } from '../icons';

export interface SwipeIndicatorProps {
    direction: 'left' | 'right' | null;
    progress: number;
    leftLabel?: string | null;
    rightLabel?: string | null;
}

/**
 * Swipe navigation indicator component
 * Shows visual feedback during swipe gestures
 */
export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ direction, progress, leftLabel, rightLabel }) => {
    if (!direction || progress < 0.1) return null;

    const opacity = Math.min(progress * 2, 1);
    const scale = 0.8 + progress * 0.2;

    return (
        <>
            {/* Left indicator (next) */}
            {direction === 'left' && (
                <div
                    className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-sys-accent/90 backdrop-blur-sm shadow-lg transition-transform"
                    style={{
                        opacity,
                        transform: `translateY(-50%) scale(${scale})`,
                    }}
                >
                    <span className="text-white font-semibold text-sm">{leftLabel || 'Next'}</span>
                    <ChevronRight size={20} className="text-white" />
                </div>
            )}

            {/* Right indicator (previous) */}
            {direction === 'right' && (
                <div
                    className="fixed left-4 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-sys-accent/90 backdrop-blur-sm shadow-lg transition-transform"
                    style={{
                        opacity,
                        transform: `translateY(-50%) scale(${scale})`,
                    }}
                >
                    <ChevronLeft size={20} className="text-white" />
                    <span className="text-white font-semibold text-sm">{rightLabel || 'Previous'}</span>
                </div>
            )}
        </>
    );
};

export default SwipeIndicator;
