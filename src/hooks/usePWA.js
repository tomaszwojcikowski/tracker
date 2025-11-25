/**
 * PWA Service Worker Registration Hook
 * Handles service worker updates and offline status
 */
import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Custom hook for PWA functionality
 * @returns {Object} PWA state and methods
 */
export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateSW, setUpdateSW] = useState(() => () => {});

  useEffect(() => {
    // Register service worker with update callbacks
    const sw = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates periodically (every hour)
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.error('SW registration error:', error);
      }
    });

    setUpdateSW(() => sw);

    // Online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Accept update and reload
  const acceptUpdate = useCallback(() => {
    updateSW(true);
  }, [updateSW]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  // Dismiss offline ready notification
  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    isOnline,
    acceptUpdate,
    dismissUpdate,
    dismissOfflineReady
  };
}

export default usePWA;
