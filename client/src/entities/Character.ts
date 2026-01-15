import Phaser from 'phaser';
import { PathfindingManager, GridPoint } from '../managers/PathfindingManager';
import { TILE_SIZE, gridToPixel, pixelToGrid } from '../config/officeLayout';
import type { Device } from '../../../shared/types';

export class Character extends Phaser.GameObjects.Sprite {
  public device: Device;
  private pathfinder: PathfindingManager;
  private isWalking = false;
  private nameLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, device: Device, pathfinder: PathfindingManager, x: number, y: number) {
    super(scene, x, y, `char_${device.characterId}`, 0);
    this.device = device;
    this.pathfinder = pathfinder;
    scene.add.existing(this);
    this.setOrigin(0.5).setDepth(10);

    const name = device.displayName || `Device ${device.characterId + 1}`;
    this.nameLabel = scene.add.text(x, y - 20, name, {
      fontSize: '10px', color: '#fff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(11);

    this.play(`char_${device.characterId}_idle`);
  }

  async walkToDesk(gridX: number, gridY: number): Promise<void> {
    if (this.isWalking) return;
    this.isWalking = true;

    const cur = pixelToGrid(this.x, this.y);
    const path = await this.pathfinder.findPath(cur.gridX, cur.gridY, gridX, gridY);
    if (path.length === 0) { this.isWalking = false; return; }

    this.play(`char_${this.device.characterId}_walk`);
    for (let i = 1; i < path.length; i++) {
      const p = path[i];
      this.setFlipX(p.x < path[i - 1].x);
      await this.tweenTo(gridToPixel(p.x, p.y));
    }
    this.play(`char_${this.device.characterId}_idle`);
    this.isWalking = false;
  }

  private tweenTo(pos: { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: [this, this.nameLabel],
        x: pos.x,
        y: (t: any) => t === this ? pos.y : pos.y - 20,
        duration: 150,
        ease: 'Linear',
        onComplete: () => resolve(),
      });
    });
  }

  async leave(doorX: number, doorY: number): Promise<void> {
    while (this.isWalking) await new Promise((r) => setTimeout(r, 100));
    await this.walkToDesk(doorX, doorY);
    await new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: [this, this.nameLabel],
        alpha: 0,
        duration: 300,
        onComplete: () => resolve(),
      });
    });
    this.destroy();
  }

  updateDevice(device: Device): void {
    this.device = device;
    this.nameLabel.setText(device.displayName || `Device ${device.characterId + 1}`);
  }

  destroy(fromScene?: boolean): void {
    this.nameLabel.destroy();
    super.destroy(fromScene);
  }
}
