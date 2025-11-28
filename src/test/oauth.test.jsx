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
        const setMockLocation = (href) => {
            delete window.location;
            window.location = { href };
        };

        afterEach(() => {
            window.location = originalLocation;
        });

        it('should return false when no OAuth parameters and no flag', () => {
            setMockLocation('https://example.com/tracker/');
            expect(isOAuthRedirect()).toBe(false);
        });

        it('should return true when URL contains code= parameter', () => {
            setMockLocation('https://example.com/tracker/?code=abc123&scope=email');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when URL contains state= parameter', () => {
            setMockLocation('https://example.com/tracker/?state=xyz789');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when URL contains both code= and state= parameters', () => {
            setMockLocation('https://example.com/tracker/?code=abc123&state=xyz789');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when OAuth flag is set even without URL parameters', () => {
            setMockLocation('https://example.com/tracker/');
            setOAuthInProgress();
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should return true when both URL parameters and flag are present', () => {
            setMockLocation('https://example.com/tracker/?code=abc123');
            setOAuthInProgress();
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should detect code= even as part of longer parameter names', () => {
            // This is a trade-off: simple substring matching may match encode=,
            // but this is acceptable because the only effect is a brief delay
            // in service worker registration, which doesn't break functionality.
            setMockLocation('https://example.com/tracker/?encode=true');
            expect(isOAuthRedirect()).toBe(true);
        });

        it('should detect state= even as part of longer parameter names', () => {
            // Same trade-off as above - simple matching for robustness
            setMockLocation('https://example.com/tracker/?estate=value');
            expect(isOAuthRedirect()).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should work with complex URLs containing OAuth params', () => {
            delete window.location;
            window.location = { href: 'https://example.com/tracker/?foo=bar&code=abc123&other=value' };
            expect(isOAuthRedirect()).toBe(true);
            window.location = originalLocation;
        });

        it('should work with hash-based routing and OAuth params', () => {
            delete window.location;
            window.location = { href: 'https://example.com/tracker/#/home?code=abc123' };
            expect(isOAuthRedirect()).toBe(true);
            window.location = originalLocation;
        });

        it('should handle URL-encoded parameters', () => {
            delete window.location;
            window.location = { href: 'https://example.com/tracker/?code=abc%20123' };
            expect(isOAuthRedirect()).toBe(true);
            window.location = originalLocation;
        });
    });
});

describe('PWA integration scenario', () => {
    const setMockLocation = (href) => {
        delete window.location;
        window.location = { href };
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
        setMockLocation('https://example.com/tracker/');
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
        setMockLocation('https://example.com/tracker/');
        expect(isOAuthRedirect()).toBe(false);
    });
});
