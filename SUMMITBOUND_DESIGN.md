# SUMMITBOUND — active design brief
**Current build:** v0.8.8 Cavern & Varied Leaps — CI build and route tests passed; awaiting real-player visual and vault-reachability review. Includes v0.8.7 full-length wooden staff rendering.
**Canonical outstanding backlog:** https://github.com/BobbyDigital-ops/summitbound/issues/1

## Game promise
Landscape-first, side-on premium arcade pole-vault ascent over extremely large Nordic snowy mountain chasms, with satisfying, almost Yeti-Sports-like timing and rewarding accuracy. Every fifth mountain is an organic cave checkpoint where reaching the fire finishes the current level. The earlier name "Summit Leap" may still occur in legacy paths; the player-facing game name is **Summitbound**.

## Visual reference and terrain constraints
Use our original `snowy_canyon_vault_adventure.png` and `a_wide_cinematic_high_quality_stylized_game_con.png` concept illustrations for intended cinematic rock spires, deep snow, mist, cliffs, caves, natural firs, warm light and abyss. The distant mountain backdrop is liked; flat grey square foreground mountains, protruding rectangular platform shelves, artificial cartoon firs and ladder scaffolding are not acceptable final art.
- Landing shelves must be *carved into and supported by one uninterrupted, irregular, textured mountain mass*. No unconnected floating platforms. Snow rims follow geological terrain, while playable landing surfaces must align precisely to the collision coordinates.
- Each seeded route has high/mid/low tier landings whose positions and widths vary independently, plus possible direct summit landing. Preserve meaningful run-up, braking space and open edge risk.
- Three outdoor spires each have **one continuous climbable frozen ice band** that crosses the tiers. Character uses a pair of ice axes and crampon steps. Only **the cave has a metal ladder**. Hold W/Up/touch Up to climb and stop when released.
- Organic fifth-spire cave roof and floor physically affect vaults; cave fire triggers win/checkpoint at entry, not a mandatory summit climb.

## Protected mechanics
Do not rewrite `public/game/scripts/physics.js`, vault tune constants, air steering or movement controls just to improve visuals. Running speed affects spring launch; hold/release timing controls range and lift; floaty flight and scary reachable gaps are intentional. Mobile gesture: touch-and-hold clear play area to plant/ride, release to vault; distinct left/right and contextual climb controls; keyboard A/D/W/Space/R. Preserve deterministic routes and Practice/Hardcore.

## Pending art and animation
Long realistic running strides instead of rapid skipping; proper sprite-based climbing arms and feet with believable tool contact; fixed-length flexible wooden pole without hinge/stretch; coherent scenery sprites/textures and cave glow; subtle weather, parallax, sound; mobile polish. More exotic ledge rescues, eagle catches, swing bars, freezing blizzards and endless runs are deliberately **deferred** until the core level works.

## Collaboration / release rule
Every release: (1) assess whether Gemini would outperform direct GitHub edits; default to direct edits and narrow Gemini prompts only where justified, (2) small, reversible GitHub changes, (3) meaningful tests, (4) **visible HUD version number and subtitle** plus updated title, (5) human preview/playtest before considering visuals approved, (6) update GitHub issue #1 as tasks are implemented. AI Studio pulls from GitHub; Gemini modifications sync to GitHub first. A passing build is not a gameplay test.

## Current traversal identities (v0.8.8)
- Leap 1: Opening Chasm — introductory canyon to first set of terraces.
- Leap 2: Windward Drop — a wider horizontal crossing with lower ledge landings.
- Leap 3: Steep Ice Crux — shorter crossing but a markedly higher destination spire.
- Leap 4: Cavern Approach — longer precision entry into a jagged recessed cave with a warm campfire, keeping the sheltered metal ladder.
These are fixed authored profiles shared by nine deterministic ledge-layout seeds; they must be judged for reachability with actual in-game vaults, not only numeric geometry tests. The v0.9 asset pass must further differentiate foreground silhouette/texture and improve cave depth.
