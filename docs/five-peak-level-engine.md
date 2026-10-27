# v0.14 physics and mountain topology note

The rendered cliff's rock shoulder and the top walkable summit are no longer the same thing. `spires[i].rockShoulderLeft` is the structural rock envelope reference; the summit's left collider stays on its actual narrow crest. This removes the misleading extra-wide, stretched summit snow that enabled a pole vault to bypass all ledges. The ice/rock attachment is audited separately at the true shelf lips.

The v0.14 vault gives the player three meaningful choices: near-vertical ascent with virtually no forward translation at early release; a high forward arc as the pole turns; and a lower maximum-distance vault mid-swing. The player must not get a distance benefit merely by hanging on; stored recoil dissipates beyond the effective release window. The meter now labels **VERTICAL / RANGE / POWER FADES**. An overheld release is intentionally poor.

Four receiving-peak crossings remain viable with safe release windows. Each requires landing on a genuine shelf or checkpoint ledge and following an ice route, rather than jumping directly onto an artificially widened summit. The four-peak bypass test uses swept first-contact collision against both shelf and summit and rejects any direct summit-first arrival. The final target is still exactly **100** curated levels.

---

# v0.13.0 — Vault physics separated from mountain authoring

The five-peak reference geography is now **frozen as authored input**, so physics can be redesigned without making the old seed-zero procedural selector fail or move the mountains. The active course samples `PolePhysicsEngine` after `pole-dynamics.js` is loaded, while the frozen pre-Phase-8 selector remains available without that module.

**Dynamic release spectrum:** swing angle and fixed hand-to-pole-tip distance vary continuously during a pole ride. Loading builds energy, the middle swing trades vertical lift for forward range, and a late release loses power. The gamer must choose the trajectory needed by the next ledge rather than hit one nominal universal best release tick. Air speed isn't artificially clipped below the physically calculated launch.

**Level QA:** the graph compiler verifies intended paths and actual braking windows under the new physics. Both campsite ledges, all alternative shelves and four real ice paths remain reachable. Those are mathematical necessary conditions, not proof that a jump feels fair. Maintain the 100-level target, not 'unlimited playable levels' claims.

---

# v0.12.1 testing note — full-speed vaults and quick retry

Practice retries now remember the **actual successful pole plant source**. Failed vaults restart there; manually pressing Retry Peak on solid terrain restarts from the current terrain. No momentum is granted on spawn and the last legitimate campsite checkpoint is preserved. Time Trial and Hardcore are not changed by this practice assist.

Vault physics is more run-up-driven: 450 max running speed, 1050 acceleration, and approximately 25% more horizontal velocity at full-speed optimal release than v0.12.0. Terrain validity is tested with real 300/375/450-speed samples. Historical golden geometry is protected by a separate frozen test sampler. The graph does not falsely count a narrow shelf as a fully-powered launch site; the maximum speed of a ledge shortcut must be reachable using its own runway minus pole-plant clearance.

**Outstanding:** gameplay feel and actual success rates, speedrun medal calibration, rugged visual overhaul, future emergency axe catch and curated 100-level generator.

---

# Five Peaks — v0.12 campsite-only architecture

Current curated level: Wolvesgate → Broken Tooth → Windward Camp → Lantern Crag → Firespine Camp. Five peaks, four leap crossings, two checkpoint mountains.

**No caves in the active course.** Windward Camp and Firespine Camp each have exactly one deliberately difficult ledge. Their checkpoint activates on contact, not upon reaching the summit. That ledge leads into an integrated icefall, followed by the next summit. Neither mountain has a cave collider, tunnel rendering, ladder or invisible transition. Historical cave implementation remains for archived tests only.

**One coherent bedrock/ice model.** All landing ledges lie within the parent mountain's bedrock envelope. Four receiving-peak route networks join to real summit colliders. All ice paths and cliffs are generated from the same physical left/right bounds, with vertical upper sections so ice ends on the summit without sideways motion. Every peak, including Wolvesgate, uses the same rock shading, facets, cracks and snow treatment.

**Fair difficulty:** chasm clearances vary roughly 452–671 world units, with physics-checked first-contact options on each crossing. A landing is demanding; walking to its ice face shouldn't be. Settled-ledge traction and climb interaction are tuned independently from aerial release timing and landing momentum. Accidental physical ledge saves are preserved.

**Course graph:** `compilePhysicalCourseGraph` and `auditPlayableCourse` reject unreachable destinations, invalid/unsupported ice, inaccessible checkpoint ledges or invalid course paths. A shortcut is only legitimate when a pole-release path from a real ledge is verified. This demo does not yet contain such a shortcut; it is a future design objective. There is still only ONE playable authored course, not an unlimited-level generator. Exactly 100 high-quality levels are the eventual product goal.

**Pending:** physical Android playtesting, cohesive rugged/menacing visual overhaul, actual speedrun data for medal calibration, emergency axe-catch mechanic design, purposeful environmental wind, and substantial curated procedural/hand-authored route variation.

