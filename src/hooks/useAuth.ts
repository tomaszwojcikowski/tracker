import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import * as FirebaseService from '../firebase-service';

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
    isRedirecting: boolean;
}

export interface UseAuthReturn extends AuthState {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(() =>
        FirebaseService.isFirebaseInitialized() ? FirebaseService.getCurrentUser() : null
    );
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

    // Initialize auth state and check for redirects
    useEffect(() => {
        if (!FirebaseService.isFirebaseInitialized()) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const initAuth = async () => {
            try {
                // 1. Setup auth state listener
                // We use initSync to hook into the existing service architecture
                // but we might want to decouple this if we want pure auth first

                // Check if we are returning from a redirect
                // This is critical for Chrome on Android
                const redirectResult = await FirebaseService.checkRedirectResult();

                if (mounted) {
                    if (redirectResult) {
                        setUser(redirectResult.user);
                        // Clear any stale errors from before redirect
                        setError(null);
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error('Auth initialization error:', err);
                    const message = err instanceof Error ? err.message : 'Authentication check failed';
                    setError(message);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Subscribe to auth changes
        // We need a way to subscribe to auth changes without triggering the full sync logic immediately
        // or we just rely on the existing service.
        // For now, let's rely on the service's state if possible, but the service doesn't expose a simple listener.
        // Let's add a listener here for UI updates.
        const unsubscribe = FirebaseService.onAuthChange((newUser) => {
            if (mounted) {
                setUser(newUser);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const login = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            // This might trigger a redirect on mobile
            const result = await FirebaseService.handleLogin();

            if (!result) {
                // If no result, it means we're redirecting (mobile flow)
                setIsRedirecting(true);
                // Loading state stays true until we return
            } else {
                // Popup flow (desktop)
                setUser(result.user);
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            setLoading(false);
            setIsRedirecting(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            await FirebaseService.handleLogout();
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        loading,
        error,
        isRedirecting,
        login,
        logout,
        clearError
    };
}
