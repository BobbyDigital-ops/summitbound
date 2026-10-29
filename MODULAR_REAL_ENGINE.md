# Summitbound real-engine modular integration (v13)

## Baseline checked
- Based on `main` at commit `dfd58be26d6247d73d6acbdb6f2fc1f5173b0c0a` (original v0.41 game plus standalone v10–v12 prototypes).
- Original gameplay entrypoint `/game/summit-leap-v081.html` remains unchanged.
- New opt-in entrypoint: `/game/summit-leap-modular-integrated.html`.
- Preserves original `character-rig-v036.js`, `physics.js`, `input-ui.js`, full `tick()` in `simulation.js`, full camera in `rendering.js`, original release/landing and input handling.
- The only changes to original game files are guarded opt-in routing in `game-state.js`, `simulation.js`, `rendering.js`. No rewrite of the motion controller or player model.

## New terrain implementation
- `spire-real-engine-v13.js` projects the two generated mountains' physically sampled course into original game `spires` and `platforms` data. Receiving surface IDs are mapped from `landing-N` to original `l1-N`.
- The original platform collision and running/vaulting/landing code is responsible for crossings.
- Separate climb-route adapter handles strictly vertical icefalls and ladders, reusing `iceClimbDisplacement` and original player state/character.
- Original camera, HUD, pole and v036 character are still painted by `rendering.js`. Only original legacy mountain artwork is replaced with `SpireRenderV10`, including new background-only modular foundations.
- Procedural art is cached into a bounded canvas per spire, culled when outside the viewport.
- Side collision rejects entry through exterior rock walls when no actual landing corridor exists, without treating embedded landing shelves as solid impassable rock.

## Verified by CI (see `.github/workflows/modular-real-engine.yml`)
- Existing valid modular/course data tests.
- Original game bootstrap with v036 renderer, input and tick functions.
- Actual successful first-spire to second-spire pole ride, release and landing under the **original** `tick()`; no alternative gameplay controller.
- Actual climb from a generated landing using original input/climb displacement.
- Ten selectable exact outer-outline gap distances and conservative exterior wall collision.
- Chromium screenshots from the running integrated game.

## Known limitations — do not overclaim
- This is a two-spire **test course**, not the full five-spire campaign.
- Complete rock-body solid collision and authoring physically carved alcoves around internal ledges remains incomplete; only external wall contacts outside landing corridors are treated as rock collision.
- Some original cliff-axe catch and time-trial/campsite logic is still tailored to Five Peaks. Their behaviour on the new terrain needs hands-on review.
- Browser automation proves a controlled flight, not that 10 presets are equally fun or playable without tuning, especially on touchscreens.
- AI Studio's unsynced editor state **cannot be verified here**. GitHub is the verified repository; Vercel is verified as the publishing endpoint for `main`. Users should ensure AI Studio is synced to main before editing/exporting in that editor.
- Do not replace the default app `src/App.tsx` or delete old assets used by the original published Five Peaks game. The new terrain does not import them.

## Phase 5 — Triple-length jump gaps, genuine zero-speed starts (v14)

The ten exact **outer rock-to-outer rock** gaps are now `[90,150,210,270,330,390,450,510,570,630]` units: three times each original preset `[30,50,70,90,110,130,150,170,190,210]`. Do not make these look closer by moving or narrowing the mountain geometry.

This is **not** an alteration to `PolePhysicsEngine`. The generation pipeline now simulates original `runAcceleration` at 120 Hz starting at **zero velocity** on the actual orange departure surface, searches plant/release frame choices, tests swept first-contact against the actual receiving platform, and rejects layouts that fail a ±2-frame plant/release tolerance. No free momentum, flight assist or hidden landing magnet.

The receiving platform is a **visible scaffold** integrated with the generated rock face. It may protrude 72 units beyond the rock silhouette. It is a continuous genuine landing collider, uses regular scaffold visuals and has an existing climb route attached at the same ID. Original solid-rock ledges remain entirely within the rock outline; icefalls stay straight and within the rock, while ladders may be exterior.

The player starts and respawns at the certified launch-run-up position rather than near the cliff edge. The original running, planting, releasing, landing, braking and climb/ice controls remain intact.

QA: `tests/spire-triple-gap-v14.test.cjs` verifies all 10 sizes × 3 seeds (30 generated courses) from rest and validates the measured rock gap, actual launch coordinates, valid pole plant, visible scaffold, and onward climb route. `tests/spire-real-engine-browser.cjs` completes all 10 gaps with the full original `tick()` from zero-speed start and explicitly brakes/walks to the onward climbing route. User playtesting remains necessary for timing satisfaction and Android touch behaviour; these are not yet guaranteed by automation.

Known remaining limits: only two spires in the live test, complete solid-rock interiors/carved cave walls unfinished, mountain texture seams and receiving scaffold finishing need visual polish. Original Five Peaks is still the normal launch.
