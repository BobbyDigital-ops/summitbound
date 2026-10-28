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

## Textured library milestone

64 independent rock piece definitions: 24 bases, 24 extensions, 16 summits. Each has polygon geometry, S/M/L join sockets and platform mounts (three per base/extension, one per summit). The 50 platform pieces have five size families and ten visual variants per size. `clean-cinematic-textures.js` adds deterministic mineral gradients, fractures, speckle and frost, displayed by `clean-asset-atlas.html`. The standalone QA workflow tests connector matches, platform mount size compatibility, mount position containment and texture-rendering smoke checks. This is **procedural Canvas texture artwork**, not final hand-painted sprites; the generated-level runtime is not yet integrated.

## Independent assembler checkpoint

`clean-map-phase1.js` now assembles 3–7-piece peaks from new prefabs only. Every piece attaches to an available same-sized opposite-facing socket. Occupied platform slots instantiate physical landing rectangles; empty slots produce no collider. `clean-spire-lab.html` previews three seed-selected assemblies. Standalone CI checks 100 seeded assemblies and 20 three-peak output sets. **Unfinished:** collision-solid welding across connector joins, validated playability with pole physics, robust icefall attachment, final texturing polish, and replacing the runtime's removed legacy world-data scripts. This development branch remains intentionally unplayable as the primary game, and must not be merged yet.

Combinatorics: a *theoretical* one-base/one-summit ordered sequence with 1–5 extension choices gives 24 × 16 × (24 + 24² + 24³ + 24⁴ + 24⁵) = 3,190,588,416 named arrangements, before connector restrictions, shape collisions or gameplay filtering. This is not the number of validated distinct playable peaks.
