import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from '../components/views/SettingsView';

const mocks = vi.hoisted(() => {
  return {
    scheduleSync: vi.fn(),
    resetProgramProgress: vi.fn(),
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
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../firebase-service', () => ({
  isFirebaseInitialized: () => false,
  initSync: vi.fn(),
  saveToCloud: vi.fn(),
}));

vi.mock('../services/SyncService', () => ({
  syncService: {
    scheduleSync: mocks.scheduleSync,
    syncNow: vi.fn(),
  },
}));

vi.mock('../utils/programImportExport', () => ({
  resetProgramProgress: mocks.resetProgramProgress,
}));

vi.mock('../services/storageNamespace', () => ({
  getActiveProgramId: () => 'program-1',
}));

// Keep this test focused on SettingsView; avoid pulling ProgramSelector dependencies.
vi.mock('../components/ProgramSelector', () => ({
  ProgramSelector: () => <div>ProgramSelector</div>,
}));

describe('SettingsView - clear progress data', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // SettingsView references Vite-injected build constants.
    (globalThis as unknown as { __BUILD_VERSION__: string }).__BUILD_VERSION__ = 'test';
    (globalThis as unknown as { __BUILD_DATE__: string }).__BUILD_DATE__ = new Date().toISOString();
  });

  it('should call resetProgramProgress for the active program when clicking Clear your progress data', () => {
    render(<SettingsView />);

    // Switch to Programs tab
    fireEvent.click(screen.getByRole('button', { name: /programs/i }));

    // Click clear progress data button
    fireEvent.click(screen.getByRole('button', { name: /clear your progress data/i }));

    // Confirm the dialog by clicking "Delete Progress" button
    fireEvent.click(screen.getByRole('button', { name: /delete progress/i }));

    expect(mocks.resetProgramProgress).toHaveBeenCalledWith('program-1');
    expect(mocks.scheduleSync).toHaveBeenCalled();
  });
});
