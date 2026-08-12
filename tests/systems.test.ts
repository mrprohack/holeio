import { describe, expect, it } from 'vitest';
import { PowerUpState } from '../src/entities/PowerUp.ts';
import { clampToArena, normalizeInputVector } from '../src/input/InputManager.ts';
import { CrazyGamesPlatform } from '../src/platform/CrazyGamesPlatform.ts';
import { generateWorld } from '../src/world/WorldGenerator.ts';

describe('world and platform systems', () => {
  it('generates the same four-district world for a fixed seed', () => {
    const a = generateWorld(42);
    const b = generateWorld(42);
    expect(a).toEqual(b);
    expect(new Set(a.districts.map((district) => district.kind))).toEqual(new Set(['park', 'traffic', 'industrial', 'downtown']));
    expect(a.objects.length).toBeGreaterThanOrEqual(240);
  });

  it('increases average object size through the district progression', () => {
    const world = generateWorld(9);
    const avg = (district: string) => {
      const items = world.objects.filter((object) => object.district === district);
      return items.reduce((sum, object) => sum + object.radius, 0) / items.length;
    };
    expect(avg('park')).toBeLessThan(avg('traffic'));
    expect(avg('traffic')).toBeLessThan(avg('industrial'));
    expect(avg('industrial')).toBeLessThan(avg('downtown'));
  });

  it('expires powerups precisely at their end time', () => {
    const state = new PowerUpState();
    state.activate('speed', 1000, 5000);
    expect(state.isActive('speed', 5999)).toBe(true);
    expect(state.isActive('speed', 6000)).toBe(false);
  });

  it('normalizes diagonals and clamps arena positions', () => {
    const diagonal = normalizeInputVector(1, 1);
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2, 12);
    expect(diagonal.z).toBeCloseTo(Math.SQRT1_2, 12);
    expect(clampToArena({ x: 80, z: -90 }, 70)).toEqual({ x: 70, z: -70 });
  });

  it('falls back safely when the CrazyGames SDK is absent', async () => {
    const platform = new CrazyGamesPlatform();
    await platform.init();
    expect(platform.available).toBe(false);
    await expect(platform.showMidgameAd()).resolves.toBe(false);
    await expect(platform.showRewardedAd()).resolves.toBe(false);
  });
});
