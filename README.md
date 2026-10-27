# Summitbound v0.10.0 — Phase 8 Skill Foundation (gameplay rebuild)

**Implementation checkpoint, awaiting real playtest and complete CI.** Active work stays on `main` for Google AI Studio; backup `backup/pre-phase8-v0924` retains the old implementation. Final design calls for **exactly 100 individually validated levels**, not 110 or 100+; content production is future work, not delivered by the prototype's 997 deterministic seeds.

- **Skill-based pole vault:** release speed now depends strongly on actual approach momentum and a precise release timing window around 68% of the pole ride; premature, weak and over-held launches receive predictable penalties. No random corrections to flight. Air steering is reduced so commitment matters.
- **Alternating ice axes:** A/D or left/right mobile buttons while attached to ice deliver edge-triggered alternating axe strikes. A correct rhythm creates climb impulses and substantial speed advantage, repeated same hand does not; W/Up remains a faster-than-before accessible steady climb, S/Down a direct descent. Regular A/D movement is unchanged when not climbing.
- **No artificial ice crest slide:** climb path ends on the REAL summit collider; on reaching the final climb point, the player dismounts at that exact X rather than automatically traversing to another snowy location. Cave shaft transition is still a separate feature for Phase 9.
- **Real landing/recovery:** each airborne physics step tests first contact by sweeping between the actual previous/current positions across every available ledge (including unintended recovery shelves). Falling through open space still returns to the last valid checkpoint if no surface is caught.
- **Intermediate launches:** a genuine large-enough landing shelf can now serve as a pole takeoff surface. Multi-peak shortcut geometry remains Phase 9 work.
- **Regression:** stock ghost replay records are versioned to v2 after the physics changes; scripted checks now cover vault consistency, axes, actual ice exits, rescue landings, and ledge launch, and are added to CI. Trial medals remain provisional until a reliable set of full real-person runs exists.
- **NOT Phase 8:** the present four-crossing level and its dated mountain geometry remain temporarily in place. Phase 9 will create wider, VARIABLE gaps, branching physically continuous mountains, campsites, cave tunnels and longer continuous progression; Phase 10 will replace the persistent cartoonish asset and glued ledge system. Wind/weather belongs to a later deterministic, telegraphed environmental system.

**Quality bar:** predictable failures, meaningful mastery, recoverable unintended landings and logically connected terrain — not artificially generous leaps or scripted summit slides.

**Known level-design debt identified by the new physics:** the old high-versus-low timing ratio is no longer a reliable difficulty certificate. In a sampled 122-seed check (366 receiving-mountain stages), about 60% retained a tighter highest-ledge release window than the low alternative; every sampled ledge was still reachable. **Phase 9 MUST re-author topology and route grading** before accepting the eventual 100-level campaign. Physical reachability alone does not satisfy our commercial difficulty bar. Shipping exactly 100 levels requires fully curated/bot-validated **and human playtested** level layouts across real Android devices.

---

# Summitbound — v0.9.24 Gameplay Systems (Phases 5–7 progress)

**Development branch:** `main` (the branch synced by Google AI Studio). The v0.9.22 and v0.9.23 states are protected as `backup/pre-phase5-v0922` and `backup/pre-phase6-v0923`. The original `level-template-v0.9.16` golden route geometry is deliberately unchanged.

- **Phase 5 — cave/checkpoint implemented:** real solid right-hand cave wall for grounded and airborne movement, entry from the left remains open, aligned collision/visual back wall. Right-hand ladder and a separate left campfire use the same geometry reference. Contextual Continue ascent / Retry leap controls appear only near the campfire in Practice; Time Trial and Hardcore continue without intrusive popups. Preserve campfire respawn and ascent victory.
- **Phase 6 — initial animation/shaft correctness implemented:** during ice climbing, temporary wall-facing red-jacket back silhouette and hand/foot axe cycle follow actual ascent/descent distance and freeze on release. New curved vault staff renderer maintains the specified 195 world-unit **material arc length** (validated over extreme reaches); no pole simulation, release, or level physics modifications. Full production character sprites and art direction remain deferred.
- **Phase 7 — Android-focused engineering groundwork:** prevent hidden-tab game-loop progression and stuck virtual controls after pagehide/blur/visibility transitions; reset accumulated physics time safely on resume. Touch controls and render diagnostics remain in place. **Hardware performance profiling, store packaging, and release are NOT complete.**
- **Regression coverage:** `npm run test:phase5`, `npm run test:phase6`, `npm run test:phase7` have been added to CI. Manual VM/integration checks confirmed cave/right-wall/ladder across seven golden routes and pole arc material length across extreme positions. Full automated GitHub CI status and actual Google AI Studio/Android visual playtests are **not yet verified**.

