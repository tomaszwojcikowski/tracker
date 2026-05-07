import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';

import { ProgramProvider, useProgram, type ProgramContextValue } from '../context/ProgramContext';
import { getBundledProgramDataPath, getProgramRegistry, resetProgramRegistry } from '../services/programRegistry';

function CaptureContext({ onChange }: { onChange: (ctx: ProgramContextValue) => void }): React.ReactElement {
  const ctx = useProgram();
  useEffect(() => {
    onChange(ctx);
  }, [ctx, onChange]);
  return <div />;
}

describe('ProgramContext switching', () => {
  beforeEach(() => {
    resetProgramRegistry();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('switchProgram force-overrides a locked active program', async () => {
    const registry = getProgramRegistry();

    // Import two programs; the first becomes active and locked.
    await registry.importProgram({
      plan: {
        id: 'p1',
        name: 'Program 1',
        version: '1.0.0',
        durationWeeks: 4,
      },
    });

    await registry.importProgram({
      plan: {
        id: 'p2',
        name: 'Program 2',
        version: '1.0.0',
        durationWeeks: 4,
      },
    });

    registry.setProgramData('p1', {
      schedule: [{ w: 1, d: 1, ex: 'A', s: 1, r: '1' }],
      metadata: { version: '2.0.0', name: 'Program 1', durationWeeks: 4 },
    });

    registry.setProgramData('p2', {
      schedule: [{ w: 1, d: 1, ex: 'B', s: 1, r: '1' }],
      metadata: { version: '2.0.0', name: 'Program 2', durationWeeks: 4 },
    });

    let latestCtx: ProgramContextValue | null = null;

    render(
      <ProgramProvider>
        <CaptureContext onChange={(ctx) => { latestCtx = ctx; }} />
      </ProgramProvider>
    );

    await waitFor(() => {
      expect(latestCtx?.isLoading).toBe(false);
      expect(latestCtx?.currentProgramId).toBe('p1');
    });

    await act(async () => {
      await latestCtx!.switchProgram('p2');
    });

    await waitFor(() => {
      expect(latestCtx?.currentProgramId).toBe('p2');
    });

    expect(registry.getActiveProgramId()).toBe('p2');
  });

  it('prefers fresh file-backed program data over stale stored registry data', async () => {
    const registry = getProgramRegistry();

    await registry.importProgram({
      formatVersion: '2.5.0',
      plan: {
        id: 'p1',
        name: 'Program 1',
        version: '1.0.0',
        durationWeeks: 1,
        phases: [],
      },
    });

    const program = registry.getProgramById('p1');
    if (!program) {
      throw new Error('Expected imported program');
    }
    program.dataPath = '/tracker/p1.json';

    registry.setProgramData('p1', {
      schedule: [{ w: 1, d: 1, ex: 'Stale Exercise', s: 1, r: '1' }],
      metadata: { version: '2.5.0', name: 'Program 1', durationWeeks: 1 },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        formatVersion: '2.5.0',
        plan: {
          id: 'p1',
          name: 'Program 1',
          version: '1.0.0',
          durationWeeks: 1,
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1',
              startWeek: 1,
              endWeek: 1,
              weeks: [
                {
                  weekNumber: 1,
                  days: [
                    {
                      dayNumber: 1,
                      name: 'Day 1',
                      exercises: [
                        {
                          exerciseName: 'Fresh Exercise',
                          category: 'main',
                          sets: 1,
                          repsType: 'reps',
                          repsValue: 1,
                          loadUnit: 'bodyweight',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    } as Response);

    let latestCtx: ProgramContextValue | null = null;

    render(
      <ProgramProvider>
        <CaptureContext onChange={(ctx) => { latestCtx = ctx; }} />
      </ProgramProvider>
    );

    await waitFor(() => {
      expect(latestCtx?.isLoading).toBe(false);
      expect(latestCtx?.schedule?.[0]?.ex).toBe('Fresh Exercise');
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/tracker/p1.json', { cache: 'no-store' });
  });

  it('repairs bundled sample dataPath and refreshes stale installed sample data', async () => {
    const registry = getProgramRegistry();
    const expectedDataPath = getBundledProgramDataPath('power-clean-bench-10-week');
    if (!expectedDataPath) {
      throw new Error('Expected bundled sample dataPath');
    }

    await registry.importProgram({
      formatVersion: '2.5.0',
      plan: {
        id: 'power-clean-bench-10-week',
        name: 'Power Clean / Bench',
        version: '1.0.0',
        durationWeeks: 1,
        phases: [],
      },
    });

    registry.setProgramData('power-clean-bench-10-week', {
      schedule: [{ w: 1, d: 1, ex: 'Stale Sample Exercise', s: 1, r: '1' }],
      metadata: { version: '2.5.0', name: 'Power Clean / Bench', durationWeeks: 1 },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        formatVersion: '2.5.0',
        plan: {
          id: 'power-clean-bench-10-week',
          name: 'Power Clean / Bench',
          version: '1.0.0',
          durationWeeks: 1,
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1',
              startWeek: 1,
              endWeek: 1,
              weeks: [
                {
                  weekNumber: 1,
                  days: [
                    {
                      dayNumber: 1,
                      name: 'Day 1',
                      exercises: [
                        {
                          exerciseName: 'Fresh Sample Exercise',
                          category: 'main',
                          sets: 1,
                          repsType: 'reps',
                          repsValue: 1,
                          loadUnit: 'bodyweight',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    } as Response);

    let latestCtx: ProgramContextValue | null = null;

    render(
      <ProgramProvider>
        <CaptureContext onChange={(ctx) => { latestCtx = ctx; }} />
      </ProgramProvider>
    );

    await waitFor(() => {
      expect(latestCtx?.isLoading).toBe(false);
      expect(latestCtx?.schedule?.[0]?.ex).toBe('Fresh Sample Exercise');
    });

    expect(registry.getProgramById('power-clean-bench-10-week')?.dataPath).toBe(expectedDataPath);
    expect(globalThis.fetch).toHaveBeenCalledWith(expectedDataPath, { cache: 'no-store' });
  });
});
