# Void Rush — Game Design

**Date:** 2026-08-12

## Goal

Build an original browser arena game inspired by the grow-by-consuming loop popularized by Hole.io, without copying its branding, art, map, UI, or assets. The game must be fun on desktop and mobile, optimized for browser play, and structured for CrazyGames SDK v3 integration.

## Product Direction

Working title: **Void Rush**.

A match lasts 90 seconds. The player controls a circular void moving through a stylized low-poly city, swallowing objects smaller than the current void diameter. Consuming objects awards score and mass, which expands the void and unlocks progressively larger targets. Seven AI-controlled rivals compete in the same arena and can consume each other when size allows.

The game should feel immediately understandable but provide more strategic routing than a simple flat city. The world is divided into resource districts that favor different growth phases.

## Core Match Loop

1. Spawn as a small void in a safe early-game area.
2. Consume tiny props and pedestrians.
3. Grow enough to consume benches, trees, cars, and larger props.
4. Move into higher-value districts as size increases.
5. Avoid larger AI rivals and attack smaller ones.
6. Use temporary power-ups to accelerate growth or escape pressure.
7. Finish the 90-second round with the highest score possible.
8. Award coins and progression, then offer replay.

## World and Districts

The city is a square bounded arena with four visually distinct zones:

- **Park:** dense early-game props, pedestrians, benches, shrubs, lamps, small trees.
- **Traffic District:** cars, vans, buses, barriers, signs, parking structures.
- **Industrial District:** crates, containers, machinery, tanks, warehouses.
- **Downtown:** large buildings and high-value late-game targets.

Resource placement must encourage a natural route from small objects toward larger objects without forcing one exact path.

## Player Controls

Desktop:

- WASD and arrow keys for movement.
- Mouse/pointer steering when active.
- Escape or dedicated UI control to pause.
- Mute toggle.

Mobile:

- Virtual joystick with a generous touch target.
- UI controls positioned away from the movement thumb region.
- Responsive HUD that remains readable in portrait-like browser frames while landscape remains preferred.

Input sources feed one normalized movement vector so gameplay logic does not depend on the current device.

## Growth Model

Each consumable entity has:

- collision radius
- mass
- score value
- category
- world position

An entity can be consumed when its effective radius is below the player's current swallow threshold and its center overlaps the capture area.

Growth is area-based rather than a fixed radius increment:

`newArea = oldArea + consumedMass * growthFactor`

`newRadius = sqrt(newArea / PI)`

This keeps growth smooth as the player becomes large.

Target progression starts approximately as follows:

| Object | Approx. radius |
|---|---:|
| Cone / small prop | 0.4 |
| Pedestrian | 0.5 |
| Trash can | 0.6 |
| Bench | 0.9 |
| Tree | 1.3 |
| Car | 1.6 |
| Van | 2.0 |
| Bus | 2.8 |
| Small structure | 3.5 |
| Building | 5.0+ |
| Tower | 8.0+ |

Exact tuning is data-driven and covered by gameplay tests.

## Swallow Feedback

Objects should not simply disappear. A consumed object should enter a short presentation sequence:

1. Become captured by the void.
2. Tilt toward its center.
3. Fall vertically.
4. Scale down slightly.
5. Emit a compact particle/score effect.
6. Return to the object pool or deactivate.
7. Smoothly animate player growth.

Visual feedback must never block the deterministic gameplay state transition.

## Opponents and AI

The match includes seven AI rivals.

AI personalities:

- Collector — prioritizes dense safe food.
- Hunter — prefers weak rivals when profitable.
- Coward — strongly avoids threats.
- Aggressive — accepts higher risk for higher score.
- Opportunist — switches between food and rivals based on local value.

Target utility combines value, distance, edibility, threat, and personality weights. Bots must not intentionally chase targets that are currently impossible to consume.

During the final 20 seconds, AI increases urgency and accepts shorter but riskier routes.

A larger void can consume a smaller rival when the size threshold is satisfied. Eliminated bots respawn after a short delay at a safe location with a reduced baseline size so the arena remains populated.

## Power-Ups

Initial release includes three temporary power-ups:

- **Magnet:** increases capture assistance for nearby valid props.
- **Speed Burst:** temporarily increases movement speed.
- **Growth Boost:** increases mass gained from consumed objects for a short duration.

Power-ups spawn at controlled intervals and may not stack infinitely. Durations and multipliers are data-driven constants.

## Scoring and Progression

Per-match:

- score from consumed world objects
- bonus score for consuming a rival
- combo multiplier for consecutive captures within a short window
- live placement leaderboard

Persistent local progression:

- best score
- total coins
- unlocked cosmetic void skins
- simple mission progress

Local saves must work independently of CrazyGames. Platform-specific save support can synchronize through the platform adapter when available.

## Rendering and Performance Architecture

Tech stack:

- Three.js
- TypeScript
- Vite
- Vitest
- ESLint

