# Summitbound — cleanroom modular mountain engine

## Direction (v9 reference)
The uploaded v9 modular-spire prototype defines the required architecture: independently selected BASE + 1–5 BODY pieces + SUMMIT, stacked vertically on real matching connector boundaries. Terrain is built first; mounting points, climb routes and departure deck follow the resulting geometry. Do not derive these maps from old Five Peaks coordinates.

## V10 clean asset replacement (current branch)
Freshly authored map assets only:
- `public/game/scripts/spire-kit-v10.js`: 24 brand-new bases, 24 bodies, 16 caps; literal horizontal S/M/L joins; prefabricated face mounting points; 25 rock ledges and 25 scaffold platforms; 8 straight icefall styles and 6 ladder styles.
- `public/game/scripts/spire-assembly-v10.js`: bottom-up independent 3–7-piece assembly, 2–4 platform slots per generated spire, deck selected from a rock cross-section, vertical routes to the deck (direct or shared), piece polygons and collider descriptors.
- `public/game/scripts/spire-render-v10.js`: entirely new procedural Canvas rock/metal/ice textures and platform/ladder rendering, no image-file dependencies.
- `public/game/new-spire-lab-v10.html`: five-spire visual preview.
- `tests/spire-v10.test.cjs`: 2,000-seed structural checks, no overlaps and exact joins, connected routes and renderer smoke tests.

Superseded cleanroom prefab/texture scripts, preview HTML, tests and legacy mountain image artwork were deleted **from this development branch**. Retained character art, user controls and pole/physics systems are separate and must not be rewritten just to replace the map system. Git history and the `main` branch still contain older code/assets as recoverable backups; they have **not** been securely erased.

## Verified so far
Standalone geometry/asset tests passed in GitHub Actions. A Chromium screenshot job must be reviewed before claiming the art looks good. The new kit makes original geometry and textured shapes, but **it is not yet connected to playable gameplay**. Platform landing behaviour, ice climbing input, rock-to-physics collision integration, and full jump-course solvability remain unverified. Do not merge this branch as a completed map engine.

## Release gate
1. Verify browser visual previews for at least five distinct vertical assemblies.
2. Validate rock and ledge collisions against real player movement and climbing.
3. Assemble distinct multi-spire courses and certify jump reachability using existing pole physics.
4. Desktop/mobile gameplay and artwork review, then merge only if all conditions pass.

## Phase 2 — isolated playable modular spire testing

Added `public/game/scripts/spire-phase2-playtest.js` and `public/game/spire-phase2-playtest.html`.
The browser harness selects among three independent v10 spire seeds, drives actual `PolePhysicsEngine` from `physics.js`, uses `iceClimbDisplacement` from `climb-mechanics.js`, provides desktop/touch controls, and lands on the v10 generator's physical platform rectangles. The orange deck is climbable and works as a genuine pole-plant support when its geometry allows it.

The four **mandatory** placement rules are enforced by `spire-assembly-v10.js` using the assembled *piecewise rock outline* rather than a bounding rectangle:
- Rock ledge: all vertices, including lip and thickness, must remain within the rock silhouette throughout their vertical footprint.
- Scaffold: may project beyond the silhouette; its collider remains genuine.
- Ladder: may project beyond the silhouette; connects source platform to receiving platform/deck.
- Straight icefall: its full-width continuous vertical rectangle must stay within the rock outline at every profile interval. Ineligible routes use a ladder instead. No sinusoidal ice paths.

`tests/spire-phase2.test.cjs` checks 2,000 different assemblies, rejects deliberately displaced rock ledges and icefalls, exercises generated landing collisions, original ice-climbing steps and pole-plant/release dynamics, and completes three test spires from the bottom to the orange deck. `tests/spire-phase2-browser.cjs` drives keyboard input in Chromium, verifies a climb and captures playtest screenshots. Tests are included in `.github/workflows/cleanroom-assets.yml`.

**Limitations:** This is an **isolated, single-spire playtest**, not the production gameplay runtime. The player is a temporary drawn marker, not the final animation rig. Existing physics routines are reused but the test adapter's collision/state orchestration is not the old main loop. The rock silhouette acts as a climbing-facing background; complete rock mass collision and carve-outs for platforms are not yet implemented. Full multi-spire pole-jump courses, physics reachability certification, performance profiling and production integration are outstanding. No changes have been made to `main`.
