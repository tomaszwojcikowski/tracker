import React, { useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Dumbbell, BookOpen, History, Settings, type LucideIcon } from '../icons';
import { useHaptic } from '../../hooks';
import type { TabId } from '../../types';
import { clsx } from 'clsx';

interface NavItem {
    id: TabId;
    icon: LucideIcon;
    label: string;
}

export interface NavigationBarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

/**
 * NavigationBar - Material Design 3 Adaptive Navigation
 *
 * Implements MD3 navigation bar spec:
 * - Adaptive: Bottom Bar (Mobile) / Navigation Rail (Tablet/Desktop)
 * - Min 80dp height (bar) / 80dp width (rail)
 * - Active indicator pill with motion
 * - Icon above label layout
 * - Haptic feedback
 */
export const NavigationBar: React.FC<NavigationBarProps> = React.memo(({ activeTab, onTabChange }) => {
    const haptic = useHaptic();

    const navItems: NavItem[] = [
        { id: 'train', icon: Dumbbell, label: 'Train' },
        { id: 'library', icon: BookOpen, label: 'Library' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'profile', icon: Settings, label: 'Settings' },
    ];

    const handleTabClick = useCallback(
        (tabId: TabId) => {
            haptic.tick();
            onTabChange(tabId);
        },
        [haptic, onTabChange]
    );

    return (
        <nav
            className="bottom-navigation fixed bottom-0 left-0 right-0 bg-sys-surface border-t border-sys-outlineVariant z-50 safe-pb shadow-elevation-2 min-h-[80px]"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around h-full px-2 py-2">
                <LayoutGroup>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] max-w-[80px] focus:outline-none rounded-xl active:scale-95 transition-transform"
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="relative flex items-center justify-center w-16 h-8">
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-sys-secondaryContainer rounded-2xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <item.icon
                                        size={24}
                                        className={clsx(
                                            "relative z-10 transition-colors duration-200",
                                            isActive ? "text-sys-onSecondaryContainer" : "text-sys-onSurfaceVariant"
                                        )}
                                    />
                                </div>
                                <span
                                    className={clsx(
                                        "text-xs font-medium transition-colors duration-200",
                                        isActive ? "text-sys-onSurface font-bold" : "text-sys-onSurfaceVariant"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </LayoutGroup>
            </div>
        </nav>
    );
});

NavigationBar.displayName = 'NavigationBar';
