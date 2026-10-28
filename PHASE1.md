# Phase 1 — cleanroom map engine

The old Five Peaks world map and its dependent course and modular-decoration generators have been deleted from this development branch:

- `public/game/scripts/world-data.js`
- `public/game/scripts/course-engine.js`
- `public/game/scripts/modular-course-v040.js`
- `public/game/scripts/true-peak-mesh-v041.js`
- `public/game/scripts/modular-peaks-v1.js`

The existing game remains on `main` for now. This development branch deliberately cannot launch the old course: its HTML still references scripts that no longer exist. The new standalone generator is incomplete and **not yet wired into gameplay**. Do not merge until it produces independently constructed, playable levels while retaining the existing pole physics and player controls.

Git history retains previous versions; deletion from a branch is not secure erasure of history.

## Asset library milestone

Implemented `public/game/scripts/clean-parts-phase1.js` as independent **vector prefab geometry definitions**: 12 bases, 12 extensions, 8 summits, 50 size-tier platform variants and 6 icefall descriptors. Each mountain prefab exposes canonical S/M/L connector profiles and typed mounting points. Platforms expose five matching width families and explicit colliders. A standalone inspection atlas lives at `/game/clean-asset-atlas.html`.

Validated by `node --test tests/clean-parts-phase1.test.cjs` in GitHub's **Cleanroom modular asset QA** workflow, including connector edge coincidence, every platform-to-mount size family, and mount containment within rock polygons. This is **not yet final hand-painted sprite art**, a terrain-assembly integration, or a playable generated course. Existing legacy-dependent game tests are expected to fail on this intentionally incomplete development branch. Do not merge yet.
