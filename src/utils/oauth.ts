/**
 * OAuth Utility Functions
 *
 * Provides utilities for handling OAuth redirect flows, specifically
 * to work around IndexedDB issues on OnePlus 12 devices where the
 * browser's IndexedDB fails to initialize properly after OAuth redirects.
 *
 * The issue occurs because:
 * 1. Google Sign-In redirect briefly unloads the page
 * 2. When returning, the service worker tries to access IndexedDB
 *    before the browser has fully restored its state
 * 3. The IndexedDB backing store fails to open, causing errors
 *
 * Solution:
 * 1. Main app: Skip service worker registration during OAuth redirects (usePWA.ts)
 * 2. Service worker: Gracefully handle IndexedDB errors with unhandledrejection handler (sw.ts)
 * 3. Caching: Use CacheableResponsePlugin instead of ExpirationPlugin to avoid IndexedDB usage
 */

const OAUTH_IN_PROGRESS_KEY = 'oauth_in_progress';

/**
 * Check if an error is an IndexedDB backing store error
 * This error occurs on some devices (e.g., OnePlus 12) when IndexedDB
 * fails to initialize properly after OAuth redirect
 *
 * Note: This function is also defined in src/sw.ts for use in the service worker,
 * which is built separately and can't import from this module.
 * Keep both versions in sync if changes are needed.
 *
 * @param error - The error to check
 * @returns true if this is an IndexedDB backing store error
 */
export function isIndexedDBBackingStoreError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as { name?: string; message?: string };
    if (err.name !== 'UnknownError') return false;

    const message = String(err.message || '');
    return (
        message.includes('IndexedDB') ||
        message.includes('indexedDB') ||
        message.includes('backing store')
    );
}

/**
 * Check if the current page load is from an OAuth redirect
 * This detects common OAuth callback parameters in the URL using
 * URLSearchParams for precise matching (avoids false positives like 'encode=')
 */
export function isOAuthRedirect(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof sessionStorage === 'undefined') return false;

    // Use URLSearchParams for precise parameter matching
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = searchParams.has('code') || searchParams.has('state');
    const hasOAuthFlag = sessionStorage.getItem(OAUTH_IN_PROGRESS_KEY) === 'true';

    return hasOAuthParams || hasOAuthFlag;
}

/**
 * Set the OAuth in-progress flag before redirecting to OAuth provider
 * This flag persists across the redirect and is used to delay service worker registration
 */
export function setOAuthInProgress(): void {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(OAUTH_IN_PROGRESS_KEY, 'true');
    }
}

/**
 * Clear the OAuth in-progress flag after successful authentication
 * This should be called after the OAuth flow completes successfully
 */
export function clearOAuthInProgress(): void {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
    }
}

/**
 * Get the current OAuth in-progress state
 * Useful for debugging and testing
 */
export function isOAuthInProgress(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(OAUTH_IN_PROGRESS_KEY) === 'true';
}
