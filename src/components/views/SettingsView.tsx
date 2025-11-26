import React, { useState, useEffect } from 'react';
import * as FirebaseService from '../../firebase-service';
import { ThemeSelector } from '../ThemeSelector';
import { useTheme } from '../../hooks/useTheme';
import { useHaptic, useLucideIcons } from '../../hooks';
import { getAllLocalData, mergeCloudData, FIREBASE_SYNC_ENABLED_KEY } from '../../utils/firebaseSync';
import { formatRelativeTime } from '../../utils/time';
import type { CloudData } from '../../firebase-service';
import type { User } from 'firebase/auth';

/**
 * SettingsView component - displays app settings including theme selection and cloud sync
 */
export const SettingsView: React.FC = () => {
    // Firebase state - using User type from firebase/auth
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(true); // Default enabled
    const [firebaseMessage, setFirebaseMessage] = useState('');

    // Theme state
    const { theme, setTheme, themes } = useTheme();

    const haptic = useHaptic();

    useEffect(() => {
        // Load Firebase sync setting
        const savedSyncEnabled = localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY) !== 'false'; // Default true
        setFirebaseSyncEnabled(savedSyncEnabled);

        // Setup Firebase auth state listener (Firebase is auto-initialized from env vars)
        if (FirebaseService.isFirebaseInitialized()) {
            FirebaseService.initSync(
                (cloudData: CloudData | null) => {
                    // Data received from cloud
                    if (cloudData) {
                        mergeCloudData(cloudData as Parameters<typeof mergeCloudData>[0]);
                        setFirebaseMessage('✓ Data synced from cloud');
                        setTimeout(() => setFirebaseMessage(''), 3000);
                    }
                },
                (user: User | null) => {
                    // Auth state changed
                    setFirebaseUser(user);
                    if (user && savedSyncEnabled) {
                        // User logged in - upload local data
                        const localData = getAllLocalData();
                        // Cast to CloudData - the runtime structure is compatible
                        FirebaseService.saveToCloud(localData as unknown as CloudData)
                            .then(() => {
                                setFirebaseMessage('✓ Local data synced to cloud');
                                setTimeout(() => setFirebaseMessage(''), 3000);
                            })
                            .catch((err: Error) => {
                                console.error('Failed to sync local data:', err);
                            });
                    }
                }
            );
        }
    }, []);

    // Initialize Lucide icons when settings change
    useLucideIcons([firebaseMessage, firebaseUser]);

    // Firebase handlers
    const handleFirebaseLogin = async () => {
        haptic.bump();
        try {
            await FirebaseService.handleLogin();
            setFirebaseMessage('✓ Logged in successfully');
            setTimeout(() => setFirebaseMessage(''), 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setFirebaseMessage('✗ Login failed: ' + message);
            setTimeout(() => setFirebaseMessage(''), 5000);
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
        try {
            const localData = getAllLocalData();
            // Cast to CloudData - the runtime structure is compatible
            await FirebaseService.saveToCloud(localData as unknown as CloudData);
            setFirebaseMessage('✓ Data synced to cloud successfully');
            setTimeout(() => setFirebaseMessage(''), 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setFirebaseMessage('✗ Sync failed: ' + message);
            setTimeout(() => setFirebaseMessage(''), 5000);
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
                                    className="flex-1 h-12 rounded-xl bg-sys-surfaceHigh text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
                                >
                                    <i data-lucide="refresh-cw" width="18"></i>
                                    <span>Sync Now</span>
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
                                className="w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform btn-gradient-primary"
                            >
                                <i data-lucide="log-in" width="20"></i>
                                <span>Sign In with Google</span>
                            </button>
                        </>
                    )}

                    {firebaseMessage && (
                        <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
                            firebaseMessage.startsWith('✓')
                                ? 'bg-sys-success/10 border border-sys-success/30 text-sys-success'
                                : 'bg-red-500/10 border border-red-500/30 text-red-500'
                        }`}>
                            {firebaseMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