**Deferred work:** the user's playtest still reports some ledges looking glued onto cliffs, oddly stretched snow-to-ice features, and an overall easy difficulty curve. Instead of endless patchwork, consolidate these into a dedicated visual and challenge overhaul: [graphics-overhaul-backlog.md](docs/graphics-overhaul-backlog.md). Preserve v0.9.24's logical geometry and player controls during that future overhaul.

---

# Summitbound — v0.9.22 Phase 4C: Terrain, Time Trials & PB Ghosts

**Code complete, pending real-device/AI Studio visual and feel review.** Development remains on `main` for Google AI Studio; `backup/pre-phase4c-v0921` preserves the previous version. The frozen `level-template-v0.9.16` and all seven approved geometry fingerprints are unchanged.

- **Terrain:** rock-rooted terrace undersides join actual mountain contours; tighter snow-on-rock ledge caps, smaller summit snow feathering and shorter ice footing eliminate unnatural stretched bridges. No collider or vault-physics changes.
- **Difficulty:** generator preferentially selects progressively narrower *safe first-contact/release* windows for higher landings (stage caps 20 / 13 / 9) while lower routes remain safer. A hard four-viable-candidate selection budget protects mobile route changes. When the preferred upper route is unavailable, the first safe viable layout is retained. Seven protected reference seeds remain exactly as approved.
- **Time Trial mode:** seeded bronze/silver/gold *course* targets, live countdown to next medal cutoff, cumulative per-stage time gates, checkpoint splits and final medal screen. Time targets use existing actual high-route ascent lengths plus vault/running budgets and must be refined after human playtests; they are not yet player-calibrated records.
- **PB ghosts:** locally stored, versioned, route-specific best runs. Sampled at ~8 Hz, interpolated at render time, ghost toggled in the HUD; saved only after a valid four-gate Time Trial victory using stock physics. A fail/retry restarts the race, and skip/tuning invalidates ranking. Local storage failure is harmless. No multiplayer or network leaderboard.
- **Validation:** all seven golden fingerprints matched. A final bounded-search sample of 80 routes passed, representative runtime playback, ghost persistence and HUD/draw checks were exercised. New `npm run test:phase4c` covers scoring, ghost correctness and anti-cheat; the standard GitHub workflow now runs it. A complete CI confirmation and physical Android/AI Studio playtest remain outstanding.

**Next: Phase 5** — fix the cave right-side collision and visual entrance mismatch, integrate cave naturally in the mountain, move ladder right of fire and provide a campfire Continue/Retry choice without unwanted popups. Phases 6/7 remain animations and Android readiness.

---

# Summitbound — v0.9.21 Precision Routes (Phase 4B)

**Phase 4B implementation complete, awaiting human AI Studio review.** Active GitHub branch is now `main`, which Google AI Studio syncs. Snapshot `backup/pre-phase4b-v0920` safeguards the previous playable version; `level-template-v0.9.16` retains the approved original geometry reference.

**Ice routes:** removed two decorative vertical frozen waterfalls that looked like duplicate climbing walls, and increased physically justified connections between intersecting climbing routes. Route branches reuse precisely the same upper path, never teleport. All 997 seeds retain accessible ledges and a summit exit; measured 1,043 shared branches across the 2,991 generated mountain stages.

**Controlled descent:** Down/S and a contextual mobile ▼ control reverse climbing speed at the same 62 units/second, stop immediately on release, and allow ascent again mid-wall. From the upper summit, descend along an existing ice route; at a genuinely shared junction you can also continue from the higher ledge down to the lower one. Summit and shelf dismounts use physical route endpoints.

**Landing difficulty:** new first-contact, stopping-distance and safe pole-release-window profiles bias unapproved generated layouts toward narrow high-route windows and generous lower-route windows. 2,987 of 2,991 stage layouts meet the measured high/low challenge distinction; the four remaining ones remain physically playable. The seven approved golden geometry snapshots are unchanged; physics, acceleration, landing collisions, pole spring constants and cave layout remain untouched. A subtle label/haptic acknowledges high landings.

