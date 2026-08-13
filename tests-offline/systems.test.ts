import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWorld } from '../src/world/WorldGenerator.ts';
import { PowerUpState } from '../src/entities/PowerUp.ts';
import { normalizeInputVector, clampToArena } from '../src/input/InputManager.ts';
import { CrazyGamesPlatform } from '../src/platform/CrazyGamesPlatform.ts';

test('world generation is deterministic and contains all four districts', () => {
  const a = generateWorld(42);
  const b = generateWorld(42);
  assert.deepEqual(a, b);
  assert.deepEqual(new Set(a.districts.map((d) => d.kind)), new Set(['park', 'traffic', 'industrial', 'downtown']));
  assert.ok(a.objects.length >= 240);
});

test('district progression trends toward larger objects', () => {
  const world = generateWorld(9);
  const avg = (district: string) => {
    const items = world.objects.filter((o) => o.district === district);
    return items.reduce((sum, item) => sum + item.radius, 0) / items.length;
  };
  assert.ok(avg('park') < avg('traffic'));
  assert.ok(avg('traffic') < avg('industrial'));
  assert.ok(avg('industrial') < avg('downtown'));
});

test('powerups activate and expire', () => {
  const state = new PowerUpState();
  state.activate('speed', 1000, 5000);
  assert.equal(state.isActive('speed', 5999), true);
  assert.equal(state.isActive('speed', 6000), false);
});

test('input vectors normalize diagonals and arena clamping keeps movement bounded', () => {
  const diagonal = normalizeInputVector(1, 1);
  assert.ok(Math.abs(diagonal.x - Math.SQRT1_2) < 1e-12);
  assert.ok(Math.abs(diagonal.z - Math.SQRT1_2) < 1e-12);
  assert.deepEqual(clampToArena({ x: 80, z: -90 }, 70), { x: 70, z: -70 });
});

test('CrazyGames adapter safely falls back when SDK is absent', async () => {
  const platform = new CrazyGamesPlatform();
  await platform.init();
  assert.equal(platform.available, false);
  assert.equal(await platform.showMidgameAd(), false);
  assert.equal(await platform.showRewardedAd(), false);
});
