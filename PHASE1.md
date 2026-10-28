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
