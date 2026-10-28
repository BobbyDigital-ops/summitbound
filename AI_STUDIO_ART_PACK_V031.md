# Summitbound v0.31 — AI Studio Git sync

**Branch:** dev/v031-art-pack-experiments
**Source:** BobbyDigital-ops/summitbound
**Preview/build in Google AI Studio only. Do not push to Vercel or publish.**

The branch includes full integration of two selectable terrain art treatments and an ice clipping correction, on top of v0.30.

In-game: Tune → Art: Painterly / Cinematic. The toggle preserves the camera, physics, progression and controls. The selected pack persists via localStorage. New art is static and uses the existing terrain cache; changing packs invalidates that cache.

Painterly: softly blended watercolour stone, blue-grey mineral washes, large snow-laden conifers.
Cinematic: deeply fractured darker granite, sharp rock facets, dense flecks and restrained snow-laden trees.

The ice routes are clipped to their physical ledge's top surface; snow caps redraw last over the ice. **Still manually inspect all four climbing exits:** route ordering may differ from ledge index. These are two procedural renderers, not third-party photographic texture packs.

CI: npm run build; npm test (and/or the existing full GitHub CI workflow). Do not change pole/vault physics to compensate for texture shapes.

**Vercel exclusion:** the branch includes a vercel.json ignoreCommand returning 0 (skip build) only for dev/v031-art-pack-experiments. Other branches retain standard behaviour. Do not remove the branch skip while it is linked to Vercel.
