import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRadiusAfterMass } from '../src/systems/GrowthSystem.ts';
import { canSwallow, canConsumeRival } from '../src/systems/SwallowSystem.ts';
import { GameState } from '../src/game/GameState.ts';
import { ScoreSystem } from '../src/systems/ScoreSystem.ts';
import { SpatialGrid } from '../src/world/SpatialGrid.ts';
import { chooseBotTarget } from '../src/systems/BotAISystem.ts';
import { sanitizeSave } from '../src/platform/SaveManager.ts';

test('area-based growth preserves area math', () => {
  const next = computeRadiusAfterMass(1, Math.PI, 1);
  assert.ok(Math.abs(next - Math.sqrt(2)) < 1e-8);
});

test('swallow threshold allows smaller and rejects oversized targets', () => {
  assert.equal(canSwallow(2, 1.5), true);
  assert.equal(canSwallow(2, 2.1), false);
  assert.equal(canConsumeRival(3, 2), true);
  assert.equal(canConsumeRival(2, 3), false);
});

test('paused game does not advance and active game reaches results', () => {
  const state = new GameState(1);
  state.start();
  state.setPaused(true);
  state.update(0.75);
  assert.equal(state.timeRemaining, 1);
  state.setPaused(false);
  state.update(1.1);
  assert.equal(state.phase, 'results');
  assert.equal(state.timeRemaining, 0);
});

test('combo grows inside window and resets after timeout', () => {
  const score = new ScoreSystem(1000);
  assert.equal(score.consume(10, 0), 10);
  assert.equal(score.consume(10, 500), 25);
  assert.equal(score.consume(10, 2000), 10);
});

test('spatial grid only returns nearby values', () => {
  const grid = new SpatialGrid<string>(10);
  grid.insert('near', 2, 3, 'near');
  grid.insert('far', 90, 90, 'far');
  assert.deepEqual(grid.queryRadius(0, 0, 8), ['near']);
});

test('bot AI rejects targets that cannot currently be swallowed', () => {
  const target = chooseBotTarget(
    { x: 0, z: 0, radius: 2, personality: 'collector' },
    [
      { id: 'big', x: 1, z: 0, radius: 3, value: 100 },
      { id: 'small', x: 5, z: 0, radius: 1, value: 5 },
    ],
    [],
    60,
  );
  assert.equal(target?.id, 'small');
});

test('invalid save fields are sanitized independently', () => {
  const save = sanitizeSave({ bestScore: -100, coins: 25, muted: 'yes', skin: 'neon' });
  assert.equal(save.bestScore, 0);
  assert.equal(save.coins, 25);
  assert.equal(save.muted, false);
  assert.equal(save.skin, 'neon');
});
