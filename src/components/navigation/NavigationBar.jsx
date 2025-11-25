import React from 'react';
import { useHaptic } from '../../hooks';

/**
 * NavigationBar - Bottom navigation component
 * 
 * Provides tab-based navigation with haptic feedback and accessibility support.
 * 
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Callback when tab changes
 */
export const NavigationBar = ({ activeTab, onTabChange }) => {
    const haptic = useHaptic();
    
    const navItems = [
        { id: 'train', icon: 'dumbbell', label: 'Train' },
        { id: 'library', icon: 'book-open', label: 'Library' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'coach', icon: 'brain', label: 'Coach' },
        { id: 'profile', icon: 'settings', label: 'Settings' },
    ];

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 bg-sys-black border-t border-white/10 z-50 safe-pb min-h-[88px] flex items-center justify-around px-2"
            role="navigation"
            aria-label="Main navigation"
        >
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button 
                        key={item.id} 
                        onClick={() => { haptic.tick(); onTabChange(item.id); }} 
                        className="flex flex-col items-center gap-1 w-full py-3 min-h-[56px] min-w-[48px] active:opacity-70 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sys-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sys-black rounded-xl"
                        aria-label={`${item.label} tab`}
                        aria-current={isActive ? 'page' : undefined}
                        aria-selected={isActive}
                        role="tab"
                    >
                        <div 
                            className={`w-16 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                isActive 
                                    ? 'bg-sys-surfaceHigh scale-110 shadow-[0_0_20px_rgba(14,165,233,0.4)]' 
                                    : 'transparent scale-100'
                            }`}
                        >
                            <i 
                                data-lucide={item.icon} 
                                width={isActive ? "28" : "24"} 
                                className={`transition-all duration-300 ${
                                    isActive 
                                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                                        : 'text-sys-onSurfaceVar'
                                }`}
                                aria-hidden="true"
                            />
                        </div>
                        <span 
                            className={`text-xs font-semibold transition-all duration-300 ${
                                isActive ? 'text-white' : 'text-sys-onSurfaceVar'
                            }`}
                        >
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default NavigationBar;
