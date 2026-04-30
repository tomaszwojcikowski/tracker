/**
 * BottomSheet Component
 *
 * Material Design 3 bottom sheet implementation with:
 * - Drag handle for visual affordance
 * - Backdrop scrim with blur
 * - Edge-to-edge slide-up animation
 * - Touch gesture support for dismiss
 * - Keyboard accessibility (Escape to close)
 * - Focus trap for modal behavior
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useFocusTrap } from '../hooks/useAccessibility';

export interface BottomSheetProps {
    /** Whether the bottom sheet is visible */
    isOpen: boolean;
    /** Callback when the sheet should close */
    onClose: () => void;
    /** Sheet content */
    children: React.ReactNode;
    /** Optional title for accessibility */
    ariaLabel?: string;
    /** Optional ID for aria-labelledby */
    ariaLabelledBy?: string;
    /** Maximum height as viewport percentage (default: 85) */
    maxHeight?: number;
    /** Whether to show the drag handle (default: true) */
    showHandle?: boolean;
    /** Custom class name for the sheet container */
    className?: string;
}

/**
 * BottomSheet - MD3 Modal Bottom Sheet
 *
 * Implements Material Design 3 bottom sheet pattern:
 * - 32dp drag handle centered at top
 * - Scrim backdrop (60% black with blur)
 * - Swipe-to-dismiss gesture
 * - 28dp top corner radius
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    ariaLabel,
    ariaLabelledBy,
    maxHeight = 85,
    showHandle = true,
    className = '',
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    // Focus trap so Tab / Shift+Tab cycle inside the sheet instead of escaping
    // to elements behind the scrim. Returns focus to the previously focused
    // element when the sheet closes.
    const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);
    const dragStartY = useRef<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus trap - focus the sheet when opened
    useEffect(() => {
        if (isOpen && sheetRef.current) {
            sheetRef.current.focus();
        }
    }, [isOpen]);

    // Wire both the local sheet ref (used for direct DOM access) and the
    // focus-trap ref returned by useFocusTrap to the same element.
    const setSheetRef = useCallback(
        (node: HTMLDivElement | null) => {
            sheetRef.current = node;
            (focusTrapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        },
        [focusTrapRef]
    );

    // Touch/drag handlers for swipe-to-dismiss
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (dragStartY.current === null) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStartY.current;

        // Only allow dragging down
        if (diff > 0) {
            setDragOffset(diff);
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);

        // If dragged more than 100px, close the sheet
        if (dragOffset > 100) {
            onClose();
        }

        setDragOffset(0);
        dragStartY.current = null;
    }, [dragOffset, onClose]);

    // Mouse drag handlers for desktop
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        dragStartY.current = e.clientY;
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (dragStartY.current === null || !isDragging) return;

        const diff = e.clientY - dragStartY.current;

        if (diff > 0) {
            setDragOffset(diff);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (dragOffset > 100) {
            onClose();
        }

        setIsDragging(false);
        setDragOffset(0);
        dragStartY.current = null;
    }, [dragOffset, onClose]);

    if (!isOpen) return null;

    const sheetStyle: React.CSSProperties = {
        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: `${maxHeight}vh`,
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={isDragging ? handleMouseUp : undefined}
            onMouseLeave={isDragging ? handleMouseUp : undefined}
        >
            {/* Scrim/Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet Container */}
            <div
                ref={setSheetRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                tabIndex={-1}
                className={`relative w-full max-w-lg modal-bottom-sheet border border-b-0 border-sys-outlineVariant rounded-t-md flex flex-col overflow-hidden animate-slide-up ${className}`}
                style={sheetStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle Area */}
                {showHandle && (
                    <div
                        className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                    >
                        {/* MD3 Drag Handle: 32dp width, 4dp height */}
                        <div className="w-10 h-1 rounded-full bg-sys-onSurfaceVar/30" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {children}
                </div>
            </div>
        </div>
    );
};
