import React, { useState, useEffect } from 'react';
import * as FirebaseService from '../../firebase-service';
import { ThemeSelector } from '../ThemeSelector';
import { useTheme } from '../../hooks/useTheme';
import { useHaptic } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import { LoginStatus } from '../auth/LoginStatus';
import { RefreshCw, Info } from 'lucide-react';
import { captureError, isErrorReportingEnabled } from '../../utils/errorReporting';
import { getAllLocalData, mergeCloudData, FIREBASE_SYNC_ENABLED_KEY, type SessionData } from '../../utils/firebaseSync';
import type { CloudData } from '../../firebase-service';
import type { User } from 'firebase/auth';
import type { ExerciseHistory } from '../../types';

/**
 * Merge local data with cloud data using smart merge strategy
 *
 * This function ensures that:
 * 1. Cloud data is preserved and not overwritten by empty local data
 * 2. Local sessions with newer timestamps take precedence
 * 3. Both local and cloud sessions are included in the result
 */
function mergeLocalAndCloudData(
    localData: ReturnType<typeof getAllLocalData>,
    cloudData: CloudData | null
): CloudData {
    // If no cloud data, just return local data
    if (!cloudData) {
        return {
            sessions: localData.sessions as CloudData['sessions'],
            exerciseHistory: localData.exercise_history,
            lastSyncTime: new Date().toISOString(),
        };
    }

    // Build merged sessions using a flexible record type
    const mergedSessions: Record<string, SessionData> = {};

    // First, copy all cloud sessions
    if (cloudData.sessions) {
        Object.entries(cloudData.sessions).forEach(([key, session]) => {
            mergedSessions[key] = session;
        });
    }

    // Merge local sessions, keeping newer versions
    if (localData.sessions) {
        Object.entries(localData.sessions).forEach(([key, localSession]) => {
            const cloudSession = mergedSessions[key];

            if (!cloudSession) {
                // No cloud version, use local
                mergedSessions[key] = localSession;
            } else if (localSession.lastModified && cloudSession.lastModified) {
                // Both have timestamps, compare
                const localTime = new Date(localSession.lastModified).getTime();
                const cloudTime = new Date(cloudSession.lastModified).getTime();

                if (localTime > cloudTime) {
                    // Local is newer
                    mergedSessions[key] = localSession;
                }
                // else keep cloud version (already in merged)
            } else if (localSession.lastModified) {
                // Only local has timestamp, use local
                mergedSessions[key] = localSession;
            }
            // else keep cloud version (already in merged)
        });
    }

    // Merge exercise history - combine entries
    const mergedHistory: ExerciseHistory = { ...(cloudData.exerciseHistory || {}) };

    if (localData.exercise_history && Object.keys(localData.exercise_history).length > 0) {
        Object.entries(localData.exercise_history).forEach(([exerciseId, entries]) => {
            if (!mergedHistory[exerciseId]) {
                mergedHistory[exerciseId] = entries;
            } else {
                // Merge entries, avoiding duplicates by date
                const existingDates = new Set(
                    mergedHistory[exerciseId].map(e => e.date)
                );
                entries.forEach(entry => {
                    if (!existingDates.has(entry.date)) {
                        mergedHistory[exerciseId].push(entry);
                    }
                });
            }
        });
    }

    // Build the result object, only including settings if defined
    // Firebase Realtime Database rejects undefined values
    const result: CloudData = {
        sessions: mergedSessions as CloudData['sessions'],
        exerciseHistory: mergedHistory,
        lastSyncTime: new Date().toISOString(),
    };

    // Only add settings if they exist (Firebase rejects undefined)
    if (cloudData.settings !== undefined) {
        result.settings = cloudData.settings;
    }

    return result;
}

/**
 * SettingsView component - displays app settings including theme selection and cloud sync
 */
