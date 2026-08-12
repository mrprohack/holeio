# Void Rush

Void Rush is an original 3D browser arena game built around a simple loop: move through a low-poly city, swallow objects smaller than your void, grow, outscore seven AI rivals, and survive a 90-second match.

The broad grow-by-consuming arena mechanic is inspired by games in the genre such as Hole.io, but Void Rush uses original code, generated world layouts, game rules, visual design, UI, AI, progression, and audio. It is not affiliated with or endorsed by Voodoo or Hole.io.

## Features

- 90-second arcade matches with a three-second countdown
- Four procedural districts: Park, Traffic, Industrial, and Downtown
- 352 world props per generated arena, grouped with Three.js `InstancedMesh`
- Area-based void growth with size-gated consumption
- Seven AI rivals with distinct behavioral personalities
- Rival-vs-rival and player-vs-rival consumption plus respawning
- Magnet, Speed Burst, and Growth Boost power-ups
- Combo scoring and live ranking/leaderboard
- Keyboard, pointer, and mobile virtual-joystick controls
- Responsive HUD, pause, mute, results, replay, best score, and coins
- Lightweight generated Web Audio effects; no external audio assets
- CrazyGames HTML5 SDK v3 integration with safe local fallback
- Rewarded-ad double coins and between-round midgame ad hooks
- Spatial-grid collision queries and clamped frame delta for browser performance

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Mouse / pointer | Steer toward pointer |
| Touch joystick | Move on mobile |
| Esc | Pause / resume |
| M | Mute / unmute |

## Tech stack

- Three.js
- TypeScript
- Vite
- Vitest
- ESLint + typescript-eslint

Use Node.js 22.12+ (or another version supported by Vite 8) for local development and CI.

## Development

```bash
npm install
npm run dev
```

Quality gates:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

There is also a dependency-free deterministic core suite useful in constrained environments:

```bash
npm run test:offline
```

## Architecture

The simulation is intentionally separated from rendering and platform integration:

- `src/game/` — match state and orchestration
- `src/world/` — deterministic procedural city definitions and spatial indexing
- `src/entities/` — player, bot, and power-up state
- `src/systems/` — growth, swallow rules, scoring, and bot target selection
- `src/rendering/` — Three.js arena, instanced props, voids, camera, and effects
- `src/input/` — keyboard, pointer, and touch input normalization
- `src/ui/` — HUD, menu, and results overlays
- `src/platform/` — CrazyGames adapter and save persistence
- `src/audio/` — browser-safe generated sound effects

## CrazyGames integration

`index.html` loads the CrazyGames HTML5 SDK v3 before the game entrypoint. `CrazyGamesPlatform` then initializes it asynchronously and automatically falls back to local mode when the SDK is missing or disabled.

The game sends gameplay start/stop events around active play, pause, and match completion. Midgame ads are requested only at a natural between-round break, while rewarded ads are optional on the results screen for doubling the earned coin reward. Ad delivery is never required to continue playing.

## CrazyGames publishing checklist

Before submission:

1. Run every quality gate above on Node 22.
2. Play a complete desktop match and verify replay, pause, mute, AI, power-ups, and persistence.
3. Test a mobile/touch viewport and the virtual joystick.
4. Test inside the CrazyGames preview environment so SDK initialization, gameplay events, and ad callbacks are exercised on a supported domain.
5. Confirm the production `dist/` stays under the platform's upload/initial-load limits and contains no excessive file count.
6. Keep all game artwork, branding, level layouts, and audio original.

## Testing scope

Vitest covers the deterministic rules for growth, swallow thresholds, match timing, combo behavior, spatial lookup, AI target eligibility, save sanitation, district generation, power-up expiration, normalized movement, and CrazyGames fallback behavior.

GitHub Actions runs tests, typechecking, linting, the Vite production build, and conservative bundle-size/file-count checks on pushes and pull requests.

## Design and implementation plan

- `docs/superpowers/specs/2026-08-12-void-rush-design.md`
- `docs/superpowers/plans/2026-08-12-void-rush-implementation.md`
