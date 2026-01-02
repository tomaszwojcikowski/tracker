import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FIREBASE_SYNC_ENABLED_KEY,
  isSyncEnabled,
  setSyncEnabled,
} from '../utils/firebaseSync';

describe('firebaseSync - isSyncEnabled/setSyncEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('defaults to enabled when not set', () => {
    expect(localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY)).toBeNull();
    expect(isSyncEnabled()).toBe(true);
  });

  it('reads false when stored false', () => {
    localStorage.setItem(FIREBASE_SYNC_ENABLED_KEY, 'false');
    expect(isSyncEnabled()).toBe(false);
  });

  it('setSyncEnabled persists and isSyncEnabled reflects it', () => {
    setSyncEnabled(false);
    expect(localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY)).toBe('false');
    expect(isSyncEnabled()).toBe(false);

    setSyncEnabled(true);
    expect(localStorage.getItem(FIREBASE_SYNC_ENABLED_KEY)).toBe('true');
    expect(isSyncEnabled()).toBe(true);
  });
});
