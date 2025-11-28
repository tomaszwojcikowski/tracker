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
 * 3. The IndexedDB backing store fails to open, breaking authentication
 */

const OAUTH_IN_PROGRESS_KEY = 'oauth_in_progress';

/**
 * Check if the current page load is from an OAuth redirect
 * This detects common OAuth callback parameters in the URL
 */
export function isOAuthRedirect(): boolean {
    if (typeof window === 'undefined') return false;

    const url = window.location.href;
    const hasOAuthParams = url.includes('code=') || url.includes('state=');
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
