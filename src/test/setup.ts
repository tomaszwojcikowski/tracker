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

// Mock custom icons module
const mockIcon = () => 'MockIcon';
vi.mock('../components/icons', () => ({
  Check: mockIcon,
  CheckCircle: mockIcon,
  CheckCircle2: mockIcon,
  CheckCheck: mockIcon,
  AlertCircle: mockIcon,
  ChevronRight: mockIcon,
  ChevronDown: mockIcon,
  ChevronUp: mockIcon,
  ChevronLeft: mockIcon,
  Plus: mockIcon,
  Minus: mockIcon,
  Calendar: mockIcon,
  Dumbbell: mockIcon,
  BookOpen: mockIcon,
  TrendingUp: mockIcon,
  User: mockIcon,
  Clock: mockIcon,
  X: mockIcon,
  Cloud: mockIcon,
  Play: mockIcon,
  Pause: mockIcon,
  PlayCircle: mockIcon,
  RefreshCw: mockIcon,
  Info: mockIcon,
  Palette: mockIcon,
  History: mockIcon,
  Settings: mockIcon,
  Settings2: mockIcon,
  Zap: mockIcon,
  Activity: mockIcon,
  Search: mockIcon,
  Target: mockIcon,
  Loader2: mockIcon,
  Trophy: mockIcon,
  Flame: mockIcon,
  Star: mockIcon,
  Award: mockIcon,
  ArrowRightLeft: mockIcon,
  Timer: mockIcon,
  Gauge: mockIcon,
  Maximize2: mockIcon,
  Minimize2: mockIcon,
  Volume2: mockIcon,
  VolumeX: mockIcon,
  ClipboardList: mockIcon,
  FileText: mockIcon,
  Edit3: mockIcon,
  Save: mockIcon,
  XCircle: mockIcon,
  BarChart2: mockIcon,
  Repeat: mockIcon,
  Link: mockIcon,
  RotateCcw: mockIcon,
  LogOut: mockIcon,
  Download: mockIcon,
}));
