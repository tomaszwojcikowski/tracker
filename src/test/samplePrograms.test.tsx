/**
 * Tests for sample program templates
 *
 * Verifies that sample programs are properly configured and can be loaded.
 */

import { describe, it, expect } from 'vitest';
import {
    SAMPLE_PROGRAMS,
    getSampleProgramById,
    getSampleProgramsByLevel,
    getSampleProgramsByDuration,
} from '../data/programTemplates';

describe('Sample Programs', () => {
    describe('SAMPLE_PROGRAMS', () => {
        it('should be empty', () => {
            expect(SAMPLE_PROGRAMS.length).toBe(0);
        });

        it('should have unique program IDs', () => {
            const ids = SAMPLE_PROGRAMS.map(p => p.manifest.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });
    });

    describe('getSampleProgramById', () => {
        it('should return undefined for non-existent ID', () => {
            const program = getSampleProgramById('non-existent-program');
            expect(program).toBeUndefined();
        });
    });

    describe('getSampleProgramsByLevel', () => {
        it('should return empty array for any level', () => {
            const programs = getSampleProgramsByLevel('beginner');
            expect(programs).toEqual([]);
        });
    });

    describe('getSampleProgramsByDuration', () => {
        it('should return empty array', () => {
            const programs = getSampleProgramsByDuration();
            expect(programs).toEqual([]);
        });
    });
});
