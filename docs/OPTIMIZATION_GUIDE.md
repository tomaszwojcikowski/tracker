# Performance Optimization Guide

This guide provides practical examples and best practices for using the performance optimization utilities in the tracker application.

## Quick Start

### 1. Lazy Load Components

Use lazy loading for heavy components that aren't needed immediately:

```typescript
import { lazy, Suspense } from 'react';
import { LoadingScreen } from './components/screens';

// Lazy load the component
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// Use with Suspense
function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 2. Memoize Components

Prevent unnecessary re-renders with React.memo:

```typescript
import React from 'react';

const ExerciseCard = React.memo(({ exercise, onUpdate }) => {
  return (
    <div className="exercise-card">
      {/* Component content */}
    </div>
  );
});

ExerciseCard.displayName = 'ExerciseCard';
```

### 3. Optimize Scroll Performance

Use passive event listeners and RAF throttling:

```typescript
import { useOptimizedScroll } from '@/hooks/useOptimizedScroll';

function MyComponent() {
  const { scrollY, scrollingDown, isAtTop, isAtBottom } = useOptimizedScroll();
  
  return (
    <div className={scrollingDown ? 'hide-header' : 'show-header'}>
      {/* Content */}
    </div>
  );
}
```

## Common Optimization Patterns

### Pattern 1: Lazy Render with Intersection Observer

Render components only when they become visible:

```typescript
import { LazyRender } from '@/utils/reactOptimizations';

function ExerciseList({ exercises }) {
  return (
    <div>
      {exercises.map(exercise => (
        <LazyRender
          key={exercise.id}
          rootMargin="100px"
          placeholder={<div className="h-20 bg-gray-800 animate-pulse" />}
        >
          <ExerciseCard exercise={exercise} />
        </LazyRender>
      ))}
    </div>
  );
}
```

### Pattern 2: Lightweight Animations

Use CSS-based animations instead of heavy libraries:

```typescript
import { animateElement, staggerAnimations } from '@/utils/lightweightAnimations';

async function showItems(elements: HTMLElement[]) {
  // Animate elements with stagger effect
  await staggerAnimations(elements, 'fadeIn', 50, 300);
}

// Or use CSS classes directly
<div className="animate-fade-in">
  Content appears with fade-in animation
</div>
```

### Pattern 3: Performance Monitoring

Track performance of critical operations:

```typescript
import { measurePerformance } from '@/utils/performanceOptimizations';

async function loadWorkoutData() {
  await measurePerformance('loadWorkoutData', async () => {
    const data = await fetchWorkoutData();
    processData(data);
  });
}
// Console output: ⏱️ loadWorkoutData: 123.45ms
```

### Pattern 4: Web Vitals Tracking

Monitor Core Web Vitals in production:

```typescript
import { initWebVitals } from '@/utils/webVitals';

// In your main.tsx or App.tsx
initWebVitals((metrics) => {
  // Send to analytics
  if (import.meta.env.PROD) {
    sendToAnalytics('web-vitals', metrics);
  }
});
```

### Pattern 5: Conditional Loading Based on Device

Disable expensive features on low-end devices:

```typescript
import { isLowEndDevice } from '@/utils/performanceOptimizations';

function MyComponent() {
  const enableAnimations = !isLowEndDevice();
  
  return (
    <div>
      {enableAnimations ? (
        <ComplexAnimation />
      ) : (
        <SimpleTransition />
      )}
    </div>
  );
}
```

## Performance Checklist for New Features

When adding new features, follow this checklist:

### Before Implementation
- [ ] Estimate bundle size impact
- [ ] Plan code splitting strategy
- [ ] Identify heavy dependencies
- [ ] Consider lazy loading

### During Implementation
- [ ] Use React.memo for expensive components
- [ ] Implement proper dependency arrays in hooks
- [ ] Use passive event listeners for touch/scroll events
- [ ] Throttle expensive operations with RAF
- [ ] Add loading states and skeletons

### After Implementation
- [ ] Run bundle analysis (`npx vite-bundle-visualizer`)
- [ ] Test on mid-range device (throttled)
- [ ] Measure Web Vitals
- [ ] Profile with React DevTools
- [ ] Test with slow 3G network

## Component Optimization Examples

### Example 1: Optimizing a List Component

**Before:**
```typescript
function ExerciseList({ exercises, onSelect }) {
  return (
    <div>
      {exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onSelect={() => onSelect(exercise.id)}
        />
      ))}
    </div>
  );
}
```

**After:**
```typescript
import React, { useCallback } from 'react';
import { LazyRender } from '@/utils/reactOptimizations';

const ExerciseCard = React.memo(({ exercise, onSelect }) => {
  // Component implementation
});

function ExerciseList({ exercises, onSelect }) {
  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <div>
      {exercises.map(exercise => (
        <LazyRender key={exercise.id} rootMargin="100px">
          <ExerciseCard
            exercise={exercise}
            onSelect={handleSelect}
          />
        </LazyRender>
      ))}
    </div>
  );
}
```

### Example 2: Optimizing Scroll Handler

**Before:**
```typescript
function MyComponent() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return <div>Scroll: {scrollY}</div>;
}
```

**After:**
```typescript
import { useOptimizedScroll } from '@/hooks/useOptimizedScroll';

