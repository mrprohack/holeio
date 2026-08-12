import { describe, expect, it } from 'vitest';
import { GameState } from '../src/game/GameState.ts';
import { sanitizeSave } from '../src/platform/SaveManager.ts';
import { chooseBotTarget } from '../src/systems/BotAISystem.ts';
import { computeRadiusAfterMass } from '../src/systems/GrowthSystem.ts';
import { ScoreSystem } from '../src/systems/ScoreSystem.ts';
import { canConsumeRival, canSwallow } from '../src/systems/SwallowSystem.ts';
import { SpatialGrid } from '../src/world/SpatialGrid.ts';

describe('Void Rush deterministic core', () => {
  it('uses area-based growth', () => {
    expect(computeRadiusAfterMass(1, Math.PI, 1)).toBeCloseTo(Math.sqrt(2), 8);
  });

  it('enforces swallow and rival size thresholds', () => {
    expect(canSwallow(2, 1.5)).toBe(true);
    expect(canSwallow(2, 2.1)).toBe(false);
    expect(canConsumeRival(3, 2)).toBe(true);
    expect(canConsumeRival(2, 3)).toBe(false);
  });

  it('stops the match timer while paused and ends at zero', () => {
    const state = new GameState(1);
    state.start();
    state.setPaused(true);
    state.update(0.75);
    expect(state.timeRemaining).toBe(1);
    state.setPaused(false);
    state.update(1.1);
    expect(state.phase).toBe('results');
    expect(state.timeRemaining).toBe(0);
  });

  it('builds and resets combo score windows', () => {
    const score = new ScoreSystem(1000);
    expect(score.consume(10, 0)).toBe(10);
    expect(score.consume(10, 500)).toBe(25);
    expect(score.consume(10, 2000)).toBe(10);
  });

  it('spatially filters distant objects', () => {
    const grid = new SpatialGrid<string>(10);
    grid.insert('near', 2, 3, 'near');
    grid.insert('far', 90, 90, 'far');
    expect(grid.queryRadius(0, 0, 8)).toEqual(['near']);
  });

  it('does not let bots target impossible food', () => {
    const target = chooseBotTarget(
      { x: 0, z: 0, radius: 2, personality: 'collector' },
      [{ id: 'big', x: 1, z: 0, radius: 3, value: 100 }, { id: 'small', x: 5, z: 0, radius: 1, value: 5 }],
      [],
      60,
    );
    expect(target?.id).toBe('small');
  });

  it('sanitizes invalid save fields independently', () => {
    expect(sanitizeSave({ bestScore: -100, coins: 25, muted: 'yes', skin: 'neon' })).toEqual({
      bestScore: 0,
      coins: 25,
      muted: false,
      skin: 'neon',
    });
  });
});
