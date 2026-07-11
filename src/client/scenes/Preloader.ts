import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');
  }

  create() {
    // No assets to preload today — the grid is drawn with Phaser primitives,
    // not image files. Go straight into today's puzzle.
    this.scene.start('Oddity');
  }
}
