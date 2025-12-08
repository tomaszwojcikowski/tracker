import React from 'react';
import { User } from 'firebase/auth';
import { Cloud, AlertCircle, X, CheckCircle, Clock, LogOut } from '../icons';
import { formatRelativeTime } from '../../utils/time';
import * as FirebaseService from '../../firebase-service';

interface LoginStatusProps {
    user: User | null;
    loading: boolean;
    error: string | null;
    onLogin: () => void;
    onLogout: () => void;
    onClearError: () => void;
}

export const LoginStatus: React.FC<LoginStatusProps> = ({
    user,
    loading,
    error,
    onLogin,
    onLogout,
    onClearError
}) => {
    return (
        <div className="bg-sys-surface rounded-2xl border border-white/5 p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-sys-accent/10 flex items-center justify-center">
                    <Cloud size={24} className="text-sys-accent" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Cloud Sync</h3>
                    <p className="text-xs text-sys-onSurfaceVar">Sync data across devices with Google Auth</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p>{error}</p>
                        {error.includes('network') && (
                            <p className="text-xs mt-1 opacity-80">Please check your internet connection and try again.</p>
                        )}
                        {error.includes('popup') && (
                            <p className="text-xs mt-1 opacity-80">Tip: Make sure popups are allowed for this site.</p>
                        )}
                    </div>
                    <button
                        onClick={onClearError}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Dismiss error"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && !user && (
                <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl flex items-center gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-sys-accent border-t-transparent rounded-full"></div>
                    <span className="text-sm text-sys-onSurfaceVar">Signing in...</span>
                </div>
            )}

            {/* Logged In State */}
            {user ? (
                <>
                    <div className="mb-4 p-4 bg-sys-surfaceHigh rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-sys-accent/20 flex items-center justify-center text-sys-accent font-bold">
                                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-semibold text-white">{user.displayName || 'User'}</div>
                                <div className="text-xs text-sys-onSurfaceVar">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-sys-success mb-2">
                            <CheckCircle size={14} />
                            <span>Signed in with Google</span>
                        </div>
                        {(() => {
                            const lastSync = FirebaseService.getLastSyncTime();
                            const timeAgo = formatRelativeTime(lastSync);
                            if (timeAgo) {
                                return (
                                    <div className="flex items-center gap-2 text-xs text-sys-onSurfaceVar">
                                        <Clock size={14} />
                                        <span>Last synced {timeAgo}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <button
                        onClick={onLogout}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-sys-surfaceHigh hover:bg-white/10 text-sys-error rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        ) : (
                            <LogOut size={16} />
                        )}
                        Sign Out
                    </button>
                </>
            ) : (
                /* Logged Out State */
                !loading && (
                    <button
                        onClick={onLogin}
                        className="w-full py-3 px-4 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>
                )
            )}
        </div>
    );
};
