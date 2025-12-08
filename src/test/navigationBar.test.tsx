/**
 * Comprehensive tests for NavigationBar component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationBar } from '../components/navigation/NavigationBar';
import type { TabId } from '../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Create a mock function that can be controlled
const mockUseMediaQuery = vi.fn(() => false);

// Mock hooks
vi.mock('../hooks', () => ({
  useHaptic: () => ({
    tick: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
  }),
  useMediaQuery: () => mockUseMediaQuery(),
}));

describe('NavigationBar', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
    mockUseMediaQuery.mockReturnValue(false); // Default to mobile view
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mobile View (Bottom Navigation)', () => {
    it('should render all navigation items', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      expect(screen.getByLabelText('Train')).toBeInTheDocument();
      expect(screen.getByLabelText('Library')).toBeInTheDocument();
      expect(screen.getByLabelText('History')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('should mark active tab with aria-current', () => {
      render(<NavigationBar activeTab="library" onTabChange={mockOnTabChange} />);

      expect(screen.getByLabelText('Library')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByLabelText('Train')).not.toHaveAttribute('aria-current', 'page');
    });

    it('should call onTabChange when tab is clicked', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      fireEvent.click(screen.getByLabelText('History'));

      expect(mockOnTabChange).toHaveBeenCalledWith('history');
    });

    it('should render as bottom navigation on mobile', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'bottom-0');
    });

    it('should have proper ARIA role', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Desktop View (Navigation Rail)', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true);
    });

    it('should render as side rail on desktop', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'left-0');
    });

    it('should render all navigation items', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      expect(screen.getByLabelText('Train')).toBeInTheDocument();
      expect(screen.getByLabelText('Library')).toBeInTheDocument();
      expect(screen.getByLabelText('History')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('should call onTabChange when tab is clicked', () => {
      render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      fireEvent.click(screen.getByLabelText('Library'));

      expect(mockOnTabChange).toHaveBeenCalledWith('library');
    });
  });

  describe('Tab Interactions', () => {
    it('should update active state correctly', () => {
      const { rerender } = render(<NavigationBar activeTab="train" onTabChange={mockOnTabChange} />);

      expect(screen.getByLabelText('Train')).toHaveAttribute('aria-current', 'page');

      rerender(<NavigationBar activeTab="history" onTabChange={mockOnTabChange} />);

      expect(screen.getByLabelText('Train')).not.toHaveAttribute('aria-current', 'page');
      expect(screen.getByLabelText('History')).toHaveAttribute('aria-current', 'page');
    });

    it('should handle all tab types', () => {
      const tabs: TabId[] = ['train', 'library', 'history', 'profile'];

      tabs.forEach(tab => {
        const { unmount } = render(<NavigationBar activeTab={tab} onTabChange={mockOnTabChange} />);

        // Find the currently active tab
        const activeButton = screen.getByRole('button', { current: 'page' });
        expect(activeButton).toBeInTheDocument();

        unmount();
      });
    });
  });
});
