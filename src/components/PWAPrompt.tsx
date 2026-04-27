/**
 * PWA Update Prompt Component
 * Shows notifications for app updates and offline status using MD3 Snackbar
 */
import React from 'react';
import { Snackbar } from './Snackbar';

export interface UpdatePromptProps {
  needRefresh: boolean;
  offlineReady: boolean;
  isOnline: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  onDismissOffline: () => void;
}

/**
 * Update notification using Snackbar
 */
export function UpdatePrompt({ needRefresh, offlineReady, isOnline, onAccept, onDismiss, onDismissOffline }: UpdatePromptProps): React.ReactElement | null {
  // Prioritize update available notification over offline ready
  if (needRefresh) {
    return (
      <Snackbar
        isOpen={true}
        message="Update available. Reload to get the latest version."
        actionLabel="Reload"
        onAction={onAccept}
        onClose={onDismiss}
        duration={0} // No auto-dismiss for updates
        type="info"
      />
    );
  }

  // Show offline ready toast (only when online, so message makes sense)
  if (offlineReady && isOnline) {
    return (
      <Snackbar
        isOpen={true}
        message="App ready for offline use"
        onClose={onDismissOffline}
        duration={4000}
        type="success"
      />
    );
  }

  return null;
}

export interface OfflineBannerProps {
  isOnline: boolean;
}

/**
 * Offline indicator banner
 */
export function OfflineBanner({ isOnline }: OfflineBannerProps): React.ReactElement | null {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-sys-tertiaryContainer border-b border-sys-tertiary">
      <div className="flex items-center justify-center gap-2 py-2 px-4">
        <svg className="w-4 h-4 text-sys-onTertiaryContainer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="text-xs font-medium text-sys-onTertiaryContainer">
          You're offline. Changes will sync when reconnected.
        </span>
      </div>
    </div>
  );
}
