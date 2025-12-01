/**
 * Tests for sample program templates
 *
 * Verifies that sample programs are properly configured and can be loaded.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    SAMPLE_PROGRAMS,
    getSampleProgramById,
    getSampleProgramsByLevel,
    getSampleProgramsByDuration,
    getFullManifest,
} from '../data/programTemplates';

describe('Sample Programs', () => {
    describe('SAMPLE_PROGRAMS', () => {
        it('should have at least 3 sample programs', () => {
            expect(SAMPLE_PROGRAMS.length).toBeGreaterThanOrEqual(3);
        });

        it('should have unique program IDs', () => {
            const ids = SAMPLE_PROGRAMS.map(p => p.manifest.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have valid manifest data for each program', () => {
            SAMPLE_PROGRAMS.forEach(program => {
                expect(program.manifest.id).toBeTruthy();
                expect(program.manifest.name).toBeTruthy();
                expect(program.manifest.version).toBeTruthy();
                expect(program.manifest.description).toBeTruthy();
                expect(program.manifest.author).toBeTruthy();
                expect(program.manifest.durationWeeks).toBeGreaterThan(0);
                expect(program.manifest.targetLevel).toBeTruthy();
                expect(Array.isArray(program.manifest.goals)).toBe(true);
                expect(Array.isArray(program.manifest.equipment)).toBe(true);
                expect(program.dataPath).toMatch(/^\/programs\/.+\.json$/);
            });
        });
    });

    describe('getFullManifest', () => {
        it('should add dataPath to manifest', () => {
            SAMPLE_PROGRAMS.forEach(program => {
                const fullManifest = getFullManifest(program);
                expect(fullManifest.dataPath).toBe(program.dataPath);
                expect(fullManifest.id).toBe(program.manifest.id);
                expect(fullManifest.name).toBe(program.manifest.name);
            });
        });
    });

    describe('getSampleProgramById', () => {
        it('should return program when ID exists', () => {
            const program = getSampleProgramById('beginner-bodyweight-4week');
            expect(program).toBeDefined();
            expect(program?.manifest.id).toBe('beginner-bodyweight-4week');
            expect(program?.manifest.name).toBe('4-Week Beginner Bodyweight');
        });

        it('should return undefined for non-existent ID', () => {
            const program = getSampleProgramById('non-existent-program');
            expect(program).toBeUndefined();
        });

        it('should return correct program for each known ID', () => {
            const ids = ['beginner-bodyweight-v1', 'beginner-bodyweight-4week', 'pull-up-strength-v1', 'strength-fundamentals-6week', 'mobility-flexibility-2week'];
            ids.forEach(id => {
                const program = getSampleProgramById(id);
                expect(program).toBeDefined();
                expect(program?.manifest.id).toBe(id);
            });
        });
    });

    describe('getSampleProgramsByLevel', () => {
        it('should return beginner programs', () => {
            const beginnerPrograms = getSampleProgramsByLevel('beginner');
            expect(beginnerPrograms.length).toBeGreaterThan(0);
            beginnerPrograms.forEach(program => {
                expect(program.manifest.targetLevel).toBe('beginner');
            });
        });

        it('should return intermediate programs', () => {
            const intermediatePrograms = getSampleProgramsByLevel('intermediate');
            expect(intermediatePrograms.length).toBeGreaterThan(0);
            intermediatePrograms.forEach(program => {
                expect(program.manifest.targetLevel).toBe('intermediate');
            });
        });

        it('should return empty array for non-existent level', () => {
            const programs = getSampleProgramsByLevel('elite');
            expect(programs).toEqual([]);
        });
    });

    describe('getSampleProgramsByDuration', () => {
        it('should return programs sorted by duration ascending', () => {
            const sorted = getSampleProgramsByDuration();
            expect(sorted.length).toBe(SAMPLE_PROGRAMS.length);

            for (let i = 1; i < sorted.length; i++) {
                expect(sorted[i].manifest.durationWeeks).toBeGreaterThanOrEqual(
                    sorted[i - 1].manifest.durationWeeks
                );
            }
        });

        it('should not modify original SAMPLE_PROGRAMS array', () => {
            const originalOrder = SAMPLE_PROGRAMS.map(p => p.manifest.id);
            getSampleProgramsByDuration();
            const currentOrder = SAMPLE_PROGRAMS.map(p => p.manifest.id);
            expect(currentOrder).toEqual(originalOrder);
        });
    });

    describe('Program content expectations', () => {
        it('beginner-bodyweight-4week should have correct metadata', () => {
            const program = getSampleProgramById('beginner-bodyweight-4week');
            expect(program?.manifest.durationWeeks).toBe(4);
            expect(program?.manifest.targetLevel).toBe('beginner');
            expect(program?.manifest.equipment).toContain('pull-up-bar');
            expect(program?.manifest.goals).toContain('foundational-strength');
        });

        it('strength-fundamentals-6week should have correct metadata', () => {
            const program = getSampleProgramById('strength-fundamentals-6week');
            expect(program?.manifest.durationWeeks).toBe(6);
            expect(program?.manifest.targetLevel).toBe('intermediate');
            expect(program?.manifest.equipment).toContain('barbell');
            expect(program?.manifest.goals).toContain('strength-building');
        });

        it('mobility-flexibility-2week should have correct metadata', () => {
            const program = getSampleProgramById('mobility-flexibility-2week');
            expect(program?.manifest.durationWeeks).toBe(2);
            expect(program?.manifest.targetLevel).toBe('beginner');
            expect(program?.manifest.equipment).toContain('yoga-mat');
            expect(program?.manifest.goals).toContain('improved-flexibility');
        });
    });
});
