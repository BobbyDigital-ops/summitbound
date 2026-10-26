/**
 * Mountaineer Player Entity & Scarf Renderer for Just Short.
 * Manages player state, movement animations, and red scarf simulation.
 */

import { PlayerState, PhysicsConfig, SurfaceType, VaultState } from '../types/game';

export interface ScarfNode {
  x: number;
  y: number;
}

export class PlayerEntity {
  public x: number = 100;
  public y: number = 1150;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 24;
  public height: number = 44;
  
  public state: PlayerState = 'GROUNDED';
  public facingDir: number = 1; // 1 = right, -1 = left
  public currentSurface: SurfaceType = 'snow';
  
  // Scarf physics nodes (5 connected points)
  public scarfNodes: ScarfNode[] = [];
  
  // Vault attachment anchor & physics state
  public plantAnchorX: number = 0;
  public plantAnchorY: number = 0;
  public poleStrain: number = 0;
  public poleBendAmount: number = 0;
  public vaultState: VaultState | null = null;
  
  // Animation counters
  private runAnimTimer: number = 0;
  private timeAlive: number = 0;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.initScarf();
  }

  private initScarf() {
    this.scarfNodes = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      this.scarfNodes.push({ x: this.x - i * 5, y: this.y - 12 });
    }
  }

  public resetPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = 'GROUNDED';
    this.poleStrain = 0;
    this.poleBendAmount = 0;
    this.plantAnchorX = 0;
    this.plantAnchorY = 0;
    this.vaultState = null;
    this.facingDir = 1;
    this.initScarf();
  }

  public update(dt: number, config: PhysicsConfig) {
    this.timeAlive += dt;
    this.runAnimTimer += Math.abs(this.vx) * dt * 0.05;

    // Scarf physics simulation
    this.updateScarf(dt);
  }

  private updateScarf(dt: number) {
    if (this.scarfNodes.length === 0) return;

    // Head/neck position as scarf origin
    const neckX = this.x - this.facingDir * 4;
    const neckY = this.y - 14;

    this.scarfNodes[0].x = neckX;
    this.scarfNodes[0].y = neckY;

    // Wind + inertia pull scarf back opposite to velocity
    const windForceX = -this.vx * 0.12 - this.facingDir * 18 + Math.sin(this.timeAlive * 4) * 6;
    const windForceY = -this.vy * 0.08 + Math.cos(this.timeAlive * 5) * 4;

    for (let i = 1; i < this.scarfNodes.length; i++) {
      const parent = this.scarfNodes[i - 1];
      const node = this.scarfNodes[i];

      // Target position pulling backward from parent
      const targetX = parent.x - this.facingDir * 7 + windForceX * (i * 0.15);
      const targetY = parent.y + 2 + windForceY * (i * 0.12);

      // Lerp towards target
      node.x += (targetX - node.x) * 18 * dt;
      node.y += (targetY - node.y) * 18 * dt;

      // Distance constraint
      const dx = node.x - parent.x;
      const dy = node.y - parent.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 7;
      if (dist > maxDist && dist > 0) {
        node.x = parent.x + (dx / dist) * maxDist;
        node.y = parent.y + (dy / dist) * maxDist;
      }
    }
  }

  /**
   * Render mountaineer character and scarf onto Phaser Graphics object.
   */
  public renderToCanvas(
    ctx: CanvasRenderingContext2D | Phaser.GameObjects.Graphics,
    isPhaserGraphics: boolean = false,
    debugShowMesh: boolean = false
  ) {
    if (isPhaserGraphics) {
      this.drawPhaserGraphics(ctx as Phaser.GameObjects.Graphics);
    }
  }

  public drawPhaserGraphics(g: Phaser.GameObjects.Graphics) {
    // 1. Draw Red Scarf (fluttering tail)
    if (this.scarfNodes.length > 1) {
      g.lineStyle(4, 0xdc2626, 0.95);
      g.beginPath();
      g.moveTo(this.scarfNodes[0].x, this.scarfNodes[0].y);
      for (let i = 1; i < this.scarfNodes.length; i++) {
        g.lineTo(this.scarfNodes[i].x, this.scarfNodes[i].y);
      }
      g.strokePath();

      // Scarf fringe highlight
      const tail = this.scarfNodes[this.scarfNodes.length - 1];
      g.fillStyle(0xef4444, 1.0);
      g.fillCircle(tail.x, tail.y, 2.5);
    }

    // 2. Draw Mountaineer Body
    const px = this.x;
    const py = this.y;
    const dir = this.facingDir;

    // Body tilt angle based on velocity / state
    let tilt = (this.vx / 500) * 0.2;
    if (this.state === 'RIDING_VAULT') {
      const dx = px - this.plantAnchorX;
      const dy = py - this.plantAnchorY;
      tilt = Math.atan2(dy, dx) - Math.PI / 2;
    }

    // Shadow on ground if grounded
    if (this.state === 'GROUNDED' || this.state === 'RUNNING' || this.state === 'SLIDING') {
      g.fillStyle(0x0f172a, 0.35);
      g.fillEllipse(px, py + 20, 22, 6);
    }

    // Legs / Boots
    const legCycle = Math.sin(this.runAnimTimer);
    g.lineStyle(4, 0x1e293b, 1); // Dark navy trousers

    if (this.state === 'RUNNING') {
      // Left leg
      g.lineBetween(px - 2, py, px - 6 + legCycle * 10 * dir, py + 18);
      // Right leg
      g.lineBetween(px + 2, py, px + 6 - legCycle * 10 * dir, py + 18);
    } else if (this.state === 'RIDING_VAULT' || this.state === 'AIRBORNE') {
      // Tucked aerial legs
      g.lineBetween(px - 3, py, px - 8 * dir, py + 12);
      g.lineBetween(px - 8 * dir, py + 12, px - 4 * dir, py + 20);
      g.lineBetween(px + 3, py, px + 6 * dir, py + 14);
    } else if (this.state === 'SLIDING') {
      // Crouch slide legs forward
      g.lineBetween(px, py + 4, px + 14 * dir, py + 18);
      g.lineBetween(px - 4, py + 4, px + 6 * dir, py + 18);
    } else {
      // Standing legs
      g.lineBetween(px - 5, py, px - 5, py + 20);
      g.lineBetween(px + 5, py, px + 5, py + 20);
    }

    // Boots
    g.fillStyle(0x0f172a, 1);
    g.fillRect(px - 7, py + 18, 6, 4);
    g.fillRect(px + 3, py + 18, 6, 4);

    // Winter Coat Torso
    g.fillStyle(0x334155, 1); // Slate winter parka
    g.fillRoundedRect(px - 10, py - 12, 20, 22, 4);

    // Parka trim highlight
    g.lineStyle(2, 0x64748b, 0.8);
    g.lineBetween(px, py - 10, px, py + 8);

    // Arms & Hands
    g.lineStyle(3, 0x1e293b, 1);
    if (this.state === 'RIDING_VAULT' || this.state === 'PLANTED_LOADING') {
      // Hands gripping pole tightly
      g.lineBetween(px - 4, py - 6, px + dir * 6, py - 4);
      g.lineBetween(px - 4, py - 2, px + dir * 10, py);
    } else {
      // Natural arm swing
      const armCycle = Math.cos(this.runAnimTimer);
      g.lineBetween(px - 6, py - 8, px - 12 * dir + armCycle * 6, py + 2);
      g.lineBetween(px + 6, py - 8, px + 12 * dir - armCycle * 6, py + 2);
    }

    // Head / Hood
    g.fillStyle(0x475569, 1); // Hood color
    g.fillCircle(px, py - 18, 9);

    // Face / Goggles
    g.fillStyle(0xf8fafc, 1); // Face skin tone/goggles
    g.fillCircle(px + dir * 3, py - 19, 4);

    g.fillStyle(0x0f172a, 0.9); // Dark goggle strap
    g.fillRect(px + dir * 1 - 2, py - 21, 6, 3);
  }
}
