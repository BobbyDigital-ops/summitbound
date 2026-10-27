# Summitbound — mountain layouts (v0.9.14)

Each *jump* has one outgoing summit, a chasm, then **one incoming mountain with alternative landing shelves**. The shelves are not successive stairs; landing on ANY one leads to that mountain's summit by ice climbing. The last stage targets the side cave.

| Jump | Receiving mountain | Usual landing choices | Intended challenge |
|---|---|---|---|
| 1 | The Broken Tooth | Low / Middle / High | Precision: a short upper shelf can be near or far; broad lower shelves need a longer climb |
| 2 | The Windward Spire | Low / Middle / High | Range: shelf width and distance are deliberately decoupled; a high shelf can be closest |
| 3 | The Lantern Crag | Low / Middle / High | Verticality: the upper shelf saves the longest ice ascent, but is harder to land |
| 4 | Firespine Cavern | One cave opening | A single decisive high cave landing followed by the checkpoint ladder |

**Variations:** normal jumps have three options; occasionally two or four. Each receiving summit separately varies in height, width and rocky profile. Every shelf varies horizontal distance, altitude, width and surface type, independently of the other shelves. Only viable layouts pass.

**Pole reach constraint:** using the unchanged pole simulation, realistically reachable first-contact shelves top out at about 145 world units above takeoff. The summit itself can be hundreds of units higher: that is the point of the ice climb. This is why simply moving the highest landing to the very top would be wrong.

**Acceptance criteria:** shelves must have different elevations (not 2 at the same height), distinct landing positions and widths, distinct real first-contact release trajectories with braking room, valid cliff backing and a playable ice climb and summit exit. New Route must rebuild live collision rectangles.

**Separate follow-on work:** real walkable summit slopes, broader/shared/branching natural ice walls, more natural cave and mobile performance; none is disguised as part of the layout generator.

## Route 1 — measured mountain map, taken from the generator

All values in game units relative to the preceding summit's takeoff edge. Each row is a landing option, NOT a series of stairs.

| Mountain | Choice | Gap to shelf | Rise over takeoff | Shelf width |
|---|---|---:|---:|---:|
| Broken Tooth | Low | 560 | 29 | 211 |
| Broken Tooth | Middle | 388 | 78 | 121 |
| Broken Tooth | High | 485 | 136 | 162 |
| Windward Spire | Low | 563 | 32 | 207 |
| Windward Spire | Middle | 398 | 76 | 103 |
| Windward Spire | High | 472 | 140 | 145 |
| Lantern Crag | Low | 486 | 40 | 229 |
| Lantern Crag | Middle | 389 | 82 | 159 |
| Lantern Crag | High | 556 | 138 | 106 |

Summit heights and widths are also independently variable; see the generator for the actual seeded coordinates. Other routes rearrange shelf horizontal order and dimensions (e.g. Route 2 has a far high shelf on Broken Tooth, and a near high shelf on Windward Spire).

## Exhaustive validation

`npm run test:allroutes` checks all 997 route seeds, 2,991 mountains, actual physics-reachable first-contact ledges, visual separation, distinct widths, summit exits, and uphill cave placement. Last verified result: 313 two-ledge, 2,362 three-ledge, 316 four-ledge mountain arrangements, **zero fallbacks** and no route errors.

The automated suite does not prove natural-looking silhouettes or subjective difficulty. Real-device and visual gameplay review are still required, and remain separate from the future mobile-performance phase.
