/**
 * Automated Verification Test Suite for Just Short:
 * Stage 1C: Physics Engine Overhaul & Physics Laboratory Scenarios.
 *
 * Verifies all 12 physical criteria from the specification:
 * 1. Increasing running speed produces greater available energy.
 * 2. Stationary plant cannot create an enormous powered vault (stalls/drops).
 * 3. Different planting positions affect the resulting motion.
 * 4. Releasing at different phases produces different launch trajectories.
 * 5. Scenario A (Precision): Controlled approach lands safely on narrow 110px spire.
 * 6. Scenario B (Distance): High-speed sprint clears 220px wide level gap.
 * 7. Scenario C (Height): Steep vault achieves vertical climb onto elevated spire.
 * 8. Excessively late release is disadvantageous (over-rotation / lost lift).
 * 9. Physical continuity: Zero position snapping or velocity impulses on plant and release.
 * 10. Determinism: Identical inputs produce bitwise identical trajectories.
 * 11. Frame rate stability: Simulation produces identical trajectories at 30Hz, 60Hz, 120Hz.
 * 12. Energy conservation: No unexplained kinetic energy spike on release.
 */

import { DEFAULT_PHYSICS_CONFIG, PhysicsConfig, PlatformDef } from '../src/legacy/types/game';
import { PlayerEntity } from '../src/legacy/entities/Player';
import { PolePhysicsEngine } from '../src/legacy/physics/PolePhysics';

