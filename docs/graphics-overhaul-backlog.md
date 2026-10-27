# Summitbound — deferred graphical overhaul and polish backlog

**Status:** intentionally deferred following the user's 27 October 2026 playtest. Do not block core gameplay, cave, controls or Android-first work on repeated small art tweaks. Maintain the approved painterly alpine mountain direction.

## Major graphical overhaul (after gameplay systems are stable)
- Replace the current procedural/painted terrain mix with a cohesive, high-resolution mountain asset language that scales across many new generated routes.
- Make shelf geometry visibly *carved into continuous bedrock* — no cut-out floating shelves, pasted-on trapezoids, or angular platform roots. Render cliff silhouettes and snow from a common contour.
- Remove stretched summit snow wedges reaching to ice faces. Accumulate snow only on believable rock lips; ice grows out of cracks and flows across rock without gratuitous additional waterfalls.
- Keep ice paths visually distinct, naturally integrated, and exactly aligned with physically climbable networks and their shared branches.
- Revisit painterly rock texture quality, perspective/parallax, crispness on desktop and Android, natural vegetation sizing, near/far separation and coherent cave geometry.
- Replace temporary red-jacket front-facing sprite masking with actual side, back, climb, carry and vault pose assets. Ensure ice axes, foot placements and mass shifting read correctly without chibi proportions.
- Improve pole shape/grip and flex depiction, but **never change its material arc length or physical release mathematics for visual fixes**.
- Rework cave interior as a believable cut-in rock shelter and keep its **solid right wall and real ladder/fire geometry** from Phase 5.

## Gameplay polish left intentionally open
- Relative high/low risk metrics passed but the **game still feels too easy**. Later perform representative human and Android difficulty playtests; curate levels with genuinely challenging vault release timing and risk/reward. Do not blindly shrink all shelves.
- Bronze/Silver/Gold targets are provisional until full-run player data is available. PB ghost timing and route-specific saves should survive redesigns only if underlying physics/geometry still match.
- Review small shelf roots and stretched snow on screenshot from Route 2, Leap 2; avoid repeated cosmetic patches without a shared art direction.
- Cave opening collision, wall-facing climber, pole performance and time gates require real visual playtesting even after automated geometry and runtime tests.

## Validation rules for future artwork
- Preserve `level-template-v0.9.16` approved golden route snapshots, the backup branches, high/low alternatives and the 997-seed selection logic unless deliberate gameplay rebalancing is explicitly agreed.
- Art features must match collision: every wall, edge and climb face is either physically real or clearly noninteractive.
- Capture a minimum of golden routes 0, 1, 2, 7, 42, 250, 996 on 16:9 and Android portrait; check stationary and moving mobile frame pacing as well as recognisable mountain silhouettes.
- Keep native Android publishing separate from this art overhaul; user intends Android/Google Play first, iOS afterwards.
