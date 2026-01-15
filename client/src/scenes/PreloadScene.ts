import Phaser from 'phaser';
import { TILE_SIZE } from '../config/officeLayout';

// All available character sprites (6 classes × 8 colors = 48 total)
const CHARACTER_CLASSES = ['generic', 'bard', 'soldier', 'scout', 'devout', 'conjurer'];
const CHARACTER_COLORS_LIST = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'pink', 'yellow'];

export const CHARACTER_SPRITES: string[] = [];
for (const cls of CHARACTER_CLASSES) {
  for (const color of CHARACTER_COLORS_LIST) {
    CHARACTER_SPRITES.push(`char_${cls}_${color}`);
  }
}

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload(): void {
    this.load.image('ramen_logo', '/ramen_club_logo.png');
    this.load.image('tile_floor', 'src/assets/sprites/floor.png');
    this.load.image('tile_chair_north', 'src/assets/sprites/chair_north_facing.png');
    this.load.image('tile_chair_south', 'src/assets/sprites/chair_south_facing.png');
    this.load.image('tile_desk', '/single_table.png');

    // Load all 48 character sprites
    for (const sprite of CHARACTER_SPRITES) {
      this.load.image(sprite, `src/assets/sprites/characters/${sprite}.png`);
    }
  }

  create(): void {
    this.generateOfficeSprites();
    this.generateTableSprite();
    this.generateRamenSprite();
    this.scene.start('OfficeScene');
  }

  private generateOfficeSprites(): void {
    const sprites = [
      { key: 'tile_wall', fn: (g: Phaser.GameObjects.Graphics) => { g.fillStyle(0x000000); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE); } },
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

  private generateRamenSprite(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Bowl (white/cream ceramic)
    g.fillStyle(0xf5f5dc);
    g.fillEllipse(16, 22, 28, 14);
    g.fillStyle(0xffe4c4);
    g.fillEllipse(16, 18, 26, 12);

    // Broth (golden/orange)
    g.fillStyle(0xd4a056);
    g.fillEllipse(16, 18, 22, 9);

    // Noodles (wavy yellow lines)
    g.lineStyle(2, 0xf4d03f);
    g.beginPath();
    g.moveTo(8, 16); g.lineTo(10, 19); g.lineTo(8, 22);
    g.moveTo(12, 15); g.lineTo(14, 18); g.lineTo(12, 21);
    g.moveTo(16, 14); g.lineTo(18, 17); g.lineTo(16, 20);
    g.moveTo(20, 15); g.lineTo(22, 18); g.lineTo(20, 21);
    g.strokePath();

    // Egg half (white + orange yolk)
    g.fillStyle(0xffffff);
    g.fillEllipse(22, 16, 6, 4);
    g.fillStyle(0xffa500);
    g.fillCircle(22, 16, 2);

    // Narutomaki (pink swirl fish cake)
    g.fillStyle(0xffc0cb);
    g.fillCircle(10, 17, 3);
    g.lineStyle(1, 0xff69b4);
    g.beginPath();
    g.arc(10, 17, 1.5, 0, Math.PI * 1.5);
    g.strokePath();

    // Green onion garnish
    g.fillStyle(0x228b22);
    g.fillCircle(14, 13, 1.5);
    g.fillCircle(18, 12, 1.5);
    g.fillCircle(16, 14, 1);

    // Chopsticks
    g.lineStyle(2, 0x8b4513);
    g.beginPath();
    g.moveTo(24, 8); g.lineTo(28, 24);
    g.moveTo(26, 8); g.lineTo(30, 22);
    g.strokePath();

    // Steam wisps (simple wavy lines)
    g.lineStyle(1, 0xffffff, 0.6);
    g.beginPath();
    g.moveTo(12, 8); g.lineTo(11, 5); g.lineTo(12, 2);
    g.moveTo(16, 7); g.lineTo(17, 4); g.lineTo(16, 1);
    g.moveTo(20, 8); g.lineTo(21, 5); g.lineTo(20, 2);
    g.strokePath();

    g.generateTexture('ramen', 32, 32);
    g.destroy();
  }

  private generateTableSprite(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Brown wooden table surface
    g.fillStyle(0x8b4513);
    g.fillRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 2);
    // Wood grain lines
    g.lineStyle(1, 0x6b3503, 0.3);
    g.lineBetween(4, 8, TILE_SIZE - 4, 8);
    g.lineBetween(4, 16, TILE_SIZE - 4, 16);
    g.lineBetween(4, 24, TILE_SIZE - 4, 24);
    g.generateTexture('tile_table', TILE_SIZE, TILE_SIZE);
    g.destroy();
  }
}
