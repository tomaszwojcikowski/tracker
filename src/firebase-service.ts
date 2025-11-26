/// <reference types="vite/client" />
/**
 * Firebase Service Module
 *
 * Provides Firebase Authentication (Google Sign-In) and Realtime Database sync
 * for secure, serverless data synchronization across devices.
 *
 * Architecture:
 * - User-Private Data Model: Each user has their own branch at /users/{uid}
 * - Security: Firebase Security Rules ensure users can only access their own data
 * - Realtime Sync: Changes propagate instantly across all logged-in devices
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import {
    getAuth,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    Auth,
    User,
    UserCredential
} from "firebase/auth";
import {
    getDatabase,
    ref,
    onValue,
    set,
    Database,
    DatabaseReference,
    Unsubscribe,
    DataSnapshot
} from "firebase/database";
import { CloudData, FirebaseUser } from './types';

/**
 * Firebase configuration interface
 */
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

/**
 * Firebase status object
 */
export interface FirebaseStatus {
    initialized: boolean;
    loggedIn: boolean;
    user: FirebaseUser | null;
    syncActive: boolean;
    lastSyncTime: string | null;
}

/**
 * Callback types for initSync
 */
export type OnDataReceivedCallback = (data: CloudData | null) => void;
export type OnAuthChangeCallback = (user: User | null) => void;

// Re-export CloudData for consumers that import from firebase-service
export type { CloudData } from './types';

// Firebase configuration - loaded from environment variables at build time
// These are set in .env file or during deployment
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Firebase instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;
let provider: GoogleAuthProvider | null = null;

// Current user state
let currentUser: User | null = null;
let currentUserRef: DatabaseReference | null = null;
let syncListener: Unsubscribe | null = null;

// Last sync tracking
const LAST_SYNC_KEY = 'firebase_last_sync_time';

/**
 * Update the last sync timestamp
 */
function updateLastSyncTime(): void {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

/**
 * Initialize Firebase with configuration from environment variables
 * This is called automatically when the module loads
 * @returns True if initialization successful
 */
export function initializeFirebase(): boolean {
    try {
        const firebaseConfig = DEFAULT_FIREBASE_CONFIG;

        // Check if config is valid (has required fields)
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.warn('Firebase not configured. Cloud sync disabled. Set VITE_FIREBASE_* environment variables to enable.');
            return false;
        }

        // Initialize Firebase app
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);
        provider = new GoogleAuthProvider();

        console.log('Firebase initialized successfully');
        console.log('Project:', firebaseConfig.projectId);
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return false;
    }
}

// Auto-initialize Firebase when module loads
initializeFirebase();

/**
 * Check if Firebase is initialized and ready
 */
export function isFirebaseInitialized(): boolean {
    return app !== null && auth !== null && db !== null;
}

/**
 * Get current authentication state
 * @returns Current user object or null if not logged in
 */
export function getCurrentUser(): User | null {
    return currentUser;
}

/**
 * Sign in with Google popup
 * @returns User credential object
 */
export async function handleLogin(): Promise<UserCredential> {
    if (!isFirebaseInitialized() || !auth || !provider) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }

    try {
        const result = await signInWithPopup(auth, provider);
        console.log('User logged in:', result.user.uid);
        return result;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * Sign out the current user
 */
export async function handleLogout(): Promise<void> {
    if (!isFirebaseInitialized() || !auth) {
        throw new Error('Firebase not initialized');
    }

    try {
        // Clean up sync listener before logout using the unsubscribe function
        if (syncListener) {
            syncListener(); // Call the unsubscribe function
            syncListener = null;
        }
        currentUserRef = null;

        await signOut(auth);
        currentUser = null;
        console.log('User logged out');
    } catch (error) {
        console.error('Logout failed:', error);
        throw error;
    }
}

/**
 * Save data to Firebase under the current user's path
 * @param data - JSON data to save
 */
export async function saveToCloud(data: CloudData): Promise<void> {
    if (!isFirebaseInitialized()) {
        throw new Error('Firebase not initialized');
    }

    if (!currentUser) {
        throw new Error('No user logged in');
    }

    if (!currentUserRef) {
        throw new Error('User reference not initialized');
    }

    try {
        await set(currentUserRef, data);
        console.log('Data saved to cloud successfully');

        // Update last sync timestamp
        updateLastSyncTime();
    } catch (error) {
        console.error('Failed to save to cloud:', error);
        throw error;
    }
}

/**
 * Initialize sync system - sets up auth state listener and realtime sync
 * @param onDataReceived - Callback when data is received from cloud (snapshot)
 * @param onAuthChange - Callback when auth state changes (user or null)
 */
export function initSync(
    onDataReceived?: OnDataReceivedCallback,
    onAuthChange?: OnAuthChangeCallback
): void {
    if (!isFirebaseInitialized() || !auth || !db) {
        console.warn('Firebase not initialized. Sync disabled.');
        return;
    }

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user: User | null) => {
        currentUser = user;

        if (user) {
            console.log(`User logged in: ${user.uid}`);
            console.log(`Email: ${user.email}`);
            console.log(`Display Name: ${user.displayName}`);

            // Reference to this user's private data path
            // IMPORTANT: Set currentUserRef BEFORE calling onAuthChange callback
            // to avoid race condition where callback tries to use currentUserRef before it's initialized
            currentUserRef = ref(db!, `users/${user.uid}`);

            // Clean up any existing listener using the unsubscribe function
            if (syncListener) {
                syncListener(); // Call the unsubscribe function
            }

            // Set up realtime listener
            // Fires immediately on login, and again whenever data changes remotely
            // onValue returns an unsubscribe function
            syncListener = onValue(currentUserRef, (snapshot: DataSnapshot) => {
                const data = snapshot.val() as CloudData | null;
                console.log('Data received from Firebase:', data ? 'yes' : 'no data');

                // Update last sync timestamp when data is received
                if (data) {
                    updateLastSyncTime();
                }

                if (onDataReceived) {
                    onDataReceived(data);
                }
            }, (error: Error) => {
                console.error('Firebase read error:', error);
            });

        } else {
            console.log('User logged out');

            // Clean up listener using the unsubscribe function
            if (syncListener) {
                syncListener(); // Call the unsubscribe function
                syncListener = null;
            }
            currentUserRef = null;
        }

        // Notify about auth state change AFTER setting up user reference
        // This ensures currentUserRef is initialized before the callback can use it
        if (onAuthChange) {
            onAuthChange(user);
        }
    });
}

/**
 * Get last sync timestamp
 * @returns ISO timestamp of last sync or null if never synced
 */
export function getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Get Firebase configuration status
 * @returns Status information
 */
export function getFirebaseStatus(): FirebaseStatus {
    return {
        initialized: isFirebaseInitialized(),
        loggedIn: currentUser !== null,
        user: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
        } : null,
        syncActive: syncListener !== null,
        lastSyncTime: getLastSyncTime()
    };
}
