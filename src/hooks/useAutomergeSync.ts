/**
 * useAutomergeSync Hook
 *
 * React hook for managing Automerge-based data synchronization with Firebase.
 * Provides automatic conflict resolution and offline-first capabilities.
 *
 * Features:
 * - CRDT-based conflict-free merging
 * - Automatic sync on changes
 * - Offline support with pending changes queue
 * - Migration from timestamp-based sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Doc } from '@automerge/automerge';
import {
  AutomergeDoc,
  AutomergeSessionData,
  getOrCreateLocalDoc,
  saveDocToLocalStorage,
  loadDocFromLocalStorage,
  updateDocSession,
  updateDocExerciseHistory,
  updateDocSettings,
  updateSetCompletion,
  updateWeight,
  updateRPE,
  updateNotes,
  mergeDocs,
  saveDoc,
  loadDoc,
  binaryToBase64,
  base64ToBinary,
  extractAllSessions,
  extractExerciseHistory,
  extractSettings,
  migrateToAutomerge,
  isAutomergeMigrated,
} from '../utils/automergeSync';
import { getAllLocalData } from '../utils/firebaseSync';
import { saveToCloud, isFirebaseInitialized, getCurrentUser } from '../firebase-service';
import type { SessionKey, ExerciseHistoryEntry, CloudData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface AutomergeSyncState {
  /** The current Automerge document */
  doc: Doc<AutomergeDoc> | null;
  /** Whether the document is currently syncing */
  isSyncing: boolean;
  /** Whether there are pending changes not yet synced */
  hasPendingChanges: boolean;
  /** Last sync timestamp */
  lastSyncTime: string | null;
  /** Any sync error */
  error: Error | null;
  /** Whether migration from old format is complete */
  isMigrated: boolean;
}

export interface AutomergeSyncActions {
  /** Update a session */
  updateSession: (sessionKey: SessionKey, data: AutomergeSessionData) => void;
  /** Update exercise history entry */
  updateExerciseHistory: (exerciseId: string, entry: ExerciseHistoryEntry) => void;
  /** Update settings */
  updateSettings: (settings: Record<string, unknown>) => void;
  /** Toggle set completion */
  toggleSet: (sessionKey: SessionKey, exerciseId: string, setIndex: number, completed: boolean) => void;
  /** Update weight */
  setWeight: (sessionKey: SessionKey, exerciseId: string, weight: string | number) => void;
  /** Update RPE */
  setRPE: (sessionKey: SessionKey, exerciseId: string, setIndex: number, rpe: string) => void;
  /** Update notes */
  setNotes: (sessionKey: SessionKey, exerciseId: string, notes: string) => void;
  /** Force sync with cloud */
  syncNow: () => Promise<void>;
  /** Merge with remote document */
  mergeRemote: (remoteBase64: string) => void;
  /** Migrate from old format */
  migrate: () => void;
  /** Get document as base64 for cloud storage */
  getDocBase64: () => string | null;
}

export type UseAutomergeSyncReturn = [AutomergeSyncState, AutomergeSyncActions];

// ============================================================================
// CONSTANTS
// ============================================================================

/** Debounce delay for auto-sync (ms) */
const SYNC_DEBOUNCE_MS = 2000;

/** Storage key for pending changes flag */
const PENDING_CHANGES_KEY = 'automerge_pending_changes';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing Automerge-based data synchronization
 */
