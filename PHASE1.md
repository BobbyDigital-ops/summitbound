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

## Phase 3 preparation — ten real spire-to-spire gap presets (v11)

`public/game/scripts/spire-course-v11.js` adds exactly **10 selectable gap sizes: 30, 50, 70, 90, 110, 130, 150, 170, 190, 210 world units**. The gap is measured between the nearest *full rock bounding outlines* of neighbouring spires, not between their centres. The generated course currently comprises five new independent v10 spires, four crossings, and a fixed 40-unit climb from each orange departure deck to an actual rock/scaffold receiving surface on the next spire.

Crossings are accepted only when the unchanged `PolePhysicsEngine` has at least one sampled vault trajectory reaching inside the receiving surface (4-unit landing margin). Sampling constrains approach speed by attainable run-up distance on the actual departure deck, and includes original pole ride, real release velocity, game gravity and flight tempo. If the prefab combination offers no sampled viable crossing, course creation retries a new deterministic composition; the game physics is never altered. These are **sampled flight envelopes**, not real-player proofs.

`public/game/spire-course-v11-lab.html` is a selector/visual debugger for all ten gap presets. `tests/spire-course-v11.test.cjs` checks 80 independent five-spire combinations / 320 crossing trajectories and verifies distances, actual generated receiving colliders and physical run-up. `tests/spire-course-v11-browser.cjs` checks selection/rendering across all ten options in Chromium.

**Not yet done:** integrate this course layout into the real game, handle complete solid-rock interactions and character animation during transfers, check all jump sequences using actual gameplay controls, and profile/polish desktop/mobile performance. It is not ready for publication. `main` remains unchanged.

## Phase 3A + 3B: actual two-spire vault and foundation extension (v12)

**New playable test:** `public/game/spire-phase3-two-spire.html`.
- `public/game/scripts/spire-phase3-two-spire.js`: independent real two-spire physics adapter using existing `PolePhysicsEngine`, existing `iceClimbDisplacement`, native keyboard/touch movement, one-way **swept** generated platform colliders, honest pole plant/release and fall/retry.
- `public/game/scripts/spire-foundations-v12.js`: newly generated **modular foundation blocks** connected via matching bottom-edge seams, projected below higher spires to a shared ground datum, shaded using the new procedural rock renderer. Crucially, foundations are scenic **background-only**, they never change the published physical gap or invent walkable mass/colliders.
- The test UI uses the existing independent *character vector drawing function*; no old mountain textures, maps, or rock geometry are imported.
- `tests/spire-phase3-two-spire.test.cjs`: repeated physically integrated two-spire crossings with **keyboard-style acceleration**, actual pole physics, colliders and second-spire climbing; foundation seam/extent checks and visual-render smoke test.
- `tests/spire-phase3-browser.cjs`: native Chromium keyboard run-up/Space hold and release at both the 30-unit and 210-unit extreme gaps, genuine first collision with intended receiving landing, saved screenshots. Browser QA controls its own physics ticks, to prevent unrelated requestAnimationFrame timing racing simulated key events; normal gameplay uses requestAnimationFrame.

### Real issues corrected
1. Generated climbing routes could **miss their actual receiving platform**; their X coordinate is now constrained to the intersection of source and receiving platform and the independent audit rejects bad exits.
2. Old jump sampler accepted a trajectory passing through a target level **even if it would hit a different higher platform first**. Course generation now simulates first swept contact against all actual receiving colliders.
3. Original candidate takeoff positions allowed as little as **3 units of planting room** before the pole missed its departure deck. The generator now requires **48 units** of planting margin and rejects invalid source decks; it does NOT change the pole mechanics.
4. Course selection also rejects candidates that fail under small speed variations or a one-frame variation in release time; no in-flight help is added.

### Verified / release gate
The isolated structural and Chromium jobs both passed for commit `28ce7ce6`. Their tests cover the 10 rock-to-rock gap presets, intact ledge/scaffold/ice placement laws, 30 controlled physical player crossings, two extreme-gap keyboard browser crossings, foundation seam integrity and renderer operation. All edits are in `dev/phase1-cleanroom-map-engine`; `main` remains unchanged.

**Not yet production complete:**
- This is a playable **isolated two-spire prototype** that reuses the original vault/climbing engines; it has not replaced the main game runtime.
- Collisions exist for the generated walkable platforms/decks, not the complete solid mass/exposed rock sidewalls. Rock ledges intentionally sit inside the outline, so a future collision pass needs carefully authored front/back or carved-face semantics, not simply turning every polygon into a solid blocker.
- The foundation extension blocks are scenic, non-colliding artwork by design. Some modular texture transitions remain visibly horizontal and require seam blending.
- The full five-spire course has theoretical sampled reachability, but has not been completed under actual player controls.
- Actual difficulty/fun, mobile performance and uninterrupted course testing remain user review tasks. Do not merge/publish until proven.
