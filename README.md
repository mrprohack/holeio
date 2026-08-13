# Void Rush

[![CI](https://github.com/mrprohack/holeio/actions/workflows/ci.yml/badge.svg)](https://github.com/mrprohack/holeio/actions/workflows/ci.yml)

Void Rush is an original 3D browser arena game about growing a moving void, swallowing a low-poly city, and outscoring rival voids before the clock runs out.

Each match is fast and readable: start small, consume tiny props, grow your capture radius, unlock larger objects, collect power-ups, avoid bigger rivals, and chase the highest score in a 90-second round.

> Void Rush uses an original codebase, generated world layout, game rules, UI, AI, visual style, progression, and browser-safe audio. It is inspired by the broad grow-by-consuming arcade genre, but it is not affiliated with, endorsed by, or built from Voodoo or Hole.io assets.

## Contents

- [Gameplay](#gameplay)
- [Features](#features)
- [Controls](#controls)
- [Quick start](#quick-start)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Testing and CI](#testing-and-ci)
- [CrazyGames integration](#crazygames-integration)
- [Publishing checklist](#publishing-checklist)
- [Design docs](#design-docs)
- [Contributing](#contributing)
- [License](#license)

## Gameplay

You control a circular void in a stylized city arena. Objects are only edible when they are smaller than your current swallow threshold, so the best route changes as you grow.

A typical round looks like this:

1. Spawn as a small void in an early-game area.
2. Eat small props, pedestrians, and light objects to build mass.
3. Move into richer districts once benches, trees, cars, and structures become edible.
4. Use temporary power-ups to accelerate growth or escape danger.
5. Chase smaller rivals and avoid rivals that can swallow you.
6. Finish the 90-second match with the best possible score, rank, and coin reward.

## Features

### Core game

- 90-second arcade rounds with a short countdown before play starts
- Four procedural city districts: Park, Traffic, Industrial, and Downtown
- Hundreds of generated arena props rendered efficiently with Three.js `InstancedMesh`
- Area-based void growth for smoother scaling as the player becomes larger
- Size-gated consumption rules for props, rivals, and power-ups
- Combo scoring, live rank tracking, match results, best score, and coin rewards

### Opponents and power-ups

- Seven AI rivals in every match
- Rival personalities that prioritize food, hunting, survival, or riskier scoring routes
- Rival-vs-rival and player-vs-rival consumption with respawning
- Temporary Magnet, Speed Burst, and Growth Boost power-ups

### Browser experience

- Keyboard, pointer, and mobile virtual-joystick controls
- Responsive HUD, menu, pause, mute, replay, and results screens
- Generated Web Audio sound effects with no external audio assets
- WebGL fallback screen for unsupported browsers
- CrazyGames HTML5 SDK v3 integration with local fallback behavior
- Optional rewarded-ad coin doubling and between-round ad hooks

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Move the void |
| Mouse / pointer | Steer toward the pointer |
| Touch joystick | Move on mobile and touch devices |
| Esc | Pause or resume |
| M | Mute or unmute audio |

## Quick start

### Requirements

- Node.js 22.12 or newer
- npm
- A modern browser with WebGL support

The CI workflow currently runs on Node.js 22.14.0.

### Install and run locally

```bash
npm install
npm run dev
```

Vite will print a local development URL. Open that URL in your browser to play the game.

### Build for production

```bash
npm run build
```

The production build is written to `dist/`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript checking and create a production build |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest suite |
| `npm run test:offline` | Run the dependency-free deterministic core tests |
| `npm run lint` | Run ESLint against `src` and `tests` |

For a full local verification pass, run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Project structure

```text
.github/workflows/       GitHub Actions CI workflow
docs/superpowers/        Design notes and implementation plan
src/audio/               Browser-safe generated sound effects
src/entities/            Player, bot, hole, and power-up state models
src/game/                Game lifecycle, match state, timing, and orchestration
src/input/               Keyboard, pointer, and touch input handling
src/platform/            CrazyGames SDK adapter and save persistence
src/rendering/           Three.js scene, arena, camera, voids, props, and effects
src/systems/             Growth, swallowing, scoring, and bot AI rules
src/ui/                  HUD, menu, pause, and results screens
tests/                   Vitest coverage for gameplay and platform logic
tests-offline/           Dependency-free deterministic test suite
```

## Architecture

Void Rush separates deterministic gameplay rules from browser rendering and platform integration.

- `Game` coordinates the main lifecycle: menu, countdown, active play, pause, results, replay, and persistence.
- State objects in `src/entities/` describe the player, bots, holes, and power-ups.
- Systems in `src/systems/` decide what can be swallowed, how growth works, how score is calculated, and what AI rivals target.
- World generation and lookup helpers in `src/world/` build the district layout and keep collision queries fast.
- Rendering code in `src/rendering/` turns game state into a Three.js scene without owning the gameplay rules.
- Platform code in `src/platform/` wraps CrazyGames SDK calls and save storage behind a local-safe adapter.

This split keeps the simulation easier to test and lets the game still run locally when platform SDK features are unavailable.

## Testing and CI

The test suite covers deterministic gameplay behavior including growth, swallow thresholds, match timing, combo behavior, spatial lookup, AI target eligibility, save-data sanitation, district generation, power-up expiration, input normalization, and CrazyGames fallback behavior.

GitHub Actions runs on pushes and pull requests. The workflow installs dependencies, runs unit tests, typechecks, lints, builds the Vite production bundle, and checks conservative `dist/` size and file-count limits.

## CrazyGames integration

`index.html` loads the CrazyGames HTML5 SDK v3 before the game entrypoint. `CrazyGamesPlatform` initializes the SDK asynchronously and falls back to local behavior when the SDK is missing, unavailable, or disabled.

The game sends gameplay start/stop events around active play, pause, and match completion. Midgame ads are requested only at natural breaks, and rewarded ads are optional on the results screen for doubling earned coins. Ads are never required to keep playing.

## Publishing checklist

Before submitting a build to CrazyGames or another web-game portal:

1. Run the full local verification pass on Node.js 22.
2. Play a full desktop match and verify movement, replay, pause, mute, AI, power-ups, scoring, and persistence.
3. Test a mobile or touch viewport and confirm the virtual joystick feels responsive.
4. Test in the CrazyGames preview environment so SDK initialization, gameplay events, and ad callbacks run on a supported domain.
5. Confirm the production `dist/` output remains inside upload, initial-load, size, and file-count limits.
6. Keep artwork, branding, level layouts, UI, sounds, and copy original.

## Design docs

The repository includes the original design and implementation planning documents:

- [`docs/superpowers/specs/2026-08-12-void-rush-design.md`](docs/superpowers/specs/2026-08-12-void-rush-design.md)
- [`docs/superpowers/plans/2026-08-12-void-rush-implementation.md`](docs/superpowers/plans/2026-08-12-void-rush-implementation.md)

## Contributing

Suggested workflow:

1. Create a feature branch from `main`.
2. Keep gameplay rules deterministic where possible.
3. Add or update tests for changed gameplay behavior.
4. Run the full verification pass before opening a pull request.
5. Keep new assets, layouts, sounds, branding, and UI original.

## License

No license file is currently included in this repository. Add a license before redistributing the project or accepting external contributions.
