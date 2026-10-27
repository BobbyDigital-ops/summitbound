# Summitbound — development handoff after Phase 1 (v0.9.18)

**Approved and retained:** v0.9.16 procedural mountain layout template (separate frozen branch `level-template-v0.9.16`). The high, middle and lower alternative landings, difficult jumps, painterly mountain atmosphere, Up/W climbing, pole physics and controls must survive all later phases. The Phase 1 sharpness optimisations must also remain subject to phone profiling.

## Phase 3 — ice connections and snowy summit exits
- Keep the now-broad, irregular, non-tubular ice faces. Let them merge/branch **only when one real climb passes a higher shelf**; otherwise maintain separate accessible routes.
- Transition each face gently beneath the summit snow cap, not a blue strip with a blunt end. Root upper ice in real rock/snow geometry.
- Maintain independently reachable summit exits with no sudden clipping or teleport, preserve slow manual climb and legitimate checkpoint behaviour.
- Validate lower, middle and high shelves, ascent length and exit safety in both landscape and portrait.

## Phase 4 — mountain and landscape polish
- Neaten the ice-to-crest intersection, uneven snow ridges and cliff roots; avoid flat rectangular tops and unrealistic floating triangular shelf fins.
- Increase undersized cliff trees proportionately; improve near-versus-far depth without blurring the climber or restoring costly full-frame effects.
- True walkable slopes are separate physics/collision work and require explicit tests before implementation.

## Phase 5 — cave and campfire interaction
- Keep the **improved cave height**.
- Make the cave feel recessed and organically carved into the cliff rather than a separate building/box.
- Move cave ladder to the **right of the fire**, leaving visual and walking separation.
- Avoid arrival popup. Near the actual fire, let the player choose **Continue ascent** or **Retry leap**; preserve cave checkpoint and final summit victory.

## Phase 6 — character and ice axes
- Make the red-jacket climber less chibi/cartoonish and slightly more natural while readable at phone scale.
- During climbing, turn the climber to face the wall (rear / three-quarter rear profile); alternate axes and foot placements with real body weight transfer. Pause the animation immediately when Up/W is released.
- Keep the pole's arc length fixed and physics untouched; review only its painted bending shape, carrying pose and animation.
- Avoid giant white foreground snowball/circle effects.

## Phase 7 — integrated validation and Android readiness
- Profile physical Android device (idle, running, vaulting, climbing, cave) in Chrome using new Render FPS, p95 draw milliseconds, DPR, cache builds and canvas MB diagnostics.
- Keep Android-first mobile publishing prep separate from source-code performance fixes. Check phone safe-areas, touch hit targets, viewport size and backgrounding.
- Require actual full playthroughs and visual screenshots for new families in addition to 997-seed first-contact, braking and ice-exit tests.

## Scaling the mountain template without quality erosion
- **Current:** 997 deterministic route seeds, ordinarily three receiving mountains and two-to-four shelf choices, generated from a SMALL set of curated `MOUNTAIN_ARCHETYPES`. This is a strong base but **not** 997 manually distinct mountains or an unlimited campaign.
- **Before adding large campaigns:** formalise level records (seed, archetype, palette, stage goals, target difficulty and acceptable completion windows); add reviewed archetypes with distinct visual/difficulty signatures instead of merely increasing random jitter.
- For every generated level, require meaningful high/middle/low separation, first-hit physics reachability, braking room, complete ice paths, summit takeoff space, natural cliff backing, and no collisions with nearby terrain.
- Reject near-duplicates, unreachable shortcuts, camera-hidden options and memory-heavy mountain caches. Check 16:9 and portrait gameplay captures for human signoff.
- The golden-geometry test `tests/approved-level-template.test.cjs` pins seven visually approved seeds. Any change to those fingerprints requires explicit visual review, not just updating numbers to make CI green.
- Full campaign generation, procedural ice network routing and visual-uniqueness scoring remain future deliverables, **not yet implemented**.
