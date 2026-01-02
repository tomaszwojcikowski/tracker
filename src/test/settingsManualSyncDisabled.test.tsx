import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from '../components/views/SettingsView';

const mocks = vi.hoisted(() => {
  return {
    syncNow: vi.fn(),
  };
});

vi.mock('../hooks', () => ({
  useHaptic: () => ({
    tick: vi.fn(),
    bump: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    swipe: vi.fn(),
  }),
  useScrollToTop: () => undefined,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user-1' },
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../firebase-service', () => ({
  isFirebaseInitialized: () => true,
  initSync: vi.fn(),
  saveToCloud: vi.fn(),
  getCurrentUser: vi.fn(() => ({ uid: 'user-1' })),
  getLastSyncTime: vi.fn(() => null),
}));

vi.mock('../services/SyncService', () => ({
  syncService: {
    scheduleSync: vi.fn(),
    syncNow: mocks.syncNow,
  },
}));

vi.mock('../utils/firebaseSync', async () => {
  const actual = await vi.importActual<typeof import('../utils/firebaseSync')>('../utils/firebaseSync');
  return {
    ...actual,
    isSyncEnabled: () => false,
    setSyncEnabled: vi.fn(),
  };
});

// Keep this test focused; avoid pulling ProgramSelector dependencies.
vi.mock('../components/ProgramSelector', () => ({
  ProgramSelector: () => <div>ProgramSelector</div>,
}));

describe('SettingsView - manual sync when disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (globalThis as unknown as { __BUILD_VERSION__: string }).__BUILD_VERSION__ = 'test';
    (globalThis as unknown as { __BUILD_DATE__: string }).__BUILD_DATE__ = new Date().toISOString();
  });

  it('should not call syncNow and should show a disabled message', () => {
    render(<SettingsView />);

    fireEvent.click(screen.getByRole('button', { name: /sync now/i }));

    expect(mocks.syncNow).not.toHaveBeenCalled();
    expect(screen.getByText(/sync is disabled/i)).toBeInTheDocument();
  });
});
