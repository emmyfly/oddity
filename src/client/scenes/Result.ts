import { Scene, GameObjects } from 'phaser';
import { showToast } from '@devvit/web/client';
import { formatSeconds, buildShareText } from '../../shared/share.js';

export type ResultData = {
  timeMs: number;
  streak: number | undefined; // undefined if the server call failed
  bestTimeMs: number | undefined;
  isNewBest: boolean;
  alreadyPlayed?: boolean; // true when reopening after already solving today (see Oddity.checkStatusThenStart)
};

export class Result extends Scene {
  private resultData!: ResultData;
  private elements: GameObjects.GameObject[] = [];

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.resultData = data;
  }

  create(): void {
    this.buildLayout();
    this.scale.on('resize', () => this.buildLayout());
  }

  private buildLayout(): void {
    for (const el of this.elements) el.destroy();
    this.elements = [];

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x028af8);
    // Scale text/spacing down on narrow phone-sized viewports, never enlarge above 1x.
    const scaleFactor = Math.min(width / 800, height / 600, 1);
    const centerX = width / 2;

    const titleLabel = this.resultData.alreadyPlayed ? 'Already solved today!' : 'Solved!';
    const title = this.add
      .text(centerX, height * 0.18, titleLabel, {
        fontFamily: 'Arial Black',
        fontSize: 48 * scaleFactor,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const time = this.add
      .text(centerX, height * 0.34, formatSeconds(this.resultData.timeMs), {
        fontFamily: 'Arial Black',
        fontSize: 64 * scaleFactor,
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const streakText =
      this.resultData.streak === undefined ? "Streak: — (couldn't save)" : `🔥 Streak: ${this.resultData.streak}`;
    const streak = this.add
      .text(centerX, height * 0.48, streakText, {
        fontFamily: 'Arial',
        fontSize: 28 * scaleFactor,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.elements.push(title, time, streak);

    if (this.resultData.isNewBest && this.resultData.bestTimeMs !== undefined) {
      const best = this.add
        .text(centerX, height * 0.58, `🎉 New personal best!`, {
          fontFamily: 'Arial',
          fontSize: 22 * scaleFactor,
          color: '#8affc1',
        })
        .setOrigin(0.5);
      this.elements.push(best);
    }

    if (this.resultData.alreadyPlayed) {
      const comeBack = this.add
        .text(centerX, height * 0.65, 'Come back tomorrow for a new puzzle!', {
          fontFamily: 'Arial',
          fontSize: 18 * scaleFactor,
          color: '#cfe8ff',
        })
        .setOrigin(0.5);
      this.elements.push(comeBack);
    }

    if (this.resultData.streak !== undefined) {
      const shareButton = this.add
        .text(centerX, height * 0.75, '📋 Copy result', {
          fontFamily: 'Arial Black',
          fontSize: 28 * scaleFactor,
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: { x: 20, y: 12 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => shareButton.setStyle({ backgroundColor: '#555555' }))
        .on('pointerout', () => shareButton.setStyle({ backgroundColor: '#444444' }))
        .on('pointerdown', () => void this.copyShareText());
      this.elements.push(shareButton);
    }
  }

  private async copyShareText(): Promise<void> {
    const streak = this.resultData.streak ?? 0;
    const text = buildShareText(new Date(), this.resultData.timeMs, streak);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (error) {
      console.error('[Result] Clipboard write failed:', error);
      showToast('Could not copy — try again');
    }
  }
}