**Validation:** core route, rock backing, ice-junction and difficulty invariants were checked over 997 seeds; four representative ascent/pause/reverse/descent scenarios were exercised in a simulated runtime. New `npm run test:phase4b` tests are wired into GitHub Actions. Visual/physical touch testing in AI Studio is still required; do not treat code tests as visual approval. Vercel may still be build-rate limited.

**Next Phase 5:** fix walking/falling through the cave's right wall, align actual cave collision with visible entrance, carve the cavern into the mountain, position the ladder to the right of the fire, and put Continue/Retry at the campfire without unsolicited popups. Phase 6 climbing/axe/pole animation; Phase 7 Android device readiness.

---

# Summitbound — v0.9.20 Mountain Integration (Phase 4A)

**Completed visual pass:** each landing ledge is drawn with a broken-stone buttress whose deep root is anchored into its actual mountain-contour boundary. The decorative ice entry now overlaps real landing snow and fractured rock, addressing the gap below/along the previously floating icy strips. The final cave mountain's long, decorative white icicles/vertical waterfall streaks are removed and replaced by subdued rock cracks.

**Deliberately unchanged:** every summit, shelf, cave collider, seeded layout, climb route, vault trajectory and user control; Android rendering optimisations/cached terrain remain. No redesign of the cave landing or the climber animation is included.

**Validation:** geometry-root tests across representative seeds, cached and uncached draw-order smoke tests, extra terrain-art tests, all 997 reachability routes, seven v0.9.16 golden level fingerprints, mobile cache tests and Vite build. Visual appearance still requires actual Android/desktop review.

**Next:** Phase 4B — measure how hard high/middle/low landings actually are using successful timing windows, tune LEVEL DESIGN for the desired high-risk/high-reward feeling, and add restrained successful-high-landing feedback. Phase 5 — cave approach/collision, carved entrance, ladder position and campfire selection. Later: animation, pole shape, Android publication checks.

---

# Summitbound — v0.9.19 Natural Ice Routes (Phase 3)

**Done:** natural ice-route network that conditionally shares the upper climb only where a lower ice path actually passes through a higher shelf's ice entrance. Other shelves retain independent climbs. Snow-covered summit caps now overlap and bury the formerly blunt cyan tops, with irregular frost tongues and a brief on-ridge step-off.

**Unchanged:** approved v0.9.16 mountain geometry (protected by level-template snapshot and golden-seed tests), pole physics, controls, manual 62-unit/s climbing speed and v0.9.18 mobile sharpness/cache improvements. Branch `main` remains untouched.

**Validation:** existing climbs and all 997 seeded layouts, conditional ice-route-network coverage, cached renderer, snow-crest artwork, browser startup and production build. Automated checks cannot establish visual fidelity on a physical phone: preview review is still necessary.

**Next:** Phase 4 (mountain snow, rock, trees and ridge polish), Phase 5 (cave and campfire), Phase 6 (wall-facing climber/axe animation and pole rendering), Phase 7 (Android validation). See `docs/post-phase1-roadmap.md`.

---

# Summitbound — active development v0.9.18 (Sharper Mobile)

**Phase 1 optimisation delivered:** mobile mountain textures have selectively improved clarity; portrait Auto canvas rendering is capped at 1.20 DPR and safely downgrades to 1x only after repeated expensive draw samples. Terrain/background caching, idle pacing and the original vault physics remain intact.

**Approved level template:** `level-template-v0.9.16` preserves the visually approved mountain layouts. `tests/approved-level-template.test.cjs` protects seven representative seeds in CI, alongside reachability, braking, cliff, ice ascent and the full 997-seed route sweep. New level families require additional manual screenshot/playability review, not merely passing geometry tests.

**Next work:** `docs/post-phase1-roadmap.md` records shared ice routes and blended summit exits (Phase 3); mountain silhouettes, trees and snow (Phase 4); natural cave and interactive campfire (Phase 5); realistic wall-facing climbing animation (Phase 6); device checks and Android preparation (Phase 7). Read `docs/level-design-template-v0916.md` before expanding the procedural level catalogue.

---

# Summitbound — active development v0.9.14 Mapped Mountain Routes

This checkpoint replaces near-horizontal platform stacks with height/distance/width-independent shelves. Each receiving peak usually offers three physically reachable shelf choices; a minority offer two or four. Summit height and crest width also vary. The 997-seed regression sweep passed without fallbacks. See [the mountain layout map](docs/mountain-layouts.md).

