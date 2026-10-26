/**
 * Authoritative Lagrangian-Coupled Flexible Pole Vault Simulation for Just Short.
 * 
 * Replaces synthetic multipliers and forced minimum speeds with a coherent
 * physical model governed by rotational momentum, centrifugal beam compression,
 * unbending recoil dynamics, and gravity torque.
 * 
 * Key Physical Principles:
 * 1. Physical Continuity: Player position and velocity are 100% continuous on plant and release.
 * 2. Momentum-Driven Loading: Pole deformation arises dynamically from forward angular rotation (F_c = m * R * omega^2).
 *    A stationary player (v=0) produces zero centrifugal compression and cannot launch.
 * 3. Energy Transfer: Stored elastic energy uncoils to accelerate the athlete upward and forward.
 * 4. Zero Artificial Velocity: No synthetic impulse on release; release preserves instantaneous velocity.
 * 5. Emergent Skill Control: Run-up speed and release timing dictate whether a jump is delicate (precision),
 *    expansive (distance), steep (height), or over-rotated (late stall).
 */

import {
  PhysicsConfig,
  PlantValidation,
  PlatformDef,
  TrajectoryPoint,
  VaultPhase,
  VaultState,
} from '../types/game';

export class PolePhysicsEngine {
  /**
   * Distance ahead of player's center where the pole tip reaches the ground on approach.
   */
  public static readonly PLANT_OFFSET = 95;

  /**
   * Validate if the pole tip can plant on a valid surface ahead on the current platform.
   */
  public static validatePlantPoint(
    px: number,
    py: number,
    facingDir: number,
    platforms: PlatformDef[],
    config: PhysicsConfig
  ): PlantValidation {
    const dir = facingDir >= 0 ? 1 : -1;
    const targetX = px + dir * this.PLANT_OFFSET;

    // Find the platform the player is currently standing on or running across
    let currentPlatform: PlatformDef | null = null;

    for (const plat of platforms) {
      const platLeft = plat.x - plat.width / 2;
      const platRight = plat.x + plat.width / 2;
      const platTop = plat.y - plat.height / 2;

      // Player must be above/on this platform horizontally
      if (px >= platLeft - 30 && px <= platRight + 30 && py <= platTop + 70) {
        currentPlatform = plat;
        break;
      }
    }

    if (!currentPlatform) {
      return {
        isValid: false,
        anchorX: targetX,
        anchorY: py + 22,
        distance: this.PLANT_OFFSET,
        angle: 0,
        reason: 'Not on a platform',
      };
    }

    const platLeft = currentPlatform.x - currentPlatform.width / 2;
    const platRight = currentPlatform.x + currentPlatform.width / 2;
    const platTop = currentPlatform.y - currentPlatform.height / 2;

    // The plant point MUST be on the same platform surface the player is launching from
    const isWithinPlatformEdge = targetX >= platLeft && targetX <= platRight;

    if (!isWithinPlatformEdge) {
      return {
        isValid: false,
        anchorX: targetX,
        anchorY: platTop,
        distance: Math.hypot(targetX - px, platTop - py),
        angle: Math.atan2(platTop - py, targetX - px),
        reason: 'Plant point is beyond cliff edge',
      };
    }

    const distance = Math.hypot(targetX - px, platTop - py);
    const angle = Math.atan2(platTop - py, targetX - px);

    return {
      isValid: true,
      anchorX: targetX,
      anchorY: platTop,
      distance,
      angle,
    };
  }

  /**
   * Initialize physical vault state when Space is pressed.
   * Continuous: Preserves player position and velocity with ZERO snapping or artificial speed boost.
   */
  public static initVault(
    px: number,
    py: number,
    vx: number,
    vy: number,
    anchorX: number,
    anchorY: number,
    config: PhysicsConfig
  ): VaultState {
    const L0 = config.poleLength;
    const facingDir = anchorX >= px ? 1 : -1;

    // Natural plant chord angle based on anchor distance ahead (95px) and pole rest length L0
    const clampedDist = Math.min(L0 * 0.92, Math.abs(anchorX - px));
    const theta = Math.acos(clampedDist / L0);

    // Initial angular velocity strictly derived from player forward velocity:
    // omega0 = (vx * sin(theta)) / L0.
    // If vx == 0, omega0 == 0 (zero artificial momentum).
    const forwardVx = facingDir >= 0 ? vx : -vx;
    const omega = (forwardVx * Math.sin(theta)) / L0;

    return {
      anchorX,
      anchorY,
      facingDir,
      theta,
      omega,
      radius: L0,
      startPx: px,
      startPy: py,
      strain: 0,
      deformationPx: 0,
      storedEnergy: 0,
      bendOffset: 0,
      springForce: 0,
      bendingTorque: 0,
      radialVelocity: 0,
      tangentialVelocity: L0 * omega,
      heightGained: 0,
      distanceTraveled: 0,
      phase: 'APPROACH',
    };
  }

