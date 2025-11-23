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

import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInWithPopup, 
    signOut,
    GoogleAuthProvider, 
    onAuthStateChanged 
} from "firebase/auth";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set,
    off 
} from "firebase/database";

// Firebase configuration - This should be replaced with actual project config
// Get these values from Firebase Console > Project Settings
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// Firebase instances
let app = null;
let auth = null;
let db = null;
let provider = null;

// Current user state
let currentUser = null;
let currentUserRef = null;
let syncListener = null;

/**
 * Initialize Firebase with custom configuration
 * @param {Object} config - Firebase configuration object
 * @returns {boolean} - True if initialization successful
 */
export function initializeFirebase(config = null) {
    try {
        // Use provided config or default
        const firebaseConfig = config || DEFAULT_FIREBASE_CONFIG;
        
        // Check if config is valid (has required fields)
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.warn('Firebase config incomplete. Sync disabled.');
            return false;
        }
        
        // Initialize Firebase app
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getDatabase(app);
        provider = new GoogleAuthProvider();
        
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return false;
    }
}

/**
 * Check if Firebase is initialized and ready
 * @returns {boolean}
 */
export function isFirebaseInitialized() {
    return app !== null && auth !== null && db !== null;
}

/**
 * Get current authentication state
 * @returns {Object|null} - Current user object or null if not logged in
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Sign in with Google popup
 * @returns {Promise<Object>} - User credential object
 */
export async function handleLogin() {
    if (!isFirebaseInitialized()) {
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
 * @returns {Promise<void>}
 */
export async function handleLogout() {
    if (!isFirebaseInitialized()) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        // Clean up sync listener before logout
        if (syncListener && currentUserRef) {
            off(currentUserRef);
            syncListener = null;
            currentUserRef = null;
        }
        
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
 * @param {Object} data - JSON data to save
 * @returns {Promise<void>}
 */
export async function saveToCloud(data) {
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
    } catch (error) {
        console.error('Failed to save to cloud:', error);
        throw error;
    }
}

/**
 * Initialize sync system - sets up auth state listener and realtime sync
 * @param {Function} onDataReceived - Callback when data is received from cloud (snapshot)
 * @param {Function} onAuthChange - Callback when auth state changes (user or null)
 */
export function initSync(onDataReceived, onAuthChange) {
    if (!isFirebaseInitialized()) {
        console.warn('Firebase not initialized. Sync disabled.');
        return;
    }
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        
        // Notify about auth state change
        if (onAuthChange) {
            onAuthChange(user);
        }
        
        if (user) {
            console.log(`User logged in: ${user.uid}`);
            console.log(`Email: ${user.email}`);
            console.log(`Display Name: ${user.displayName}`);
            
            // Reference to this user's private data path
            currentUserRef = ref(db, `users/${user.uid}`);
            
            // Clean up any existing listener
            if (syncListener) {
                off(currentUserRef);
            }
            
            // Set up realtime listener
            // Fires immediately on login, and again whenever data changes remotely
            syncListener = onValue(currentUserRef, (snapshot) => {
                const data = snapshot.val();
                console.log('Data received from Firebase:', data ? 'yes' : 'no data');
                
                if (onDataReceived) {
                    onDataReceived(data);
                }
            }, (error) => {
                console.error('Firebase read error:', error);
            });
            
        } else {
            console.log('User logged out');
            
            // Clean up listener
            if (syncListener && currentUserRef) {
                off(currentUserRef);
                syncListener = null;
                currentUserRef = null;
            }
        }
    });
}

/**
 * Get Firebase configuration status
 * @returns {Object} - Status information
 */
export function getFirebaseStatus() {
    return {
        initialized: isFirebaseInitialized(),
        loggedIn: currentUser !== null,
        user: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
        } : null,
        syncActive: syncListener !== null
    };
}
