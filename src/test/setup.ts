import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage with actual storage implementation
const localStorageData: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string): string | null => localStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string): void => { localStorageData[key] = value; }),
  removeItem: vi.fn((key: string): void => { delete localStorageData[key]; }),
  clear: vi.fn((): void => {
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
  }),
};

(global as typeof globalThis & { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => 'Check',
  CheckCheck: () => 'CheckCheck',
  ChevronRight: () => 'ChevronRight',
  ChevronDown: () => 'ChevronDown',
  ChevronUp: () => 'ChevronUp',
  ChevronLeft: () => 'ChevronLeft',
  Plus: () => 'Plus',
  Minus: () => 'Minus',
  Calendar: () => 'Calendar',
  Dumbbell: () => 'Dumbbell',
  BookOpen: () => 'BookOpen',
  TrendingUp: () => 'TrendingUp',
  User: () => 'User',
  Clock: () => 'Clock',
  X: () => 'X',
  Cloud: () => 'Cloud',
  Play: () => 'Play',
  PlayCircle: () => 'PlayCircle',
  RefreshCw: () => 'RefreshCw',
  Info: () => 'Info',
  Palette: () => 'Palette',
  History: () => 'History',
  Settings: () => 'Settings',
  Zap: () => 'Zap',
  Activity: () => 'Activity',
}));