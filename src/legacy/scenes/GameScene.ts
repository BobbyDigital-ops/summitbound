/**
 * Main Game Scene for Just Short.
 * Manages game loop, authoritative pole-vault physics, 3-action controls (A/D, Hold Space, Release Space),
 * generous mountain run-up, platform collisions, camera tracking, and sound triggers.
 */

import Phaser from 'phaser';
import { DEFAULT_PHYSICS_CONFIG, GameMode, LabChallenge, PhysicsConfig, PlatformDef, PlantValidation, TrajectoryPoint, VaultState } from '../types/game';
import { PolePhysicsEngine } from '../physics/PolePhysics';
import { PlayerEntity } from '../entities/Player';
import { MountainRenderer } from '../graphics/MountainRenderer';
import { sounds } from '../audio/SoundEffects';

export class GameScene extends Phaser.Scene {
  public config: PhysicsConfig = { ...DEFAULT_PHYSICS_CONFIG };
  public gameMode: GameMode = 'NORMAL';
  public activeChallenge: LabChallenge = 'NONE';

  public player!: PlayerEntity;
  public platforms: PlatformDef[] = [];
  public currentCheckpoint = { id: 'start', x: 250, y: 1068, name: 'Mountain Base' };

  private mountainRenderer!: MountainRenderer;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private poleGraphics!: Phaser.GameObjects.Graphics;
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Fixed timestep physics accumulator (120 Hz deterministic updates)
  private physicsAccumulator: number = 0;
  private readonly FIXED_DT: number = 1 / 120;

  // Controls & Keys (Simplified: A/D to run, Space to vault)
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyF3!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // State flags
  public isPaused: boolean = false;
  public isDebugMode: boolean = false;
  public isPlantButtonPressed: boolean = false;
  public currentPlantTarget: PlantValidation | null = null;
  
  // Game metrics
  public jumpCount: number = 0;
  public elapsedTime: number = 0;
  public activeCheckpointName: string = 'Mountain Base';
  public hasReachedSummit: boolean = false;

  // Trajectory history
  private flightTrail: TrajectoryPoint[] = [];

  // Robust DOM key tracking set
  private keysDown: Set<string> = new Set();
  private onKeyDownHandler?: (e: KeyboardEvent) => void;
  private onKeyUpHandler?: (e: KeyboardEvent) => void;

  // Callbacks to React UI with full telemetry
  public onStateUpdate?: (data: {
    state: string;
    vx: number;
    vy: number;
    speed: number;
    strain: number;
    springForce: number;
    heightGained: number;
    distanceTraveled: number;
    storedEnergy: number;
    deformationPx: number;
    phase: string;
    bendingTorque: number;
    plantStatus: string;
    anchorX: number;
    anchorY: number;
    mode: GameMode;
    challenge: LabChallenge;
    checkpoint: string;
    jumps: number;
    time: number;
    hasReachedSummit: boolean;
  }) => void;

