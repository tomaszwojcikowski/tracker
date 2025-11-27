import React from 'react';

export interface TabContentProps {
    children: React.ReactNode;
    activeTab: string;
    id?: string;
}

/**
 * TabContent - Animated wrapper for tab content transitions
 *
 * Uses CSS animation to smoothly transition content when activeTab changes.
 * The key prop triggers re-mount and animation on tab change.
 */
export const TabContent: React.FC<TabContentProps> = ({ children, activeTab, id }) => {
    return (
        <main
            id={id}
            key={activeTab}
            className="animate-tab-transition"
            role="tabpanel"
            aria-label={`${activeTab} content`}
        >
            {children}
        </main>
    );
};

export default TabContent;
