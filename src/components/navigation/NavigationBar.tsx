import React, { useCallback } from 'react';
import { useHaptic } from '../../hooks';
import type { TabId } from '../../types';

interface NavItem {
    id: TabId;
    icon: string;
    label: string;
}

export interface NavigationBarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

/**
 * NavigationBar - Material Design 3 Bottom Navigation
 *
 * Implements MD3 navigation bar spec:
 * - Min 80dp height (adaptable)
 * - 64x32dp active indicator pill
 * - Icon above label layout
 * - Native active state feedback
 * - Haptic feedback
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
    const haptic = useHaptic();

    const navItems: NavItem[] = [
        { id: 'train', icon: 'dumbbell', label: 'Train' },
        { id: 'library', icon: 'book-open', label: 'Library' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'profile', icon: 'settings', label: 'Settings' },
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
            className="fixed bottom-0 left-0 right-0 bg-sys-black border-t border-white/10 z-50 safe-pb surface-elevation-2 min-h-[80px]"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around h-full px-2 py-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] max-w-[80px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-accent focus-visible:ring-inset rounded-xl transition-all active:scale-95 active:bg-white/10"
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            aria-selected={isActive}
                            role="tab"
                        >
                            {/* Active indicator pill - MD3 spec: 64x32dp */}
                            <div
                                className={`relative flex items-center justify-center transition-all duration-200 ease-out ${
                                    isActive
                                        ? 'w-16 h-8 rounded-2xl bg-sys-accent/20'
                                        : 'w-12 h-8 rounded-2xl bg-transparent'
                                }`}
                            >
                                <i
                                    data-lucide={item.icon}
                                    style={{ width: 24, height: 24 }}
                                    className={`transition-colors duration-200 ${
                                        isActive
                                            ? 'text-sys-accent'
                                            : 'text-sys-onSurfaceVar'
                                    }`}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Label - always visible per MD3 */}
                            <span
                                className={`text-xs font-medium transition-colors duration-200 ${
                                    isActive ? 'text-sys-accent' : 'text-sys-onSurfaceVar'
                                }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default NavigationBar;
