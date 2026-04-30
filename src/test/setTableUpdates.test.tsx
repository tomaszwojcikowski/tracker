import { describe, it, expect } from 'vitest';
import { computeSetWeightsUpdate, computeSetRepsUpdate } from '../utils/setTableUpdates';

describe('computeSetWeightsUpdate', () => {
    it('pads array up to totalSets with undefined', () => {
        const result = computeSetWeightsUpdate(undefined, undefined, 0, '50', 3);
        expect(result).toHaveLength(3);
        expect(result[0]).toBe('50');
    });

    it('writes value to target index', () => {
        const result = computeSetWeightsUpdate([], [], 1, '60', 3);
        expect(result[1]).toBe('60');
    });

    it('copies value forward to all later un-overridden, incomplete sets', () => {
        const result = computeSetWeightsUpdate([], [false, false, false, false], 0, '70', 4);
        expect(result).toEqual(['70', '70', '70', '70']);
    });

    it('does NOT overwrite later sets that already have an explicit override', () => {
        const result = computeSetWeightsUpdate(
            [undefined, undefined, '100', undefined],
            [false, false, false, false],
            0,
            '50',
            4,
        );
        expect(result).toEqual(['50', '50', '100', '50']);
    });

    it('does NOT copy forward to sets that are already completed', () => {
        const result = computeSetWeightsUpdate(
            [],
            [false, true, false],
            0,
            '60',
            3,
        );
        // Index 1 is completed -> skip; index 2 is not completed AND not overridden -> copy
        expect(result).toEqual(['60', undefined, '60']);
    });

    it('does NOT copy forward when editing a middle set: only forward propagation', () => {
        const result = computeSetWeightsUpdate(
            [undefined, undefined, undefined, undefined],
            [false, false, false, false],
            1,
            '80',
            4,
        );
        // Index 0 is left alone; index 1 written; 2 & 3 copied forward
        expect(result).toEqual([undefined, '80', '80', '80']);
    });

    it('clearing a set with empty string only clears that index (no cascade)', () => {
        const result = computeSetWeightsUpdate(
            ['50', '50', '50'],
            [false, false, false],
            1,
            '',
            3,
        );
        expect(result).toEqual(['50', undefined, '50']);
    });

    it('preserves earlier explicit values when editing a later set', () => {
        const result = computeSetWeightsUpdate(
            ['40', undefined, undefined],
            [false, false, false],
            1,
            '60',
            3,
        );
        expect(result).toEqual(['40', '60', '60']);
    });

    it('keeps cascade alive across multi-keystroke edits ("5" -> "50")', () => {
        // After first keystroke "5":
        const afterFive = computeSetWeightsUpdate(
            undefined,
            [false, false, false],
            0,
            '5',
            3,
        );
        expect(afterFive).toEqual(['5', '5', '5']);

        // Second keystroke makes the input "50":
        const afterFifty = computeSetWeightsUpdate(
            afterFive,
            [false, false, false],
            0,
            '50',
            3,
        );
        // Later rows were tracking the prior value '5' — they update too.
        expect(afterFifty).toEqual(['50', '50', '50']);
    });

    it('does NOT cascade past a row that has been independently edited', () => {
        // Set 0 = 50 (cascaded), Set 1 = 60 (user edited), Set 2 = 50 (still tracking).
        const start: (string | undefined)[] = ['50', '60', '50'];
        const result = computeSetWeightsUpdate(
            start,
            [false, false, false],
            0,
            '70',
            3,
        );
        // Set 1 was '60', not equal to prior value '50' → preserved.
        // Set 2 was '50', equal to prior value '50' → updated.
        expect(result).toEqual(['70', '60', '70']);
    });
});

describe('computeSetRepsUpdate', () => {
    it('pads to totalSets with undefined', () => {
        const result = computeSetRepsUpdate(undefined, 0, 8, 3);
        expect(result).toEqual([8, undefined, undefined]);
    });

    it('writes reps at target index', () => {
        const result = computeSetRepsUpdate([8, 8, 8], 1, 10, 3);
        expect(result).toEqual([8, 10, 8]);
    });

    it('does NOT cascade reps forward', () => {
        const result = computeSetRepsUpdate([], 0, 12, 4);
        expect(result).toEqual([12, undefined, undefined, undefined]);
    });

    it('writes undefined to clear', () => {
        const result = computeSetRepsUpdate([8, 8, 8], 1, undefined, 3);
        expect(result).toEqual([8, undefined, 8]);
    });
});
