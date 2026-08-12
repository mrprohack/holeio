# Void Rush Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete playable 90-second Three.js browser arena game with growth-by-consumption, bots, districts, power-ups, responsive controls, persistence, and a CrazyGames SDK v3 adapter.

**Architecture:** Keep deterministic gameplay logic in pure TypeScript modules and isolate Three.js/DOM/platform code at the edges. A single `Game` orchestrator owns the fixed game state, update loop, renderer, UI, input, bots, power-ups, and persistence while individual systems remain independently testable.

**Tech Stack:** Three.js 0.185.x, TypeScript 7.x project target, Vite 8.x, Vitest 4.x, ESLint 9.x, browser WebGL2/WebGL fallback.

## Global Constraints

- Original game identity: `Void Rush`; do not copy Hole.io code, assets, branding, maps, UI, audio, or proprietary level design.
- 90-second matches with seven AI rivals.
- Four world districts: park, traffic, industrial, downtown.
- Three power-ups: magnet, speed burst, growth boost.
- Desktop keyboard/pointer and mobile touch controls.
- CrazyGames SDK v3 is optional at runtime; game must work when unavailable.
- Gameplay simulation delta is clamped to 50 ms.
- Browser performance targets are 60 FPS desktop and at least 30 FPS low-end mobile where practical.

---

### Task 1: Project scaffold and deterministic growth/swallow domain

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`
- Create: `src/systems/GrowthSystem.ts`
- Create: `src/systems/SwallowSystem.ts`
- Create: `tests/growth.test.ts`
- Create: `tests/swallow.test.ts`

**Interfaces:**
- `computeRadiusAfterMass(radius: number, mass: number, growthFactor?: number): number`
- `canSwallow(holeRadius: number, targetRadius: number, tolerance?: number): boolean`
- `captureDistance(holeRadius: number, targetRadius: number): number`

- [ ] **Step 1: Write failing tests for area-based growth and swallow thresholds.**

```ts
import { describe, expect, it } from 'vitest';
import { computeRadiusAfterMass } from '../src/systems/GrowthSystem';
import { canSwallow } from '../src/systems/SwallowSystem';

describe('growth', () => {
  it('uses area based growth', () => {
    const next = computeRadiusAfterMass(1, Math.PI, 1);
    expect(next).toBeCloseTo(Math.sqrt(2), 6);
  });
});

