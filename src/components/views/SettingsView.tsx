import React, { useState, useEffect } from 'react';
import * as FirebaseService from '../../firebase-service';
import { ThemeSelector } from '../ThemeSelector';
import { useTheme } from '../../hooks/useTheme';
import { useHaptic, useLucideIcons } from '../../hooks';
import { captureError, isErrorReportingEnabled } from '../../utils/errorReporting';
import { getAllLocalData, mergeCloudData, FIREBASE_SYNC_ENABLED_KEY, type SessionData } from '../../utils/firebaseSync';
import { formatRelativeTime } from '../../utils/time';
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
    // Firebase state - using User type from firebase/auth
    // Initialize with current user if already logged in (e.g., after redirect)
    const [firebaseUser, setFirebaseUser] = useState<User | null>(
        () => FirebaseService.isFirebaseInitialized() ? FirebaseService.getCurrentUser() : null
    );
    const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(true); // Default enabled
    const [firebaseMessage, setFirebaseMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    // Only show checking state if we don't already have a user
    const [isCheckingRedirect, setIsCheckingRedirect] = useState(() => {
        const currentUser = FirebaseService.isFirebaseInitialized() ? FirebaseService.getCurrentUser() : null;
        return currentUser === null; // Only check if not already logged in
    });

    // Theme state
    const { theme, setTheme, themes } = useTheme();

    const haptic = useHaptic();

    useEffect(() => {
        // Load Firebase sync setting
        const savedSyncEnabled = localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY) !== 'false'; // Default true
        setFirebaseSyncEnabled(savedSyncEnabled);

        // Setup Firebase auth state listener (Firebase is auto-initialized from env vars)
        if (FirebaseService.isFirebaseInitialized()) {
            // Check for redirect result first (for mobile login flow)
            FirebaseService.checkRedirectResult().then((result) => {
                setIsCheckingRedirect(false);
                if (result) {
                    console.log('Redirect login successful:', result.user.email);
                    // Update user state immediately after redirect
                    setFirebaseUser(result.user);
                    setFirebaseMessage('✓ Logged in as ' + (result.user.displayName || result.user.email));
                    setTimeout(() => setFirebaseMessage(''), 5000);
                }
                // Don't set message to empty here - let initSync handle the rest
            }).catch((err) => {
                setIsCheckingRedirect(false);
                console.error('Redirect result error:', err);
                
                // Extract error details
                const errorCode = err?.code || '';
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                
                // Handle specific error cases
                if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
                    setFirebaseMessage('↩ Login cancelled');
                    setTimeout(() => setFirebaseMessage(''), 5000);
                } else if (errorCode === 'auth/network-request-failed') {
                    setFirebaseMessage('✗ Network error - check your connection');
                    setTimeout(() => setFirebaseMessage(''), 10000);
                } else {
                    // Show full error for debugging
                    const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
                    setFirebaseMessage('✗ Login failed: ' + displayMessage);
                    // Keep error visible longer
                    setTimeout(() => setFirebaseMessage(''), 15000);
                }
            });

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
                    setFirebaseUser(user);

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

    // Initialize Lucide icons when settings change
    useLucideIcons([firebaseMessage, firebaseUser, isSyncing, isLoggingIn]);

    // Firebase handlers
    const handleFirebaseLogin = async () => {
        haptic.bump();
        setIsLoggingIn(true);
        setFirebaseMessage('');
        try {
            const result = await FirebaseService.handleLogin();
            // On desktop, we get a result. On mobile with redirect, we get void
            // and the success message will be shown after redirect via checkRedirectResult
            if (result) {
                setFirebaseMessage('✓ Logged in successfully');
                setTimeout(() => setFirebaseMessage(''), 3000);
            } else {
                // Mobile redirect - show redirecting message
                setFirebaseMessage('↻ Redirecting to Google...');
            }
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            const errorCode = err?.code || '';
            const errorMessage = err?.message || 'Unknown error';
            
            // Handle specific error cases
            if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
                setFirebaseMessage('↩ Login cancelled');
                setTimeout(() => setFirebaseMessage(''), 5000);
            } else if (errorCode === 'auth/network-request-failed') {
                setFirebaseMessage('✗ Network error - check your connection');
                setTimeout(() => setFirebaseMessage(''), 10000);
            } else {
                const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
                setFirebaseMessage('✗ Login failed: ' + displayMessage);
                setTimeout(() => setFirebaseMessage(''), 15000);
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleFirebaseLogout = async () => {
        haptic.bump();
        try {
            await FirebaseService.handleLogout();
            setFirebaseMessage('✓ Logged out successfully');
            setTimeout(() => setFirebaseMessage(''), 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setFirebaseMessage('✗ Logout failed: ' + message);
            setTimeout(() => setFirebaseMessage(''), 5000);
        }
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
        <div className="px-5 pb-32 pt-6">
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
                <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                            <i data-lucide="cloud" width="24" className="text-sys-accent"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Cloud Sync</h3>
                            <p className="text-xs text-sys-onSurfaceVar">Sync data across devices with Google Auth</p>
                        </div>
                    </div>

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

                    {/* Loading state while checking redirect */}
                    {isCheckingRedirect && !firebaseUser && (
                        <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin h-5 w-5 border-2 border-sys-accent border-t-transparent rounded-full"></div>
                                <span className="text-sm text-sys-onSurfaceVar">Checking login status...</span>
                            </div>
                        </div>
                    )}

                    {firebaseUser ? (
                        <>
                            <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    {firebaseUser.photoURL && (
                                        <img src={firebaseUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                                    )}
                                    <div>
                                        <div className="text-sm font-semibold text-white">{firebaseUser.displayName || 'User'}</div>
                                        <div className="text-xs text-sys-onSurfaceVar">{firebaseUser.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-sys-success mb-2">
                                    <i data-lucide="check-circle" width="14"></i>
                                    <span>Signed in with Google</span>
                                </div>
                                {(() => {
                                    const lastSync = FirebaseService.getLastSyncTime();
                                    const timeAgo = formatRelativeTime(lastSync);
                                    if (timeAgo) {
                                        return (
                                            <div className="flex items-center gap-2 text-xs text-sys-onSurfaceVar">
                                                <i data-lucide="clock" width="14"></i>
                                                <span>Last synced {timeAgo}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

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

                            <div className="flex gap-3">
                                <button
                                    onClick={handleManualSync}
                                    disabled={isSyncing}
                                    className={`flex-1 h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 transition-transform border border-white/5 ${isSyncing ? 'opacity-50' : 'active:scale-95'}`}
                                >
                                    <i data-lucide="refresh-cw" width="18" className={isSyncing ? 'animate-spin' : ''}></i>
                                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                </button>

                                <button
                                    onClick={handleFirebaseLogout}
                                    className="flex-1 h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
                                >
                                    <i data-lucide="log-out" width="18"></i>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-sys-onSurfaceVar mb-4">
                                Sign in with your Google account to sync your workout data across all your devices. Your data is stored securely and privately.
                            </p>

                            <button
                                onClick={handleFirebaseLogin}
                                disabled={isLoggingIn}
                                aria-disabled={isLoggingIn}
                                aria-label={isLoggingIn ? 'Signing in to Google, please wait' : 'Sign in with Google'}
                                className={`w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-transform btn-gradient-primary ${isLoggingIn ? 'opacity-70' : 'active:scale-95'}`}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <i data-lucide="loader-2" width="20" className="animate-spin" aria-hidden="true"></i>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <i data-lucide="log-in" width="20" aria-hidden="true"></i>
                                        <span>Sign In with Google</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {firebaseMessage && (
                        <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
                            firebaseMessage.startsWith('✓')
                                ? 'bg-sys-success/10 border border-sys-success/30 text-sys-success'
                                : firebaseMessage.startsWith('↻')
                                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-500'
                        }`}>
                            {firebaseMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Build Info Section */}
            <div className="bg-sys-surface rounded-3xl border border-white/5 p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                        <i data-lucide="info" width="24" className="text-sys-accent"></i>
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
