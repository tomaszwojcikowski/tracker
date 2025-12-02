/**
 * OAuth Utility Tests
 *
 * Tests for OAuth redirect detection and flag management
 * to fix IndexedDB issues on OnePlus 12 devices.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    isOAuthRedirect,
    setOAuthInProgress,
    clearOAuthInProgress,
    isOAuthInProgress,
    isIndexedDBBackingStoreError,
} from '../utils/oauth';

// Mock sessionStorage
const mockSessionStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

// Save original objects
const originalSessionStorage = global.sessionStorage;
const originalLocation = window.location;

describe('OAuth Utilities', () => {
    beforeEach(() => {
        mockSessionStorage.clear();
        Object.defineProperty(global, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(global, 'sessionStorage', {
            value: originalSessionStorage,
            writable: true,
        });
    });

    describe('setOAuthInProgress / isOAuthInProgress / clearOAuthInProgress', () => {
        it('should set the OAuth in-progress flag', () => {
            expect(isOAuthInProgress()).toBe(false);
            setOAuthInProgress();
            expect(isOAuthInProgress()).toBe(true);
        });

        it('should clear the OAuth in-progress flag', () => {
            setOAuthInProgress();
            expect(isOAuthInProgress()).toBe(true);
            clearOAuthInProgress();
            expect(isOAuthInProgress()).toBe(false);
        });

        it('should handle multiple set calls', () => {
            setOAuthInProgress();
            setOAuthInProgress();
            expect(isOAuthInProgress()).toBe(true);
            clearOAuthInProgress();
            expect(isOAuthInProgress()).toBe(false);
        });

        it('should handle clear when flag is not set', () => {
            expect(isOAuthInProgress()).toBe(false);
            clearOAuthInProgress();
            expect(isOAuthInProgress()).toBe(false);
        });
    });

    describe('isOAuthRedirect', () => {
        const setMockLocation = (href, search = '') => {
            delete window.location;
            // Parse search from href if not explicitly provided
            if (!search && href.includes('?')) {
                search = href.substring(href.indexOf('?'));
            }
            window.location = { href, search };
        };

        afterEach(() => {
            window.location = originalLocation;
        });

        it('should return false when no OAuth parameters and no flag', () => {
            setMockLocation('https://example.com/tracker/', '');
            expect(isOAuthRedirect()).toBe(false);
        });

        it('should return true when URL contains code parameter', () => {
            setMockLocation('https://example.com/tracker/?code=abc123&scope=email');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when URL contains state parameter', () => {
            setMockLocation('https://example.com/tracker/?state=xyz789');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when URL contains both code and state parameters', () => {
            setMockLocation('https://example.com/tracker/?code=abc123&state=xyz789');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when OAuth flag is set even without URL parameters', () => {
            setMockLocation('https://example.com/tracker/', '');
            setOAuthInProgress();
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when both URL parameters and flag are present', () => {
            setMockLocation('https://example.com/tracker/?code=abc123');
            setOAuthInProgress();
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should not detect partial matches like encode=', () => {
            // Using URLSearchParams ensures precise matching
            setMockLocation('https://example.com/tracker/?encode=true');
            expect(isOAuthRedirect()).toBe(false);
        });

        it('should not detect partial matches like estate=', () => {
            // Using URLSearchParams ensures precise matching
            setMockLocation('https://example.com/tracker/?estate=value');
            expect(isOAuthRedirect()).toBe(false);
        });
    });

    describe('Edge cases', () => {
        const setMockLocation = (href, search = '') => {
            delete window.location;
            if (!search && href.includes('?') && !href.includes('#')) {
                search = href.substring(href.indexOf('?'));
            } else if (!search && href.includes('?') && href.includes('#')) {
                // Handle ?query#hash case - extract query before hash
                const hashIndex = href.indexOf('#');
                const queryIndex = href.indexOf('?');
                if (queryIndex < hashIndex) {
                    search = href.substring(queryIndex, hashIndex);
                }
            }
            window.location = { href, search };
        };

        beforeEach(() => {
            // Need to access the global mock, not create new
            Object.defineProperty(global, 'sessionStorage', {
                value: mockSessionStorage,
                writable: true,
            });
            mockSessionStorage.clear();
        });

        afterEach(() => {
            window.location = originalLocation;
        });

        it('should work with complex URLs containing OAuth params', () => {
            setMockLocation('https://example.com/tracker/?foo=bar&code=abc123&other=value');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should handle hash-based routing - OAuth params in query string', () => {
            // When OAuth params are in query string, they're detected
            setMockLocation('https://example.com/tracker/?code=abc123#/home', '?code=abc123');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should handle URL-encoded parameters', () => {
            setMockLocation('https://example.com/tracker/?code=abc%20123');
            expect(isOAuthRedirect()).toBe(true);
        });
    });
});

describe('PWA integration scenario', () => {
    const setMockLocation = (href, search = '') => {
        delete window.location;
        if (!search && href.includes('?')) {
            search = href.substring(href.indexOf('?'));
        }
        window.location = { href, search };
    };

    beforeEach(() => {
        mockSessionStorage.clear();
        Object.defineProperty(global, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true,
        });
    });

    afterEach(() => {
        window.location = originalLocation;
        Object.defineProperty(global, 'sessionStorage', {
            value: originalSessionStorage,
            writable: true,
        });
    });

    it('should correctly handle the full OAuth flow lifecycle', () => {
        // Step 1: User is on the app, no OAuth in progress
        setMockLocation('https://example.com/tracker/', '');
        expect(isOAuthRedirect()).toBe(false);
        expect(isOAuthInProgress()).toBe(false);

        // Step 2: User clicks login, OAuth flag is set before redirect
        setOAuthInProgress();
        expect(isOAuthInProgress()).toBe(true);
        expect(isOAuthRedirect()).toBe(true);

        // Step 3: Page returns from OAuth redirect with code parameter
        setMockLocation('https://example.com/tracker/?code=abc123&state=xyz789');
        expect(isOAuthRedirect()).toBe(true);

        // Step 4: Authentication completes successfully, flag is cleared
        clearOAuthInProgress();
        expect(isOAuthInProgress()).toBe(false);

        // Step 5: On subsequent navigations (without OAuth params), redirect detection is false
        setMockLocation('https://example.com/tracker/', '');
        expect(isOAuthRedirect()).toBe(false);
    });
});

describe('isIndexedDBBackingStoreError', () => {
    it('should return true for IndexedDB backing store error', () => {
        const error = {
            name: 'UnknownError',
            message: 'Internal error opening backing store for indexedDB.open.'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(true);
    });

    it('should return true for error with IndexedDB in message', () => {
        const error = {
            name: 'UnknownError',
            message: 'IndexedDB connection failed'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(true);
    });

    it('should return true for error with indexedDB (lowercase) in message', () => {
        const error = {
            name: 'UnknownError',
            message: 'Failed to open indexedDB database'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(true);
    });

    it('should return false for non-UnknownError errors', () => {
        const error = {
            name: 'TypeError',
            message: 'Internal error opening backing store for indexedDB.open.'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(false);
    });

    it('should return false for UnknownError without IndexedDB message', () => {
        const error = {
            name: 'UnknownError',
            message: 'Something else went wrong'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(false);
    });

    it('should return false for null', () => {
        expect(isIndexedDBBackingStoreError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
        expect(isIndexedDBBackingStoreError(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
        expect(isIndexedDBBackingStoreError('error string')).toBe(false);
        expect(isIndexedDBBackingStoreError(123)).toBe(false);
        expect(isIndexedDBBackingStoreError(true)).toBe(false);
    });

    it('should handle error without message property', () => {
        const error = { name: 'UnknownError' };
        expect(isIndexedDBBackingStoreError(error)).toBe(false);
    });

    it('should match the exact error from OnePlus 12 device', () => {
        // This is the actual error format seen in the problem statement
        const error = {
            name: 'UnknownError',
            message: 'Internal error opening backing store for indexedDB.open.'
        };
        expect(isIndexedDBBackingStoreError(error)).toBe(true);
    });
});
