# Summit Leap v0.8.3 — Clean Foundation

This is a **structure-only refactor** of the uploaded v0.8.1 project. The game logic and physics equations are preserved exactly: no rebalancing, new mountain geometry or artistic overhaul.

## Active runtime

React/Vite displays `/game/summit-leap-v081.html` in an iframe. That HTML contains only markup and linked styles/scripts. The game runs as six ordered classic scripts sharing the existing global state:

1. `public/game/scripts/physics.js` — `PolePhysicsEngine` and clamp helper
2. `public/game/scripts/world-data.js` — artwork paths, physics configuration, spires and deterministic route layouts
3. `public/game/scripts/game-state.js` — canvas setup, player spawn, vault input actions and helpers
4. `public/game/scripts/rendering.js` — trees, terrain, cave, ladders, graphics and camera
5. `public/game/scripts/simulation.js` — checkpoint, collision, climbing, fixed-timestep loop, retry
6. `public/game/scripts/input-ui.js` — buttons, keyboard bridge, multitouch and startup

Styles are in `public/game/summit-style.css`. Older Phaser/TypeScript files are archived under `src/legacy/`, untouched except for relocation.

### Why classic scripts?

This is a minimal-risk split preserving shared global lexical bindings and initialization order. We have intentionally *not* converted to ES modules or changed the physics during this pass. The next maintainability step can introduce explicit imports one subsystem at a time, with integration tests.

### Regression expectations

Check running (A/D), pole plant/ride/release (Space), manual climbing (W/Up), cave checkpoint, Practice/Hardcore, touch controls and route selection. Compare behaviour with the original v0.8.1.

### Deliberately deferred

Natural mountain geometry fixes, asset overhaul, terrain generator redesign, climbing visual changes and more advanced tests.
