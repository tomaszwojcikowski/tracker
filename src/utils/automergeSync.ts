/**
 * Automerge Sync Utilities
 *
 * CRDT-based conflict-free data merging using Automerge.
 * This module provides automatic conflict resolution for workout data
 * syncing between devices.
 *
 * Key benefits over timestamp-based merging:
 * - No data loss: Concurrent edits are automatically merged
 * - Conflict-free: CRDTs guarantee eventual consistency
 * - Offline-first: Changes can be made offline and merged later
 * - Deterministic: Same inputs always produce same output
 */

import * as Automerge from '@automerge/automerge';
import type {
  ExerciseHistory,
  ExerciseHistoryEntry,
  SessionKey,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Automerge-compatible session data structure
 * Uses Automerge's Map and Array types for CRDT properties
 */
export interface AutomergeSessionData {
  week: number;
  day: number;
  completedSets: Record<string, boolean[]>;
  weights: Record<string, string | number>;
  rpeData: Record<string, Record<number, string>>;
  notes: Record<string, string>;
  lastModified: string;
}

/**
 * Root document structure for Automerge
 * Extends Record<string, unknown> to satisfy Automerge's type constraints
 */
export interface AutomergeDoc {
  [key: string]: unknown;
  sessions: Record<string, AutomergeSessionData>;
  exerciseHistory: Record<string, ExerciseHistoryEntry[]>;
  settings: Record<string, unknown>;
  actorId: string;
  lastUpdated: string;
}

/**
 * Binary representation of Automerge document for storage
 */
export type AutomergeBinary = Uint8Array;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Storage key for local Automerge document
 */
export const AUTOMERGE_DOC_KEY = 'automerge_doc';

/**
 * Storage key for actor ID (unique device identifier)
 */
export const ACTOR_ID_KEY = 'automerge_actor_id';

// ============================================================================
// ACTOR ID MANAGEMENT
// ============================================================================

/**
 * Get or create a unique actor ID for this device
 * Actor IDs identify the source of changes in Automerge
 */
export function getActorId(): string {
  let actorId = localStorage.getItem(ACTOR_ID_KEY);
  if (!actorId) {
    actorId = crypto.randomUUID();
    localStorage.setItem(ACTOR_ID_KEY, actorId);
  }
  return actorId;
}

// ============================================================================
// DOCUMENT INITIALIZATION
// ============================================================================

/**
 * Create a new empty Automerge document
 */
export function createEmptyDoc(): Automerge.Doc<AutomergeDoc> {
  return Automerge.from<AutomergeDoc>({
    sessions: {},
    exerciseHistory: {},
    settings: {},
    actorId: getActorId(),
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Initialize document from existing data
 * Used when migrating from timestamp-based sync to Automerge
 */
export function initDocFromData(
  sessions: Record<SessionKey, AutomergeSessionData>,
  exerciseHistory: ExerciseHistory,
  settings: Record<string, unknown> = {}
): Automerge.Doc<AutomergeDoc> {
  return Automerge.from<AutomergeDoc>({
    sessions: sessions as Record<string, AutomergeSessionData>,
    exerciseHistory: exerciseHistory as Record<string, ExerciseHistoryEntry[]>,
    settings,
    actorId: getActorId(),
    lastUpdated: new Date().toISOString(),
  });
}

// ============================================================================
// DOCUMENT SERIALIZATION
// ============================================================================

/**
 * Serialize Automerge document to binary for storage/transmission
 */
export function saveDoc(doc: Automerge.Doc<AutomergeDoc>): AutomergeBinary {
  return Automerge.save(doc);
}

/**
 * Deserialize binary back to Automerge document
 */
export function loadDoc(binary: AutomergeBinary): Automerge.Doc<AutomergeDoc> {
  return Automerge.load<AutomergeDoc>(binary);
}

/**
 * Convert binary to base64 string for Firebase storage
 */
export function binaryToBase64(binary: AutomergeBinary): string {
  return btoa(String.fromCharCode(...binary));
}

/**
 * Convert base64 string back to binary
 */
export function base64ToBinary(base64: string): AutomergeBinary {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// LOCAL STORAGE OPERATIONS
// ============================================================================

/**
 * Save Automerge document to localStorage
 */
export function saveDocToLocalStorage(doc: Automerge.Doc<AutomergeDoc>): boolean {
  try {
    const binary = saveDoc(doc);
    const base64 = binaryToBase64(binary);
    localStorage.setItem(AUTOMERGE_DOC_KEY, base64);
    return true;
  } catch (error) {
    console.error('Failed to save Automerge doc to localStorage:', error);
    return false;
  }
}

/**
 * Load Automerge document from localStorage
 */
export function loadDocFromLocalStorage(): Automerge.Doc<AutomergeDoc> | null {
  try {
    const base64 = localStorage.getItem(AUTOMERGE_DOC_KEY);
    if (!base64) return null;
    const binary = base64ToBinary(base64);
    return loadDoc(binary);
  } catch (error) {
    console.error('Failed to load Automerge doc from localStorage:', error);
    return null;
  }
}

/**
 * Get or create the local Automerge document
 */
export function getOrCreateLocalDoc(): Automerge.Doc<AutomergeDoc> {
  const existing = loadDocFromLocalStorage();
  if (existing) return existing;

  const newDoc = createEmptyDoc();
  saveDocToLocalStorage(newDoc);
  return newDoc;
}

// ============================================================================
// DOCUMENT MODIFICATION
// ============================================================================

/**
 * Update a session in the Automerge document
 */
export function updateDocSession(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey,
  sessionData: AutomergeSessionData
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Update session ${sessionKey}`, (d) => {
    d.sessions[sessionKey] = sessionData;
    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update exercise history in the Automerge document
 */
export function updateDocExerciseHistory(
  doc: Automerge.Doc<AutomergeDoc>,
  exerciseId: string,
  entry: ExerciseHistoryEntry
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Update exercise history for ${exerciseId}`, (d) => {
    if (!d.exerciseHistory[exerciseId]) {
      d.exerciseHistory[exerciseId] = [];
    }

    // Check if entry already exists (by date, week, day)
    const existingIndex = d.exerciseHistory[exerciseId].findIndex(
      (e) => e.date === entry.date && e.week === entry.week && e.day === entry.day
    );

    if (existingIndex >= 0) {
      // Update existing entry
      d.exerciseHistory[exerciseId][existingIndex] = entry;
    } else {
      // Add new entry
      d.exerciseHistory[exerciseId].push(entry);
    }

    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update settings in the Automerge document
 */
export function updateDocSettings(
  doc: Automerge.Doc<AutomergeDoc>,
  settings: Record<string, unknown>
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, 'Update settings', (d) => {
    Object.assign(d.settings, settings);
    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update a specific set completion
 */
export function updateSetCompletion(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey,
  exerciseId: string,
  setIndex: number,
  completed: boolean
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Toggle set ${setIndex} for ${exerciseId}`, (d) => {
    if (!d.sessions[sessionKey]) {
      d.sessions[sessionKey] = {
        week: 0,
        day: 0,
        completedSets: {},
        weights: {},
        rpeData: {},
        notes: {},
        lastModified: new Date().toISOString(),
      };
    }

    if (!d.sessions[sessionKey].completedSets[exerciseId]) {
      d.sessions[sessionKey].completedSets[exerciseId] = [];
    }

    d.sessions[sessionKey].completedSets[exerciseId][setIndex] = completed;
    d.sessions[sessionKey].lastModified = new Date().toISOString();
    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update weight for an exercise
 */
export function updateWeight(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey,
  exerciseId: string,
  weight: string | number
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Update weight for ${exerciseId}`, (d) => {
    if (!d.sessions[sessionKey]) {
      d.sessions[sessionKey] = {
        week: 0,
        day: 0,
        completedSets: {},
        weights: {},
        rpeData: {},
        notes: {},
        lastModified: new Date().toISOString(),
      };
    }

    d.sessions[sessionKey].weights[exerciseId] = weight;
    d.sessions[sessionKey].lastModified = new Date().toISOString();
    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update RPE for a set
 */
export function updateRPE(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey,
  exerciseId: string,
  setIndex: number,
  rpe: string
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Update RPE for ${exerciseId} set ${setIndex}`, (d) => {
    if (!d.sessions[sessionKey]) {
      d.sessions[sessionKey] = {
        week: 0,
        day: 0,
        completedSets: {},
        weights: {},
        rpeData: {},
        notes: {},
        lastModified: new Date().toISOString(),
      };
    }

    if (!d.sessions[sessionKey].rpeData[exerciseId]) {
      d.sessions[sessionKey].rpeData[exerciseId] = {};
    }

    d.sessions[sessionKey].rpeData[exerciseId][setIndex] = rpe;
    d.sessions[sessionKey].lastModified = new Date().toISOString();
    d.lastUpdated = new Date().toISOString();
  });
}

/**
 * Update notes for an exercise
 */
export function updateNotes(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey,
  exerciseId: string,
  notes: string
): Automerge.Doc<AutomergeDoc> {
  return Automerge.change(doc, `Update notes for ${exerciseId}`, (d) => {
    if (!d.sessions[sessionKey]) {
      d.sessions[sessionKey] = {
        week: 0,
        day: 0,
        completedSets: {},
        weights: {},
        rpeData: {},
        notes: {},
        lastModified: new Date().toISOString(),
      };
    }

    d.sessions[sessionKey].notes[exerciseId] = notes;
    d.sessions[sessionKey].lastModified = new Date().toISOString();
    d.lastUpdated = new Date().toISOString();
  });
}

// ============================================================================
// MERGING
// ============================================================================

/**
 * Merge two Automerge documents
 * This is the core CRDT merge - automatically resolves conflicts
 */
export function mergeDocs(
  local: Automerge.Doc<AutomergeDoc>,
  remote: Automerge.Doc<AutomergeDoc>
): Automerge.Doc<AutomergeDoc> {
  return Automerge.merge(local, remote);
}

/**
 * Merge a binary document from the cloud with local document
 */
export function mergeFromCloud(
  localDoc: Automerge.Doc<AutomergeDoc>,
  cloudBinary: AutomergeBinary
): Automerge.Doc<AutomergeDoc> {
  const cloudDoc = loadDoc(cloudBinary);
  return mergeDocs(localDoc, cloudDoc);
}

/**
 * Merge from base64 string (Firebase storage format)
 */
export function mergeFromBase64(
  localDoc: Automerge.Doc<AutomergeDoc>,
  cloudBase64: string
): Automerge.Doc<AutomergeDoc> {
  const cloudBinary = base64ToBinary(cloudBase64);
  return mergeFromCloud(localDoc, cloudBinary);
}

// ============================================================================
// CHANGE TRACKING
// ============================================================================

/**
 * Get the list of changes between two document states
 */
export function getChanges(
  oldDoc: Automerge.Doc<AutomergeDoc>,
  newDoc: Automerge.Doc<AutomergeDoc>
): Automerge.Change[] {
  return Automerge.getChanges(oldDoc, newDoc);
}

/**
 * Apply changes to a document
 */
export function applyChanges(
  doc: Automerge.Doc<AutomergeDoc>,
  changes: Automerge.Change[]
): [Automerge.Doc<AutomergeDoc>] {
  return Automerge.applyChanges(doc, changes);
}

/**
 * Get all changes in a document (for initial sync)
 */
export function getAllChanges(doc: Automerge.Doc<AutomergeDoc>): Automerge.Change[] {
  return Automerge.getAllChanges(doc);
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Extract plain session data from Automerge document
 * Returns data in format compatible with existing localStorage APIs
 */
export function extractSessionData(
  doc: Automerge.Doc<AutomergeDoc>,
  sessionKey: SessionKey
): AutomergeSessionData | null {
  const session = doc.sessions[sessionKey];
  if (!session) return null;

  // Deep clone to get plain objects
  return JSON.parse(JSON.stringify(session));
}

/**
 * Extract all sessions from document
 */
export function extractAllSessions(
  doc: Automerge.Doc<AutomergeDoc>
): Record<SessionKey, AutomergeSessionData> {
  return JSON.parse(JSON.stringify(doc.sessions));
}

/**
 * Extract exercise history from document
 */
export function extractExerciseHistory(
  doc: Automerge.Doc<AutomergeDoc>
): ExerciseHistory {
  return JSON.parse(JSON.stringify(doc.exerciseHistory));
}

/**
 * Extract settings from document
 */
export function extractSettings(
  doc: Automerge.Doc<AutomergeDoc>
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc.settings));
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate from timestamp-based sync to Automerge
 * Imports existing localStorage data into an Automerge document
 */
export function migrateToAutomerge(
  sessions: Record<SessionKey, AutomergeSessionData>,
  exerciseHistory: ExerciseHistory
): Automerge.Doc<AutomergeDoc> {
  console.log('Migrating to Automerge CRDT sync...');

  const doc = initDocFromData(sessions, exerciseHistory);
  saveDocToLocalStorage(doc);

  console.log('Migration complete. Automerge document created.');
  return doc;
}

/**
 * Check if Automerge migration has been done
 */
export function isAutomergeMigrated(): boolean {
  return localStorage.getItem(AUTOMERGE_DOC_KEY) !== null;
}
