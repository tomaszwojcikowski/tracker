import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock;

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => 'Check',
  ChevronRight: () => 'ChevronRight',
  ChevronDown: () => 'ChevronDown',
  Plus: () => 'Plus',
  Calendar: () => 'Calendar',
  Dumbbell: () => 'Dumbbell',
  BookOpen: () => 'BookOpen',
  TrendingUp: () => 'TrendingUp',
  User: () => 'User',
  Clock: () => 'Clock',
  X: () => 'X',
}));