function MyComponent() {
  const { scrollY } = useOptimizedScroll();
  
  return <div>Scroll: {scrollY}</div>;
}
```

### Example 3: Optimizing Animation

**Before:**
```typescript
import { motion } from 'framer-motion';

function MyComponent({ isVisible }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

**After:**
```typescript
function MyComponent({ isVisible }) {
  return (
    <div className={isVisible ? 'animate-fade-in' : 'opacity-0'}>
      Content
    </div>
  );
}
```

## Advanced Optimization Techniques

### 1. Component Splitting

Split large components into smaller, focused components:

```typescript
// Before: One large component (1660 lines)
function WorkoutPlayer() {
  // Huge component implementation
}

// After: Split into smaller components
function WorkoutPlayer() {
  return (
    <>
      <WorkoutHeader />
      <ExerciseList />
      <WorkoutControls />
      <WorkoutSummary />
    </>
  );
}
```

### 2. State Colocation

Move state closer to where it's used:

```typescript
// Before: State at top level
function App() {
  const [exerciseFilter, setExerciseFilter] = useState('');
  // ... lots of other state
  
  return (
    <>
      <Header />
      <ExerciseLibrary filter={exerciseFilter} />
    </>
  );
}

// After: State colocated with component
function ExerciseLibrary() {
  const [filter, setFilter] = useState('');
  // Component implementation
}
```

### 3. Virtualization

For large lists, use virtualization (coming soon):

```typescript
import { useVirtualList } from '@/hooks/useVirtualList';

function HistoryList({ items }) {
  const { virtualItems, totalSize, scrollRef } = useVirtualList({
    count: items.length,
    estimateSize: () => 80,
    overscan: 5,
  });
  
  return (
    <div ref={scrollRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: totalSize }}>
        {virtualItems.map(virtualItem => (
          <HistoryItem
            key={virtualItem.index}
            item={items[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4. Request Batching

Batch multiple localStorage operations:

```typescript
import { batchDOMUpdates } from '@/utils/performanceOptimizations';

async function saveMultipleExercises(exercises) {
  const updates = exercises.map(exercise => 
    () => localStorage.setItem(`ex_${exercise.id}`, JSON.stringify(exercise))
  );
  
  await batchDOMUpdates(updates);
}
```

## Debugging Performance Issues

### 1. Use React DevTools Profiler

```typescript
import { useWhyDidYouUpdate } from '@/utils/reactOptimizations';

function MyComponent(props) {
  useWhyDidYouUpdate('MyComponent', props);
  // Component implementation
}
```

### 2. Track Render Count

```typescript
import { useRenderCount } from '@/utils/reactOptimizations';

function MyComponent() {
  const renderCount = useRenderCount('MyComponent');
  
  if (import.meta.env.DEV && renderCount > 10) {
    console.warn('Component rendering too frequently!');
  }
  
  // Component implementation
}
```

### 3. Performance Profiling

```typescript
import { measurePerformance } from '@/utils/performanceOptimizations';

// Measure component mount time
useEffect(() => {
  measurePerformance('MyComponent-mount', () => {
    // Mount logic
  });
}, []);
```

## Mobile-Specific Optimizations

### 1. Touch Optimization

```typescript
// Use passive listeners for better scroll performance
import { addPassiveEventListener } from '@/utils/performanceOptimizations';

useEffect(() => {
  const cleanup = addPassiveEventListener(
    element,
    'touchstart',
    handleTouchStart
  );
  
  return cleanup;
}, []);
```

### 2. Reduce Motion Support

```typescript
import { prefersReducedMotion } from '@/utils/performanceOptimizations';

function MyComponent() {
  const shouldAnimate = !prefersReducedMotion();
  
  return (
    <div className={shouldAnimate ? 'with-animation' : 'no-animation'}>
      Content
    </div>
  );
}
```

### 3. Network Awareness

```typescript
function useNetworkQuality() {
  const [quality, setQuality] = useState('4g');
  
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setQuality(connection.effectiveType);
      
      connection.addEventListener('change', () => {
        setQuality(connection.effectiveType);
      });
    }
  }, []);
  
  return quality;
}

function MyComponent() {
  const networkQuality = useNetworkQuality();
  
  // Load high-res images only on good connection
  const imageQuality = networkQuality === '4g' ? 'high' : 'low';
}
```

## Testing Performance

### 1. Lighthouse CI

Run Lighthouse in CI/CD:

```bash
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=http://localhost:5173
```

### 2. Bundle Size Tracking

Track bundle size over time:

```bash
# Analyze current bundle
npx vite-bundle-visualizer --template treemap

# Compare with previous build
npx bundlesize
```

### 3. Performance Budget

Set performance budgets in `package.json`:

```json
{
  "bundlesize": [
    {
      "path": "./dist/assets/main-*.js",
      "maxSize": "100 KB"
    },
    {
      "path": "./dist/assets/vendor-*.js",
      "maxSize": "300 KB"
    }
  ]
}
```

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/reference/react/memo)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Get Help

If you're unsure about optimizing a specific component or feature:

1. Profile with React DevTools
2. Measure with Performance API
3. Check Web Vitals
4. Review bundle analysis
5. Test on real device

For questions, refer to the team or open an issue.