---

# Summitbound: Five Peaks vertical slice and scalable course engine

**Active commercial target:** exactly **100** quality-controlled levels. **Currently playable:** one five-summit level (four major crossings). The 997 historic procedural seeds are retained for reference/test coverage, not selectable in the player UI.

## Single source of truth
- `course-engine.js` contains `FEATURED_COURSE` (identity, five peak motifs, per-peak offsets, *different* per-ledge landing clearances, campsite/cave checkpoints), `installFeaturedCourseGeometry`, `auditPlayableCourse` and `compilePhysicalCourseGraph`.
- `world-data.js` owns summit, ledge, cave, ice route and **both** left and right rock contours. Ice art and movement use the same anchored route geometry.
- `rendering.js` paints the solid mountain inside those contours, plus a campsite and a tunnel that follows the exact cave ladder coordinate. Never use a separate visual bridge, false ice waterfall or slide-to-summit action.
- `simulation.js` processes actual first-contact landings, axe climbing and checkpoint logic. No summit automatically saves progress: the third-peak camp and fifth-peak cave do.

## Five Peaks hand-curation
| Crossing | Intended choice | Audited first-contact safe opportunities |
|---|---|---|
| Start → Broken Tooth | Distant lower rescue, middle platform, narrow upper approach | Low 3 / Middle 16 / High 4 |
| Broken Tooth → Windward Spire | Long lower rescue, middle, technical high | Low 2 / Middle 13 / High 4 |
| Windward → Lantern Crag | Further and increasingly narrow risk/reward | Low 2 / Middle 6 / High 2 |
| Lantern → Firespine cave | Recessed cave checkpoint, ladder through rock | Four safe sampled releases |

These counts are based on the internal representative vault-release sampler. They establish **possible** routes, not perceived difficulty, route quality or human success rates. The four major gap clearances vary roughly 452–655 world units. No verified direct intermediate-ledge shortcut exists in this initial slice; do not fake one.

## Non-negotiable quality gates for every additional level
1. **Real physics:** each intended launch has room to plant the pole, and each destination offers at least a validated safe release range. A superhuman/unreachable jump is rejected; no invisible flight assistance.
2. **Route graph:** connect accessible launch surfaces, ledges, climbs, cave shafts and checkpoints with measured physical edges. A complete path and fair recovery alternatives must exist. Ledge-to-next-peak shortcuts are accepted only when the sampler proves them.
3. **Rock backing:** every vertex and intermediate part of the visible ice corridor lies inside the **same** left/right mountain silhouette, with minimum margin. The ice must actually end on a legal summit point.
4. **Failure:** any physical landing can save a bad attempt. An uncaught fall returns to the last *meaningful* checkpoint. The engine does not silently restart at every peak.
5. **Gameplay quality:** separate intended high-skill and safer slower alternatives, progressively varied gap sizes, geometry and pacing. Similar seeds are not automatically different levels. Real human assessment is mandatory.
6. **Visual quality:** inspect mountain composition, camp, cave, rock texture, snow shape, and exact collisions in landscape and portrait; reject detached platforms or tunnels behind pasted-on scenery.
7. **Production:** tests plus a complete Android playthrough with profiler evidence. Do not label a level ready because unit tests pass.

## How to grow this beyond the first five peaks
- Next engine milestone: author a catalogue of independent cliff, ridge, cave, campsite and ice-shaft archetypes. Each carries collision and visual geometry, potential takeoffs, real climb graph and difficulty intent.
- Compose candidate multi-peak runs *through a validated manifest*, not unbounded random coordinate jitter. The route compiler's loops are data-driven in peak count, but additional peak counts are **not** yet fully supported by the current UI/simulation/rendering. These must be refactored as one task.
- For each candidate: generate physical course graph; simulate first-contact pole-release windows for *all* intended edges and all viable launch surfaces; validate falls and checkpoints; reject unsupported ice and false ledges; score difficulty and topology uniqueness.
- Promote candidates into the 100-level campaign only after curated playtesting, real Android performance tests and human signoff. Keep deterministic seeds for reproducibility, but **never claim unlimited playable levels merely because a generator can output unlimited seeds**.
- Later include readable, deterministic wind/environmental metadata in each manifest, and tune time-trial medal targets using actual playthrough completion times and PB ghosts.

## Current known limits
The new cliff-backing correction still needs **actual screenshot confirmation** to ensure the rock and ice LOOK natural, not just geometrically overlap. Character and overall mountain art remain cartoonish; a cohesive rugged visual overhaul is still required. The cave tunnel is a functional drawn shaft, not final production-quality interior art. A full CI run and physical Android playtest remain outstanding. Vercel may still be build-rate-limited.

**Related:** `tests/five-peak-course.test.cjs` and `docs/graphics-overhaul-backlog.md`.
