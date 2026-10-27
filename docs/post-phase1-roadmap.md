# Confirmed target: 100 levels (not 110 or 100+)

**Phase 8 v0.10.0:** skill-biased deterministic vault release, alternating A/D axe climbing, landing-swept recovery and direct physical ice exits; intermediate shelf planting enabled. Core physics and controls need real Android feel review. `backup/pre-phase8-v0924` protects old gameplay.

**Phase 9 planned:** redesign topological mountain network as one continuous route; *much larger and variable* physically reachable leap distances, forked intermediate-ledge shortcuts, cave shafts and campfire/tent checkpoints. Player remains in one continuous ascent, checkpoints do not end courses.

**Phase 10 planned:** cohesive rugged, menacing non-cartoonish mountain, snow, rock, cave and climber art. Fix detached ledges and snow 'bridges' at the terrain-model level.

**Later:** 100 authored/curated levels, validated challenge variety and accessibility; transparent Bronze/Silver/Gold timing, PB ghosts; deterministic telegraphed wind/weather hazards; Android commercial packaging only after real performance and playtests.

---

# Summitbound — development handoff after Phase 1 (v0.9.18)

**Approved and retained:** v0.9.16 procedural mountain layout template (separate frozen branch `level-template-v0.9.16`). The high, middle and lower alternative landings, difficult jumps, painterly mountain atmosphere, Up/W climbing, pole physics and controls must survive all later phases. The Phase 1 sharpness optimisations must also remain subject to phone profiling.

## Phase 3 — ice connections and snowy summit exits (implemented v0.9.19; awaiting visual review)
- Keep the now-broad, irregular, non-tubular ice faces. Let them merge/branch **only when one real climb passes a higher shelf**; otherwise maintain separate accessible routes.
- Transition each face gently beneath the summit snow cap, not a blue strip with a blunt end. Root upper ice in real rock/snow geometry.
- Maintain independently reachable summit exits with no sudden clipping or teleport, preserve slow manual climb and legitimate checkpoint behaviour.
- Validate lower, middle and high shelves, ascent length and exit safety in both landscape and portrait.

## Phase 4A — landing rock and ice visual integration (implemented v0.9.20; needs visual review)
- Neaten the ice-to-crest intersection, uneven snow ridges and cliff roots; avoid flat rectangular tops and unrealistic floating triangular shelf fins.
- Increase undersized cliff trees proportionately; improve near-versus-far depth without blurring the climber or restoring costly full-frame effects.
- True walkable slopes are separate physics/collision work and require explicit tests before implementation.

## Phase 4C — time gates, challenge curve, ledge/snow polish (implemented v0.9.22; needs playtesting)

The new Time Trial mode adds bronze/silver/gold course cutoffs, cumulative stage gates and split timing, plus optional local personal-best ghosts. Gold remains deliberately ambitious; provisional thresholds scale with the accepted mountain layout and require real-player adjustment. A run with tuning or skipped stages never saves a PB. Trial failure resets the run to avoid checkpoint-cheating.

Rendering uses deeper irregular rooted terraces and tighter snow caps on actual collision ledges, with smaller summit ice/snow feathering and shorter ice-root frosting. The generated stage difficulty increases through stricter high-landing first-contact and release-window preference, capped at four viable candidate selections per mountain to protect mobile performance. All approved golden seed fingerprints remain protected.

A local 80-route bounded-generation sample and representative full draw/game-loop smoke passed. A 997-route full sweep of the previous unbounded variant found all options reachable, but that exhaustive search was too slow for mobile; the bounded version therefore needs its GitHub full-test run and manual review before final acceptance.

## Phase 5 — cave and campfire (implemented in v0.9.23; visual review deferred)
- Solid physical right wall stops running and airborne escape; left-hand cave approach is intentionally open. The fire, ladder and back wall share world-space geometry.
- Ladder on right, fire separate on the left. Non-modal Continue / Retry appear only when near the fire in Practice. Time Trial/Hardcore proceed uninterrupted. Practice Retry starts at the preceding summit; checkpoint respawn and actual final ladder victory remain.
- Tested logic against golden route seeds; exact mouth silhouette and visual integration remain part of future graphics overhaul.

## Phase 6 — climber and pole (initial work implemented in v0.9.24)
- Climbing animation moves as a function of physical climb distance and pauses/reverses with Up/W and Down/S. A temporary rear-facing pose masks the front-face sprite while on ice.
- Staff renderer enforces constant 195-unit material arc length, including extreme chord cases. **Pole physics remain untouched.**
- Replacing the chibi-ish sprite artwork with coherent final side/rear/vault sprites and fully natural weighted axe/foot animation belongs to the later graphical overhaul.

