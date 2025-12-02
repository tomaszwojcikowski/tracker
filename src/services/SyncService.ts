import { getAllLocalData, localDataToCloudData, isSyncEnabled } from '../utils/firebaseSync';
import * as FirebaseService from '../firebase-service';

/**
 * Service for handling cloud synchronization with batching/debouncing.
 * This ensures that we don't spam Firebase with too many write requests
 * when the user is making frequent changes (e.g., toggling sets).
 */
class SyncService {
    private static instance: SyncService;
    private debounceTimer: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_MS = 2000;

    private constructor() {}

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Schedule a sync to cloud.
     * This is debounced to prevent spamming Firebase.
     * Call this whenever local data changes that should be synced.
     */
    public scheduleSync(): void {
        if (!this.canSync()) return;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.performSync();
        }, this.DEBOUNCE_MS);
    }

    /**
     * Perform an immediate sync to cloud.
     * Use this for critical updates (e.g., workout completion) or manual sync.
     */
    public async syncNow(): Promise<void> {
        if (!this.canSync()) return;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        await this.performSync();
    }

    private async performSync(): Promise<void> {
        try {
            const localData = getAllLocalData();
            const cloudData = localDataToCloudData(localData);
            await FirebaseService.saveToCloud(cloudData);
            console.log('Data synced to cloud successfully');
        } catch (error) {
            console.error('Failed to sync data to cloud:', error);
            // We could implement retry logic here if needed
        }
    }

    private canSync(): boolean {
        return isSyncEnabled() && FirebaseService.isFirebaseInitialized() && !!FirebaseService.getCurrentUser();
    }
}

export const syncService = SyncService.getInstance();
