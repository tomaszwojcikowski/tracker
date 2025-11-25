/**
 * Optimistic Sync Hook
 *
 * Provides optimistic UI updates with background cloud synchronization.
 * 
 * Design Philosophy:
 * - Local state and localStorage are the source of truth
 * - Cloud sync happens in the background without blocking UI
 * - Failed syncs are queued for retry
 * - Users see immediate feedback for all actions
 * 
 * Usage:
 * ```jsx
 * const { syncData, pendingSyncs, lastSyncError } = useOptimisticSync();
 * 
 * // After any data change:
 * syncData(getAllLocalData());
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as FirebaseService from '../firebase-service';

// Constants
const SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds before syncing
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Sync status for UI display
 */
export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline',
};

/**
 * Hook for optimistic updates with background sync
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether cloud sync is enabled
 * @param {boolean} options.disableAutoRetry - Disable automatic retry on failure (useful for testing)
 * @param {Function} options.onSyncSuccess - Callback on successful sync
 * @param {Function} options.onSyncError - Callback on sync error
 * @returns {Object} Sync utilities and state
 */
export function useOptimisticSync(options = {}) {
  const { enabled = true, disableAutoRetry = false, onSyncSuccess, onSyncError } = options;

  // Sync state
  const [syncStatus, setSyncStatus] = useState(SyncStatus.IDLE);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Refs for managing async operations
  const syncTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef(null);

  /**
   * Check if online and Firebase is ready for sync
   * Note: This doesn't set state to avoid render loops
   */
  const canSync = useCallback(() => {
    if (!enabled) return false;
    if (!navigator.onLine) return false;
    if (!FirebaseService.isFirebaseInitialized()) return false;
    if (!FirebaseService.getCurrentUser()) return false;
    return true;
  }, [enabled]);

  /**
   * Perform the actual sync to Firebase
   */
  const performSync = useCallback(
    async (data) => {
      if (!canSync()) {
        setPendingChanges(true);
        return false;
      }

      try {
        setSyncStatus(SyncStatus.SYNCING);

        await FirebaseService.saveToCloud(data);

        setSyncStatus(SyncStatus.SUCCESS);
        setLastSyncTime(new Date().toISOString());
        setLastError(null);
        setPendingChanges(false);
        retryCountRef.current = 0;

        if (onSyncSuccess) {
          onSyncSuccess();
        }

        // Reset status after a delay
        setTimeout(() => {
          setSyncStatus(SyncStatus.IDLE);
        }, 2000);

        return true;
      } catch (error) {
        console.error('Sync failed:', error);
        setLastError(error.message || 'Sync failed');
        setSyncStatus(SyncStatus.ERROR);
        setPendingChanges(true);

        if (onSyncError) {
          onSyncError(error);
        }

        // Retry logic (unless disabled)
        if (!disableAutoRetry && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          retryCountRef.current++;
          console.log(
            `Retrying sync (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
          );

          setTimeout(() => {
            performSync(data);
          }, RETRY_DELAY_MS);
        }

        return false;
      }
    },
    [canSync, onSyncSuccess, onSyncError]
  );

  /**
   * Queue a sync with debouncing
   * Call this after any data change for optimistic background sync
   */
  const syncData = useCallback(
    (data) => {
      // Clear any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Mark as having pending changes
      setPendingChanges(true);

      // Debounce the sync to batch rapid changes
      syncTimeoutRef.current = setTimeout(() => {
        performSync(data);
      }, SYNC_DEBOUNCE_MS);
    },
    [performSync]
  );

  /**
   * Force an immediate sync without debouncing
   */
  const syncNow = useCallback(
    async (data) => {
      // Clear any pending debounced sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      return performSync(data);
    },
    [performSync]
  );

  /**
   * Cancel any pending syncs
   */
  const cancelSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSyncStatus(SyncStatus.IDLE);
  }, []);

  /**
   * Retry failed sync
   */
  const retrySync = useCallback(
    (data) => {
      retryCountRef.current = 0;
      setLastError(null);
      return performSync(data);
    },
    [performSync]
  );

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      if (pendingChanges) {
        setSyncStatus(SyncStatus.IDLE);
        // Trigger a sync when coming back online
        // The caller should provide the data to sync
      }
    };

    const handleOffline = () => {
      setSyncStatus(SyncStatus.OFFLINE);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setSyncStatus(SyncStatus.OFFLINE);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    syncStatus,
    lastSyncTime,
    lastError,
    pendingChanges,
    isOnline: navigator.onLine,

    // Actions
    syncData,
    syncNow,
    cancelSync,
    retrySync,

    // Utilities
    canSync: canSync(),
  };
}

export default useOptimisticSync;
