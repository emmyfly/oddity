import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { generatePuzzle } from '../../shared/puzzle.js';
import type { Puzzle, Shape } from '../../shared/puzzle.js';
import type { SolveRequest, SolveResponse, StatusResponse } from '../../shared/api.js';
import type { ResultData } from './Result.js';

const WRONG_TAP_PENALTY_MS = 500;
const GRID_PADDING = 40;
const TILE_FILL_RATIO = 0.6; // shape size relative to its tile cell

export class Oddity extends Scene {
  private puzzle!: Puzzle;
  private startTime = 0;
  private penaltyMs = 0;
  private solved = false;
  private tileObjects: Phaser.GameObjects.GameObject[] = [];
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super('Oddity');
  }

  create() {
    this.puzzle = generatePuzzle(new Date());
    this.penaltyMs = 0;
    this.solved = false;

    this.loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Loading…', {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    void this.checkStatusThenStart();
  }

  // Checks whether this user already solved today's puzzle (server-authoritative,
  // via the /api/status endpoint backed by Redis — see src/server/core/streak.ts).
  // If so, skip the grid entirely and jump to their existing result: this is what
  // prevents replaying today's puzzle after it's already been solved once.
  private async checkStatusThenStart(): Promise<void> {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const status: StatusResponse = await response.json();
        if (status.alreadySolvedToday) {
          this.loadingText?.destroy();
          this.scene.start('Result', {
            timeMs: status.lastTimeMs,
            streak: status.streak,
            bestTimeMs: status.bestTimeMs,
            isNewBest: false,
            alreadyPlayed: true,
          } satisfies ResultData);
          return;
        }
      }
    } catch (error) {
      // Status check failed — fail open and let them play rather than block
      // on a non-critical request (same resilience approach as submitSolve).
      console.error('[Oddity] Status check failed, showing puzzle anyway:', error);
    }

    this.loadingText?.destroy();
    this.startPuzzle();
  }

  private startPuzzle(): void {
    // Timer starts the moment the grid is about to render.
    this.startTime = performance.now();
    this.buildGrid(this.puzzle);

    // The iframe's real size can arrive slightly after the scene starts, and
    // players may rotate their phone mid-puzzle, so rebuild on every resize.
    this.scale.on('resize', () => this.buildGrid(this.puzzle));
  }

  private buildGrid(puzzle: Puzzle): void {
    for (const obj of this.tileObjects) obj.destroy();
    this.tileObjects = [];

    const { gridSize, totalTiles, oddIndex, base, odd } = puzzle;

    const available = Math.min(this.scale.width, this.scale.height) - GRID_PADDING * 2;
    const cellSize = available / gridSize;
    const originX = (this.scale.width - available) / 2;
    const originY = (this.scale.height - available) / 2;

    for (let index = 0; index < totalTiles; index++) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = originX + col * cellSize + cellSize / 2;
      const y = originY + row * cellSize + cellSize / 2;

      const appearance = index === oddIndex ? odd : base;

      const graphics = this.add.graphics({ x, y });
      drawShape(graphics, appearance.shape, cellSize * TILE_FILL_RATIO, appearance.color);
      graphics.setAngle(appearance.rotation);

      const zone = this.add.zone(x, y, cellSize, cellSize).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.handleTap(index));

      this.tileObjects.push(graphics, zone);
    }
  }

  private handleTap(index: number): void {
    if (this.solved) return;

    if (index === this.puzzle.oddIndex) {
      this.solved = true;
      const elapsedMs = Math.round(performance.now() - this.startTime + this.penaltyMs);
      void this.submitSolve(elapsedMs);
    } else {
      this.penaltyMs += WRONG_TAP_PENALTY_MS;
      console.log('[Oddity] Wrong tile, +500ms penalty', { totalPenaltyMs: this.penaltyMs });
    }
  }

  private async submitSolve(timeMs: number): Promise<void> {
    const resultData: ResultData = { timeMs, streak: undefined, bestTimeMs: undefined, isNewBest: false };

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeMs } satisfies SolveRequest),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data: SolveResponse = await response.json();
      resultData.streak = data.streak;
      resultData.bestTimeMs = data.bestTimeMs;
      resultData.isNewBest = data.isNewBest;
      console.log('[Oddity] Solved!', { seed: this.puzzle.seed, timeMs, ...data });
    } catch (error) {
      // Streak/bestTime are unavailable, but the player still solved it —
      // show the result screen with what we know rather than blocking them.
      console.error('[Oddity] Failed to record solve, showing partial result:', error);
    }

    this.scene.start('Result', resultData);
  }
}

// Draws `shape` centered at the graphics object's local origin (0, 0).
function drawShape(graphics: Phaser.GameObjects.Graphics, shape: Shape, size: number, color: string): void {
  const fillColor = Phaser.Display.Color.HexStringToColor(color).color;
  graphics.fillStyle(fillColor, 1);

  const half = size / 2;
  switch (shape) {
    case 'circle':
      graphics.fillCircle(0, 0, half);
      break;
    case 'square':
      graphics.fillRect(-half, -half, size, size);
      break;
    case 'diamond':
      graphics.fillPoints(
        [
          new Phaser.Math.Vector2(0, -half),
          new Phaser.Math.Vector2(half, 0),
          new Phaser.Math.Vector2(0, half),
          new Phaser.Math.Vector2(-half, 0),
        ],
        true
      );
      break;
    case 'triangle':
      graphics.fillPoints(
        [
          new Phaser.Math.Vector2(0, -half),
          new Phaser.Math.Vector2(half, half),
          new Phaser.Math.Vector2(-half, half),
        ],
        true
      );
      break;
  }
}