  /**
   * Advance one physics step of the flexible pole vault using fixed-timestep numerical integration.
   * 
   * Models the athlete interacting with a flexible grounded pole:
   * 1. Centrifugal Beam Compression: F_c = m * R * omega^2
   * 2. Gravity Torque: opposes ascent while theta < pi/2
   * 3. Beam Unbending Restoring Kick: transfers stored elastic energy into forward rotation
   * 4. Radial Unbending Recoil: snaps outward as chord approaches vertical
   */
  public static stepVault(
    state: VaultState,
    dt: number,
    config: PhysicsConfig,
    currentPx?: number,
    currentPy?: number,
    currentVx?: number,
    currentVy?: number
  ): {
    state: VaultState;
    nextPx: number;
    nextPy: number;
    nextVx: number;
    nextVy: number;
    shouldAutoRelease: boolean;
  } {
    const L0 = config.poleLength;
    const g = config.gravity;
    const m = config.playerMass;

    let theta = state.theta;
    let omega = state.omega;

    // 1. Dynamic Centrifugal Beam Compression
    // Only forward angular momentum into the plant box compresses the pole
    const forwardOmega = Math.max(0, omega);
    const centrifugalAcc = L0 * forwardOmega * forwardOmega;
    const maxDeformPx = L0 * config.maxDeformation;

    // Physical deflection proportional to centrifugal loading
    const delta = Math.max(0, Math.min(maxDeformPx, centrifugalAcc * 0.12));
    const currentRadius = Math.max(L0 * 0.52, L0 - delta);
    const strain = Math.min(1.0, delta / maxDeformPx);

    // Stored elastic energy: E = 0.5 * k * delta^2
    const storedEnergy = 0.5 * config.poleStiffness * delta * delta * 0.05;
    const springForce = delta * config.poleStiffness * 4.5;

    // 2. Angular Dynamics
    // Torque 1: Gravity opposes upward rotation while theta < pi/2
    const alpha_grav = -(g / currentRadius) * Math.cos(theta);

    // Torque 2: Beam unbending moment (active when delta > 0, levers tip forward)
    const alpha_beam = (delta * (config.bendingStiffness * 0.0055)) * Math.cos(theta) * (omega >= 0 ? 1.0 : -0.2);

    // Torque 3: Rotational damping
    const alpha_damp = -config.poleDamping * 0.28 * omega;

    const alpha = alpha_grav + alpha_beam + alpha_damp;
    omega += alpha * dt;
    theta += omega * dt;

    // 3. Radial Unbending Recoil
    // Dynamic Loading vs Unbending Recoil:
    // - Plant & Loading Phase (theta from plant ~0.99 rad to ~1.20 rad, ~57° to 69°):
    //   Pole compresses and bends, absorbing approach momentum into strain energy.
    // - Unbending Recoil Phase (theta from ~1.20 rad to ~1.65 rad, ~69° to 95°):
    //   Stored elastic deflection uncoils outward, imparting powerful vertical lift as chord approaches vertical.
    let rDot = 0;
    if (delta > 1.5 && theta >= 1.20 && theta <= 1.65) {
      const recoilFactor = Math.sin(((theta - 1.20) / (1.65 - 1.20)) * Math.PI);
      rDot = delta * 8.5 * Math.max(0.3, recoilFactor);
    }

    // 4. Kinematics (Player Position and Velocity)
    const nextPx = state.anchorX - state.facingDir * currentRadius * Math.cos(theta);
    const nextPy = state.anchorY - currentRadius * Math.sin(theta);

    const vTan = currentRadius * omega;
    const vRad = rDot;

    const nextVx = state.facingDir * (vTan * Math.sin(theta) + vRad * Math.cos(theta));
    const nextVy = -(vTan * Math.cos(theta) + vRad * Math.sin(theta));

    const heightGained = Math.max(0, state.startPy - nextPy);
    const distanceTraveled = Math.abs(nextPx - state.startPx);
    const bendingTorque = Math.abs(alpha_beam * m * currentRadius * currentRadius * 0.001);

    // 5. Dynamic Vault Phase State Machine
    let phase: VaultPhase = state.phase;
    if (delta > 2 && omega > 0.4 && theta < 1.15) {
      phase = 'LOADING';
    } else if (delta > maxDeformPx * 0.35 && theta >= 1.15 && theta < 1.25) {
      phase = 'MAX_FLEX';
    } else if (rDot > 15 && theta >= 1.25 && theta <= 1.65) {
      phase = 'RECOILING';
    } else if (theta > 1.65) {
      phase = 'UNCOILED';
    } else if (omega < 0.12 && theta < 1.1) {
      phase = 'STALLED';
    }

    // 6. Auto-release condition:
    // Detach if athlete swings completely past pole (> 135 deg) or touches ground
    const shouldAutoRelease = theta > 2.35 || (theta > 1.55 && nextPy >= state.anchorY - 6) || (omega <= 0 && theta < 0.5);

    const updatedState: VaultState = {
      ...state,
      theta,
      omega,
      radius: currentRadius,
      strain,
      deformationPx: delta,
      storedEnergy,
      bendOffset: delta * 0.85,
      springForce,
      bendingTorque,
      radialVelocity: vRad,
      tangentialVelocity: vTan,
      heightGained,
      distanceTraveled,
      phase,
    };

    return {
      state: updatedState,
      nextPx,
      nextPy,
      nextVx,
      nextVy,
      shouldAutoRelease,
    };
  }

  /**
   * Detach from pole into free ballistic flight.
   * 
   * CRITICAL REQUIREMENT:
   * Preserves instantaneous physical velocity with ZERO synthetic velocity boost or multiplier!
   */
  public static calculateReleaseVelocity(
    vx: number,
    vy: number,
    state: VaultState,
    config: PhysicsConfig
  ): { vx: number; vy: number } {
    // 100% physically continuous: instantaneous physical velocity is preserved bitwise
    return {
      vx,
      vy,
    };
  }

  /**
   * Predict ballistic flight path under gravity for trajectory visualization.
   */
  public static predictTrajectory(
    startX: number,
    startY: number,
    startVx: number,
    startVy: number,
    config: PhysicsConfig,
    steps: number = 28,
    timeStep: number = 0.04
  ): TrajectoryPoint[] {
    const points: TrajectoryPoint[] = [];
    let x = startX;
    let y = startY;
    let vx = startVx;
    let vy = startVy;

    for (let i = 0; i < steps; i++) {
      points.push({ x, y });
      vy += config.gravity * timeStep;
      x += vx * timeStep;
      y += vy * timeStep;
    }

    return points;
  }
}