## Phase 7 — Android-first readiness (partly implemented v0.9.24; not release-ready)
- App/tab visibility, blur and pagehide clear all touch and keyboard holds; resuming resets the 120 Hz simulation clock instead of fast-forwarding time trials.
- Browser/mobile performance diagnostics and safe-area touch controls continue from earlier phases.
- **Outstanding:** inspect real Android Chrome performance (idle / walking / vault / climbing / cave), p95 draw, memory, portrait touch, orientation/focus and production packaging. Do not claim Google Play readiness without real device validation.

**Deferred graphics and difficulty:** see `docs/graphics-overhaul-backlog.md` for naturally rooted ledges, stretched snow joins, coherent painterly cliff assets, temporary climber rear-pose replacement and revised challenge/medal calibration.

## Scaling the mountain template without quality erosion
- **Current:** 997 deterministic route seeds, ordinarily three receiving mountains and two-to-four shelf choices, generated from a SMALL set of curated `MOUNTAIN_ARCHETYPES`. This is a strong base but **not** 997 manually distinct mountains or an unlimited campaign.
- **Before adding large campaigns:** formalise level records (seed, archetype, palette, stage goals, target difficulty and acceptable completion windows); add reviewed archetypes with distinct visual/difficulty signatures instead of merely increasing random jitter.
- For every generated level, require meaningful high/middle/low separation, first-hit physics reachability, braking room, complete ice paths, summit takeoff space, natural cliff backing, and no collisions with nearby terrain.
- Reject near-duplicates, unreachable shortcuts, camera-hidden options and memory-heavy mountain caches. Check 16:9 and portrait gameplay captures for human signoff.
- The golden-geometry test `tests/approved-level-template.test.cjs` pins seven visually approved seeds. Any change to those fingerprints requires explicit visual review, not just updating numbers to make CI green.
- Full campaign generation, procedural ice network routing and visual-uniqueness scoring remain future deliverables, **not yet implemented**.

## Phase 3 implementation checkpoint (v0.9.19)

- `iceRouteNetwork` derives each ascent from its original ice curve; a low route can join a higher route **only** when it passes within 35 game units of that higher shelf's entry and its crossing lies inside the higher shelf. No forced trunk and no changes to ledge physics.
- After a join, the lower and upper climb reuse exactly the same segment coordinates and exit. Isolated routes remain independent. The runtime caches the graph per mountain, invalidated on New Route, to preserve mobile performance.
- The static mountain cache draws only each unique ice segment (children stop at their merge), rather than overpainting a cyan trunk several times. Frozen surfaces end UNDER the top snow; irregular windblown white drifts soften the join along the summit.
- After climbing, ice exits require a short 20-unit step onto a legally walkable snow plateau. Ladder exit unchanged.
- New test suites `test:ice-network` and `test:ice-snow` cover all 997 route seeds and artwork invariants. **Visual approval and a real touch-device climb are still required.**

## Phase 4B — precision landing routes and reversible ice climbing (implemented v0.9.21; needs gameplay review)

**Implemented:** sample all 180 pole-release setups using the existing first-contact and braking model. Prefer accepted authored ledge layouts with narrower safe highest-ledge release windows than the lowest ledge; keep the seven v0.9.16 golden routes untouched. Across 997 route seeds, 2,987 of 2,991 stage layouts meet the precision criterion while four remain safely playable; future human difficulty review is still required. Preserve manual climbing with Down/S and mobile down control for descent/reversal, including shared-ice junctions. Remove fake decorative ice falls. Keep contextual HIGH ROUTE feedback subtle. All 997 routes, physical cliff backing and summit exits must remain valid, with an Android playtest before signoff.

## Phase 5 cave landing and presentation notes

The user playback shows the cave appearing to accept the player while the character overshoots or glances off the invisible collision/roof rule. Align the ACTUAL collision target with the visible cave entrance and slightly improve the reasonable landing window; preserve the challenge. Retain the improved cave height, recess the cave naturally into the rock, move the ladder to the right of the campfire and trigger Continue/Retry only when the player approaches the fire. Do not address by altering vault physics.

## Phase 4A verified changes

- `terraceButtressProfile` roots each outcrop into the continuous level cliff at its real depth, rather than a disconnected angular trapezoid.
- `drawIceShelfJoins` overlays ice and frost across real shelf entry/footing; cached terrain draws the ice, footing and summit snow in that order.
- Removed decorative full-height frozen waterfalls and oversized white scratch marks from the last cave summit. These were art-only features, not climb routes.
- No mountain/collider coordinate changes; approved level template and 997-route tests remain mandatory.
