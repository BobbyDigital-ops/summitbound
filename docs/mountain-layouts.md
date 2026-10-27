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

## Route 1 worked map (relative to each preceding takeoff summit)

| Destination | Low shelf (distance / rise / width) | Middle shelf | High shelf | Summit altitude |
|---|---|---|---|---|
| Broken Tooth | 559 / 33 / 155 | 384 / 81 / 230 | 457 / 141 / 110 | approx. 796 |
| Windward Spire | 462 / 31 / 154 | 567 / 91 / 224 | 391 / 143 / 120 | varies by seed |
| Lantern Crag | 562 / 45 / 170 | 377 / 85 / 233 | 468 / 142 / 100 | varies by seed |

Game units; X distance is measured from the takeoff summit's right edge. Notice that the highest shelf is closer than the low shelf on every example except where they happen to be otherwise ordered. These are examples from a validated route, not fixed coordinates for all routes.
