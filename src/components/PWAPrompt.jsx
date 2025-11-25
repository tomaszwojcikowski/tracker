/**
 * PWA Update Prompt Component
 * Shows notifications for app updates and offline status
 */
import React from 'react';

/**
 * Update notification toast
 */
export function UpdatePrompt({ needRefresh, offlineReady, isOnline, onAccept, onDismiss, onDismissOffline }) {
  // Prioritize update available notification over offline ready
  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-blue-900/95 backdrop-blur-sm border border-blue-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-blue-100">Update Available</h3>
              <p className="text-xs text-blue-300 mt-0.5">
                A new version is available. Reload to update.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={onAccept}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Reload Now
                </button>
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 bg-blue-800/50 hover:bg-blue-700/50 text-blue-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show offline ready toast (only when online, so message makes sense)
  if (offlineReady && isOnline) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-green-900/95 backdrop-blur-sm border border-green-700 rounded-xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-green-100">Ready for Offline Use</h3>
              <p className="text-xs text-green-300 mt-0.5">
                App cached successfully. You can now use it offline.
              </p>
            </div>
            <button
              onClick={onDismissOffline}
              className="flex-shrink-0 text-green-400 hover:text-green-200 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Offline indicator banner
 */
export function OfflineBanner({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/95 backdrop-blur-sm border-b border-amber-700">
      <div className="flex items-center justify-center gap-2 py-2 px-4">
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="text-xs font-medium text-amber-200">
          You're offline. Changes will sync when reconnected.
        </span>
      </div>
    </div>
  );
}

export default UpdatePrompt;
