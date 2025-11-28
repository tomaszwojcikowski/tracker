import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import * as FirebaseService from '../firebase-service';

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface UseAuthReturn extends AuthState {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

/**
 * Simple, robust authentication hook
 *
 * Key design principles:
 * 1. Uses popup authentication only (works reliably on mobile PWAs)
 * 2. No dependency on service workers or special storage handling
 * 3. Self-contained state management via Firebase's onAuthStateChanged
 * 4. Handles popup blockers and mobile browser quirks gracefully
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        mountedRef.current = true;

        if (!FirebaseService.isFirebaseInitialized()) {
            setLoading(false);
            return;
        }

        // Get current user immediately if available
        const currentUser = FirebaseService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setLoading(false);
        }

        // Subscribe to auth state changes - this is the single source of truth
        const unsubscribe = FirebaseService.onAuthChange((newUser) => {
            if (mountedRef.current) {
                setUser(newUser);
                setLoading(false);
                // Clear any stale errors when user changes
                if (newUser) {
                    setError(null);
                }
            }
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    const login = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            // Always use popup - more reliable on mobile PWAs than redirect
            await FirebaseService.handleLogin();
            // Auth state will be updated via onAuthChange listener
        } catch (err) {
            console.error('Login error:', err);

            if (mountedRef.current) {
                // Provide user-friendly error messages
                let message = 'Login failed';

                if (err instanceof Error) {
                    const errorCode = (err as { code?: string }).code;

                    switch (errorCode) {
                        case 'auth/popup-closed-by-user':
                            message = 'Sign-in was cancelled';
                            break;
                        case 'auth/popup-blocked':
                            message = 'Popup was blocked. Please allow popups for this site.';
                            break;
                        case 'auth/cancelled-popup-request':
                            // User clicked login multiple times - not an error
                            message = '';
                            break;
                        case 'auth/network-request-failed':
                            message = 'Network error. Please check your connection.';
                            break;
                        case 'auth/internal-error':
                            message = 'An internal error occurred. Please try again.';
                            break;
                        default:
                            message = err.message || 'Login failed';
                    }
                }

                if (message) {
                    setError(message);
                }
                setLoading(false);
            }
        }
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            await FirebaseService.handleLogout();
            // Auth state will be updated via onAuthChange listener
        } catch (err) {
            console.error('Logout error:', err);
            if (mountedRef.current) {
                const message = err instanceof Error ? err.message : 'Logout failed';
                setError(message);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        loading,
        error,
        login,
        logout,
        clearError
    };
}