Rendering must use Three.js `InstancedMesh` for repeated static or semi-static props where practical. Collision queries must use a 2D spatial grid rather than checking every entity against every void every frame.

Performance techniques:

- instanced rendering
- shared geometries/materials
- object pooling
- spatial-grid neighborhood queries
- frustum culling
- capped device pixel ratio
- limited dynamic shadows
- distance-based visual simplification where needed

Targets:

- desktop: 60 FPS on mainstream hardware
- mid-range mobile: 45–60 FPS where practical
- low-end mobile: at least 30 FPS with adaptive quality

The simulation delta must be clamped to avoid physics/collision explosions after tab suspension.

## Architecture

The project is organized into focused modules:

```text
src/
  main.ts
  game/
    Game.ts
    GameState.ts
    constants.ts
    types.ts
  world/
    City.ts
    WorldGenerator.ts
    SpatialGrid.ts
  entities/
    Hole.ts
    Bot.ts
    EdibleObject.ts
    PowerUp.ts
  systems/
    MovementSystem.ts
    SwallowSystem.ts
    GrowthSystem.ts
    BotAISystem.ts
    SpawnSystem.ts
    ScoreSystem.ts
  rendering/
    Renderer.ts
    CameraController.ts
    Effects.ts
    ObjectPool.ts
  input/
    InputManager.ts
    TouchJoystick.ts
  ui/
    HUD.ts
    Menu.ts
    Results.ts
  platform/
    CrazyGamesPlatform.ts
    SaveManager.ts
  audio/
    AudioManager.ts
```

Responsibilities must remain separated: simulation code does not directly manipulate DOM UI, rendering code does not decide scoring, and platform integration is isolated behind an adapter.

## Game State

Primary states:

- `menu`
- `countdown`
- `playing`
- `paused`
- `results`

Only the `playing` state advances the match timer and gameplay simulation.

## CrazyGames Integration

Use CrazyGames HTML5 SDK v3 behind `CrazyGamesPlatform`.

Required behavior:

- Initialize asynchronously.
- Continue to run outside CrazyGames when the SDK is unavailable.
- Signal gameplay start/stop through the platform adapter.
- Use CrazyGames-provided ad APIs only.
- Show midgame ads only at natural breaks such as between rounds.
- Rewarded ads are optional and grant a clear reward such as doubled coins.
- Never make game progress depend on successful ad delivery.

The initial build should remain comfortably below CrazyGames browser download limits by using procedural low-poly assets and avoiding large texture/audio packs.

## UI Direction

The presentation is original and distinct from Hole.io.

Style:

- clean arcade aesthetic
- bold readable timer
- compact vertical leaderboard
- high-contrast score and growth progress
- simple top-level menu
- bright low-poly city
- dark animated void with a colored rim/skin accent

HUD priorities during play:

1. timer
2. current placement
3. score
4. next-size/growth feedback
5. power-up status
6. mini leaderboard

Menus must use large touch-friendly controls and avoid covering the game unnecessarily.

## Audio

Include lightweight generated/original effects for:

- small consume
- large consume
- rival consume
- power-up pickup
- countdown
- match end
- UI selection

Audio must begin only after user interaction where required by browser autoplay policy and must respect mute state.

## Testing Strategy

Unit tests cover deterministic simulation behavior:

- small entity is edible
- oversized entity is not edible
- consuming an entity increases score
- area-based growth calculates radius correctly
- larger player can consume smaller bot
- smaller player cannot consume larger bot
- match timer reaches results state
- paused state stops simulation and timer advancement
- AI rejects impossible targets
- bot respawn does not duplicate active entities
- power-ups expire correctly
- combo window resets correctly
- save data sanitizes invalid persisted values

Project quality gates:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

After automated checks, perform a browser smoke test for desktop movement, mobile/touch input, resize behavior, complete match flow, replay, pause/mute, and SDK-unavailable fallback.

## Error Handling

- Platform SDK initialization failure: log once, use local adapter mode, continue game.
- Corrupt local save: reset only invalid fields to defaults.
- WebGL unavailable: show a clear unsupported-browser message rather than a blank screen.
- Asset/audio failure: use graceful fallback and keep gameplay functional.
- Large frame delta: clamp delta time before simulation.

## Originality Constraints

Do not use Hole.io source code, proprietary art, branding, maps, UI assets, audio, logos, or copied level layouts. The reference is limited to the broad grow-by-consuming arena mechanic. Void Rush uses original code, visual design, world generation, progression, districts, AI behavior, power-ups, and interface.

## Definition of Done

The first release is done when:

- a full 90-second match can be played from menu to results and replay
- swallowing and growth are reliable and satisfying
- seven bots participate and interact with world objects and rivals
- four districts are represented in the generated city
- all three power-ups work
- desktop and touch controls work
- live leaderboard, timer, score, pause, mute, and results UI work
- persistent best score/coins work locally
- CrazyGames adapter works both with and without the SDK
- automated tests, typecheck, lint, and production build pass
- browser smoke test reveals no blocking gameplay or responsive UI defects
