/**
 * Game state types and configuration definitions for Just Short
 */

export type GameMode = 'NORMAL' | 'HARDCORE';

export type LabChallenge = 'NONE' | 'TEST_A' | 'TEST_B' | 'TEST_C' | 'TEST_D';

export type VaultPhase = 
  | 'APPROACH'
  | 'LOADING'
  | 'MAX_FLEX'
  | 'RECOILING'
  | 'UNCOILED'
  | 'STALLED';

export type PlayerState = 
  | 'GROUNDED'
  | 'RUNNING'
  | 'BRAKING'
  | 'AIMING_PLANT'
  | 'PLANTED_LOADING'
  | 'RIDING_VAULT'
  | 'AIRBORNE'
  | 'SLIDING'
  | 'FALLING'
  | 'CLIMBING_LADDER';

export type SurfaceType = 'rock' | 'snow' | 'ice';

export interface PhysicsConfig {
  gravity: number;             // px/s^2 (default: 1050)
  runAcceleration: number;     // px/s^2 (default: 850, gradual run-up)
  maxRunSpeed: number;         // px/s (default: 360)
  brakingDecel: number;        // px/s^2 (default: 2000)
  
  poleLength: number;          // px (default: 175)
  poleStiffness: number;       // spring stiffness k (default: 120 N/px)
  poleDamping: number;         // damping (default: 4.5)
  bendingStiffness: number;    // flexural restoring torque (default: 40)
  maxDeformation: number;      // max compression fraction (default: 0.52)
  energyRetention: number;     // coefficient of restitution / energy conservation (default: 0.96)
  
  playerMass: number;          // kg (default: 70)
  airborneSteerForce: number;  // px/s^2 horizontal steering in air (default: 260)
  
  rockFriction: number;        // ground friction (default: 0.88)
  snowFriction: number;        // ground friction (default: 0.48)
  iceFriction: number;         // ground friction (default: 0.05)
  
  simSpeed: number;            // time scale (default: 1.0)
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 1050,
  runAcceleration: 850,
  maxRunSpeed: 360,
  brakingDecel: 2000,
  
  poleLength: 175,
  poleStiffness: 120,
  poleDamping: 4.5,
  bendingStiffness: 40,
  maxDeformation: 0.52,
  energyRetention: 0.96,
  
  playerMass: 70,
  airborneSteerForce: 260,
  
  rockFriction: 0.88,
  snowFriction: 0.48,
  iceFriction: 0.05,
  
  simSpeed: 1.0,
};

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  surfaceType: SurfaceType;
  label?: string;
  isCave?: boolean;
  hasCampfire?: boolean;
  hasLadder?: boolean;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface PlantValidation {
  isValid: boolean;
  anchorX: number;
  anchorY: number;
  distance: number;
  angle: number; // radians
  reason?: string;
}

export interface VaultState {
  anchorX: number;
  anchorY: number;
  facingDir: number;
  theta: number;             // current chord angle from horizontal (rad)
  omega: number;             // angular velocity (rad/s)
  radius: number;            // current distance from anchor to grip (px)
  startPx: number;           // position when vault initiated
  startPy: number;
  strain: number;            // compression fraction (0 to 1)
  deformationPx: number;     // compression delta: L0 - radius (px)
  storedEnergy: number;      // elastic potential energy = 0.5 * k * delta^2 (Joules)
  bendOffset: number;        // visual curved flex deflection (px)
  springForce: number;       // radial restoring spring force (N)
  bendingTorque: number;     // transverse flexural torque (N*px)
  radialVelocity: number;    // velocity along pole chord (px/s)
  tangentialVelocity: number;// velocity perpendicular to pole (px/s)
  heightGained: number;      // vertical lift above plant start (px)
  distanceTraveled: number;  // horizontal advance from plant start (px)
  phase: VaultPhase;         // current phase of vault interaction
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

