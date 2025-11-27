/**
 * Firebase Sync Tests
 * 
 * Tests for timestamp-based merging of workout data from Firebase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Helper functions from App.jsx
const safeGetJSON = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Failed to parse JSON for key "${key}":`, error);
        return defaultValue;
    }
};

const safeSetJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Failed to save JSON for key "${key}":`, error);
        return false;
    }
};

// The mergeCloudData function implementation
const mergeCloudData = (cloudData) => {
    if (!cloudData) return;
    
    console.log('Merging cloud data with local data');
    
    // Merge settings (always use cloud settings)
    if (cloudData.gemini_api_key) {
        localStorage.setItem('gemini_api_key', cloudData.gemini_api_key);
    }
    if (cloudData.gemini_auto_sync) {
        localStorage.setItem('gemini_auto_sync', cloudData.gemini_auto_sync);
    }
    
    // Merge exercise history (always use cloud history)
    if (cloudData.exercise_history) {
        safeSetJSON('exercise_history', cloudData.exercise_history);
    }
    
    // Merge workout sessions based on timestamps
    if (cloudData.sessions) {
        Object.keys(cloudData.sessions).forEach(key => {
            const cloudSession = cloudData.sessions[key];
            const localSession = safeGetJSON(key, null);
            
            // If no local session exists, use cloud data
            if (!localSession) {
                console.log(`No local session for ${key}, using cloud data`);
                safeSetJSON(key, cloudSession);
                return;
            }
            
            // Compare timestamps to determine which version is newer
            const cloudTimestamp = cloudSession.lastModified;
            const localTimestamp = localSession.lastModified;
            
            // If either timestamp is missing, use cloud data (backward compatibility)
            if (!cloudTimestamp || !localTimestamp) {
                console.log(`Missing timestamp for ${key}, using cloud data (cloud: ${cloudTimestamp || 'none'}, local: ${localTimestamp || 'none'})`);
                safeSetJSON(key, cloudSession);
                return;
            }
            
            // Compare timestamps and keep the newer version
            const cloudDate = new Date(cloudTimestamp);
            const localDate = new Date(localTimestamp);
            
            // Check for invalid dates (NaN) - if either is invalid, use cloud data
            if (isNaN(cloudDate.getTime()) || isNaN(localDate.getTime())) {
                console.log(`Invalid timestamp detected for ${key}, using cloud data (cloud: ${cloudTimestamp}, local: ${localTimestamp})`);
                safeSetJSON(key, cloudSession);
                return;
            }
            
            if (cloudDate > localDate) {
                // Cloud data is newer, use it
                console.log(`Using cloud data for ${key} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`);
                safeSetJSON(key, cloudSession);
            } else {
                // Local data is newer or equal, keep it
                console.log(`Keeping local data for ${key} (cloud: ${cloudTimestamp}, local: ${localTimestamp})`);
            }
        });
    }
    
    console.log('Cloud data merged successfully');
};

describe('Firebase Sync - Timestamp-based merging', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('mergeCloudData - workout sessions', () => {
        it('should use cloud data when no local session exists', () => {
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: '2024-01-15T10:00:00.000Z'
                    }
                }
            };

            mergeCloudData(cloudData);

            const localSession = safeGetJSON('session_w1d1');
            expect(localSession).toEqual(cloudData.sessions['session_w1d1']);
        });

        it('should use cloud data when cloud timestamp is newer', () => {
            // Setup: local data with older timestamp
            const localSession = {
                'exercise_1': { sets: [true, false], weight: 40 },
                lastModified: '2024-01-15T09:00:00.000Z'
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data with newer timestamp
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: '2024-01-15T10:00:00.000Z'
                    }
                }
            };

            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            expect(mergedSession).toEqual(cloudData.sessions['session_w1d1']);
            expect(mergedSession['exercise_1'].weight).toBe(50);
            expect(mergedSession['exercise_1'].sets).toEqual([true, true]);
        });

        it('should keep local data when local timestamp is newer', () => {
            // Setup: local data with newer timestamp
            const localSession = {
                'exercise_1': { sets: [true, true, true], weight: 60 },
                lastModified: '2024-01-15T11:00:00.000Z'
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data with older timestamp
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: '2024-01-15T10:00:00.000Z'
                    }
                }
            };

            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            expect(mergedSession).toEqual(localSession);
            expect(mergedSession['exercise_1'].weight).toBe(60);
            expect(mergedSession['exercise_1'].sets).toEqual([true, true, true]);
        });

        it('should keep local data when timestamps are equal', () => {
            const timestamp = '2024-01-15T10:00:00.000Z';
            
            // Setup: local data
            const localSession = {
                'exercise_1': { sets: [true, true, true], weight: 60 },
                lastModified: timestamp
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data with same timestamp
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: timestamp
                    }
                }
            };

            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            expect(mergedSession).toEqual(localSession);
            expect(mergedSession['exercise_1'].weight).toBe(60);
        });

        it('should use cloud data when local session has no timestamp (backward compatibility)', () => {
            // Setup: local data without timestamp (old format)
            const localSession = {
                'exercise_1': { sets: [true, false], weight: 40 }
                // No lastModified field
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data with timestamp
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: '2024-01-15T10:00:00.000Z'
                    }
                }
            };

            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            expect(mergedSession).toEqual(cloudData.sessions['session_w1d1']);
        });

        it('should use cloud data when cloud session has no timestamp (backward compatibility)', () => {
            // Setup: local data with timestamp
            const localSession = {
                'exercise_1': { sets: [true, false], weight: 40 },
                lastModified: '2024-01-15T10:00:00.000Z'
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data without timestamp (old format)
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 }
                        // No lastModified field
                    }
                }
            };

            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            expect(mergedSession).toEqual(cloudData.sessions['session_w1d1']);
        });

        it('should handle multiple workout sessions correctly', () => {
            // Setup: local sessions with different timestamps
            safeSetJSON('session_w1d1', {
                'exercise_1': { sets: [true], weight: 40 },
                lastModified: '2024-01-15T11:00:00.000Z' // Newer locally
            });
            
            safeSetJSON('session_w1d2', {
                'exercise_2': { sets: [true], weight: 30 },
                lastModified: '2024-01-15T09:00:00.000Z' // Older locally
            });

            // Cloud data
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: '2024-01-15T10:00:00.000Z' // Older remotely
                    },
                    'session_w1d2': {
                        'exercise_2': { sets: [true, true], weight: 35 },
                        lastModified: '2024-01-15T10:00:00.000Z' // Newer remotely
                    }
                }
            };

            mergeCloudData(cloudData);

            // w1d1 should keep local (local is newer)
            const session1 = safeGetJSON('session_w1d1');
            expect(session1['exercise_1'].weight).toBe(40);
            
            // w1d2 should use cloud (cloud is newer)
            const session2 = safeGetJSON('session_w1d2');
            expect(session2['exercise_2'].weight).toBe(35);
        });
    });

    describe('mergeCloudData - settings', () => {
        it('should merge gemini API key from cloud', () => {
            const cloudData = {
                gemini_api_key: 'test-api-key-123',
                gemini_auto_sync: 'true'
            };

            mergeCloudData(cloudData);

            expect(localStorage.getItem('gemini_api_key')).toBe('test-api-key-123');
            expect(localStorage.getItem('gemini_auto_sync')).toBe('true');
        });
    });

    describe('mergeCloudData - exercise history', () => {
        it('should merge exercise history from cloud', () => {
            const cloudData = {
                exercise_history: {
                    'Pull-ups': [
                        { date: '2024-01-15', sets: 3, weight: 0 }
                    ]
                }
            };

            mergeCloudData(cloudData);

            const history = safeGetJSON('exercise_history');
            expect(history).toEqual(cloudData.exercise_history);
        });
    });

    describe('Edge cases', () => {
        it('should handle null cloudData gracefully', () => {
            expect(() => mergeCloudData(null)).not.toThrow();
        });

        it('should handle undefined cloudData gracefully', () => {
            expect(() => mergeCloudData(undefined)).not.toThrow();
        });

        it('should handle cloudData without sessions', () => {
            const cloudData = {
                gemini_api_key: 'test-key'
            };

            expect(() => mergeCloudData(cloudData)).not.toThrow();
            expect(localStorage.getItem('gemini_api_key')).toBe('test-key');
        });

        it('should handle invalid timestamp formats gracefully', () => {
            // Setup: local data with valid timestamp
            const localSession = {
                'exercise_1': { sets: [true], weight: 40 },
                lastModified: '2024-01-15T10:00:00.000Z'
            };
            safeSetJSON('session_w1d1', localSession);

            // Cloud data with invalid timestamp
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'exercise_1': { sets: [true, true], weight: 50 },
                        lastModified: 'invalid-date-string'
                    }
                }
            };

            // Should default to using cloud data when timestamp is invalid
            mergeCloudData(cloudData);

            const mergedSession = safeGetJSON('session_w1d1');
            // Invalid timestamp should trigger fallback to cloud data
            expect(mergedSession).toEqual(cloudData.sessions['session_w1d1']);
            expect(mergedSession['exercise_1'].weight).toBe(50);
        });
    });

    describe('Real-world scenario', () => {
        it('should correctly sync workout updated on Device A to Device B', () => {
            // Simulate Device B (local) with workout from yesterday
            const deviceBSession = {
                'pull_ups': { sets: [true, true, false], weight: 0 },
                'bench_press': { sets: [true, true, true], weight: 80 },
                workoutNotes: 'Felt tired',
                lastModified: '2024-01-14T18:00:00.000Z'
            };
            safeSetJSON('session_w1d1', deviceBSession);

            // Simulate Device A updated the workout today and synced to Firebase
            const cloudData = {
                sessions: {
                    'session_w1d1': {
                        'pull_ups': { sets: [true, true, true], weight: 0 },
                        'bench_press': { sets: [true, true, true, true], weight: 85 },
                        workoutNotes: 'Much better today, added extra set!',
                        lastModified: '2024-01-15T10:00:00.000Z'
                    }
                }
            };

            // Device B receives cloud data and merges
            mergeCloudData(cloudData);

            // Device B should now have the updated workout from Device A
            const deviceBUpdated = safeGetJSON('session_w1d1');
            expect(deviceBUpdated['pull_ups'].sets).toEqual([true, true, true]);
            expect(deviceBUpdated['bench_press'].weight).toBe(85);
            expect(deviceBUpdated['bench_press'].sets).toEqual([true, true, true, true]);
            expect(deviceBUpdated.workoutNotes).toBe('Much better today, added extra set!');
        });
    });

    describe('Smart merge (local + cloud combination)', () => {
        /**
         * Helper function that mimics the mergeLocalAndCloudData behavior from SettingsView
         * This tests the bidirectional merge where both local and cloud data are combined
         */
        const mergeLocalAndCloudData = (localData, cloudData) => {
            if (!cloudData) {
                return {
                    sessions: localData.sessions,
                    exerciseHistory: localData.exercise_history,
                    lastSyncTime: new Date().toISOString(),
                };
            }

            const mergedSessions = {};
            
            // Copy cloud sessions first
            if (cloudData.sessions) {
                Object.entries(cloudData.sessions).forEach(([key, session]) => {
                    mergedSessions[key] = session;
                });
            }

            // Merge local sessions
            if (localData.sessions) {
                Object.entries(localData.sessions).forEach(([key, localSession]) => {
                    const cloudSession = mergedSessions[key];
                    
                    if (!cloudSession) {
                        mergedSessions[key] = localSession;
                    } else if (localSession.lastModified && cloudSession.lastModified) {
                        const localTime = new Date(localSession.lastModified).getTime();
                        const cloudTime = new Date(cloudSession.lastModified).getTime();
                        
                        if (localTime > cloudTime) {
                            mergedSessions[key] = localSession;
                        }
                    } else if (localSession.lastModified) {
                        mergedSessions[key] = localSession;
                    }
                });
            }

            // Merge exercise history
            const mergedHistory = { ...(cloudData.exerciseHistory || {}) };
            
            if (localData.exercise_history) {
                Object.entries(localData.exercise_history).forEach(([exerciseId, entries]) => {
                    if (!mergedHistory[exerciseId]) {
                        mergedHistory[exerciseId] = entries;
                    } else {
                        const existingDates = new Set(mergedHistory[exerciseId].map(e => e.date));
                        entries.forEach(entry => {
                            if (!existingDates.has(entry.date)) {
                                mergedHistory[exerciseId].push(entry);
                            }
                        });
                    }
                });
            }

            return {
                sessions: mergedSessions,
                exerciseHistory: mergedHistory,
                settings: cloudData.settings,
                lastSyncTime: new Date().toISOString(),
            };
        };

        it('should preserve cloud data when local has no sessions', () => {
            const localData = { sessions: {}, exercise_history: {} };
            const cloudData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true, true] }, lastModified: '2024-01-15T10:00:00.000Z' }
                },
                exerciseHistory: {}
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            expect(merged.sessions['session_w1d1']).toEqual(cloudData.sessions['session_w1d1']);
        });

        it('should combine sessions from both local and cloud', () => {
            const localData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true] }, lastModified: '2024-01-15T11:00:00.000Z' }
                },
                exercise_history: {}
            };
            const cloudData = {
                sessions: {
                    'session_w1d2': { 'bench_press': { sets: [true, true] }, lastModified: '2024-01-15T10:00:00.000Z' }
                },
                exerciseHistory: {}
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            expect(merged.sessions['session_w1d1']).toBeDefined();
            expect(merged.sessions['session_w1d2']).toBeDefined();
        });

        it('should keep local session when it has newer timestamp than cloud', () => {
            const localData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true, true, true] }, lastModified: '2024-01-15T12:00:00.000Z' }
                },
                exercise_history: {}
            };
            const cloudData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true] }, lastModified: '2024-01-15T10:00:00.000Z' }
                },
                exerciseHistory: {}
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            expect(merged.sessions['session_w1d1']['pull_ups'].sets).toEqual([true, true, true]);
        });

        it('should keep cloud session when it has newer timestamp than local', () => {
            const localData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true] }, lastModified: '2024-01-15T08:00:00.000Z' }
                },
                exercise_history: {}
            };
            const cloudData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true, true, true] }, lastModified: '2024-01-15T10:00:00.000Z' }
                },
                exerciseHistory: {}
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            expect(merged.sessions['session_w1d1']['pull_ups'].sets).toEqual([true, true, true]);
        });

        it('should combine exercise history from both sources', () => {
            const localData = {
                sessions: {},
                exercise_history: {
                    'pull_ups': [{ date: '2024-01-14', sets: 3, weight: 0 }]
                }
            };
            const cloudData = {
                sessions: {},
                exerciseHistory: {
                    'pull_ups': [{ date: '2024-01-15', sets: 4, weight: 5 }]
                }
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            expect(merged.exerciseHistory['pull_ups']).toHaveLength(2);
        });

        it('should not duplicate exercise history entries with same date', () => {
            const localData = {
                sessions: {},
                exercise_history: {
                    'pull_ups': [{ date: '2024-01-15', sets: 3, weight: 0 }]
                }
            };
            const cloudData = {
                sessions: {},
                exerciseHistory: {
                    'pull_ups': [{ date: '2024-01-15', sets: 4, weight: 5 }]
                }
            };

            const merged = mergeLocalAndCloudData(localData, cloudData);
            // Cloud entry is preserved since it's added first; local duplicate by date is skipped
            expect(merged.exerciseHistory['pull_ups']).toHaveLength(1);
            expect(merged.exerciseHistory['pull_ups'][0].sets).toBe(4); // Cloud version
        });

        it('should handle null cloud data by using local data', () => {
            const localData = {
                sessions: {
                    'session_w1d1': { 'pull_ups': { sets: [true] }, lastModified: '2024-01-15T10:00:00.000Z' }
                },
                exercise_history: { 'pull_ups': [{ date: '2024-01-15', sets: 3 }] }
            };

            const merged = mergeLocalAndCloudData(localData, null);
            expect(merged.sessions['session_w1d1']).toBeDefined();
            expect(merged.exerciseHistory['pull_ups']).toBeDefined();
        });
    });
});
