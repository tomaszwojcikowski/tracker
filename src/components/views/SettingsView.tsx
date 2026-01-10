import React, { useState, useEffect } from 'react';
import * as FirebaseService from '../../firebase-service';
import { useHaptic, useScrollToTop } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import { LoginStatus } from '../auth/LoginStatus';
import { ActionLogSettings } from '../ActionLogSettings';
import { ConfirmDialog } from '../Dialog';
import { Snackbar } from '../Snackbar';
import { RefreshCw, Info, Dumbbell, Settings, RotateCcw, Activity } from '../icons';
import { captureError, isErrorReportingEnabled } from '../../utils/errorReporting';
import { syncService } from '../../services/SyncService';
import { resetProgramProgress } from '../../utils/programImportExport';
import { getActiveProgramId } from '../../services/storageNamespace';
import {
    getAllLocalData,
    mergeCloudData,
    isSyncEnabled,
    setSyncEnabled,
    type SessionData,
    type GlobalHistoryEntry
} from '../../utils/firebaseSync';
import { ProgramSelector } from '../ProgramSelector';
import type { CloudData } from '../../firebase-service';
import type { User } from 'firebase/auth';
import type { ExerciseHistory } from '../../types';

// Settings tab type
type SettingsTab = 'general' | 'programs' | 'logs';

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
            global_history: localData.global_history,
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

    // Merge global history - combine entries
    const cloudGlobalHistory = cloudData.global_history;
    const mergedGlobalHistory: GlobalHistoryEntry[] = [...(cloudGlobalHistory || [])];

    if (localData.global_history && localData.global_history.length > 0) {
        // Create a Set of existing entry keys (date + week + day) for quick lookup
        const existingEntryKeys = new Set(
            mergedGlobalHistory.map(entry => `${entry.date}-${entry.week}-${entry.day}`)
        );

        // Add local entries that don't exist in cloud
        localData.global_history.forEach(localEntry => {
            const entryKey = `${localEntry.date}-${localEntry.week}-${localEntry.day}`;
            if (!existingEntryKeys.has(entryKey)) {
                mergedGlobalHistory.push(localEntry);
            }
        });
    }

    // Build the result object, only including settings if defined
    // Firebase Realtime Database rejects undefined values
    const result: CloudData = {
        sessions: mergedSessions as CloudData['sessions'],
        exerciseHistory: mergedHistory,
        global_history: mergedGlobalHistory,
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
    // Settings tab state
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

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
    const [settingsToastMessage, setSettingsToastMessage] = useState('');
    const [syncSnackbarMessage, setSyncSnackbarMessage] = useState('');
    const [syncSnackbarType, setSyncSnackbarType] = useState<'success' | 'error' | 'info'>('info');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showClearProgressConfirm, setShowClearProgressConfirm] = useState(false);

    const haptic = useHaptic();

    // Scroll to top when view loads
    useScrollToTop();

    useEffect(() => {
        // Load Firebase sync setting
        const savedSyncEnabled = isSyncEnabled();
        setFirebaseSyncEnabled(savedSyncEnabled);

        // Setup Firebase sync listener (Firebase is auto-initialized from env vars)
        if (FirebaseService.isFirebaseInitialized()) {
            FirebaseService.initSync(
                // onDataReceived - called for subsequent cloud updates after initial sync
                (cloudData: CloudData | null) => {
                    if (cloudData) {
                        mergeCloudData(cloudData as Parameters<typeof mergeCloudData>[0]);
                        setSyncSnackbarMessage('Data synced from cloud');
                        setSyncSnackbarType('success');
                    }
                },
                // onAuthChange - called with user AND initial cloud data
                // This ensures we merge cloud data BEFORE pushing local data
                (user: User | null, initialCloudData: CloudData | null) => {
                    // Note: user state is handled by useAuth, but we need this for sync logic

                    // Re-check current setting at the time of auth change (avoid stale closure)
                    if (user && isSyncEnabled()) {
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
                                setSyncSnackbarMessage('Data synced successfully');
                                setSyncSnackbarType('success');
                            })
                            .catch((err: Error) => {
                                console.error('Failed to sync data:', err);
                                setSyncSnackbarMessage('Sync failed: ' + err.message);
                                setSyncSnackbarType('error');
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
        setSyncSnackbarMessage('Logged out successfully');
        setSyncSnackbarType('success');
    };

    const handleManualSync = async () => {
        haptic.bump();

        if (!isSyncEnabled()) {
            setSyncSnackbarMessage('Sync is disabled. Enable Automatic Sync to use cloud sync.');
            setSyncSnackbarType('info');
            return;
        }

        setIsSyncing(true);
        try {
            await syncService.syncNow();
            setSyncSnackbarMessage('Data synced to cloud successfully');
            setSyncSnackbarType('success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setSyncSnackbarMessage('Sync failed: ' + message);
            setSyncSnackbarType('error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncToggle = () => {
        haptic.tick();
        const newValue = !firebaseSyncEnabled;
        setFirebaseSyncEnabled(newValue);
        setSyncEnabled(newValue);
    };

    const handleResetProgress = () => {
        setShowClearProgressConfirm(true);
    };

    const handleClearProgressConfirmed = () => {
        haptic.bump();
        const programId = getActiveProgramId();
        resetProgramProgress(programId);
        syncService.scheduleSync();
        setShowClearProgressConfirm(false);
        setSettingsToastMessage('Progress data cleared');
    };

    return (
        <div className="px-5 pb-20 pt-6">
            {/* Clear Progress Confirmation Dialog */}
            <ConfirmDialog
                title="Clear Progress Data?"
                message="This will permanently delete all workout sessions and history for the active program. This action cannot be undone."
                onConfirm={handleClearProgressConfirmed}
                onClose={() => setShowClearProgressConfirm(false)}
                isOpen={showClearProgressConfirm}
                destructive={true}
                confirmLabel="Delete Progress"
                cancelLabel="Cancel"
            />

            {/* Settings toast notification */}
            <Snackbar
                isOpen={!!settingsToastMessage}
                message={settingsToastMessage}
                onClose={() => setSettingsToastMessage('')}
                type="success"
                duration={3000}
            />

            {/* Sync status notification */}
            <Snackbar
                isOpen={!!syncSnackbarMessage}
                message={syncSnackbarMessage}
                onClose={() => setSyncSnackbarMessage('')}
                type={syncSnackbarType}
                duration={syncSnackbarType === 'error' ? 5000 : 3000}
            />

            {/* Tab Navigation - MD3 segmented button style */}
            <div className="segmented-button-container mb-6">
                <button
                    onClick={() => {
                        haptic.tick();
                        setActiveTab('general');
                    }}
                    className={`segmented-button ${activeTab === 'general' ? 'active' : ''}`}
                >
                    <Settings size={18} />
                    General
                </button>
                <button
                    onClick={() => {
                        haptic.tick();
                        setActiveTab('programs');
                    }}
                    className={`segmented-button ${activeTab === 'programs' ? 'active' : ''}`}
                >
                    <Dumbbell size={18} />
                    Programs
                </button>
                <button
                    onClick={() => {
                        haptic.tick();
                        setActiveTab('logs');
                    }}
                    className={`segmented-button ${activeTab === 'logs' ? 'active' : ''}`}
                >
                    <Activity size={18} />
                    Logs
                </button>
            </div>

            {/* General Tab Content */}
            {activeTab === 'general' && (
                <>
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
                                <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-6 mb-4">
                                    {/* Auto-sync toggle */}
                                    <div className="mb-4 p-4 bg-sys-surfaceContainerHigh rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={handleSyncToggle}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${firebaseSyncEnabled ? 'bg-sys-success' : 'bg-sys-onSurfaceVar'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-sys-surface transition-transform ${firebaseSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                            </button>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-sys-onSurface mb-1">Automatic Sync</h4>
                                                <p className="text-xs text-sys-onSurfaceVar leading-relaxed">
                                                    Automatically sync data to cloud when changes are made
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleManualSync}
                                        disabled={isSyncing}
                                        className={`w-full h-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-onSurface font-medium flex items-center justify-center gap-2 transition-transform border border-sys-outlineVariant ${isSyncing ? 'opacity-50' : 'active:scale-95'}`}
                                    >
                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Build Info Section */}
                    <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-6 mb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-sys-primary/10 flex items-center justify-center">
                                <Info size={24} className="text-sys-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-sys-onSurface">App Info</h3>
                                <p className="text-xs text-sys-onSurfaceVar">Build version and details</p>
                            </div>
                        </div>
                        <div className="space-y-3 p-4 bg-sys-surfaceContainerHigh rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-sys-onSurfaceVar">Version</span>
                                <span className="text-sm font-medium text-sys-onSurface">{__BUILD_VERSION__}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-sys-onSurfaceVar">Build Date</span>
                                <span className="text-sm font-medium text-sys-onSurface">
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
                                <div className="pt-3 space-y-3">
                                    <div className="divider divider-inset" aria-hidden="true" />
                                    <button
                                        onClick={() => {
                                            captureError(new Error('Test error from Settings page'), 'error', {
                                                component: 'SettingsView',
                                                action: 'testSentryButton',
                                            });
                                            alert('Test error sent to Sentry! Check your Sentry dashboard.');
                                        }}
                                        className="w-full py-2 px-4 bg-sys-errorContainer/50 hover:bg-sys-errorContainer text-sys-onErrorContainer rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Test Sentry Error Reporting
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Programs Tab Content */}
            {activeTab === 'programs' && (
                <div className="space-y-4">
                    <p className="text-sm text-sys-onSurfaceVar mb-4">
                        Choose from available workout programs or import new ones. Your progress is saved separately for each program.
                    </p>
                    <ProgramSelector variant="full" />

                    <div className="bg-sys-surface rounded-2xl border border-sys-outlineVariant p-6">
                        <h3 className="text-lg font-bold text-sys-onSurface mb-1">Clear your progress data</h3>
                        <p className="text-xs text-sys-onSurfaceVar mb-4">
                            Clears workout sessions and history for the active program.
                        </p>
                        <button
                            onClick={handleResetProgress}
                            className="w-full h-12 rounded-xl bg-sys-surfaceContainerHigh text-sys-onSurface font-medium flex items-center justify-center gap-2 transition-transform border border-sys-outlineVariant active:scale-95"
                        >
                            <RotateCcw size={18} />
                            <span>Clear your progress data</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Logs Tab Content */}
            {activeTab === 'logs' && <ActionLogSettings />}
        </div>
    );
};
