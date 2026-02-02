import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';

import { ProgramProvider, useProgram, type ProgramContextValue } from '../context/ProgramContext';
import { getProgramRegistry, resetProgramRegistry } from '../services/programRegistry';

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
});
