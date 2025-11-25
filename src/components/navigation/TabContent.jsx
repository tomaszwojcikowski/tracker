import React from 'react';

/**
 * TabContent - Animated wrapper for tab content transitions
 * 
 * Uses CSS animation to smoothly transition content when activeTab changes.
 * The key prop triggers re-mount and animation on tab change.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Tab content to display
 * @param {string} props.activeTab - Current active tab for animation key
 */
export const TabContent = ({ children, activeTab }) => {
    return (
        <div 
            key={activeTab}
            className="animate-tab-transition"
            role="tabpanel"
            aria-label={`${activeTab} content`}
        >
            {children}
        </div>
    );
};

export default TabContent;
