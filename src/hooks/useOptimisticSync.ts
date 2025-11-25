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
 * ```tsx
 * const { syncData, pendingSyncs, lastSyncError } = useOptimisticSync();
 *
 * // After any data change:
 * syncData(getAllLocalData());
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as FirebaseService from '../firebase-service';
import type { CloudData } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds before syncing
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync status for UI display
 */
export const SyncStatus = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    ERROR: 'error',
    OFFLINE: 'offline',
} as const;

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus];

/**
 * Options for the optimistic sync hook
 */
export interface OptimisticSyncOptions {
    /** Whether cloud sync is enabled */
    enabled?: boolean;
    /** Disable automatic retry on failure (useful for testing) */
    disableAutoRetry?: boolean;
    /** Callback on successful sync */
    onSyncSuccess?: () => void;
    /** Callback on sync error */
    onSyncError?: (error: Error) => void;
}

/**
 * Return type for useOptimisticSync hook
 */
export interface OptimisticSyncReturn {
    /** Current sync status */
    syncStatus: SyncStatusType;
    /** Timestamp of last successful sync */
    lastSyncTime: string | null;
    /** Last error message if sync failed */
    lastError: string | null;
    /** Whether there are pending changes to sync */
    pendingChanges: boolean;
    /** Whether the browser is currently online */
    isOnline: boolean;
    /** Whether sync is possible (enabled, online, Firebase ready, user logged in) */
    canSync: boolean;
    /** Queue data for syncing (debounced) */
    syncData: (data: CloudData) => void;
    /** Force immediate sync without debouncing */
    syncNow: (data: CloudData) => Promise<boolean>;
    /** Cancel any pending syncs */
    cancelSync: () => void;
    /** Retry failed sync */
    retrySync: (data: CloudData) => Promise<boolean>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for optimistic updates with background sync
 * @param options - Configuration options
 * @returns Sync utilities and state
 */
export function useOptimisticSync(
    options: OptimisticSyncOptions = {}
): OptimisticSyncReturn {
    const {
        enabled = true,
        disableAutoRetry = false,
        onSyncSuccess,
        onSyncError,
    } = options;

    // Sync state
    const [syncStatus, setSyncStatus] = useState<SyncStatusType>(SyncStatus.IDLE);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    // Refs for managing async operations
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryCountRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Check if online and Firebase is ready for sync
     */
    const canSync = useCallback((): boolean => {
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
        async (data: CloudData): Promise<boolean> => {
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
                const errorMessage = error instanceof Error ? error.message : 'Sync failed';
                console.error('Sync failed:', error);
                setLastError(errorMessage);
                setSyncStatus(SyncStatus.ERROR);
                setPendingChanges(true);

                if (onSyncError) {
                    onSyncError(error instanceof Error ? error : new Error(errorMessage));
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
        [canSync, onSyncSuccess, onSyncError, disableAutoRetry]
    );

    /**
     * Queue a sync with debouncing
     */
    const syncData = useCallback(
        (data: CloudData): void => {
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
        async (data: CloudData): Promise<boolean> => {
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
    const cancelSync = useCallback((): void => {
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
        async (data: CloudData): Promise<boolean> => {
            retryCountRef.current = 0;
            setLastError(null);
            return performSync(data);
        },
        [performSync]
    );

    // Handle online/offline status changes
    useEffect(() => {
        const handleOnline = (): void => {
            setIsOnline(true);
            if (syncStatus === SyncStatus.OFFLINE) {
                setSyncStatus(SyncStatus.IDLE);
            }
        };

        const handleOffline = (): void => {
            setIsOnline(false);
            setSyncStatus(SyncStatus.OFFLINE);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial offline status
        if (!navigator.onLine) {
            setIsOnline(false);
            setSyncStatus(SyncStatus.OFFLINE);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    return {
        syncStatus,
        lastSyncTime,
        lastError,
        pendingChanges,
        isOnline,
        canSync: canSync(),
        syncData,
        syncNow,
        cancelSync,
        retrySync,
    };
}

export default useOptimisticSync;
