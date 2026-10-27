# Summitbound — The Reforge (v0.20.0)

**Artifact:** one intentionally designed five-peak vertical slice; five peaks / four canyon crossings / two additional uphill ridge vaults / four real ice climbs / two narrow campsite checkpoints. Eventual product target remains **exactly 100 polished levels**. This commit is not a generator of 100 acceptable levels.

## The architectural corrections

1. **One authored obstacle graph, not only a coordinate sampler.** `FEATURED_RIDGE_CRUXES` defines two real uphill transfers, The Black Notch and The Broken Crown. Each mountain has an ice-receiving arrival rock `a1`/`a3` and a separate higher takeoff platform `s1`/`s3`, separated by a real crevasse. The global game physics checks first-contact surfaces (not target teleportation). Downstream peaks shift to preserve intentionally large chasms.
2. **World-space rock and collision are shared.** `ridgeUpperWallX` is used in the granite artwork AND the actual side-wall collision; under-shooting a high ridge vault hits granite. Ice-route exits terminate on the exact lower arrival collider when it exists, never slide sideways to a separate summit.
3. **Control skill ceiling retained.** Near-vertical, higher and longer vault releases use the tested v0.14 pole dynamics. Alternating A/D picks retain faster ice climbing. A 120Hz physics step and responsive Practice same-peak retries are preserved.
4. **New strict physical axe catch.** On a falling approach, press F or the mobile AXE CATCH button *once* when an outstretched axe is within a short physical window of a genuine left/right platform rim. No auto-catch, no magnetic extension, no repeat button mashing. Catching leaves the climber hanging; four alternating A/D strikes within 2.6 seconds pull them over the lip. Failure drops the player back into the actual world. The player can catch unintended physically reachable ledges, including a campsite.
5. **Unified bleak mountain art.** `bleak-art.js` completely replaces the featured course's old tree/rock/ledge/ice renderers: dark jagged granite, consistent fault lines, restrained snow, desaturated ice, weathered dark canvas tents, cold atmosphere, and genuinely open summit fractures. The original painter is preserved in the repo for archive/legacy tests but is not invoked for featured mountain rendering. The backdrop is dimmed and the HUD is steel-and-charcoal rather than bright blues.

## Demonstrated tests

- Current featured course `auditPlayableCourse()` returns no failures; compiler path contains both mandatory `arrival → higher ridge` vault edges and preserves both campsite checkpoints.
- Physics sampling: The Black Notch has **18** sampled braking-safe release opportunities; The Broken Crown **11**. These are counts from defined samples, NOT measured human success probability.
- Actual integrated `tick(1/120)` runs from the lower arrival rocks onto their correct higher takeoff ridges using separate release timings and ordinary landing collision.
- All four receiving-peak ice routes terminate on real colliders. No lateral STEP_OFF transition is restored.
- One-shot axe input requires a real platform rim; a deliberate miss consumes the attempt. Four different alternating strikes recover the player, while hanging too long drops them.
- A falling climber under-shooting an uphill ridge collides with its exact drawn rock wall and loses forward momentum.
- Course audit explicitly rejects an incoming chasm leap that could land on the later summit or on an ice-route arrival ridge, bypassing the intended gameplay.
- Focus, movement, fixed-length pole, versioned ghosts and Android input systems remain in source. The `npm run test:reforge` regression suite and browser-smoke test are part of the GitHub workflow.

**Sign-off remains conditional** until real Chromium screenshots, visual inspection of the huge granite forms (including Android portrait), and representative human completion/failure data. Scripted geometric validity is necessary but not equivalent to a commercially satisfying game. Existing archived procedural generator quality and all 100-level production work remain out of scope.

## Next commercial-development gates

- Review screenshot/feel: Does the fracture read as a true void rather than a dark platform? Is the ice embedded at every tier? Does the outstretched catch feel precise on mobile? Do both ridge cruxes require genuine learning rather than luck?
- Record at least 10 first-time attempts and 10 learned attempts on the same Five Peaks route. Check completion time distribution, fail cause labels, catch false positives and respawn speed, then re-set Gold/Silver/Bronze from actual player times.
- Implement and playtest distinct additional archetypes (overhanging ice, sloped launch, lateral recovery, clear deterministic wind) before trying to produce the eventual 100 curated levels.
- Profile Android graphics memory and 95th percentile frame time with high-resolution terrain caches. Optimise or prerender texture assets before store release.
