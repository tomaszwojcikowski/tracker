/**
 * PWA Components Tests
 * Tests for PWA update prompts and offline indicators
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { UpdatePrompt, OfflineBanner } from '../components/PWAPrompt.jsx';

describe('OfflineBanner', () => {
  it('should render when offline', () => {
    render(<OfflineBanner isOnline={false} />);
    expect(screen.getByText(/You're offline/i)).toBeInTheDocument();
  });

  it('should not render when online', () => {
    const { container } = render(<OfflineBanner isOnline={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show sync message when offline', () => {
    render(<OfflineBanner isOnline={false} />);
    expect(screen.getByText(/Changes will sync when reconnected/i)).toBeInTheDocument();
  });
});

describe('UpdatePrompt', () => {
  const defaultProps = {
    needRefresh: false,
    offlineReady: false,
    isOnline: true,
    onAccept: vi.fn(),
    onDismiss: vi.fn(),
    onDismissOffline: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no update needed and not offline ready', () => {
    const { container } = render(<UpdatePrompt {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show offline ready notification', () => {
    render(
      <UpdatePrompt
        {...defaultProps}
        offlineReady={true}
        isOnline={true}
      />
    );
    expect(screen.getByText(/ready for offline use/i)).toBeInTheDocument();
  });

  it('should show update available notification', () => {
    render(
      <UpdatePrompt
        {...defaultProps}
        needRefresh={true}
      />
    );
    expect(screen.getByText(/Update available/i)).toBeInTheDocument();
  });

  it('should have reload action button for updates', () => {
    render(
      <UpdatePrompt
        {...defaultProps}
        needRefresh={true}
      />
    );
    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    expect(reloadButton).toBeInTheDocument();
  });

  it('should call onAccept when reload button clicked', () => {
    const onAccept = vi.fn();
    render(
      <UpdatePrompt
        {...defaultProps}
        needRefresh={true}
        onAccept={onAccept}
      />
    );

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    fireEvent.click(reloadButton);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('should prioritize update notification over offline ready', () => {
    render(
      <UpdatePrompt
        {...defaultProps}
        needRefresh={true}
        offlineReady={true}
        isOnline={true}
      />
    );

    // Update should show, not offline ready
    expect(screen.getByText(/Update available/i)).toBeInTheDocument();
    expect(screen.queryByText(/ready for offline use/i)).not.toBeInTheDocument();
  });

  it('should not show offline ready when offline', () => {
    const { container } = render(
      <UpdatePrompt
        {...defaultProps}
        offlineReady={true}
        isOnline={false}
      />
    );
    // Don't show "ready for offline" when actually offline - that's redundant
    expect(container.firstChild).toBeNull();
  });
});