  public onSummitReached?: () => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create() {
    // 1. Setup handcrafted Mountain Level Platforms (Generous Run-up & 5 Jumps)
    this.initLevelPlatforms();

    // 2. Initialize Player on the spacious start plateau
    this.player = new PlayerEntity(this.currentCheckpoint.x, this.currentCheckpoint.y);

    // 3. Setup Graphics Renderers
    this.mountainRenderer = new MountainRenderer(this);
    this.poleGraphics = this.add.graphics();
    this.poleGraphics.setDepth(10);
    this.trajectoryGraphics = this.add.graphics();
    this.trajectoryGraphics.setDepth(8);
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(20);

    // 4. Setup Snow Particle System
    this.createSnowParticles();

    // 5. Setup Input Controls (A/D to run, Space to plant/vault)
    if (this.input.keyboard) {
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
      this.cursors = this.input.keyboard.createCursorKeys();

      this.keyR.on('down', () => this.restartCurrentAttempt());
      this.keyEsc.on('down', () => this.togglePause());
      this.keyF3.on('down', () => { this.isDebugMode = !this.isDebugMode; });
    }

    // Direct window keyboard listeners for guaranteed key event delivery
    this.onKeyDownHandler = (e: KeyboardEvent) => {
      this.keysDown.add(e.code);
      this.keysDown.add(e.key.toLowerCase());
      if (e.code === 'KeyR' || e.key === 'r') this.restartCurrentAttempt();
      if (e.code === 'Escape') this.togglePause();
      if (e.code === 'F3') this.isDebugMode = !this.isDebugMode;
    };
    this.onKeyUpHandler = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
      this.keysDown.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', this.onKeyDownHandler);
    window.addEventListener('keyup', this.onKeyUpHandler);

    this.events.on('shutdown', () => {
      if (this.onKeyDownHandler) window.removeEventListener('keydown', this.onKeyDownHandler);
      if (this.onKeyUpHandler) window.removeEventListener('keyup', this.onKeyUpHandler);
    });

    // Pointer events on canvas for mouse button plant / release
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isPlantButtonPressed = true;
        this.tryPlantPole();
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.isPlantButtonPressed = false;
        this.releaseVault();
      }
    });

    // Camera setup (Broad world tracking for smooth ascent)
    this.cameras.main.setBounds(0, 0, 4200, 1600);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private initLevelPlatforms() {
    this.platforms = [
      // Platform 0: Generous Starting Plateau with long run-up (x in [0, 900])
      { id: 'p0', x: 450, y: 1150, width: 900, height: 120, surfaceType: 'snow', label: 'Start Plateau' },

      // Jump 1: First dramatic chasm (gap: 900 -> 1090 = 190px). Receiving broad snow spire!
      { id: 'p1', x: 1300, y: 1150, width: 420, height: 120, surfaceType: 'snow', label: 'Jump 1: Broad Ledge' },

      // Jump 2: Deeper horizontal vault (gap: 1510 -> 1700 = 190px).
      { id: 'p2', x: 1880, y: 1100, width: 360, height: 120, surfaceType: 'snow', label: 'Jump 2: Deep Chasm' },

      // Jump 3: High Spire Peak (Elevation ascent to 820px)
      { id: 'p3', x: 2450, y: 880, width: 320, height: 120, surfaceType: 'rock', label: 'Jump 3: High Spire' },

      // Jump 4: Precision Narrow Ice Ledge (Slippery glacial ice surface!)
      { id: 'p4', x: 2950, y: 780, width: 220, height: 80, surfaceType: 'ice', label: 'Jump 4: Icy Ledge' },

      // Jump 5: Campfire Cave Spire & Ladder (Checkpoint!)
      { id: 'p5', x: 3450, y: 580, width: 360, height: 140, surfaceType: 'rock', isCave: true, hasCampfire: true, hasLadder: true, label: 'Jump 5: Campfire Cave' },

      // Summit Lookout Peak (Platform 6 - Victory area reached by ladder)
      { id: 'p6', x: 3700, y: 350, width: 240, height: 60, surfaceType: 'snow', label: 'Grand Peak Summit' },
    ];
  }

  private createSnowParticles() {
    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xffffff, 0.8);
    particleGraphics.fillCircle(4, 4, 3);
    particleGraphics.generateTexture('fluff_snow', 8, 8);
    particleGraphics.destroy();

    const rect = new Phaser.Geom.Rectangle(0, 0, 4200, 1600);
    this.particleEmitter = this.add.particles(0, 0, 'fluff_snow', {
      frequency: 35,
      quantity: 2,
      lifespan: 14000,
      speedX: { min: -40, max: -10 },
      speedY: { min: 40, max: 90 },
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.8, end: 0.1 },
      emitZone: { type: 'random', source: rect, quantity: 0 },
    });
    this.particleEmitter.setDepth(15);
  }

  public update(time: number, deltaMs: number) {
    if (this.isPaused) return;

    // Cap delta to prevent spiral of death during frame drops or tab unfocus
    const dt = Math.min(0.08, deltaMs / 1000) * this.config.simSpeed;
    this.elapsedTime += dt;
    this.physicsAccumulator += dt;

    // Fixed timestep sub-stepping loop (120 Hz deterministic physics)
    let subSteps = 0;
    while (this.physicsAccumulator >= this.FIXED_DT && subSteps < 8) {
      const prevY = this.player.y;
      this.handleControls(this.FIXED_DT);
      this.updatePhysicsState(this.FIXED_DT);
      this.checkCollisions(this.FIXED_DT, prevY);
      this.physicsAccumulator -= this.FIXED_DT;
      subSteps++;
    }

    // 4. Update Player Animation & Scarf Physics
    this.player.update(dt, this.config);

    // 5. Render Environmental Art & Dynamic Vaulting Pole
    this.renderVisuals(time);

    // 6. Broadcast Detailed Real Telemetry to React Dev Panel / HUD
    if (this.onStateUpdate) {
      const p = this.player;
      const speed = Math.hypot(p.vx, p.vy);
      const val = this.getPlantValidation();
      const vs = p.vaultState;

      this.onStateUpdate({
        state: p.state,
        vx: p.vx,
        vy: p.vy,
        speed,
        strain: p.poleStrain,
        springForce: vs ? vs.springForce : 0,
        heightGained: vs ? vs.heightGained : 0,
        distanceTraveled: vs ? vs.distanceTraveled : 0,
        storedEnergy: vs ? vs.storedEnergy : 0,
        deformationPx: vs ? vs.deformationPx : 0,
        phase: vs ? vs.phase : (p.state === 'AIRBORNE' ? 'AIRBORNE' : 'APPROACH'),
        bendingTorque: vs ? vs.bendingTorque : 0,
        plantStatus: val.isValid ? 'Valid surface ahead' : (val.reason || 'Invalid'),
        anchorX: p.plantAnchorX || (val.isValid ? val.anchorX : 0),
        anchorY: p.plantAnchorY || (val.isValid ? val.anchorY : 0),
        mode: this.gameMode,
        challenge: this.activeChallenge,
        checkpoint: this.activeCheckpointName,
        jumps: this.jumpCount,
        time: this.elapsedTime,
        hasReachedSummit: this.hasReachedSummit,
      });
    }
  }

  /**
   * Determine candidate plant anchor on current platform top surface ahead of player.
   */
  public getPlantValidation(): PlantValidation {
    const p = this.player;
    return PolePhysicsEngine.validatePlantPoint(
      p.x,
      p.y,
      p.facingDir,
      this.platforms,
      this.config
    );
  }

  private handleControls(dt: number) {
    const isLeft = this.keyA?.isDown || this.cursors?.left.isDown || this.keysDown.has('KeyA') || this.keysDown.has('a') || this.keysDown.has('ArrowLeft');
    const isRight = this.keyD?.isDown || this.cursors?.right.isDown || this.keysDown.has('KeyD') || this.keysDown.has('d') || this.keysDown.has('ArrowRight');
    const isUp = this.keyW?.isDown || this.cursors?.up.isDown || this.keysDown.has('KeyW') || this.keysDown.has('w') || this.keysDown.has('ArrowUp');
    const isDown = this.keyS?.isDown || this.cursors?.down.isDown || this.keysDown.has('KeyS') || this.keysDown.has('s') || this.keysDown.has('ArrowDown');
    const isSpace = this.keySpace?.isDown || this.keysDown.has('Space') || this.keysDown.has(' ');

    const p = this.player;

    // Primary Plant Action: Hold Space (or LMB) to plant & vault
    const pointer = this.input.activePointer;
    const isPlantInputActive = isSpace || (pointer && pointer.leftButtonDown());

    if (isPlantInputActive && !this.isPlantButtonPressed && p.state !== 'RIDING_VAULT') {
      this.isPlantButtonPressed = true;
      this.tryPlantPole();
    } else if (!isPlantInputActive && this.isPlantButtonPressed) {
      this.isPlantButtonPressed = false;
      this.releaseVault();
    }

    // Ground Movement Handling (Run Left / Right with A / D)
    if (p.state === 'GROUNDED' || p.state === 'RUNNING' || p.state === 'SLIDING' || p.state === 'BRAKING') {
      let friction = this.config.rockFriction;
      if (p.currentSurface === 'snow') friction = this.config.snowFriction;
      if (p.currentSurface === 'ice') friction = this.config.iceFriction;

      if (isLeft) {
        p.facingDir = -1;
        if (p.vx > 0) {
          // Braking from rightward momentum
          p.vx -= this.config.brakingDecel * dt;
          p.state = 'BRAKING';
        } else {
          // Accelerate left
          p.vx -= this.config.runAcceleration * dt;
          p.vx = Math.max(-this.config.maxRunSpeed, p.vx);
          p.state = 'RUNNING';
        }
      } else if (isRight) {
        p.facingDir = 1;
        if (p.vx < 0) {
          // Braking from leftward momentum
          p.vx += this.config.brakingDecel * dt;
          p.state = 'BRAKING';
        } else {
          // Accelerate right
          p.vx += this.config.runAcceleration * dt;
          p.vx = Math.min(this.config.maxRunSpeed, p.vx);
          p.state = 'RUNNING';
        }
      } else {
        // Friction deceleration: rock stops quickly, ice slides smoothly
        const decel = 2400 * friction;
        if (Math.abs(p.vx) > 10) {
          p.vx -= Math.sign(p.vx) * decel * dt;
          p.state = friction < 0.2 ? 'SLIDING' : 'RUNNING';
        } else {
          p.vx = 0;
          p.state = 'GROUNDED';
        }
      }

      // Footstep sound feedback
      if ((p.state === 'RUNNING' || p.state === 'BRAKING') && Math.abs(p.vx) > 40) {
        if (Math.random() < dt * 6) {
          sounds.playFootstep(p.currentSurface);
        }
      }
    } else if (p.state === 'AIRBORNE') {
      // Subtle airborne steering with A / D
      if (isLeft) {
        p.vx -= this.config.airborneSteerForce * dt;
        p.facingDir = -1;
      } else if (isRight) {
        p.vx += this.config.airborneSteerForce * dt;
        p.facingDir = 1;
      }
    } else if (p.state === 'CLIMBING_LADDER') {
      p.vx = 0;
      if (isUp) {
        p.vy = -180;
      } else if (isDown) {
        p.vy = 180;
      } else {
        p.vy = 0;
      }
    }
  }

  /**
   * Attempt to plant pole at valid surface ahead on the current platform.
   */
  public tryPlantPole(): boolean {
    const p = this.player;
    if (p.state === 'RIDING_VAULT') return false;

    const validation = this.getPlantValidation();

    if (validation.isValid) {
      // Successful Plant! Initialize authoritative flexible vault simulation
      p.state = 'RIDING_VAULT';
      p.plantAnchorX = validation.anchorX;
      p.plantAnchorY = validation.anchorY;
      p.vaultState = PolePhysicsEngine.initVault(
        p.x,
        p.y,
        p.vx,
        p.vy,
        validation.anchorX,
        validation.anchorY,
        this.config
      );
      this.jumpCount++;

      sounds.playPolePlant();
      sounds.startFlexSound();
      return true;
    }

    // Invalid position (e.g. over cliff edge) - reject and keep running/falling
    return false;
  }

  /**
   * Detach from pole and launch into free flight on current trajectory.
   * Continuous release: ZERO artificial impulses or velocity boosts!
   */
  public releaseVault() {
    const p = this.player;
    if (p.state !== 'RIDING_VAULT' || !p.vaultState) return;

    // Preserves instantaneous physical velocity accumulated during swing
    const launch = PolePhysicsEngine.calculateReleaseVelocity(
      p.vx,
      p.vy,
      p.vaultState,
      this.config
    );

    p.vx = launch.vx;
    p.vy = launch.vy;
    p.state = 'AIRBORNE';
    p.poleStrain = 0;
    p.poleBendAmount = 0;
    p.vaultState = null;
    p.plantAnchorX = 0;
    p.plantAnchorY = 0;

    sounds.playVaultRelease(Math.hypot(p.vx, p.vy));
  }

  private updatePhysicsState(dt: number) {
    const p = this.player;

    if (p.state === 'RIDING_VAULT' && p.vaultState) {
      // Step Flexible Pole Vault Simulation with continuous player state
      const step = PolePhysicsEngine.stepVault(p.vaultState, dt, this.config, p.x, p.y, p.vx, p.vy);

      p.vaultState = step.state;
      p.x = step.nextPx;
      p.y = step.nextPy;
      p.vx = step.nextVx;
      p.vy = step.nextVy;
      p.poleStrain = step.state.strain;
      p.poleBendAmount = step.state.bendOffset;

      sounds.updateFlexTension(p.poleStrain);

      // Auto-release if player completes full swing or touches down
      if (step.shouldAutoRelease) {
        this.releaseVault();
      }
    } else if (p.state === 'AIRBORNE' || p.state === 'FALLING') {
      // Ballistic flight under gravity
      p.vy += this.config.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Track flight trail for debug overlay
      this.flightTrail.push({ x: p.x, y: p.y });
      if (this.flightTrail.length > 50) this.flightTrail.shift();
    } else if (p.state === 'CLIMBING_LADDER') {
      p.y += p.vy * dt;
    } else {
      // GROUNDED, RUNNING, BRAKING, SLIDING
      p.x += p.vx * dt;

      // Natural mountain rock wall at x = 20 on the far left of the start plateau
      if (p.x < 20) {
        p.x = 20;
        if (p.vx < 0) p.vx = 0;
      }
    }
  }

  private checkCollisions(dt: number, prevY?: number) {
    const p = this.player;

    // Fall Into Abyss Check
    if (p.y > 1450) {
      this.handleAbyssFall();
      return;
    }

    // CRITICAL: Never clamp or ground-snap the player while vaulting on the pole!
    if (p.state === 'RIDING_VAULT' || p.state === 'CLIMBING_LADDER') {
      return;
    }

    // Platform Surface Collision Detection (For landing & ground movement)
    let isOnGround = false;

    for (const plat of this.platforms) {
      const platLeft = plat.x - plat.width / 2;
      const platRight = plat.x + plat.width / 2;
      const platTop = plat.y - plat.height / 2;

      // Check ladder climbing zone inside/above cave
      if (plat.hasLadder && Math.abs(p.x - (platRight - 35)) < 24 && p.y >= platTop - 180 && p.y <= platTop + 40) {
        if (this.keyW?.isDown || this.cursors?.up.isDown || this.keysDown.has('KeyW') || this.keysDown.has('w')) {
          p.state = 'CLIMBING_LADDER';
          isOnGround = true;
          break;
        }
      }

      // Check top landing surface with continuous swept detection to prevent tunneling
      const playerFeet = p.y + p.height / 2 - 4;
      const prevFeet = (prevY !== undefined ? prevY : p.y) + p.height / 2 - 4;
      const isAbovePlat = p.x >= platLeft - 8 && p.x <= platRight + 8;
      const crossedSurface = (prevFeet <= platTop + 4 && playerFeet >= platTop - 8) || 
                            (playerFeet >= platTop - 8 && playerFeet <= platTop + 24);

      if (isAbovePlat && crossedSurface && p.vy >= 0) {
        // Landing Event from airborne flight
        if (p.state === 'AIRBORNE' || p.state === 'FALLING') {
          sounds.playLanding(p.vy, plat.surfaceType);
          this.flightTrail = [];
        }

        p.y = platTop - p.height / 2 + 4;
        p.vy = 0;
        p.currentSurface = plat.surfaceType;
        isOnGround = true;

        if (p.state !== 'SLIDING' && p.state !== 'BRAKING') {
          p.state = Math.abs(p.vx) > 30 ? (plat.surfaceType === 'ice' ? 'SLIDING' : 'RUNNING') : 'GROUNDED';
        }

        // Checkpoint Activation at Campfire Cave
        if (plat.hasCampfire && this.currentCheckpoint.id !== plat.id) {
          this.currentCheckpoint = {
            id: plat.id,
            x: plat.x - 30,
            y: platTop - p.height / 2,
            name: 'Campfire Cave Checkpoint',
          };
          this.activeCheckpointName = 'Campfire Cave';
          sounds.playCheckpoint();
        }

        // Summit Reach Event
        if (plat.id === 'p6' && !this.hasReachedSummit) {
          this.hasReachedSummit = true;
          sounds.playCheckpoint();
          if (this.onSummitReached) this.onSummitReached();
        }

        break;
      }
    }

    // If player runs off platform edge without vaulting
    if (!isOnGround && (p.state === 'GROUNDED' || p.state === 'RUNNING' || p.state === 'BRAKING' || p.state === 'SLIDING')) {
      p.state = 'FALLING';
    }
  }

  public setChallenge(challenge: LabChallenge) {
    this.activeChallenge = challenge;
    if (challenge === 'NONE') {
      this.initLevelPlatforms();
      this.currentCheckpoint = { id: 'p0', x: 250, y: 1068, name: 'Mountain Base' };
      this.activeCheckpointName = 'Mountain Base';
      this.player.resetPosition(250, 1068);
      this.cameras.main.setBounds(0, 0, 4200, 1600);
    } else if (challenge === 'TEST_A') {
      // Test A: Precision (Narrow target spire, 90px gap)
      this.platforms = [
        { id: 'lab_start', x: 250, y: 1100, width: 500, height: 120, surfaceType: 'snow', label: 'Start Plateau' },
        { id: 'lab_target', x: 645, y: 1100, width: 110, height: 120, surfaceType: 'rock', label: 'Precision Ledge' },
      ];
      this.currentCheckpoint = { id: 'lab_start', x: 340, y: 1018, name: 'Lab A: Precision' };
      this.activeCheckpointName = 'Lab A: Precision';
      this.player.resetPosition(340, 1018);
      this.cameras.main.setBounds(0, 400, 2000, 1200);
    } else if (challenge === 'TEST_B') {
      // Test B: Distance (220px wide gap, wide target)
      this.platforms = [
        { id: 'lab_start', x: 300, y: 1100, width: 600, height: 120, surfaceType: 'snow', label: 'Run-up Plateau' },
        { id: 'lab_target', x: 1000, y: 1100, width: 360, height: 120, surfaceType: 'snow', label: 'Distance Spire' },
      ];
      this.currentCheckpoint = { id: 'lab_start', x: 150, y: 1018, name: 'Lab B: Distance' };
      this.activeCheckpointName = 'Lab B: Distance';
      this.player.resetPosition(150, 1018);
      this.cameras.main.setBounds(0, 400, 2400, 1200);
    } else if (challenge === 'TEST_C') {
      // Test C: Height (150px elevation gain, steep vault needed)
      this.platforms = [
        { id: 'lab_start', x: 300, y: 1150, width: 600, height: 120, surfaceType: 'snow', label: 'Launch Plateau' },
        { id: 'lab_target', x: 870, y: 1000, width: 260, height: 120, surfaceType: 'rock', label: 'Elevated Spire (+150px)' },
      ];
      this.currentCheckpoint = { id: 'lab_start', x: 150, y: 1068, name: 'Lab C: Height' };
      this.activeCheckpointName = 'Lab C: Height';
      this.player.resetPosition(150, 1068);
      this.cameras.main.setBounds(0, 300, 2200, 1300);
    } else if (challenge === 'TEST_D') {
      // Test D: Controlled Landing (130px gap to narrow icy platform)
      this.platforms = [
        { id: 'lab_start', x: 250, y: 1100, width: 500, height: 120, surfaceType: 'snow', label: 'Approach Plateau' },
        { id: 'lab_target', x: 700, y: 1100, width: 140, height: 120, surfaceType: 'ice', label: 'Glacial Ice Ledge' },
      ];
      this.currentCheckpoint = { id: 'lab_start', x: 250, y: 1018, name: 'Lab D: Ice Braking' };
      this.activeCheckpointName = 'Lab D: Ice Braking';
      this.player.resetPosition(250, 1018);
      this.cameras.main.setBounds(0, 400, 2000, 1200);
    }
    this.isPlantButtonPressed = false;
    this.elapsedTime = 0;
    this.jumpCount = 0;
    this.hasReachedSummit = false;
    this.flightTrail = [];
  }

  private handleAbyssFall() {
    sounds.playFallSound();

    if (this.activeChallenge !== 'NONE') {
      this.player.resetPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
    } else if (this.gameMode === 'NORMAL') {
      // Respawn at active Checkpoint
      this.player.resetPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
    } else {
      // HARDCORE MODE: Restart entire mountain ascent from start plateau
      this.player.resetPosition(250, 1068);
      this.activeCheckpointName = 'Mountain Base';
    }
    this.isPlantButtonPressed = false;
  }

  public restartCurrentAttempt() {
    if (this.activeChallenge !== 'NONE') {
      this.player.resetPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
    } else if (this.gameMode === 'HARDCORE') {
      this.player.resetPosition(250, 1068);
      this.activeCheckpointName = 'Mountain Base';
    } else {
      this.player.resetPosition(this.currentCheckpoint.x, this.currentCheckpoint.y);
    }
    this.isPlantButtonPressed = false;
    this.elapsedTime = 0;
    this.jumpCount = 0;
    this.hasReachedSummit = false;
    this.flightTrail = [];
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
  }

  private renderVisuals(time: number) {
    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;

    // 1. Render Background Parallax, Grand Peak, and Mist
    this.mountainRenderer.renderBackground(camX, camY, 4200, 1600);

    // 2. Render Platforms, Snowy Spires, Caves, and Ladders
    this.mountainRenderer.renderPlatforms(this.platforms, time);

    // 3. Render Vaulting Pole Arc & Flex Deformation
    this.renderPoleGraphic();

    // 4. Render Mountaineer Character & Scarf
    this.poleGraphics.lineStyle(0, 0, 0);
    this.player.renderToCanvas(this.poleGraphics, true, this.isDebugMode);

    // 5. Render Trajectory & Debug Visualization (F3)
    this.renderDebugAndTrajectory();
  }

  private renderPoleGraphic() {
    const g = this.poleGraphics;
    g.clear();
    const p = this.player;

    if (p.state === 'RIDING_VAULT' && p.vaultState) {
      // Curved Elastic Bending Pole during Vault
      const ax = p.vaultState.anchorX;
      const ay = p.vaultState.anchorY;
      const px = p.x + p.vaultState.facingDir * 4;
      const py = p.y - 4; // Grip point at chest height

      const midX = (ax + px) / 2;
      const midY = (ay + py) / 2;

      const dx = px - ax;
      const dy = py - ay;
      const len = Math.hypot(dx, dy);

      // Normal vector for flex bulge
      const nx = -dy / len;
      const ny = dx / len;

      const flexOffset = p.vaultState.bendOffset * p.vaultState.facingDir;
      const ctrlX = midX + nx * flexOffset;
      const ctrlY = midY + ny * flexOffset;

      // Draw Curved Pole using Bezier points
      const points: Phaser.Math.Vector2[] = [];
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const invT = 1 - t;
        const bx = invT * invT * ax + 2 * invT * t * ctrlX + t * t * px;
        const by = invT * invT * ay + 2 * invT * t * ctrlY + t * t * py;
        points.push(new Phaser.Math.Vector2(bx, by));
      }

      g.lineStyle(5, 0xd97706, 1.0); // Warm amber wooden pole
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i].x, points[i].y);
      }
      g.strokePath();

      // Pole metal tip & grip cap
      g.fillStyle(0x475569, 1.0);
      g.fillCircle(ax, ay, 4);
      g.fillCircle(px, py, 4);
    } else {
      // Carried Pole in Player Hands (pointing naturally forward)
      const dir = p.facingDir;
      const startX = p.x - dir * 6;
      const startY = p.y - 4;

      const val = this.getPlantValidation();
      this.currentPlantTarget = val;

      let endX: number;
      let endY: number;

      if (val.isValid) {
        endX = val.anchorX;
        endY = val.anchorY;
      } else {
        // Natural forward carrying angle
        const angle = dir >= 0 ? 0.22 : Math.PI - 0.22;
        const poleLen = this.config.poleLength * 0.85;
        endX = startX + Math.cos(angle) * poleLen;
        endY = startY + Math.sin(angle) * poleLen;
      }

      // Draw Carried Pole
      g.lineStyle(4, 0xd97706, 0.95);
      g.lineBetween(startX, startY, endX, endY);

      // Grip cap
      g.fillStyle(0x78350f, 1.0);
      g.fillCircle(startX, startY, 3);

      // Visual Aim Indicator Dot on platform surface
      if (val.isValid) {
        // Glowing green target on platform surface ahead
        g.fillStyle(0x22c55e, 0.95);
        g.fillCircle(val.anchorX, val.anchorY, 6);
        g.lineStyle(2, 0x86efac, 0.7);
        g.strokeCircle(val.anchorX, val.anchorY, 10);
      } else {
        // Plant point is off the ledge - show warning indicator
        g.lineStyle(2, 0xef4444, 0.8);
        g.lineBetween(endX - 5, endY - 5, endX + 5, endY + 5);
        g.lineBetween(endX - 5, endY + 5, endX + 5, endY - 5);
      }
    }
  }

  private renderDebugAndTrajectory() {
    const g = this.debugGraphics;
    g.clear();

    if (!this.isDebugMode) return;

    const p = this.player;

    // 1. Velocity Vector Arrow
    g.lineStyle(2, 0x38bdf8, 1.0);
    g.lineBetween(p.x, p.y, p.x + p.vx * 0.25, p.y + p.vy * 0.25);

    // 2. Center of Mass Dot
    g.fillStyle(0xf59e0b, 1.0);
    g.fillCircle(p.x, p.y, 4);

    // 3. Flight Trail History Path
    if (this.flightTrail.length > 1) {
      g.lineStyle(2, 0xa855f7, 0.7);
      g.beginPath();
      g.moveTo(this.flightTrail[0].x, this.flightTrail[0].y);
      for (let i = 1; i < this.flightTrail.length; i++) {
        g.lineTo(this.flightTrail[i].x, this.flightTrail[i].y);
      }
      g.strokePath();
    }

    // 4. Predicted Trajectory Preview Arc
    const predicted = PolePhysicsEngine.predictTrajectory(p.x, p.y, p.vx, p.vy, this.config, 25);
    g.lineStyle(1.5, 0xec4899, 0.5);
    g.beginPath();
    if (predicted.length > 0) {
      g.moveTo(predicted[0].x, predicted[0].y);
      for (let i = 1; i < predicted.length; i++) {
        g.lineTo(predicted[i].x, predicted[i].y);
      }
      g.strokePath();
    }

    // 5. Platform Bounding Collision Boxes
    for (const plat of this.platforms) {
      g.lineStyle(1, 0x22c55e, 0.5);
      g.strokeRect(plat.x - plat.width / 2, plat.y - plat.height / 2, plat.width, plat.height);
    }
  }
}
