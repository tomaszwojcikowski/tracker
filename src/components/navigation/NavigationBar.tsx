import React, { useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Dumbbell, BookOpen, History, Settings, LucideIcon } from 'lucide-react';
import { useHaptic, useMediaQuery } from '../../hooks';
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
export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
    const haptic = useHaptic();
    const isDesktop = useMediaQuery('(min-width: 800px)');

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

    if (isDesktop) {
        return (
            <nav
                className="fixed left-0 top-0 bottom-0 w-20 bg-sys-surface border-r border-sys-outlineVariant z-50 flex flex-col items-center py-8 gap-8"
                role="navigation"
                aria-label="Main navigation"
            >
                {/* Logo or Top Action */}
                <div className="w-12 h-12 rounded-xl bg-sys-primaryContainer text-sys-onPrimaryContainer flex items-center justify-center mb-4 shadow-sm">
                    <Dumbbell size={24} />
                </div>

                <div className="flex flex-col gap-4 w-full px-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className="group relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors hover:bg-sys-surfaceVariant/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-primary"
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className={clsx(
                                    "relative flex items-center justify-center w-14 h-8 rounded-2xl transition-all duration-300",
                                    isActive ? "bg-sys-secondaryContainer text-sys-onSecondaryContainer" : "text-sys-onSurfaceVariant group-hover:text-sys-onSurface"
                                )}>
                                    <item.icon size={24} />
                                </div>
                                <span className={clsx(
                                    "text-xs font-medium transition-colors",
                                    isActive ? "text-sys-onSurface" : "text-sys-onSurfaceVariant"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        );
    }

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-sys-surface border-t border-sys-outlineVariant z-50 safe-pb surface-elevation-2 min-h-[80px]"
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
                                        isActive ? "text-sys-onSurface" : "text-sys-onSurfaceVariant"
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
};

export default NavigationBar;
