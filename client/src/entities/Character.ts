import Phaser from 'phaser';
import { PathfindingManager, GridPoint } from '../managers/PathfindingManager';
import { TILE_SIZE, gridToPixel, pixelToGrid, ActivityZone } from '../config/officeLayout';
import type { Device } from '../../../shared/types';
import { CHARACTER_SPRITES } from '../scenes/PreloadScene';

// Character activity state
export type CharacterState = 'at_desk' | 'walking_to_activity' | 'at_activity' | 'returning_to_desk';

// Get a consistent character sprite for a device based on MAC hash
function getCharacterSprite(device: Device): string {
  // Simple hash of MAC address to get consistent character
  let hash = 0;
  const mac = device.mac || device.id;
  for (let i = 0; i < mac.length; i++) {
    hash = ((hash << 5) - hash) + mac.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % CHARACTER_SPRITES.length;
  return CHARACTER_SPRITES[index];
}

export class Character extends Phaser.GameObjects.Sprite {
  public device: Device;
  private pathfinder: PathfindingManager;
  private isWalking = false;
  private nameLabel: Phaser.GameObjects.Text;
  private spriteKey: string;
  private bounceTween: Phaser.Tweens.Tween | null = null;

  // Activity state
  private activityState: CharacterState = 'at_desk';
  private assignedDeskPosition: { gridX: number; gridY: number } | null = null;
  private currentActivityZone: string | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(scene: Phaser.Scene, device: Device, pathfinder: PathfindingManager, x: number, y: number) {
    const spriteKey = getCharacterSprite(device);
    super(scene, x, y, spriteKey);
    this.spriteKey = spriteKey;
    this.device = device;
    this.pathfinder = pathfinder;
    scene.add.existing(this);
    this.setOrigin(0.5).setDepth(10).setScale(2); // Scale up 16x16 sprites

    const name = device.displayName || `Device ${device.characterId + 1}`;
    this.nameLabel = scene.add.text(x, y - 24, name, {
      fontSize: '10px', color: '#fff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(11);

    // Start idle bounce animation
    this.startIdleBounce();
  }

  private startIdleBounce(): void {
    if (this.bounceTween) this.bounceTween.stop();
    this.bounceTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 2,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopIdleBounce(): void {
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }
  }

  async walkToDesk(gridX: number, gridY: number): Promise<void> {
    if (this.isWalking) return;
    this.isWalking = true;
    this.stopIdleBounce();

    const cur = pixelToGrid(this.x, this.y);
    const path = await this.pathfinder.findPath(cur.gridX, cur.gridY, gridX, gridY);
    if (path.length === 0) { this.isWalking = false; this.startIdleBounce(); return; }

    for (let i = 1; i < path.length; i++) {
      const p = path[i];
      this.setFlipX(p.x < path[i - 1].x);
      await this.tweenTo(gridToPixel(p.x, p.y));
    }
    this.startIdleBounce();
    this.isWalking = false;
  }

  private tweenTo(pos: { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x: pos.x,
        y: pos.y,
        duration: 150,
        ease: 'Linear',
        onUpdate: () => {
          this.nameLabel.setPosition(this.x, this.y - 24);
        },
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
    this.cancelActivity();
    this.stopIdleBounce();
    this.nameLabel.destroy();
    super.destroy(fromScene);
  }

  // Activity system methods

  /** Set the desk position this character returns to after activities */
  setAssignedDesk(gridX: number, gridY: number): void {
    this.assignedDeskPosition = { gridX, gridY };
  }

  /** Get current activity state */
  getActivityState(): CharacterState {
    return this.activityState;
  }

  /** Get current activity zone ID */
  getCurrentActivityZone(): string | null {
    return this.currentActivityZone;
  }

  /** Check if character is available to start a new activity */
  isAvailableForActivity(): boolean {
    return !this.isWalking && this.activityState === 'at_desk' && this.assignedDeskPosition !== null;
  }

  /** Start walking to an activity zone */
  async startActivity(zone: ActivityZone, waypoint: { x: number; y: number }): Promise<boolean> {
    if (!this.isAvailableForActivity()) return false;

    this.activityState = 'walking_to_activity';
    this.currentActivityZone = zone.id;

    // Walk to the waypoint
    await this.walkToDesk(waypoint.x, waypoint.y);

    // If we're still in walking_to_activity state (not cancelled), transition to at_activity
    if (this.activityState === 'walking_to_activity') {
      this.activityState = 'at_activity';
      return true;
    }
    return false;
  }

  /** Return to assigned desk after activity */
  async returnToDesk(): Promise<void> {
    if (!this.assignedDeskPosition) return;
    if (this.activityState !== 'at_activity') return;

    this.activityState = 'returning_to_desk';
    this.currentActivityZone = null;

    await this.walkToDesk(this.assignedDeskPosition.gridX, this.assignedDeskPosition.gridY);

    // If we're still returning (not cancelled), transition back to at_desk
    if (this.activityState === 'returning_to_desk') {
      this.activityState = 'at_desk';
    }
  }

  /** Cancel any ongoing activity (used on disconnect) */
  cancelActivity(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    this.currentActivityZone = null;
    // Don't reset state here - let the leave() method handle it
  }

  /** Set an activity timeout (used by ActivityManager) */
  setActivityTimeout(callback: () => void, duration: number): void {
    this.activityTimeout = setTimeout(callback, duration);
  }
}
