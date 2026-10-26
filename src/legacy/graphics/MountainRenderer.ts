/**
 * Mountain & Environmental Art Renderer for Just Short.
 * Renders Zhangjiajie-style spires, snow cliffs, icicles, pine trees, cloud mist, distant grand peaks,
 * and warm glowing cave campfires in Phaser 3 / Canvas.
 */

import { PlatformDef } from '../types/game';

export class MountainRenderer {
  private scene: Phaser.Scene;
  private bgGraphic: Phaser.GameObjects.Graphics;
  private fgGraphic: Phaser.GameObjects.Graphics;
  private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private campfireEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bgGraphic = scene.add.graphics();
    this.fgGraphic = scene.add.graphics();
    this.bgGraphic.setDepth(-10);
    this.fgGraphic.setDepth(5);
  }

  /**
   * Render static/semi-static background mountain spires, mist layers, and sky.
   */
  public renderBackground(cameraX: number, cameraY: number, levelWidth: number, levelHeight: number) {
    const g = this.bgGraphic;
    g.clear();

    // 1. Sky Gradient (Alpine Twilight: deep cold indigo -> soft amber horizon)
    g.fillGradientStyle(0x0f172a, 0x1e293b, 0x334155, 0x475569, 1);
    g.fillRect(cameraX - 400, cameraY - 400, 1600, 1200);

    // 2. Far Grand Peak (Parallax 0.05)
    const peakX = levelWidth * 0.7 - cameraX * 0.05;
    const peakY = 250 - cameraY * 0.05;
    g.fillStyle(0x64748b, 0.45); // Misty far peak
    g.beginPath();
    g.moveTo(peakX - 350, peakY + 600);
    g.lineTo(peakX - 120, peakY + 180);
    g.lineTo(peakX, peakY); // Peak summit
    g.lineTo(peakX + 150, peakY + 220);
    g.lineTo(peakX + 380, peakY + 600);
    g.closePath();
    g.fillPath();

    // Snow highlight on Far Peak summit
    g.fillStyle(0xe2e8f0, 0.6);
    g.beginPath();
    g.moveTo(peakX - 40, peakY + 60);
    g.lineTo(peakX, peakY);
    g.lineTo(peakX + 50, peakY + 75);
    g.lineTo(peakX + 10, peakY + 110);
    g.closePath();
    g.fillPath();

    // 3. Midground Distant Stone Pillars / Spires (Parallax 0.15)
    const pillarPositions = [
      { x: 200, w: 90, h: 700 },
      { x: 550, w: 110, h: 850 },
      { x: 950, w: 80, h: 650 },
      { x: 1400, w: 120, h: 900 },
      { x: 1900, w: 100, h: 750 },
      { x: 2400, w: 130, h: 800 },
      { x: 2900, w: 95, h: 700 },
    ];

    for (const p of pillarPositions) {
      const px = p.x - cameraX * 0.15;
      const py = 1200 - cameraY * 0.15;

      // Vertical stone pillar body
      g.fillStyle(0x334155, 0.65);
      g.fillRect(px - p.w / 2, py - p.h, p.w, p.h);

      // Top snow cap on midground pillar
      g.fillStyle(0xcfdeeb, 0.75);
      g.fillTriangle(
        px - p.w / 2 - 5,
        py - p.h + 5,
        px,
        py - p.h - 22,
        px + p.w / 2 + 5,
        py - p.h + 5
      );
    }

    // 4. Low Cloud / Mist Sea Layer (Parallax 0.25)
    const mistY = 1250 - cameraY * 0.25;
    g.fillStyle(0xe2e8f0, 0.25);
    g.fillEllipse(cameraX + 400, mistY, 1800, 220);
    g.fillStyle(0xcfdeeb, 0.35);
    g.fillEllipse(cameraX + 200, mistY + 40, 1600, 180);
  }

  /**
   * Render active level platforms, cliffs, icy surfaces, snow caps, pines, and caves.
   */
  public renderPlatforms(platforms: PlatformDef[], time: number) {
    const g = this.fgGraphic;
    g.clear();

    for (const p of platforms) {
      const left = p.x - p.width / 2;
      const right = p.x + p.width / 2;
      const top = p.y - p.height / 2;
      const bottom = p.y + p.height / 2;

      // Special handling for Cave Platform
      if (p.isCave) {
        this.renderCavePlatform(g, p, left, right, top, bottom, time);
        continue;
      }

      // 1. Rock Cliff Pillar Base (Vertical striations & dark slate texture)
      g.fillStyle(0x1e293b, 1.0); // Main rock body
      g.fillRect(left, top, p.width, p.height);

      // Rock edge highlights & side shadows
      g.fillStyle(0x0f172a, 0.6); // Right shadow side
      g.fillRect(right - 12, top, 12, p.height);

      g.fillStyle(0x475569, 0.4); // Left light edge
      g.fillRect(left, top, 10, p.height);

      // Vertical rock crack details
      g.lineStyle(2, 0x0f172a, 0.5);
      g.lineBetween(left + p.width * 0.3, top + 15, left + p.width * 0.35, top + p.height - 20);
      g.lineBetween(left + p.width * 0.7, top + 10, left + p.width * 0.68, top + p.height - 10);

      // 2. Surface Layer: Rock vs Snow vs Ice
      if (p.surfaceType === 'ice') {
        // Glacial Ice Top Surface (Glossy cyan-blue translucent cap)
        g.fillStyle(0x38bdf8, 0.85); // Bright icy blue
        g.fillRect(left, top - 6, p.width, 10);
        
        g.fillStyle(0xe0f2fe, 0.95); // Shiny ice white top ridge
        g.fillRect(left, top - 6, p.width, 4);

        // Ice gleam lines
        g.lineStyle(1.5, 0xffffff, 0.9);
        g.lineBetween(left + 20, top - 4, left + p.width * 0.4, top - 4);
        g.lineBetween(left + p.width * 0.55, top - 4, left + p.width * 0.85, top - 4);

        // Hanging Icicles underneath ice ledge
        const icicleCount = Math.floor(p.width / 24);
        g.fillStyle(0xbae6fd, 0.9);
        for (let i = 0; i < icicleCount; i++) {
          const ix = left + 12 + i * 24;
          const iLen = 14 + (i % 3) * 8;
          g.fillTriangle(ix - 3, top + 4, ix + 3, top + 4, ix, top + 4 + iLen);
        }
      } else if (p.surfaceType === 'snow') {
        // Deep Snow Top Cap (Fluffy white with soft blue shadow)
        g.fillStyle(0xf1f5f9, 1.0); // Crisp snow top
        g.beginPath();
        g.moveTo(left - 6, top);
        // Irregular fluffy snow bumps
        const bumpStep = p.width / 6;
        for (let i = 0; i <= 6; i++) {
          const bx = left + i * bumpStep;
          const by = top - 8 - (i % 2 === 0 ? 5 : 2);
          g.lineTo(bx, by);
        }
        g.lineTo(right + 6, top);
        g.lineTo(right, top + 8);
        g.lineTo(left, top + 8);
        g.closePath();
        g.fillPath();

        // Snow overhang drops
        g.fillStyle(0xe2e8f0, 1.0);
        g.fillCircle(left + 15, top + 8, 7);
        g.fillCircle(right - 18, top + 8, 8);
      } else {
        // Rough Rock Top
        g.fillStyle(0x334155, 1.0);
        g.fillRect(left, top - 3, p.width, 6);
      }

      // 3. Decorative Alpine Pine Trees on edges
      if (p.width >= 200 && p.surfaceType !== 'ice') {
        this.renderPineTree(g, left + 24, top - 8);
      }

      // Platform Label / Signpost (e.g. Jump 1, Jump 2, Ice Ledge)
      if (p.label) {
        // Quiet text indicator rendered above/below platform
      }
    }
  }

  /**
   * Render Cave Platform with interior room, roof collision, campfire, and ladder.
   */
  private renderCavePlatform(
    g: Phaser.GameObjects.Graphics,
    p: PlatformDef,
    left: number,
    right: number,
    top: number,
    bottom: number,
    time: number
  ) {
    // Cave outer mountain rock
    g.fillStyle(0x1e293b, 1.0);
    g.fillRect(left, top, p.width, p.height);

    // Cave Interior Cutout (dark hollow cave entrance)
    const caveX = p.x - 30;
    const caveY = p.y + 10;
    const caveW = 140;
    const caveH = 90;

    g.fillStyle(0x090d16, 1.0); // Deep dark cave interior
    g.fillRoundedRect(caveX - caveW / 2, caveY - caveH / 2, caveW, caveH, 16);

    // Warm Orange Campfire Glow effect inside cave
    const flicker = Math.sin(time * 0.01) * 4 + Math.cos(time * 0.017) * 3;
    const glowRadius = 85 + flicker;

    // Outer glow halo
    g.fillStyle(0xf97316, 0.25);
    g.fillCircle(caveX, caveY + 15, glowRadius);
    g.fillStyle(0xfbbf24, 0.45);
    g.fillCircle(caveX, caveY + 15, glowRadius * 0.6);
    g.fillStyle(0xffedd5, 0.8); // Core bright campfire flame
    g.fillCircle(caveX, caveY + 22, 10 + flicker * 0.5);

    // Log base
    g.fillStyle(0x451a03, 1.0);
    g.fillRect(caveX - 14, caveY + 26, 28, 6);

    // Snow Cap on Cave Roof
    g.fillStyle(0xf1f5f9, 1.0);
    g.fillRect(left - 4, top - 8, p.width + 8, 10);

    // Ladder climbing up right side of cave to summit
    if (p.hasLadder) {
      const ladX = right - 35;
      const ladTop = top - 180;
      const ladBottom = top + 10;

      g.lineStyle(4, 0x78350f, 1.0); // Wood rails
      g.lineBetween(ladX - 10, ladTop, ladX - 10, ladBottom);
      g.lineBetween(ladX + 10, ladTop, ladX + 10, ladBottom);

      // Rungs
      g.lineStyle(3, 0x92400e, 1.0);
      for (let ry = ladTop + 15; ry < ladBottom; ry += 16) {
        g.lineBetween(ladX - 12, ry, ladX + 12, ry);
      }
    }
  }

  /**
   * Render a small stylized snow-covered pine tree.
   */
  private renderPineTree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    // Trunk
    g.fillStyle(0x451a03, 1.0);
    g.fillRect(x - 3, y - 10, 6, 10);

    // Dark pine foliage tiers
    g.fillStyle(0x064e3b, 1.0);
    g.fillTriangle(x - 14, y - 8, x, y - 28, x + 14, y - 8);
    g.fillTriangle(x - 11, y - 22, x, y - 38, x + 11, y - 22);
    g.fillTriangle(x - 8, y - 32, x, y - 46, x + 8, y - 32);

    // Snow dusting on pine branches
    g.fillStyle(0xf1f5f9, 0.9);
    g.fillTriangle(x - 12, y - 10, x, y - 26, x + 12, y - 10);
    g.fillTriangle(x - 9, y - 24, x, y - 36, x + 9, y - 24);
    g.fillTriangle(x - 6, y - 34, x, y - 44, x + 6, y - 34);
  }
}