export const SettingsView: React.FC = () => {
    // Use the new auth hook
    const {
        user: firebaseUser,
        loading: authLoading,
        error: authError,
        login,
        logout,
        clearError
    } = useAuth();

    const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(true); // Default enabled
    const [firebaseMessage, setFirebaseMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // Theme state
    const { theme, setTheme, themes } = useTheme();

    const haptic = useHaptic();

    useEffect(() => {
        // Load Firebase sync setting
        const savedSyncEnabled = localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY) !== 'false'; // Default true
        setFirebaseSyncEnabled(savedSyncEnabled);

        // Setup Firebase sync listener (Firebase is auto-initialized from env vars)
        if (FirebaseService.isFirebaseInitialized()) {
            FirebaseService.initSync(
                // onDataReceived - called for subsequent cloud updates after initial sync
                (cloudData: CloudData | null) => {
                    if (cloudData) {
                        mergeCloudData(cloudData as Parameters<typeof mergeCloudData>[0]);
                        setFirebaseMessage('✓ Data synced from cloud');
                        setTimeout(() => setFirebaseMessage(''), 3000);
                    }
                },
                // onAuthChange - called with user AND initial cloud data
                // This ensures we merge cloud data BEFORE pushing local data
                (user: User | null, initialCloudData: CloudData | null) => {
                    // Note: user state is handled by useAuth, but we need this for sync logic

                    if (user && savedSyncEnabled) {
                        setIsSyncing(true);

                        // STEP 1: Merge initial cloud data into local storage first
                        if (initialCloudData) {
                            console.log('Merging initial cloud data before pushing local changes');
                            mergeCloudData(initialCloudData as Parameters<typeof mergeCloudData>[0]);
                        }

                        // STEP 2: Get local data (now includes merged cloud data)
                        const localData = getAllLocalData();

                        // STEP 3: Smart merge - combine local and cloud data
                        const mergedData = mergeLocalAndCloudData(localData, initialCloudData);

                        // STEP 4: Push merged data to cloud
                        FirebaseService.saveToCloud(mergedData)
                            .then(() => {
                                setFirebaseMessage('✓ Data synced successfully');
                                setTimeout(() => setFirebaseMessage(''), 3000);
                            })
                            .catch((err: Error) => {
                                console.error('Failed to sync data:', err);
                                setFirebaseMessage('✗ Sync failed: ' + err.message);
                                setTimeout(() => setFirebaseMessage(''), 5000);
                            })
                            .finally(() => {
                                setIsSyncing(false);
                            });
                    }
                }
            );
        }
    }, []);

    // Firebase handlers
    const handleFirebaseLogin = async () => {
        haptic.bump();
        await login();
    };

    const handleFirebaseLogout = async () => {
        haptic.bump();
        await logout();
        setFirebaseMessage('✓ Logged out successfully');
        setTimeout(() => setFirebaseMessage(''), 3000);
    };

    const handleManualSync = async () => {
        haptic.bump();
        setIsSyncing(true);
        try {
            // Get local data including current workout
            const localData = getAllLocalData();
            // Push local data to cloud (realtime listener will handle incoming changes)
            await FirebaseService.saveToCloud(localData as unknown as CloudData);
            setFirebaseMessage('✓ Data synced to cloud successfully');
            setTimeout(() => setFirebaseMessage(''), 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setFirebaseMessage('✗ Sync failed: ' + message);
            setTimeout(() => setFirebaseMessage(''), 5000);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncToggle = () => {
        haptic.tick();
        const newValue = !firebaseSyncEnabled;
        setFirebaseSyncEnabled(newValue);
        localStorage.setItem(FIREBASE_SYNC_ENABLED_KEY, newValue.toString());
    };

    return (
        <div className="px-5 pb-20 pt-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            {/* Theme Selection */}
            <ThemeSelector
                theme={theme}
                setTheme={(newTheme: string) => {
                    haptic.bump();
                    setTheme(newTheme as Parameters<typeof setTheme>[0]);
                }}
                themes={themes}
            />

            {/* Firebase Sync Section - Only shown if Firebase is configured at build time */}
            {FirebaseService.isFirebaseInitialized() && (
                <>
                    <LoginStatus
                        user={firebaseUser}
                        loading={authLoading}
                        error={authError}
                        onLogin={handleFirebaseLogin}
                        onLogout={handleFirebaseLogout}
                        onClearError={clearError}
                    />

                    {/* Sync Controls - Only shown when logged in */}
                    {firebaseUser && (
                        <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-4">
                            {/* Status message - always visible when there's a message */}
                            {firebaseMessage && (
                                <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                                    firebaseMessage.startsWith('✓') ? 'bg-sys-success/20 text-sys-success' :
                                    firebaseMessage.startsWith('✗') ? 'bg-red-500/20 text-red-400' :
                                    'bg-sys-accent/20 text-sys-accent'
                                }`}>
                                    {firebaseMessage}
                                </div>
                            )}

                            {/* Auto-sync toggle */}
                            <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={handleSyncToggle}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${firebaseSyncEnabled ? 'bg-sys-success' : 'bg-sys-onSurfaceVar'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${firebaseSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                    </button>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-white mb-1">Automatic Sync</h4>
                                        <p className="text-xs text-sys-onSurfaceVar leading-relaxed">
                                            Automatically sync data to cloud when changes are made
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className={`w-full h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 transition-transform border border-white/5 ${isSyncing ? 'opacity-50' : 'active:scale-95'}`}
                            >
                                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Build Info Section */}
            <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                        <Info size={24} className="text-sys-accent" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">App Info</h3>
                        <p className="text-xs text-sys-onSurfaceVar">Build version and details</p>
                    </div>
                </div>
                <div className="space-y-3 p-4 bg-sys-surfaceHigh rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-sys-onSurfaceVar">Version</span>
                        <span className="text-sm font-medium text-white">{__BUILD_VERSION__}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-sys-onSurfaceVar">Build Date</span>
                        <span className="text-sm font-medium text-white">
                            {new Date(__BUILD_DATE__).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                    {/* Sentry Test Button - for verifying error reporting */}
                    {isErrorReportingEnabled() && (
                        <div className="pt-3 border-t border-white/10">
                            <button
                                onClick={() => {
                                    captureError(new Error('Test error from Settings page'), 'error', {
                                        component: 'SettingsView',
                                        action: 'testSentryButton',
                                    });
                                    alert('Test error sent to Sentry! Check your Sentry dashboard.');
                                }}
                                className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-sm font-medium transition-colors"
                            >
                                Test Sentry Error Reporting
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
