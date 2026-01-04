/**
 * Divider Component
 *
 * Material Design 3 divider for visual separation of content.
 * Supports full-width and inset variants.
 */

import React from 'react';

export interface DividerProps {
    /** Divider variant: 'full-width' | 'inset' | 'middle' */
    variant?: 'full-width' | 'inset' | 'middle';
    /** Custom margin/spacing */
    className?: string;
    /** Optional label text for dividers */
    label?: string;
}

/**
 * MD3 Divider Component
 *
 * Specs:
 * - Height: 1px
 * - Color: outline variant
 * - Full-width: spans entire width
 * - Inset: leaves margin on both sides (16dp on mobile, 72dp on desktop)
 * - Middle: insets on both sides equally
 */
export const Divider: React.FC<DividerProps> = ({
    variant = 'full-width',
    className = '',
    label,
}) => {
    if (label) {
        return (
            <div className={`divider-container divider-${variant} ${className}`}>
                <div className="divider-line" />
                <span className="divider-label">{label}</span>
                <div className="divider-line" />
            </div>
        );
    }

    return <div className={`divider divider-${variant} ${className}`} />;
};

export default Divider;