export function useAutomergeSync(): UseAutomergeSyncReturn {
  // State
  const [doc, setDoc] = useState<Doc<AutomergeDoc> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMigrated, setIsMigrated] = useState(false);

  // Refs for debouncing
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize document on mount
  useEffect(() => {
    const existingDoc = loadDocFromLocalStorage();
    if (existingDoc) {
      setDoc(existingDoc);
      setIsMigrated(true);
    } else {
      // Create new empty document
      const newDoc = getOrCreateLocalDoc();
      setDoc(newDoc);
    }

    // Check for pending changes
    const pending = localStorage.getItem(PENDING_CHANGES_KEY);
    setHasPendingChanges(pending === 'true');
  }, []);

  // Auto-sync when document changes
  useEffect(() => {
    if (!doc) return;

    // Save locally immediately
    saveDocToLocalStorage(doc);

    // Mark as having pending changes
    setHasPendingChanges(true);
    localStorage.setItem(PENDING_CHANGES_KEY, 'true');

    // Debounce cloud sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToCloud();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [doc]);

  // Sync to cloud
  const syncToCloud = useCallback(async () => {
    if (!doc || !isFirebaseInitialized() || !getCurrentUser()) {
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Convert Automerge doc to CloudData format for backward compatibility
      const cloudData: CloudData = {
        sessions: extractAllSessions(doc) as CloudData['sessions'],
        exerciseHistory: extractExerciseHistory(doc),
        settings: extractSettings(doc) as unknown as CloudData['settings'],
        lastSyncTime: new Date().toISOString(),
        // Also store the Automerge binary for future CRDT merging
        // @ts-expect-error - Adding automerge binary to cloud data
        automergeDoc: binaryToBase64(saveDoc(doc)),
      };

      await saveToCloud(cloudData);

      setHasPendingChanges(false);
      localStorage.removeItem(PENDING_CHANGES_KEY);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
      setError(err instanceof Error ? err : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [doc]);

  // Actions
  const actions: AutomergeSyncActions = {
    updateSession: useCallback((sessionKey: SessionKey, data: AutomergeSessionData) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateDocSession(prev, sessionKey, data);
      });
    }, []),

    updateExerciseHistory: useCallback((exerciseId: string, entry: ExerciseHistoryEntry) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateDocExerciseHistory(prev, exerciseId, entry);
      });
    }, []),

    updateSettings: useCallback((settings: Record<string, unknown>) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateDocSettings(prev, settings);
      });
    }, []),

    toggleSet: useCallback((sessionKey: SessionKey, exerciseId: string, setIndex: number, completed: boolean) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateSetCompletion(prev, sessionKey, exerciseId, setIndex, completed);
      });
    }, []),

    setWeight: useCallback((sessionKey: SessionKey, exerciseId: string, weight: string | number) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateWeight(prev, sessionKey, exerciseId, weight);
      });
    }, []),

    setRPE: useCallback((sessionKey: SessionKey, exerciseId: string, setIndex: number, rpe: string) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateRPE(prev, sessionKey, exerciseId, setIndex, rpe);
      });
    }, []),

    setNotes: useCallback((sessionKey: SessionKey, exerciseId: string, notes: string) => {
      setDoc((prev) => {
        if (!prev) return prev;
        return updateNotes(prev, sessionKey, exerciseId, notes);
      });
    }, []),

    syncNow: syncToCloud,

    mergeRemote: useCallback((remoteBase64: string) => {
      setDoc((prev) => {
        if (!prev) return prev;
        try {
          const remoteBinary = base64ToBinary(remoteBase64);
          const remoteDoc = loadDoc(remoteBinary);
          return mergeDocs(prev, remoteDoc);
        } catch (err) {
          console.error('Failed to merge remote doc:', err);
          return prev;
        }
      });
    }, []),

    migrate: useCallback(() => {
      if (isAutomergeMigrated()) {
        console.log('Already migrated to Automerge');
        setIsMigrated(true);
        return;
      }

      // Get existing data from localStorage
      const localData = getAllLocalData();

      // Migrate to Automerge
      const newDoc = migrateToAutomerge(
        localData.sessions as Record<SessionKey, AutomergeSessionData>,
        localData.exercise_history
      );

      setDoc(newDoc);
      setIsMigrated(true);
    }, []),

    getDocBase64: useCallback(() => {
      if (!doc) return null;
      return binaryToBase64(saveDoc(doc));
    }, [doc]),
  };

  const state: AutomergeSyncState = {
    doc,
    isSyncing,
    hasPendingChanges,
    lastSyncTime,
    error,
    isMigrated,
  };

  return [state, actions];
}

export default useAutomergeSync;