function runOverhaulVerification() {
  console.log('================================================================');
  console.log('   JUST SHORT — STAGE 1C PHYSICS ENGINE OVERHAUL VERIFICATION   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  const config: PhysicsConfig = { ...DEFAULT_PHYSICS_CONFIG };
  const FIXED_DT = 1 / 120; // 120 Hz authoritative fixed timestep

  function simulateVault(
    initialVx: number,
    initialVy: number,
    plantDistAhead: number,
    steps: number,
    releaseAtStep?: number
  ) {
    const startX = 500;
    const startY = 1040;
    const anchorX = startX + plantDistAhead;
    const anchorY = startY;

    const vs = PolePhysicsEngine.initVault(
      startX,
      startY,
      initialVx,
      initialVy,
      anchorX,
      anchorY,
      config
    );

    let currentState = vs;
    let px = startX;
    let py = startY;
    let vx = initialVx;
    let vy = initialVy;

    let maxDeformation = 0;
    let maxStoredEnergy = 0;
    let maxLift = 0;
    let releaseVelocity: { vx: number; vy: number } | null = null;
    let releasePos: { x: number; y: number } | null = null;

    for (let s = 0; s < steps; s++) {
      if (releaseAtStep !== undefined && s === releaseAtStep) {
        releaseVelocity = PolePhysicsEngine.calculateReleaseVelocity(vx, vy, currentState, config);
        releasePos = { x: px, y: py };
        break;
      }

      const step = PolePhysicsEngine.stepVault(currentState, FIXED_DT, config, px, py, vx, vy);
      currentState = step.state;
      px = step.nextPx;
      py = step.nextPy;
      vx = step.nextVx;
      vy = step.nextVy;

      if (currentState.deformationPx > maxDeformation) maxDeformation = currentState.deformationPx;
      if (currentState.storedEnergy > maxStoredEnergy) maxStoredEnergy = currentState.storedEnergy;
      const lift = Math.max(0, startY - py);
      if (lift > maxLift) maxLift = lift;

      if (step.shouldAutoRelease && !releaseVelocity) {
        releaseVelocity = PolePhysicsEngine.calculateReleaseVelocity(vx, vy, currentState, config);
        releasePos = { x: px, y: py };
        break;
      }
    }

    return {
      finalState: currentState,
      maxDeformation,
      maxStoredEnergy,
      maxLift,
      px,
      py,
      vx,
      vy,
      releaseVelocity,
      releasePos,
    };
  }

  // -------------------------------------------------------------------------
  // TEST 1: Running Speed Produces Greater Available Energy
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Running Speed vs Stored Elastic Energy ---');
  const slowVault = simulateVault(140, 0, 95, 40);
  const medVault = simulateVault(250, 0, 95, 40);
  const fastVault = simulateVault(360, 0, 95, 40);

  console.log(`Slow (140 px/s): def = ${slowVault.maxDeformation.toFixed(1)}px, energy = ${slowVault.maxStoredEnergy.toFixed(0)} J`);
  console.log(`Med  (250 px/s): def = ${medVault.maxDeformation.toFixed(1)}px, energy = ${medVault.maxStoredEnergy.toFixed(0)} J`);
  console.log(`Fast (360 px/s): def = ${fastVault.maxDeformation.toFixed(1)}px, energy = ${fastVault.maxStoredEnergy.toFixed(0)} J`);

  assert(
    slowVault.maxStoredEnergy < medVault.maxStoredEnergy && medVault.maxStoredEnergy < fastVault.maxStoredEnergy,
    `Stored energy scales with approach momentum (${slowVault.maxStoredEnergy.toFixed(0)}J < ${medVault.maxStoredEnergy.toFixed(0)}J < ${fastVault.maxStoredEnergy.toFixed(0)}J)`
  );
  assert(
    slowVault.maxDeformation < fastVault.maxDeformation,
    `Fast approach loads pole deeper than slow approach (${fastVault.maxDeformation.toFixed(1)}px vs ${slowVault.maxDeformation.toFixed(1)}px)`
  );

  // -------------------------------------------------------------------------
  // TEST 2: Stationary Plant Cannot Create Enormous Vault
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Stationary Plant (v = 0) Stalls Without Speed ---');
  const stationaryVault = simulateVault(0, 0, 95, 40);
  console.log(`Stationary plant lift = ${stationaryVault.maxLift.toFixed(1)}px, max energy = ${stationaryVault.maxStoredEnergy.toFixed(0)}J, phase = ${stationaryVault.finalState.phase}`);

  assert(stationaryVault.maxDeformation === 0, `Stationary player produces zero centrifugal compression`);
  assert(stationaryVault.maxStoredEnergy === 0, `Stationary player cannot store spring energy (${stationaryVault.maxStoredEnergy}J)`);
  assert(
    stationaryVault.finalState.omega <= 0 || stationaryVault.finalState.phase === 'STALLED',
    `Stationary player stalls naturally without artificial launch energy`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Different Planting Positions Affect Resulting Motion
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Planting Position Geometric Variation ---');
  const closePlant = simulateVault(320, 0, 75, 20);
  const farPlant = simulateVault(320, 0, 115, 20);

  assert(
    closePlant.finalState.theta !== farPlant.finalState.theta,
    `Planting distance changes chord angle: close = ${(closePlant.finalState.theta * 180 / Math.PI).toFixed(1)}° vs far = ${(farPlant.finalState.theta * 180 / Math.PI).toFixed(1)}°`
  );
  assert(
    closePlant.finalState.omega !== farPlant.finalState.omega,
    `Planting distance modifies initial angular rotation rate`
  );

  // -------------------------------------------------------------------------
  // TEST 4: Release Timing and Trajectory Control
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Release Timing Trajectory Control ---');
  // Early release at step 6 (~0.05s, shallow forward launch before full uncoil)
  // Peak uncoiling release at step 28 (~0.23s, maximum vertical lift)
  const earlyRelease = simulateVault(360, 0, 95, 60, 6);
  const lateRelease = simulateVault(360, 0, 95, 60, 28);

  assert(earlyRelease.releaseVelocity !== null && lateRelease.releaseVelocity !== null, `Release points captured`);
  if (earlyRelease.releaseVelocity && lateRelease.releaseVelocity) {
    console.log(`Early Release (step 6):  vx = ${earlyRelease.releaseVelocity.vx.toFixed(1)}, vy = ${earlyRelease.releaseVelocity.vy.toFixed(1)}`);
    console.log(`Peak Release  (step 28): vx = ${lateRelease.releaseVelocity.vx.toFixed(1)}, vy = ${lateRelease.releaseVelocity.vy.toFixed(1)}`);

    assert(
      lateRelease.releaseVelocity.vy < earlyRelease.releaseVelocity.vy,
      `Holding pole into uncoiling generates stronger vertical lift (vy: ${lateRelease.releaseVelocity.vy.toFixed(1)} < ${earlyRelease.releaseVelocity.vy.toFixed(1)})`
    );
    assert(
      earlyRelease.releaseVelocity.vx > 150,
      `Early release preserves forward horizontal momentum (vx: ${earlyRelease.releaseVelocity.vx.toFixed(1)} px/s)`
    );
  }

  // -------------------------------------------------------------------------
  // TEST 5: Scenario A — Precision Landing (Lab A)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Scenario A — Precision Landing (Lab A) ---');
  // Lab A: Start plateau ends at x = 500, target spire is x in [590, 700], width 110px, gap 90px.
  // Controlled approach (vx = 250 px/s) + release at step 20
  const precisionVault = simulateVault(250, 0, 85, 60, 20);
  assert(precisionVault.releaseVelocity !== null, `Precision release executed`);

  if (precisionVault.releaseVelocity && precisionVault.releasePos) {
    let simX = precisionVault.releasePos.x;
    let simY = precisionVault.releasePos.y;
    let simVx = precisionVault.releaseVelocity.vx;
    let simVy = precisionVault.releaseVelocity.vy;
    let landedInTarget = false;
    let overshot = false;

    console.log(`Precision release: pos=(${simX.toFixed(1)}, ${simY.toFixed(1)}), vx=${simVx.toFixed(1)}, vy=${simVy.toFixed(1)}`);

    for (let f = 0; f < 180; f++) {
      simVy += config.gravity * FIXED_DT;
      simX += simVx * FIXED_DT;
      simY += simVy * FIXED_DT;

      const playerFeet = simY + 18;
      if (playerFeet >= 1040 && simVy >= 0) {
        console.log(`Precision landed at x = ${simX.toFixed(1)} (target spire [590, 700])`);
        if (simX >= 590 && simX <= 700) {
          landedInTarget = true;
        } else if (simX > 700) {
          overshot = true;
        }
        break;
      }
    }

    assert(landedInTarget === true, `Player successfully executed precision jump and landed on narrow 110px spire`);
    assert(overshot === false, `Controlled momentum prevented overshooting`);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Scenario B — Distance Landing (Lab B)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Scenario B — Distance Landing (Lab B) ---');
  // Lab B: Start plateau ends at x = 600, target spire is x in [820, 1180], gap 220px.
  // Plant at edge x = 550 -> anchorX = 645. Full sprint vx = 360 px/s, release at step 32
  const startPlateauB = 550;
  const anchorB = startPlateauB + 95;
  const vsB = PolePhysicsEngine.initVault(startPlateauB, 1040, 360, 0, anchorB, 1040, config);
  let curStateB = vsB;
  let pxB = startPlateauB;
  let pyB = 1040;
  let vxB = 360;
  let vyB = 0;

  for (let s = 0; s < 32; s++) {
    const step = PolePhysicsEngine.stepVault(curStateB, FIXED_DT, config, pxB, pyB, vxB, vyB);
    curStateB = step.state;
    pxB = step.nextPx;
    pyB = step.nextPy;
    vxB = step.nextVx;
    vyB = step.nextVy;
  }

  const relB = PolePhysicsEngine.calculateReleaseVelocity(vxB, vyB, curStateB, config);
  let simXB = pxB;
  let simYB = pyB;
  let simVxB = relB.vx;
  let simVyB = relB.vy;
  let landedB = false;

  console.log(`Distance launch: pos = (${simXB.toFixed(1)}, ${simYB.toFixed(1)}), vx = ${simVxB.toFixed(1)}, vy = ${simVyB.toFixed(1)}`);

  for (let f = 0; f < 250; f++) {
    simVyB += config.gravity * FIXED_DT;
    simXB += simVxB * FIXED_DT;
    simYB += simVyB * FIXED_DT;

    const playerFeet = simYB + 18;
    if (playerFeet >= 1040 && simVyB >= 0) {
      console.log(`Distance landed at x = ${simXB.toFixed(1)} (target spire [820, 1180])`);
      if (simXB >= 820 && simXB <= 1180) {
        landedB = true;
      }
      break;
    }
  }

  assert(landedB === true, `Player vaulted across wide 220px chasm and landed safely on receiving spire`);

  // -------------------------------------------------------------------------
  // TEST 7: Scenario C — Height Landing (Lab C)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Scenario C — Steep Height Climb (Lab C) ---');
  // Lab C: Start plateau at y = 1090. Target spire elevated to y = 940 (climb 150px!), x in [740, 1000].
  // Full approach + release during peak upward recoil at step 28
  const startPlateauC = 520;
  const anchorC = startPlateauC + 95;
  const vsC = PolePhysicsEngine.initVault(startPlateauC, 1090, 360, 0, anchorC, 1090, config);
  let curStateC = vsC;
  let pxC = startPlateauC;
  let pyC = 1090;
  let vxC = 360;
  let vyC = 0;

  for (let s = 0; s < 28; s++) {
    const step = PolePhysicsEngine.stepVault(curStateC, FIXED_DT, config, pxC, pyC, vxC, vyC);
    curStateC = step.state;
    pxC = step.nextPx;
    pyC = step.nextPy;
    vxC = step.nextVx;
    vyC = step.nextVy;
  }

  const relC = PolePhysicsEngine.calculateReleaseVelocity(vxC, vyC, curStateC, config);
  let simXC = pxC;
  let simYC = pyC;
  let simVxC = relC.vx;
  let simVyC = relC.vy;
  let landedC = false;
  let minPyC = simYC;

  console.log(`Height launch: pos = (${simXC.toFixed(1)}, ${simYC.toFixed(1)}), vx = ${simVxC.toFixed(1)}, vy = ${simVyC.toFixed(1)}`);

  for (let f = 0; f < 250; f++) {
    simVyC += config.gravity * FIXED_DT;
    simXC += simVxC * FIXED_DT;
    simYC += simVyC * FIXED_DT;
    if (simYC < minPyC) minPyC = simYC;

    const playerFeet = simYC + 18;
    if (playerFeet >= 940 && simVyC >= 0 && simXC >= 740 && simXC <= 1000) {
      landedC = true;
      console.log(`Landed on elevated spire at x = ${simXC.toFixed(1)}, feet = ${playerFeet.toFixed(1)} (surface 940)`);
      break;
    }
  }

  assert(minPyC < 920, `Apex climbed high above launch level: minPy = ${minPyC.toFixed(1)} (lift gained > 170px)`);
  assert(landedC === true, `Player successfully ascended to and landed upon the elevated cliff!`);

  // -------------------------------------------------------------------------
  // TEST 8: Excessively Late Release Penalty
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Excessively Late Release Penalty ---');
  // Held through step 65 where pole has rotated past vertical, uncoiled, and gravity pulls downward
  const lateOverVault = simulateVault(360, 0, 95, 75, 65);
  if (lateOverVault.releaseVelocity) {
    console.log(`Over-rotated release vy = ${lateOverVault.releaseVelocity.vy.toFixed(1)} (downward momentum)`);
    assert(
      lateOverVault.releaseVelocity.vy > 0,
      `Excessively late release loses upward lift and starts falling downward (vy = ${lateOverVault.releaseVelocity.vy.toFixed(1)} px/s)`
    );
  }

  // -------------------------------------------------------------------------
  // TEST 9: Physical Continuity on Plant and Release
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Physical Continuity (Zero Snapping / No Teleport) ---');
  const runPx = 480;
  const runPy = 1040;
  const runVx = 350;
  const runVy = 0;
  const plantAnchorX = 575;
  const plantAnchorY = 1040;

  const initVaultState = PolePhysicsEngine.initVault(runPx, runPy, runVx, runVy, plantAnchorX, plantAnchorY, config);
  assert(initVaultState.startPx === runPx, `Position X continuous at plant (${initVaultState.startPx} === ${runPx})`);
  assert(initVaultState.startPy === runPy, `Position Y continuous at plant (${initVaultState.startPy} === ${runPy})`);

  // Release continuity test
  const stepOut = PolePhysicsEngine.stepVault(initVaultState, FIXED_DT, config, runPx, runPy, runVx, runVy);
  const relOut = PolePhysicsEngine.calculateReleaseVelocity(stepOut.nextVx, stepOut.nextVy, stepOut.state, config);
  assert(
    relOut.vx === stepOut.nextVx,
    `Release velocity vx matches instantaneous physical velocity with zero artificial boost`
  );
  assert(
    relOut.vy === stepOut.nextVy,
    `Release velocity vy matches instantaneous physical velocity with zero artificial boost`
  );

  // -------------------------------------------------------------------------
  // TEST 10: Determinism (Identical Inputs = Identical Trajectory)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Determinism Verification ---');
  const runA = simulateVault(333.3, 0, 95, 45);
  const runB = simulateVault(333.3, 0, 95, 45);

  assert(runA.px === runB.px, `Deterministic X position: ${runA.px} === ${runB.px}`);
  assert(runA.py === runB.py, `Deterministic Y position: ${runA.py} === ${runB.py}`);
  assert(runA.vx === runB.vx, `Deterministic Vx: ${runA.vx} === ${runB.vx}`);
  assert(runA.vy === runB.vy, `Deterministic Vy: ${runA.vy} === ${runB.vy}`);

  // -------------------------------------------------------------------------
  // TEST 11: Frame Rate Stability (Fixed Timestep Verification)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 11: Display Framerate Independence (30Hz, 60Hz, 120Hz) ---');
  function runWithAccumulator(frameDt: number, totalSeconds: number) {
    let accum = 0;
    let vs = PolePhysicsEngine.initVault(500, 1040, 350, 0, 595, 1040, config);
    let px = 500;
    let py = 1040;
    let vx = 350;
    let vy = 0;

    const totalFrames = Math.round(totalSeconds / frameDt);
    for (let f = 0; f < totalFrames; f++) {
      accum += frameDt;
      while (accum >= FIXED_DT) {
        const step = PolePhysicsEngine.stepVault(vs, FIXED_DT, config, px, py, vx, vy);
        vs = step.state;
        px = step.nextPx;
        py = step.nextPy;
        vx = step.nextVx;
        vy = step.nextVy;
        accum -= FIXED_DT;
      }
    }
    return { px, py, vx, vy };
  }

  const res30 = runWithAccumulator(1 / 30, 0.4);
  const res60 = runWithAccumulator(1 / 60, 0.4);
  const res120 = runWithAccumulator(1 / 120, 0.4);

  const diffX = Math.abs(res30.px - res120.px);
  const diffY = Math.abs(res30.py - res120.py);
  console.log(`Position difference between 30Hz and 120Hz after 0.4s: dx = ${diffX.toFixed(4)}px, dy = ${diffY.toFixed(4)}px`);

  assert(diffX < 0.001 && diffY < 0.001, `Fixed-timestep accumulator guarantees frame-rate independent physics!`);

  // -------------------------------------------------------------------------
  // TEST 12: Kinetic Energy Conservation on Release
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 12: Kinetic Energy Conservation on Release ---');
  const midVault = simulateVault(360, 0, 95, 35);
  const m = config.playerMass;
  const EkBefore = 0.5 * m * (midVault.vx * midVault.vx + midVault.vy * midVault.vy);
  const relVel = PolePhysicsEngine.calculateReleaseVelocity(midVault.vx, midVault.vy, midVault.finalState, config);
  const EkAfter = 0.5 * m * (relVel.vx * relVel.vx + relVel.vy * relVel.vy);

  console.log(`Kinetic Energy before release = ${EkBefore.toFixed(0)} J, after release = ${EkAfter.toFixed(0)} J`);
  assert(EkAfter === EkBefore, `Zero unexplained energy injection on release (${EkAfter.toFixed(0)}J === ${EkBefore.toFixed(0)}J)`);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOverhaulVerification();
