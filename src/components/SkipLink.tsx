import React from 'react';

export interface SkipLinkProps {
    /** Target element ID to skip to */
    targetId?: string;
    /** Custom label text */
    label?: string;
}

/**
 * SkipLink - Accessibility component for keyboard navigation
 * 
 * Allows keyboard users to skip directly to the main content,
 * bypassing navigation elements. Hidden by default, visible on focus.
 * 
 * @example
 * <SkipLink targetId="main-content" label="Skip to content" />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
    targetId = 'main-content',
    label = 'Skip to main content',
}) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
            // Remove tabindex after focus to maintain natural tab order
            setTimeout(() => target.removeAttribute('tabindex'), 100);
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className="skip-link"
            aria-label={label}
        >
            {label}
        </a>
    );
};

export default SkipLink;
