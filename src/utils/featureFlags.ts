/**
 * Feature Flags
 *
 * Lightweight client-side feature flags backed by `localStorage`. Used to
 * roll out experimental UI behind toggles. Flags are read synchronously and
 * cached for the lifetime of the page (re-read on `'storage'` events).
 *
 * Defaults are conservative: every flag is OFF unless explicitly enabled.
 *
 * Toggling from the browser console:
 *   localStorage.setItem('tracker_feature_set_table', '1');
 *   location.reload();
 */

import { useEffect, useState } from 'react';

export type FeatureFlag =
    /** P1 — Strong/Hevy-style per-set table inside ExerciseCard. */
    | 'set_table';

const STORAGE_PREFIX = 'tracker_feature_';

const DEFAULTS: Record<FeatureFlag, boolean> = {
    set_table: false,
};

const storageKey = (flag: FeatureFlag): string => `${STORAGE_PREFIX}${flag}`;

const readFlag = (flag: FeatureFlag): boolean => {
    if (typeof window === 'undefined') return DEFAULTS[flag];
    try {
        const raw = window.localStorage.getItem(storageKey(flag));
        if (raw === null) return DEFAULTS[flag];
        return raw === '1' || raw === 'true';
    } catch {
        return DEFAULTS[flag];
    }
};

/** Synchronous read. Use outside React components or in event handlers. */
export const isFeatureEnabled = (flag: FeatureFlag): boolean => readFlag(flag);

/** React hook that re-renders when the flag changes (cross-tab via storage events). */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
    const [enabled, setEnabled] = useState<boolean>(() => readFlag(flag));

    useEffect(() => {
        const onStorage = (e: StorageEvent): void => {
            if (e.key === storageKey(flag)) {
                setEnabled(readFlag(flag));
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [flag]);

    return enabled;
};

/** Programmatically enable/disable a flag (for tests, settings UI, devtools). */
export const setFeatureFlag = (flag: FeatureFlag, value: boolean): void => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(storageKey(flag), value ? '1' : '0');
        // Notify same-tab listeners (storage events only fire cross-tab).
        window.dispatchEvent(
            new StorageEvent('storage', { key: storageKey(flag), newValue: value ? '1' : '0' })
        );
    } catch {
        /* ignore quota / private mode errors */
    }
};
