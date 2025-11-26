/// <reference types="vite/client" />

/**
 * Extend React's HTML attributes to support Lucide icon attributes
 * Lucide icons use data-lucide and optional width/height attributes on <i> elements
 */
declare namespace React {
    interface HTMLAttributes<T> {
        width?: string | number;
        height?: string | number;
    }
}

/**
 * Type declarations for virtual:pwa-register
 * This is a Vite virtual module provided by vite-plugin-pwa
 */
declare module 'virtual:pwa-register' {
    export interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: Error) => void;
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
