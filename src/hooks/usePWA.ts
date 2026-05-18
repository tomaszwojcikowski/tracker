/**
 * PWA Service Worker Registration Hook
 * Handles service worker updates and offline status
 */
import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

// ============================================================================
// TYPES
// ============================================================================

/**
 * PWA state and methods returned by usePWA
 */
export interface PWAState {
  /** Whether a new service worker is waiting to be activated */
  needRefresh: boolean;
  /** Whether the app is ready to work offline */
  offlineReady: boolean;
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Accept the update and reload the page */
  acceptUpdate: () => void;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
  /** Dismiss the offline ready notification */
  dismissOfflineReady: () => void;
}

/**
 * Service worker update function type
 */
type UpdateSWFunction = (reloadPage?: boolean) => Promise<void>;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for PWA functionality
 * @returns PWA state and methods
 *
 * @example
 * const { needRefresh, acceptUpdate, isOnline } = usePWA();
 *
 * if (needRefresh) {
 *   return <button onClick={acceptUpdate}>Update available</button>;
 * }
 */
export function usePWA(): PWAState {
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [offlineReady, setOfflineReady] = useState<boolean>(false);
  // Always default to online to prevent false offline banners
  // We'll update via event listeners if we go offline
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [updateSW, setUpdateSW] = useState<UpdateSWFunction>(() => async () => {});
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    const intervalIds: ReturnType<typeof setInterval>[] = [];

    const scheduleTimeout = (callback: () => void, delay: number): void => {
      const timeoutId = setTimeout(() => {
        const index = timeoutIds.indexOf(timeoutId);
        if (index >= 0) {
          timeoutIds.splice(index, 1);
        }

        if (isMounted) {
          callback();
        }
      }, delay);
      timeoutIds.push(timeoutId);
    };

    const scheduleInterval = (callback: () => void, delay: number): void => {
      const intervalId = setInterval(() => {
        if (isMounted) {
          callback();
        }
      }, delay);
      intervalIds.push(intervalId);
    };

    // Only set offline if navigator explicitly says we're offline
    // AND we fail a network request (double-check)
    // navigator.onLine can be unreliable on some browsers/OS combinations
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // Double-check with a quick fetch to confirm offline status
      fetch(`${import.meta.env.BASE_URL || '/'}manifest.webmanifest`, {
        method: 'HEAD',
        cache: 'no-store',
      })
        .then(() => {
          // Fetch succeeded, we're actually online despite navigator.onLine
          if (isMounted) {
            setIsOnline(true);
          }
        })
        .catch(() => {
          // Fetch failed, we're actually offline
          if (isMounted) {
            setIsOnline(false);
          }
        });
    }

    // Register service worker with update callbacks
    const sw = registerSW({
      immediate: true, // Register immediately
      onNeedRefresh(): void {
        if (!isMounted) return;

        setNeedRefresh(true);
        // On mobile, auto-reload after a short delay to ensure fresh content
        // Desktop users get the prompt to reload manually
        if (
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        ) {
          console.log('PWA update detected on mobile, auto-reloading in 2 seconds...');
          scheduleTimeout(() => {
            sw(true); // Reload the page
          }, 2000);
        }
      },
      onOfflineReady(): void {
        if (!isMounted) return;

        setOfflineReady(true);
      },
      onRegisteredSW(_swUrl: string, reg: ServiceWorkerRegistration | undefined): void {
        if (!isMounted || !reg) return;

        setRegistration(reg);

        // Initial check after 10 seconds
        scheduleTimeout(() => {
          reg.update().catch(console.error);
        }, 10 * 1000);

        // Then check every 5 minutes
        scheduleInterval(
          () => {
            reg.update().catch(console.error);
          },
          5 * 60 * 1000
        );
      },
      onRegisterError(error: Error): void {
        console.error('SW registration error:', error);
      },
    });

    setUpdateSW(() => sw);

    // Online/offline event listeners
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      timeoutIds.forEach(clearTimeout);
      intervalIds.forEach(clearInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for updates when app becomes visible (user returns to app on mobile)
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible' && registration) {
        // Check for updates
        registration.update().catch(console.error);

        // On mobile, if there's a waiting worker, activate it immediately
        if (isMobile && registration.waiting) {
          console.log(
            'PWA: Found waiting service worker on mobile visibility change, activating...'
          );
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Reload after a short delay to ensure SW takes control
          reloadTimeout = setTimeout(() => {
            reloadTimeout = null;
            window.location.reload();
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registration]);

  // Accept update and reload
  const acceptUpdate = useCallback((): void => {
    updateSW(true);
  }, [updateSW]);

  // Dismiss update notification
  const dismissUpdate = useCallback((): void => {
    setNeedRefresh(false);
  }, []);

  // Dismiss offline ready notification
  const dismissOfflineReady = useCallback((): void => {
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    isOnline,
    acceptUpdate,
    dismissUpdate,
    dismissOfflineReady,
  };
}
