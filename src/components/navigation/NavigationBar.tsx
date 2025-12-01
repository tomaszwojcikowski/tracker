import React, { useCallback, useRef } from 'react';
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
 * Creates a ripple effect at the touch/click position
 */
const createRipple = (event: React.MouseEvent | React.TouchEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 2;

    let x: number, y: number;
    if ('touches' in event) {
        x = event.touches[0].clientX - rect.left - size / 2;
        y = event.touches[0].clientY - rect.top - size / 2;
    } else {
        x = event.clientX - rect.left - size / 2;
        y = event.clientY - rect.top - size / 2;
    }

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: var(--state-primary-pressed);
        transform: scale(0);
        animation: ripple 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    `;

    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);
};

/**
 * NavigationBar - Material Design 3 Bottom Navigation
 *
 * Implements MD3 navigation bar spec:
 * - 80dp height
 * - 64x32dp active indicator pill
 * - Icon above label layout
 * - Ripple effect on touch
 * - Haptic feedback
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
    const haptic = useHaptic();
    const navRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map());

    const navItems: NavItem[] = [
        { id: 'train', icon: 'dumbbell', label: 'Train' },
        { id: 'library', icon: 'book-open', label: 'Library' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'profile', icon: 'settings', label: 'Settings' },
    ];

    const handleTabClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>, tabId: TabId) => {
            const button = navRefs.current.get(tabId);
            if (button) {
                createRipple(event, button);
            }
            haptic.tick();
            onTabChange(tabId);
        },
        [haptic, onTabChange]
    );

    const setRef = useCallback((tabId: TabId) => (el: HTMLButtonElement | null) => {
        if (el) {
            navRefs.current.set(tabId, el);
        } else {
            navRefs.current.delete(tabId);
        }
    }, []);

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-sys-black border-t border-white/10 z-50 safe-pb surface-elevation-2"
            style={{ minHeight: '80px', height: '80px' }}
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around h-full px-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            ref={setRef(item.id)}
                            onClick={(e) => handleTabClick(e, item.id)}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] max-w-[80px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-accent focus-visible:ring-inset rounded-xl transition-colors"
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
