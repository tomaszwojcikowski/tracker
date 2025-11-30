import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage with actual storage implementation
const localStorageData = {};
const localStorageMock = {
  getItem: vi.fn((key) => localStorageData[key] ?? null),
  setItem: vi.fn((key, value) => { localStorageData[key] = value; }),
  removeItem: vi.fn((key) => { delete localStorageData[key]; }),
  clear: vi.fn(() => {
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
  }),
};

global.localStorage = localStorageMock;

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => 'Check',
  CheckCheck: () => 'CheckCheck',
  ChevronRight: () => 'ChevronRight',
  ChevronDown: () => 'ChevronDown',
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
}));