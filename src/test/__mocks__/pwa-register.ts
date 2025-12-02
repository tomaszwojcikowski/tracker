/**
 * Mock for virtual:pwa-register
 * Used in tests to avoid the Vite virtual module resolution
 */
export const registerSW = (): (() => void) => () => {};
