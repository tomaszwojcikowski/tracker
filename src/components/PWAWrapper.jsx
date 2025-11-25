/**
 * PWA Wrapper Component
 * Provides PWA functionality to the app including update prompts and offline indicators
 */
import React from 'react';
import { usePWA } from '../hooks/usePWA.js';
import { UpdatePrompt, OfflineBanner } from './PWAPrompt.jsx';

export function PWAWrapper({ children }) {
  const {
    needRefresh,
    offlineReady,
    isOnline,
    acceptUpdate,
    dismissUpdate,
    dismissOfflineReady
  } = usePWA();

  return (
    <>
      {/* Offline banner at top of screen */}
      <OfflineBanner isOnline={isOnline} />
      
      {/* Main app content */}
      {children}
      
      {/* Update/offline ready prompts */}
      <UpdatePrompt
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        isOnline={isOnline}
        onAccept={acceptUpdate}
        onDismiss={dismissUpdate}
        onDismissOffline={dismissOfflineReady}
      />
    </>
  );
}

export default PWAWrapper;
