import React from 'react';
import { ChevronLeft, ChevronRight } from '../icons';

/**
 * Swipe navigation indicator component
 * Shows visual feedback during swipe gestures
 *
 * @param {Object} props
 * @param {string} props.direction - Current swipe direction ('left', 'right', or null)
 * @param {number} props.progress - Swipe progress (0 to 1)
 * @param {string} props.leftLabel - Label for left swipe action
 * @param {string} props.rightLabel - Label for right swipe action
 */
export const SwipeIndicator = ({ direction, progress, leftLabel, rightLabel }) => {
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
