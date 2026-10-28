# Phase 1 — cleanroom map engine

The old Five Peaks world map and its dependent course and modular-decoration generators have been deleted from this development branch:

- `public/game/scripts/world-data.js`
- `public/game/scripts/course-engine.js`
- `public/game/scripts/modular-course-v040.js`
- `public/game/scripts/true-peak-mesh-v041.js`
- `public/game/scripts/modular-peaks-v1.js`

The existing game remains on `main` for now. This development branch deliberately cannot launch the old course: its HTML still references scripts that no longer exist. The new standalone generator is incomplete and **not yet wired into gameplay**. Do not merge until it produces independently constructed, playable levels while retaining the existing pole physics and player controls.

Git history retains previous versions; deletion from a branch is not secure erasure of history.
