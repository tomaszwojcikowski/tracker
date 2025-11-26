import React from 'react';
import { X, Plus, Clock } from '../icons';

/**
 * Floating timer component that stays visible during workout
 * Displays rest timer in a compact, always-visible format
 *
 * @param {Object} props
 * @param {number} props.seconds - Timer seconds remaining
 * @param {boolean} props.active - Whether timer is active
 * @param {Function} props.onStop - Callback to stop timer
 * @param {Function} props.onAddTime - Callback to add 30 seconds
 */
export const FloatingTimer = ({ seconds, active, onStop, onAddTime }) => {
    if (!active || seconds <= 0) return null;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const isUrgent = seconds <= 10;

    return (
        <div
            className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all ${
                isUrgent
                    ? 'bg-sys-error/90 animate-pulse'
                    : 'bg-sys-surfaceHigh/90 border border-white/10'
            }`}
        >
            <Clock size={16} className={isUrgent ? 'text-white' : 'text-sys-accent'} />
            <span
                className={`font-mono font-bold text-lg min-w-[60px] ${
                    isUrgent ? 'text-white' : 'text-white'
                }`}
            >
                {minutes}:{secs < 10 ? '0' : ''}{secs}
            </span>
            <button
                onClick={onAddTime}
                className="h-7 px-2 rounded-full bg-white/10 hover:bg-white/20 text-sys-accent text-xs font-bold active:scale-90 transition-all"
                aria-label="Add 30 seconds"
            >
                +30s
            </button>
            <button
                onClick={onStop}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
                aria-label="Stop timer"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default FloatingTimer;
