/**
 * Lightweight Animations Utility
 * 
 * Provides CSS-based animations as a lightweight alternative to Framer Motion
 * for simple fade/slide transitions. Uses native CSS transitions for better
 * performance on mobile devices.
 */

import { prefersReducedMotion } from './performanceOptimizations';

/**
 * Animation presets for common use cases
 */
export const animationPresets = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideInRight: {
        initial: { opacity: 0, transform: 'translateX(20px)' },
        animate: { opacity: 1, transform: 'translateX(0)' },
        exit: { opacity: 0, transform: 'translateX(-20px)' },
    },
    slideInLeft: {
        initial: { opacity: 0, transform: 'translateX(-20px)' },
        animate: { opacity: 1, transform: 'translateX(0)' },
        exit: { opacity: 0, transform: 'translateX(20px)' },
    },
    slideUp: {
        initial: { opacity: 0, transform: 'translateY(10px)' },
        animate: { opacity: 1, transform: 'translateY(0)' },
        exit: { opacity: 0, transform: 'translateY(-10px)' },
    },
    scale: {
        initial: { opacity: 0, transform: 'scale(0.95)' },
        animate: { opacity: 1, transform: 'scale(1)' },
        exit: { opacity: 0, transform: 'scale(0.95)' },
    },
} as const;

export type AnimationPreset = keyof typeof animationPresets;

/**
 * Generate CSS classes for animations
 */
export function getAnimationClasses(
    preset: AnimationPreset,
    duration: number = 300
): {
    initial: string;
    animate: string;
    exit: string;
    style: React.CSSProperties;
} {
    const isReduced = prefersReducedMotion();
    const actualDuration = isReduced ? 0 : duration;
    
    const baseStyle: React.CSSProperties = {
        transitionProperty: 'opacity, transform',
        transitionDuration: `${actualDuration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    };

    return {
        initial: 'transition-opacity transition-transform',
        animate: 'transition-opacity transition-transform',
        exit: 'transition-opacity transition-transform',
        style: baseStyle,
    };
}

/**
 * Apply animation styles directly to an element
 */
export function applyAnimationStyle(
    element: HTMLElement,
    preset: AnimationPreset,
    phase: 'initial' | 'animate' | 'exit',
    duration: number = 300
): void {
    const animation = animationPresets[preset];
    const styles = animation[phase];
    
    if (prefersReducedMotion()) {
        // Skip animation, just apply final state
        if (phase === 'animate') {
            Object.assign(element.style, styles);
        }
        return;
    }

    element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    Object.assign(element.style, styles);
}

/**
 * Create a promise-based animation
 * Useful for sequential animations
 */
export function animateElement(
    element: HTMLElement,
    preset: AnimationPreset,
    duration: number = 300
): Promise<void> {
    return new Promise((resolve) => {
        if (prefersReducedMotion()) {
            resolve();
            return;
        }

        applyAnimationStyle(element, preset, 'initial', 0);
        
        // Use RAF to ensure initial state is rendered
        requestAnimationFrame(() => {
            applyAnimationStyle(element, preset, 'animate', duration);
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    });
}

/**
 * Stagger animations for a list of elements
 */
export function staggerAnimations(
    elements: HTMLElement[],
    preset: AnimationPreset,
    staggerDelay: number = 50,
    duration: number = 300
): Promise<void> {
    if (prefersReducedMotion()) {
        elements.forEach(el => applyAnimationStyle(el, preset, 'animate', 0));
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        elements.forEach((element, index) => {
            setTimeout(() => {
                animateElement(element, preset, duration);
                
                // Resolve when last animation starts
                if (index === elements.length - 1) {
                    setTimeout(resolve, duration);
                }
            }, index * staggerDelay);
        });
    });
}

/**
 * CSS animation keyframes (can be added to stylesheet)
 */
export const cssAnimationKeyframes = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInRight {
    from { 
        opacity: 0; 
        transform: translateX(20px); 
    }
    to { 
        opacity: 1; 
        transform: translateX(0); 
    }
}

@keyframes slideInLeft {
    from { 
        opacity: 0; 
        transform: translateX(-20px); 
    }
    to { 
        opacity: 1; 
        transform: translateX(0); 
    }
}

@keyframes slideUp {
    from { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

@keyframes scale {
    from { 
        opacity: 0; 
        transform: scale(0.95); 
    }
    to { 
        opacity: 1; 
        transform: scale(1); 
    }
}

/* Utility classes */
.animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-in-right {
    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-in-left {
    animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
    animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-scale {
    animation: scale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    .animate-fade-in,
    .animate-slide-in-right,
    .animate-slide-in-left,
    .animate-slide-up,
    .animate-scale {
        animation: none !important;
        transition: none !important;
    }
}
`;

/**
 * Hook-like function for managing animation state
 * Can be used with React useState
 */
export function useAnimationState(initiallyVisible: boolean = false) {
    return {
        isVisible: initiallyVisible,
        show: () => true,
        hide: () => false,
        toggle: (current: boolean) => !current,
    };
}

/**
 * Create intersection observer for scroll-triggered animations
 */
export function createScrollAnimationObserver(
    preset: AnimationPreset = 'fadeIn',
    options?: IntersectionObserverInit
): IntersectionObserver {
    return new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                animateElement(element, preset);
                // Optional: disconnect after animating once
                // observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
    });
}