describe('swallow rules', () => {
  it('allows smaller targets and rejects oversized targets', () => {
    expect(canSwallow(2, 1.5)).toBe(true);
    expect(canSwallow(2, 2.3)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail because the modules do not exist.**

Run: `npm test -- growth swallow`
Expected: FAIL because `GrowthSystem` and `SwallowSystem` are missing.

- [ ] **Step 3: Add minimal deterministic implementations and shared entity types.**

```ts
export function computeRadiusAfterMass(radius: number, mass: number, growthFactor = 0.24) {
  const area = Math.PI * radius * radius;
  return Math.sqrt((area + Math.max(0, mass) * growthFactor) / Math.PI);
}

export function canSwallow(holeRadius: number, targetRadius: number, tolerance = 0.88) {
  return targetRadius <= holeRadius * tolerance;
}
```

- [ ] **Step 4: Run unit tests and typecheck.**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit.**

`git commit -m "feat: add core growth and swallow rules"`

---

### Task 2: Match state, scoring, combo, power-up timers, and persistence

**Files:**
- Create: `src/game/GameState.ts`
- Create: `src/systems/ScoreSystem.ts`
- Create: `src/entities/PowerUp.ts`
- Create: `src/platform/SaveManager.ts`
- Create: `tests/game-state.test.ts`
- Create: `tests/score.test.ts`
- Create: `tests/powerup.test.ts`
- Create: `tests/save-manager.test.ts`

**Interfaces:**
- `GameState.start(): void`
- `GameState.setPaused(paused: boolean): void`
- `GameState.update(dt: number): void`
- `ScoreSystem.consume(value: number, nowMs: number): number`
- `PowerUpState.activate(kind, nowMs): void`
- `PowerUpState.isActive(kind, nowMs): boolean`
- `sanitizeSave(input: unknown): SaveData`

- [ ] **Step 1: Write failing tests proving paused matches do not advance, matches end at zero, combos expire, power-ups expire, and invalid saves fall back to defaults.**
- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Implement minimal state machines with no rendering dependencies.**
- [ ] **Step 4: Run all tests and typecheck.**
- [ ] **Step 5: Commit `feat: add match state scoring and persistence`.**

---

### Task 3: Spatial grid and procedural district world model

**Files:**
- Create: `src/world/SpatialGrid.ts`
- Create: `src/world/WorldGenerator.ts`
- Create: `tests/spatial-grid.test.ts`
- Create: `tests/world-generator.test.ts`

**Interfaces:**
- `SpatialGrid<T>.insert(id: string, x: number, z: number, value: T): void`
- `SpatialGrid<T>.remove(id: string): void`
- `SpatialGrid<T>.queryRadius(x: number, z: number, radius: number): T[]`
- `generateWorld(seed: number): WorldDefinition`

- [ ] **Step 1: Write failing tests for nearby-only spatial queries and deterministic four-district generation.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement cell-key indexing and a seeded pseudo-random generator.**
- [ ] **Step 4: Ensure the generated world contains `park`, `traffic`, `industrial`, and `downtown` with increasing average target size.**
- [ ] **Step 5: Run tests/typecheck and commit `feat: add spatial world generation`.**

---

### Task 4: Three.js renderer, city meshes, hole presentation, camera, and effects

**Files:**
- Create: `src/rendering/Renderer.ts`
- Create: `src/rendering/CameraController.ts`
- Create: `src/rendering/Effects.ts`
- Create: `src/world/City.ts`
- Create: `src/entities/Hole.ts`
- Create: `src/entities/EdibleObject.ts`
- Create: `src/styles.css`

**Interfaces:**
- `Renderer3D.mount(container: HTMLElement): void`
- `Renderer3D.render(frame: RenderFrame): void`
- `Renderer3D.resize(): void`
- `City.build(world: WorldDefinition): void`
- `City.markConsumed(id: string): void`
- `CameraController.follow(x: number, z: number, radius: number, dt: number): void`

- [ ] **Step 1: Add pure render-frame mapping tests where possible before implementation.**
- [ ] **Step 2: Implement a bright low-poly arena using shared geometries/materials and `InstancedMesh` for repeated props.**
- [ ] **Step 3: Render the player/bots as dark circular void discs with colored rim accents and shadow/inner gradient geometry.**
- [ ] **Step 4: Add smooth isometric camera follow and small consume score particles without affecting simulation state.**
- [ ] **Step 5: Typecheck and production-build; commit `feat: render low poly Void Rush arena`.**

---

### Task 5: Input, HUD, menus, touch joystick, and full player match loop

**Files:**
- Create: `src/input/InputManager.ts`
- Create: `src/input/TouchJoystick.ts`
- Create: `src/ui/HUD.ts`
- Create: `src/ui/Menu.ts`
- Create: `src/ui/Results.ts`
- Create: `src/game/Game.ts`
- Create: `src/main.ts`
- Create: `tests/input-vector.test.ts`

**Interfaces:**
- `InputManager.vector(): { x: number; z: number }`
- `Game.startMatch(): void`
- `Game.togglePause(): void`
- `Game.update(dt: number): void`
- `Game.restart(): void`

- [ ] **Step 1: Write failing tests for normalized diagonal keyboard vectors and movement clamping to arena bounds.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement keyboard, pointer, and touch input normalized into one movement vector.**
- [ ] **Step 4: Wire the menu → countdown → playing → results → replay state flow.**
- [ ] **Step 5: Add responsive HUD showing timer, score, rank, combo, growth and active power-up.**
- [ ] **Step 6: Run tests/typecheck/build and commit `feat: add complete player match loop`.**

---

### Task 6: Bot AI, rival consumption, respawn, leaderboard, and power-up pickups

**Files:**
- Create: `src/entities/Bot.ts`
- Create: `src/systems/BotAISystem.ts`
- Create: `src/systems/SpawnSystem.ts`
- Create: `tests/bot-ai.test.ts`
- Create: `tests/rival-consumption.test.ts`

**Interfaces:**
- `chooseBotTarget(bot, candidates, threats, personality): TargetChoice | null`
- `canConsumeRival(attackerRadius: number, victimRadius: number): boolean`
- `SpawnSystem.scheduleRespawn(botId: string, nowMs: number): void`

- [ ] **Step 1: Write failing tests proving AI rejects impossible targets, avoids larger threats according to personality, and rival consume rules are one-way by size.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement seven bots with personality weights and final-20-second urgency.**
- [ ] **Step 4: Implement safe bot respawn and three power-up pickup effects.**
- [ ] **Step 5: Feed player/bot scores into a live sorted leaderboard.**
- [ ] **Step 6: Run all gates and commit `feat: add rival AI and powerups`.**

---

### Task 7: CrazyGames adapter and browser-safe audio

**Files:**
- Create: `src/platform/CrazyGamesPlatform.ts`
- Create: `src/audio/AudioManager.ts`
- Create: `tests/crazygames-platform.test.ts`

**Interfaces:**
- `CrazyGamesPlatform.init(): Promise<void>`
- `CrazyGamesPlatform.gameplayStart(): void`
- `CrazyGamesPlatform.gameplayStop(): void`
- `CrazyGamesPlatform.showMidgameAd(): Promise<boolean>`
- `CrazyGamesPlatform.showRewardedAd(): Promise<boolean>`
- `AudioManager.unlock(): void`
- `AudioManager.setMuted(muted: boolean): void`

- [ ] **Step 1: Write failing fallback-mode tests where `window.CrazyGames` is absent.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement SDK v3 detection/initialization and no-op local fallback.**
- [ ] **Step 4: Add user-gesture-unlocked Web Audio oscillator effects with mute support and no external audio files.**
- [ ] **Step 5: Integrate gameplay start/stop and optional results-screen rewarded double-coins flow.**
- [ ] **Step 6: Run tests/typecheck/build and commit `feat: integrate CrazyGames platform adapter`.**

---

### Task 8: Polish, accessibility, performance safeguards, docs, and release verification

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `eslint.config.js`
- Modify: `src/styles.css`
- Modify: `src/game/Game.ts`
- Modify: rendering/world modules as measurements require

- [ ] **Step 1: Add keyboard-focus styles, touch target sizing, reduced-motion handling, WebGL unsupported fallback, and responsive small-screen layout.**
- [ ] **Step 2: Cap renderer pixel ratio, clamp simulation delta to 0.05s, avoid per-frame allocations in hot loops, and keep repeated city props instanced.**
- [ ] **Step 3: Document setup, controls, architecture, CrazyGames integration, originality constraints, and publishing checklist.**
- [ ] **Step 4: Run `npm test`. Expected: all tests pass.**
- [ ] **Step 5: Run `npm run typecheck`. Expected: no TypeScript errors.**
- [ ] **Step 6: Run `npm run lint`. Expected: no lint errors.**
- [ ] **Step 7: Run `npm run build`. Expected: production bundle succeeds.**
- [ ] **Step 8: Run a browser smoke test covering menu, 90-second flow (using debug accelerated timer if needed), movement, eating/growth, bots, power-ups, pause, mute, resize, touch joystick, results, replay, save reload, and SDK fallback.**
- [ ] **Step 9: Fix any issue found and repeat Steps 4–8 until clean.**
- [ ] **Step 10: Commit `chore: polish and verify Void Rush release`.**

## Plan Self-Review

- Spec coverage: core loop, 90-second state, all four districts, seven bots, three power-ups, desktop/touch controls, persistence, CrazyGames fallback, responsive UI, performance safeguards, and verification all map to explicit tasks.
- Placeholder scan: no TBD/TODO implementation placeholders are used.
- Type consistency: game state, growth/swallow, world, renderer, input, AI, platform, and save interfaces are defined once and consumed by later tasks.
- Scope: this produces one coherent single-player-with-bots browser release; real network multiplayer is intentionally excluded from v1.
