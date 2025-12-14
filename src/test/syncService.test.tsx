import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncService } from '../services/SyncService';
import * as FirebaseService from '../firebase-service';
import * as FirebaseSyncUtils from '../utils/firebaseSync';

// Mock dependencies
vi.mock('../firebase-service', () => ({
    saveToCloud: vi.fn(() => Promise.resolve()),
    isFirebaseInitialized: vi.fn(() => true),
    getCurrentUser: vi.fn(() => ({ uid: 'test-user' })),
}));

vi.mock('../utils/firebaseSync', () => ({
    getAllLocalData: vi.fn(() => ({ sessions: {} })),
    localDataToCloudData: vi.fn((data) => ({ sessions: data.sessions })),
    isSyncEnabled: vi.fn(() => true),
}));

describe('SyncService', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        consoleLogSpy.mockRestore();
    });

    it('should be a singleton', () => {
        const instance1 = syncService;
        // Accessing the private constructor via static method is how we get the instance
        // But here we just check if the exported instance is defined
        expect(instance1).toBeDefined();
    });

    it('should schedule a sync with debounce', async () => {
        syncService.scheduleSync();

        // Should not have called saveToCloud yet
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();

        // Fast forward time but not enough
        vi.advanceTimersByTime(1000);
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();

        // Fast forward past debounce time
        vi.advanceTimersByTime(1001);

        // Should have called saveToCloud
        expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
    });

    it('should debounce multiple schedule calls', async () => {
        syncService.scheduleSync();
        vi.advanceTimersByTime(1000);

        // Call again before timeout
        syncService.scheduleSync();
        vi.advanceTimersByTime(1000);

        // Should still not have called (total 2000ms from first call, but reset by second)
        // Wait, debounce resets the timer. So 2000ms from second call is needed.
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1001);
        expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
    });

    it('should sync immediately with syncNow', async () => {
        await syncService.syncNow();
        expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending scheduled sync when syncNow is called', async () => {
        syncService.scheduleSync();
        vi.advanceTimersByTime(1000);

        await syncService.syncNow();
        expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);

        // Fast forward time to where the scheduled sync would have happened
        vi.advanceTimersByTime(2000);

        // Should not have called it again
        expect(FirebaseService.saveToCloud).toHaveBeenCalledTimes(1);
    });

    it('should not sync if sync is disabled', async () => {
        vi.mocked(FirebaseSyncUtils.isSyncEnabled).mockReturnValue(false);

        await syncService.syncNow();
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();

        syncService.scheduleSync();
        vi.advanceTimersByTime(3000);
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();
    });

    it('should not sync if firebase is not initialized', async () => {
        vi.mocked(FirebaseService.isFirebaseInitialized).mockReturnValue(false);

        await syncService.syncNow();
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();
    });

    it('should not sync if user is not logged in', async () => {
        vi.mocked(FirebaseService.getCurrentUser).mockReturnValue(null);

        await syncService.syncNow();
        expect(FirebaseService.saveToCloud).not.toHaveBeenCalled();
    });
});
