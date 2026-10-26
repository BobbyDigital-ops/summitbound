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
