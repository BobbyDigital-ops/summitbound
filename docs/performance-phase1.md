# Phase 1 — Mobile performance and tightening (v0.9.17)

The v0.9.16 mountain layouts are **frozen as a reusable level template** in branch `level-template-v0.9.16` (commit `9cde4c561d3901e813c6b2cd7a50456c6dafe3b3`). This performance phase must preserve the same vault physics, controls and mountain choices.

## Audited bottlenecks

1. The full-resolution painted JPG was being resized on EVERY animation frame even when the camera was stationary.
2. The terrain cache allowed only two mountain canvases on phones. When three mountain faces were simultaneously relevant, one would be discarded and rebuilt repeatedly.
3. HUD/stage/timer/Climb button style/text mutations occurred on each draw loop even with no state change.
4. Even while motionless, portrait rendering attempted near-60Hz full-screen painting and auto quality used 1.15 canvas DPR (about 32% more pixels than DPR 1).
5. Portrait navigation wrapped into multiple lines, reducing the playable area.

## Fixes

- A bounded background raster is built once per quality/viewport and reused for parallax; do not downsample the source JPG repeatedly.
- Maintain up to **three** mobile cached terrain surfaces with LRU and a **40 MiB** raster memory budget. Cache counters reveal unexpected rebuilds/evictions.
- Auto portrait DPR is capped at 1; High remains opt-in. A motionless grounded player in auto/low uses approximately 30 rendered frames/s, while simulation/physics still ticks at 120 Hz and moving/vaulting renders at display rate.
- Update UI text and visibility only when values change.
- Display optional **Render FPS, mean / p95 draw time, canvas cache memory, rebuilds/evictions** under Tune. This is instrumentation rather than a claim of measured Android performance.
- Keep the mobile toolbar in one horizontally scrollable row instead of obscuring the whole scene.

## Acceptance procedure on actual Android

1. Load development Vercel preview in Chrome, choose Auto graphics and leave character idle for 10 seconds.
2. Open **Tune** and note Render FPS, mean / p95 draw milliseconds, cache MB and evictions. A deliberate ~30fps idle is expected; **draw time** and hitch frequency matter more.
3. Hold Right for a long traverse and vault. Moving should render faster; watch for freezes, rising cache builds, and missed inputs.
4. Change Route five times and retry/spawn on the high, middle and lower ledges. Check consistent ice climbing, summit exits, cave checkpoint and no new black frames.
5. Repeat with Low quality. If the **p95 draw time** remains high while idle, profile on the real phone in Chrome DevTools (Performance + Memory + Layers). Do not assume desktop Chromium CI proves real mobile smoothness.

## Remaining performance work

Physical-device trace measurements, high-resolution GPU memory evaluation, final cave static-layer caching if needed, and Android packaging/testing. This phase is intentionally a targeted first pass, not a guaranteed resolution of every handset's stutter.
