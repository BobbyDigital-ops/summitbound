# SUMMITBOUND — active design brief
**Current build:** v0.9.7 Mobile Release Candidate — six-checkpoint mega update on development branch, all automated tests and a full renderer smoke test across nine routes pass. Awaiting HUMAN browser and mobile playtesting. Original v0.9.1 protected at `backup/v091-before-mega`.
**Canonical outstanding backlog:** https://github.com/BobbyDigital-ops/summitbound/issues/1

## Game promise
Landscape-first, side-on premium arcade pole-vault ascent over extremely large Nordic snowy mountain chasms, with satisfying, almost Yeti-Sports-like timing and rewarding accuracy. Every fifth mountain is an organic cave checkpoint where reaching the fire finishes the current level. The earlier name "Summit Leap" may still occur in legacy paths; the player-facing game name is **Summitbound**.

## Visual reference and terrain constraints
Use our original `snowy_canyon_vault_adventure.png` and `a_wide_cinematic_high_quality_stylized_game_con.png` concept illustrations for intended cinematic rock spires, deep snow, mist, cliffs, caves, natural firs, warm light and abyss. The distant mountain backdrop is liked; flat grey square foreground mountains, protruding rectangular platform shelves, artificial cartoon firs and ladder scaffolding are not acceptable final art.
- Landing shelves must be *carved into and supported by one uninterrupted, irregular, textured mountain mass*. No unconnected floating platforms. Snow rims follow geological terrain, while playable landing surfaces must align precisely to the collision coordinates.
- Each seeded route now has **1–4** landings per spire, spread across the wider mountain face with distinct widths, heights and approaches; retain a reachable landing and possible direct summit shortcut. Some climb lines are independent, some share an ice trunk. Preserve meaningful run-up, braking space and open edge risk.
- Three outdoor spires each have ice routes: a shared trunk when shelves are close, otherwise **separate ice climbs** from individual shelves to the summit. Character uses a pair of ice axes and crampon steps. Only **the cave has a metal ladder**. Hold W/Up/touch Up to climb and stop when released.
- Organic fifth-spire cave roof and floor physically affect vaults; cave fire triggers win/checkpoint at entry, not a mandatory summit climb.

## Protected mechanics
Do not rewrite `public/game/scripts/physics.js`, vault tune constants, air steering or movement controls just to improve visuals. Running speed affects spring launch; hold/release timing controls range and lift; floaty flight and scary reachable gaps are intentional. Mobile gesture: touch-and-hold clear play area to plant/ride, release to vault; distinct left/right and contextual climb controls; keyboard A/D/W/Space/R. Preserve deterministic routes and Practice/Hardcore.

## Pending art and animation
Long realistic running strides instead of rapid skipping; proper sprite-based climbing arms and feet with believable tool contact; fixed-length flexible wooden pole without hinge/stretch; coherent scenery sprites/textures and cave glow; subtle weather, parallax, sound; mobile polish. More exotic ledge rescues, eagle catches, swing bars, freezing blizzards and endless runs are deliberately **deferred** until the core level works.

## Collaboration / release rule
Every release: (1) assess whether Gemini would outperform direct GitHub edits; default to direct edits and narrow Gemini prompts only where justified, (2) small, reversible GitHub changes, (3) meaningful tests, (4) **visible HUD version number and subtitle** plus updated title, (5) human preview/playtest before considering visuals approved, (6) update GitHub issue #1 as tasks are implemented. AI Studio pulls from GitHub; Gemini modifications sync to GitHub first. A passing build is not a gameplay test.

## Current traversal identities (v0.9.1)
- Leap 1: Opening Chasm — introductory canyon to first set of terraces.
- Leap 2: Windward Rise — a more demanding horizontal crossing where EVERY landing is higher than the preceding launch summit.
- Leap 3: Steep Ice Crux — shorter crossing, ascending to a markedly higher spire.
- Leap 4: Cavern Approach — an UPHILL precision entry into a high cave recessed on the side of a much taller jagged peak, with the sheltered steel ladder and finish-line campfire.
All four crossings gain elevation; low, middle and high terraces are risk/reward landing choices with independent horizontal positions, varied distances and widths. Nine deterministic routes are checked against the actual pole-vault flight engine, but still require real human playtesting. The v0.9 asset pass must further differentiate foreground silhouette/texture and improve cave depth.

## v0.9.1 pending visual review
Terraces are horizontally staggered and lead to a coherent uphill route. Smaller non-collidable crags, winter shrubs, grass, ice drips and dwarf firs are layered into the clipped mountainside. The ice-climbing sprite, pick placements and crampon animation were smoothed by using a slower distance-linked cadence. **Still unmet:** truly painterly illustrated cave entrance on rock-face side, high-quality foreground assets, polished full-body climbing animation, and convincing running sprite poses. Never claim procedural shape changes alone achieve the original concept art.


## v0.9.2–v0.9.7 mega-update checkpoints
- **v0.9.2 Mobile Rendering:** raster cache static terrain, reduce mobile backing pixel resolution and invalidate caches when seeds/assets change.
- **v0.9.3 Distributed Landings:** seeded count 1, 2, 3 or 4; offset shelves widely in X, collision platforms recreated to match; separate or shared climbing routes as warranted. True uphill approach retained.
- **v0.9.4 Natural Cavern:** cave opening is irregular broken rock with snow/ice; sheltered steel rungs are visible *inside* cavern. Reworked ledge rock profiles.
- **v0.9.5 Alpine Assets:** two reusable SVG scenery assets (`public/game/art/alpine-fir.svg`, `public/game/art/cliff-scrub.svg`) integrated into cached mountain art.
- **v0.9.6 Natural Motion:** longer distance-driven stride and limited sprite interpolation; calmer ice-pick/boot animation, but **not** a replacement authored sprite sheet.
- **v0.9.7 Mobile Release Candidate:** Auto/Low/High graphical presets and loop FPS indicator in Tune; reduced moving snow and quality-scaled cache in Low. Static ice routes now cached with terrain.

Validation: CI includes ice, cliff, wooden staff, leap, art, ascent, physical vault reachability, mobile structure and **runtime Canvas rendering for all nine routes**. CI cannot certify actual 60 FPS on Android, finger controls under load, artistic fidelity, or fun/jump difficulty. User's AI Studio preview and standalone mobile browser must be used for those checks.

Protected old version: `backup/v091-before-mega`. The player-facing label changes to **MOBILE RELEASE CANDIDATE · v0.9.7**. Use GitHub as the source of truth, and never force-push to overwrite Gemini changes.
