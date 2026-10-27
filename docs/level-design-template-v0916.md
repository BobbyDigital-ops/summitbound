# Summitbound — reusable level template (frozen v0.9.16)

**Approved visual/gameplay baseline:** `level-template-v0.9.16` branch at `9cde4c561d3901e813c6b2cd7a50456c6dafe3b3`. This branch is a **snapshot**, not the active development branch. Current feature work stays on `dev/visual-recovery-v099-v0912`; never overwrite the snapshot or merge it to `main` without approval.

## Preserve these rules when adding mountains

1. Each leap crosses a real chasm and offers **alternative landing choices on one mountain** — not stepping stones. Usually three choices; occasionally two or four.
2. **High shelf**: precision landing above previous takeoff; short ascent, may be narrow/far. **Middle shelf**: separate distance, width and elevation. **Low shelf**: much lower than takeoff, longer flight and major ice climb. High does NOT have to be the farthest.
3. Every shelf projects out from, and remains visibly rooted in, a solid irregular cliff. An ice route connects that specific shelf to a **distinct reachable summit exit**. A shared ice face is allowed only when the actual paths overlap.
4. The summit continues the upward progression and includes enough run-up for the next vault. Vary height, crest length, rock silhouette and exposed shelf widths rather than using uniform stacks.
5. **Do not change pole physics or controls to rescue bad terrain**. Accept only shelves with first-contact trajectories, sufficient stopping room, legal climbs and safe exits under unchanged physics.
6. Keep the painterly rocks, snow caps, wide irregular ice sheets and red-jacket climber styling. Avoid blue tube ice and fake disconnected horizontal slabs.
7. Preserve manual Up/W climbing, cave checkpoint behaviour and the long-term Android-first plan.

## Level-authoring workflow

- Begin with 2–4 authored shelf configurations: `[distanceFromTakeoff, riseOverTakeoff, width]`, using a negative rise for a lower shelf. Choose distinctly different distance/height combinations.
- In `public/game/scripts/world-data.js`, add a small set of named `MOUNTAIN_ARCHETYPES` or equivalent level-specific templates, then apply modest deterministic variation.
- Reject every candidate that fails `viableShelves` (first actual contact and braking). Build mountain contour, live platform colliders and summit exits from that same accepted geometry.
- Inspect a real 16:9 desktop and portrait-mobile gameplay capture. A passing unit test alone cannot validate silhouette, camera composition or fun.
- Run `npm run test:allroutes` plus cliff, climb, vault, browser, mobile, renderer and production-build checks.

## Deliberate phase boundary

**v0.9.16 template is visually approved for now.** Phase 1 addresses mobile performance, frame pacing, caching, memory, DPR and rendering overhead. Optimisation must not silently shrink chasms, change pole physics, flatten mountains or remove independent ice routes.

## Quality gate for large level collections

The current generator provides 997 deterministic routes using a limited set of reviewed shelf archetypes and three receiving mountains per route. More levels should be built from *additional, deliberately different* archetypes, not unbounded random coordinate changes. Preserve the existing golden seeds (0, 1, 2, 7, 42, 250, 996) and add reviewed golden samples when introducing each new family.

The `level-template-v0.9.16` snapshot is immutable. In active development, `tests/approved-level-template.test.cjs` rejects accidental changes to geometry, while the 997-seed tests check first-contact reach, braking room, summit climb exits and deterministic layout variety. Add portrait/desktop visual review, natural rock/ice intersections and difficulty-curated playthroughs before promising a much larger level catalogue. Full campaign assembly and visual similarity scoring are not yet implemented.
