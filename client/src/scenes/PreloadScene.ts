import Phaser from 'phaser';
import { CHARACTER_COLORS } from '../../../shared/types';
import { TILE_SIZE } from '../config/officeLayout';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create(): void {
    this.generateCharacterSprites();
    this.generateOfficeSprites();
    this.scene.start('OfficeScene');
  }

  private generateCharacterSprites(): void {
    const size = TILE_SIZE - 4;
    for (const char of CHARACTER_COLORS) {
      const key = `char_${char.id}`;
      const rt = this.add.renderTexture(0, 0, TILE_SIZE * 4, TILE_SIZE).setVisible(false);

      for (let frame = 0; frame < 4; frame++) {
        const g = this.make.graphics({ x: 0, y: 0 });
        const bounce = frame % 2 === 0 ? 0 : -2;
        g.fillStyle(char.color);
        g.fillRoundedRect(2, 4 + bounce, size, size - 2, 4);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(4, 6 + bounce, size - 8, 8, 2);
        g.fillStyle(0xffffff);
        g.fillCircle(10, 14 + bounce, 5);
        g.fillCircle(22, 14 + bounce, 5);
        g.fillStyle(0x000000);
        const pupil = frame < 2 ? -1 : 1;
        g.fillCircle(10 + pupil, 14 + bounce, 2);
        g.fillCircle(22 + pupil, 14 + bounce, 2);
        g.fillStyle(char.color, 0.8);
        const foot = frame % 2 === 0 ? 0 : 2;
        g.fillEllipse(8, 28 + foot, 6, 4);
        g.fillEllipse(24, 28 - foot, 6, 4);
        rt.draw(g, frame * TILE_SIZE, 0);
        g.destroy();
      }

      rt.saveTexture(key);
      const tex = this.textures.get(key);
      for (let i = 0; i < 4; i++) tex.add(i, 0, i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
      rt.destroy();

      this.anims.create({ key: `${key}_walk`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${key}_idle`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
    }
  }

  private generateOfficeSprites(): void {
    const sprites = [
      { key: 'tile_floor', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x3a3a5e); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE); g.lineStyle(1, 0x4a4a6e); g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE); } },
      { key: 'tile_desk', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x8b4513); g.fillRoundedRect(2, 8, TILE_SIZE - 4, TILE_SIZE - 10, 2); g.fillStyle(0x2a2a4e); g.fillRect(10, 2, 12, 8); g.fillStyle(0x4a4a8a); g.fillRect(12, 4, 8, 4); } },
      { key: 'tile_chair', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x5a5a7a); g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 10); g.lineStyle(2, 0x6a6a8a); g.strokeCircle(TILE_SIZE / 2, TILE_SIZE / 2, 10); } },
      { key: 'tile_wall', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x4a4a6a); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE); g.lineStyle(2, 0x5a5a7a); g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE); } },
      { key: 'tile_door', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x2ecc71); g.fillRect(4, 0, TILE_SIZE - 8, TILE_SIZE); g.fillStyle(0x27ae60); g.fillRect(6, 4, TILE_SIZE - 12, TILE_SIZE - 8); } },
      { key: 'tile_kitchen', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x3498db); g.fillRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 4); g.fillStyle(0x2980b9); g.fillRect(10, 10, 12, 12); } },
      { key: 'tile_lounge', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x9b59b6); g.fillRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 4); } },
    ];
    for (const { key, fn } of sprites) {
      const g = this.make.graphics({ x: 0, y: 0 });
      fn(g);
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.destroy();
    }
  }
}
