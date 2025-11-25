/**
 * Optimistic Sync Hook Tests
 *
 * Tests for the useOptimisticSync hook which provides
 * background cloud synchronization with debouncing and retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticSync, SyncStatus } from '../hooks/useOptimisticSync';

// Mock Firebase service
vi.mock('../firebase-service', () => ({
  isFirebaseInitialized: vi.fn(() => true),
  getCurrentUser: vi.fn(() => ({ uid: 'test-user' })),
  saveToCloud: vi.fn(() => Promise.resolve()),
}));

// Import mocked module
import * as FirebaseService from '../firebase-service';

describe('useOptimisticSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset Firebase mocks to default values
    FirebaseService.isFirebaseInitialized.mockReturnValue(true);
    FirebaseService.getCurrentUser.mockReturnValue({ uid: 'test-user' });
    FirebaseService.saveToCloud.mockResolvedValue();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useOptimisticSync());

      expect(result.current.syncStatus).toBe(SyncStatus.IDLE);
      expect(result.current.pendingChanges).toBe(false);
      expect(result.current.lastError).toBeNull();
    });

    it('should check canSync based on conditions', () => {
      const { result } = renderHook(() => useOptimisticSync({ enabled: true }));

      expect(result.current.canSync).toBe(true);
    });

    it('should return canSync false when disabled', () => {
      const { result } = renderHook(() => useOptimisticSync({ enabled: false }));

      expect(result.current.canSync).toBe(false);
    });
  });

  describe('syncData - debounced sync', () => {
    it('should debounce rapid calls', async () => {
      const { result } = renderHook(() => useOptimisticSync());

      // Call syncData multiple times rapidly
      act(() => {
        result.current.syncData({ test: 1 });
        result.current.syncData({ test: 2 });
        result.current.syncData({ test: 3 });
      });

      // Mark as pending immediately
      expect(result.current.pendingChanges).toBe(true);

      // Should not have synced yet
      expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();

      // Fast-forward past debounce time (2000ms)
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });

      // Should have called saveToCloud only once with the last data
      expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
      expect(FirebaseService.saveToCloud).toHaveBeenCalledWith({ test: 3 });
    });

    it('should update status to syncing during sync', async () => {
      let resolveSync;
      FirebaseService.saveToCloud.mockImplementation(
        () => new Promise((resolve) => { resolveSync = resolve; })
      );

      const { result } = renderHook(() => useOptimisticSync());

      act(() => {
        result.current.syncData({ test: 1 });
      });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });

      // Should be syncing
      expect(result.current.syncStatus).toBe(SyncStatus.SYNCING);

      // Resolve the sync
      await act(async () => {
        resolveSync();
      });

      expect(result.current.syncStatus).toBe(SyncStatus.SUCCESS);
    });
  });

  describe('syncNow - immediate sync', () => {
    it('should sync immediately without debouncing', async () => {
      const { result } = renderHook(() => useOptimisticSync());

      await act(async () => {
        await result.current.syncNow({ immediate: true });
      });

      expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
      expect(FirebaseService.saveToCloud).toHaveBeenCalledWith({ immediate: true });
    });

    it('should cancel any pending debounced sync', async () => {
      const { result } = renderHook(() => useOptimisticSync());

      // Queue a debounced sync
      act(() => {
        result.current.syncData({ debounced: true });
      });

      // Immediately sync with different data
      await act(async () => {
        await result.current.syncNow({ immediate: true });
      });

      // Should have synced with immediate data
      expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
      expect(FirebaseService.saveToCloud).toHaveBeenCalledWith({ immediate: true });

      // Advance timer - debounced sync should have been cancelled
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Still only one call
      expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should set error status on sync failure', async () => {
      FirebaseService.saveToCloud.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useOptimisticSync({ disableAutoRetry: true }));

      await act(async () => {
        await result.current.syncNow({ test: 1 });
      });

      expect(result.current.syncStatus).toBe(SyncStatus.ERROR);
      expect(result.current.lastError).toBe('Network error');
      expect(result.current.pendingChanges).toBe(true);
    });

    it('should call onSyncError callback on failure', async () => {
      const onSyncError = vi.fn();
      FirebaseService.saveToCloud.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useOptimisticSync({ onSyncError, disableAutoRetry: true })
      );

      await act(async () => {
        await result.current.syncNow({ test: 1 });
      });

      expect(onSyncError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onSyncSuccess callback on success', async () => {
      const onSyncSuccess = vi.fn();

      const { result } = renderHook(() =>
        useOptimisticSync({ onSyncSuccess })
      );

      await act(async () => {
        await result.current.syncNow({ test: 1 });
      });

      expect(onSyncSuccess).toHaveBeenCalled();
    });
  });

  describe('Offline handling', () => {
    it('should report offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOptimisticSync());

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('Firebase conditions', () => {
    it('should not sync when disabled', async () => {
      const { result } = renderHook(() => useOptimisticSync({ enabled: false }));

      await act(async () => {
        await result.current.syncNow({ test: 1 });
      });

      expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();
    });
  });

  describe('cancelSync', () => {
    it('should reset status when cancelled', () => {
      const { result } = renderHook(() => useOptimisticSync());

      // Queue a sync then immediately cancel
      act(() => {
        result.current.syncData({ test: 1 });
        result.current.cancelSync();
      });

      expect(result.current.syncStatus).toBe(SyncStatus.IDLE);
    });
  });

  describe('retrySync', () => {
    it('should allow manual retry', async () => {
      const { result } = renderHook(() => useOptimisticSync({ disableAutoRetry: true }));

      await act(async () => {
        await result.current.retrySync({ test: 2 });
      });

      expect(FirebaseService.saveToCloud).toHaveBeenCalledWith({ test: 2 });
      expect(result.current.syncStatus).toBe(SyncStatus.SUCCESS);
    });
  });
});

describe('SyncStatus constants', () => {
  it('should have all expected status values', () => {
    expect(SyncStatus.IDLE).toBe('idle');
    expect(SyncStatus.SYNCING).toBe('syncing');
    expect(SyncStatus.SUCCESS).toBe('success');
    expect(SyncStatus.ERROR).toBe('error');
    expect(SyncStatus.OFFLINE).toBe('offline');
  });
});