**Not yet completed:** natural shared ice branches, truly walkable summit slopes, final cave visual overhaul, or the stationary/mobile stutter investigation.

---

# Summitbound — active development: v0.9.13 Procedural Peaks

Active game: `public/game/summit-leap-v081.html` with modular Canvas scripts under `public/game/scripts/`. Development branch: `dev/visual-recovery-v099-v0912`. Main is not automatically updated by this branch.

## v0.9.13 (procedural mountain Phase 2)
- 997 deterministic route seeds; mountains now vary in summit height, crest width, exposed cliff taper and shelf arrangement.
- Usually 2–4 shelves per mountain; a rare special layout has one. Each shelf independently varies horizontal distance, length, elevation and surface. High shelf does **not** have to be farther away than low shelf.
- Potential shelves are accepted only if flight sampling using the **existing** `PolePhysicsEngine` finds real first-contact landings and adequate braking windows. Summit collision run-up is rebuilt with each route. Existing vault physics and control handling are unchanged.
- All prior regressions remain; `npm run test:procedural` additionally checks 51 routes and `test:chasm` checks extra difficult seeds.
- Phase 3 shared/branched ice walls, fully walkable sloped summits, visual cave work and performance diagnosis remain *future* tasks; do not assume these are implemented.
- A green CI result confirms automated tests, **not** a complete manual gameplay review.

---

# Summit Leap — v0.8.3 Clean Foundation

Read [CLEAN_FOUNDATION.md](CLEAN_FOUNDATION.md) for the active architecture and migration notes.

# Summit Leap v0.6 — AI Studio import package

This is a full copy of the original React/Vite/Phaser AI Studio project, with the *active game* replaced by the v0.5-derived mobile canvas game (v0.6) inside the React viewport. The original Phaser sources are retained under `src/scenes`, `src/physics`, etc. as **legacy reference**, **not** the active gameplay engine. Do not re-enable that older physics accidentally. The playable game is `public/game/summit-leap-v06.html`.

## Features
- Three mountain-to-mountain vaults, tiered naturally integrated rock shelves and direct summit shortcuts
- Longer, intimidating chasms, with open right ledge edges (no invisible stopping walls)
- v0.5 arcade launch, release, low gravity and air steering; fixed-length curved pole rendering + rider tether
- Manual hold-to-climb via ferrata (W/Up; on mobile contextual Up), slow climbing costs time
- Reusable transparent 10-frame mountaineer sprite atlas in `public/game/mountaineer-sprites.png`
- Opaque hand-drawn cliff gradients, fracture pattern and snow cap integrated into the rock profile
- Original mountainscape reference preserved as background
- Practice and Hardcore, timing HUD and release-phase meter, two-thumb mobile input

## Notes
`npm install && npm run build` compiles the React/Vite shell and copies the active game/assets. `npm run dev` runs local preview.
Standalone, dependency-free testing: `summit-leap-great-traverse-v06.html` (included in ZIP `extras/`).
AI Studio can edit `public/game/summit-leap-v06.html` directly. A future refactor may extract it into TypeScript/Phaser, but should preserve the game's validated feel before any engine migration.

Ledge grabs and Endless Mode remain planned, not implemented in this build.


## v0.6.1 rock ledge variety
Different widths and horizontal offsets for high/middle/low outcrops across three spires. `New route` cycles among nine reproducible arrangements; retrying or falling keeps the same arrangement for skill mastery and fair times. Manual climbs now visually follow each tier's actual via ferrata route, with modest extra time for horizontal traversal. The v0.5-derived arcade vault, pole length constraint, mobile controls, checkpoint and Hardcore logic are preserved. Gameplay file `public/game/summit-leap-v061.html` is the active version.


## v0.7 — The Cave of Embers
This version is the active `public/game/summit-leap-v07.html`. Builds on the playable v0.6.1/v0.5-derived arcade movement. Four canyon jumps now terminate at the fifth spire's cave checkpoint, with roof collision and variant entrance geometry. Existing normal tiered ledges vary width and horizontal placement with replayable route seeds. Manual ladder climbs are vertical with alternating limb poses and deliberate dismount. Foreground uses a red-puffer mountaineer sprite atlas with hat, shades, black trousers, proper running stride; fixed-length visibly tapered wooden pole; repeating slate texture and snowfall. Player can still overshoot ledges and fall. Practice/Hardcore and mobile multitouch controls preserved. Ledge grabs and Endless mode remain future tasks.
