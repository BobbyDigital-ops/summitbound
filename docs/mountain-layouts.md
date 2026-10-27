# Summitbound v0.9.16 — actual high, middle and low mountain approaches

Root-cause correction: earlier generation was restricted to only 15–145 game units ABOVE takeoff, because its flight sampler stopped 40 units below the takeoff surface. Moving shelves farther sideways without changing that constraint could only keep producing compact, staircase-like arrangements.

The receiving mountain now has 2–4 *alternative* landings on its face. One shelf completes the vault; from there you climb the mountain to the next summit. It is NOT a series of platforms the player must jump between.

- A high shelf is normally 105–145 units ABOVE takeoff. It saves climbing but may be short and technically demanding.
- A middle shelf may be slightly above or below takeoff with independent length and range.
- A low shelf is normally 200–320 units BELOW takeoff, allowing a longer descent before landing at the cost of a much longer manual ice climb.
- The receiving mountain summit is still considerably ABOVE the preceding summit, and positioned farther right than the upper landing shelves to create a real ascending rock face.
- Authored composition families are mixed and vary by seed. Examples (distance from outgoing edge / rise / width):
  - Precision route: Low (740 / -240 / 210), Middle (480 / -35 / 165), High (395 / +133 / 130).
  - Risk inversion: Low (510 / -240 / 240), Middle (690 / -95 / 185), High (580 / +121 / 175).
  - High-far option: Low (575 / -250 / 225), Middle (420 / +15 / 130), High (620 / +105 / 155).
- All candidates are checked against the unchanged PolePhysicsEngine flight paths for first-contact collision and safe stopping room, including descents. Ice summit exits are kept distinct.
- Poles, controls, climbing speed, cave checkpoint and production main branch are unchanged.

CI coverage includes all 997 seeded routes, real vault reachability, full climb simulation, browser smoke, terrain, mobile safeguards and a production build. A successful CI does not imply real-world playtesting is complete.

**Remaining:** shared/branching ice walls, true sloping collision summits, mobile stutter optimisation, cave/campfire rework.
