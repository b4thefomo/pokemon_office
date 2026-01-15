import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { DeskManager } from '../managers/DeskManager';
import { PathfindingManager } from '../managers/PathfindingManager';
import { ActivityManager } from '../managers/ActivityManager';
import { wsManager } from '../managers/wsInstance';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TABLES, CHAIRS, COMMUNAL_SPACES, ENTRY_POINT, POOL_TABLE, MEETING_ROOM, gridToPixel } from '../config/officeLayout';
import type { Device, FullStatePayload, DeviceEventPayload } from '../../../shared/types';
import { CHARACTER_COLORS } from '../../../shared/types';

export class OfficeScene extends Phaser.Scene {
  private deskManager!: DeskManager;
  private pathfinder!: PathfindingManager;
  private activityManager!: ActivityManager;
  private characters: Map<string, Character> = new Map();
  private deviceList: Device[] = [];
  private clockText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'OfficeScene' }); }

  create(): void {
    this.deskManager = new DeskManager();
    this.pathfinder = new PathfindingManager();
    this.activityManager = new ActivityManager(this, this.characters);
    this.drawOffice();
    this.setupWebSocket();
    this.activityManager.start();
    // Title with ramen logo
    this.add.image(320, 26, 'ramen_logo').setDepth(10);
    this.add.text(420, 16, 'RAMEN SPACE', { fontSize: '20px', color: '#57FDD0', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10);

    // Digital clock in top-right corner
    this.clockText = this.add.text(775, 16, '', {
      fontSize: '16px',
      color: '#57FDD0',
      fontStyle: 'bold',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 2 }
    }).setOrigin(1, 0).setDepth(10);
    this.updateClock();
    this.time.addEvent({ delay: 1000, callback: this.updateClock, callbackScope: this, loop: true });
  }

  private drawOffice(): void {
    // Draw floor tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const pos = gridToPixel(x, y);
        const tile = (x === 0 || x === MAP_WIDTH - 1 || y === 0) ? 'tile_wall' : 'tile_floor';
        this.add.image(pos.x, pos.y, tile).setDepth(0);
      }
    }

    // Draw tables
    for (const table of TABLES) {
      // Table 5 uses a custom long vertical sprite
      if (table.id === 5) {
        const pos = gridToPixel(table.gridX, table.gridY);
        // Sprite is 64x128 (2x4 tiles), position at center
        this.add.image(pos.x + 16, pos.y + 48, 'long_table_vertical').setDepth(1);
      } else {
        for (let ty = 0; ty < table.height; ty++) {
          for (let tx = 0; tx < table.width; tx++) {
            const pos = gridToPixel(table.gridX + tx, table.gridY + ty);
            this.add.image(pos.x, pos.y, 'tile_desk').setDepth(1);
          }
        }
      }
      // Table label
      const labelPos = gridToPixel(table.gridX + table.width / 2 - 0.5, table.gridY + table.height / 2 - 0.5);
      this.add.text(labelPos.x, labelPos.y, table.name, { fontSize: '10px', color: '#fff' })
        .setOrigin(0.5).setDepth(2);
    }

    // Draw chairs at each position
    for (const chair of CHAIRS) {
      const pos = gridToPixel(chair.gridX, chair.gridY);
      let chairSprite: string;
      switch (chair.side) {
        case 'top': chairSprite = 'tile_chair_south'; break;
        case 'bottom': chairSprite = 'tile_chair_north'; break;
        case 'left': chairSprite = 'tile_chair_east'; break;
        case 'right': chairSprite = 'tile_chair_west'; break;
      }
      this.add.image(pos.x, pos.y, chairSprite).setDepth(1);
    }

    // Draw pool table (96x112 pixels)
    const poolPos = gridToPixel(POOL_TABLE.gridX, POOL_TABLE.gridY);
    this.add.image(poolPos.x + 32, poolPos.y + 40, 'pool_table').setDepth(1);
    this.add.text(poolPos.x + 48, poolPos.y + 100, 'Pool', { fontSize: '8px', color: '#2ecc71' }).setOrigin(0.5, 0).setDepth(2);

    // Draw meeting room glass walls and doors
    const frontWallY = MEETING_ROOM.gridY + MEETING_ROOM.height - 1;
    for (let x = MEETING_ROOM.gridX; x < MEETING_ROOM.gridX + MEETING_ROOM.width; x++) {
      const pos = gridToPixel(x, frontWallY);
      const isDoor = MEETING_ROOM.doors.some(d => d.gridX === x && d.gridY === frontWallY);
      if (isDoor) {
        this.add.image(pos.x, pos.y, 'glass_door').setDepth(1);
      } else {
        this.add.image(pos.x, pos.y, 'glass_wall').setDepth(1);
      }
    }
    // Meeting room floor (inside the room)
    for (let y = MEETING_ROOM.gridY; y < MEETING_ROOM.gridY + MEETING_ROOM.height - 1; y++) {
      for (let x = MEETING_ROOM.gridX; x < MEETING_ROOM.gridX + MEETING_ROOM.width; x++) {
        const pos = gridToPixel(x, y);
        this.add.image(pos.x, pos.y, 'tile_floor').setDepth(0);
      }
    }
    // Meeting room label
    const meetingLabelPos = gridToPixel(MEETING_ROOM.gridX + MEETING_ROOM.width / 2, MEETING_ROOM.gridY);
    this.add.text(meetingLabelPos.x, meetingLabelPos.y, MEETING_ROOM.name, { fontSize: '10px', color: '#7fdbff' })
      .setOrigin(0.5).setDepth(2);

    // Draw communal spaces
    for (const space of COMMUNAL_SPACES) {
      const pos = gridToPixel(space.gridX, space.gridY);
      this.add.image(pos.x, pos.y, space.id === 'kitchen' ? 'tile_kitchen' : 'tile_lounge').setDepth(1);
      this.add.text(pos.x, pos.y + 20, space.name, { fontSize: '8px', color: '#aaa' }).setOrigin(0.5, 0).setDepth(2);
      // Add ramen bowl to kitchen
      if (space.id === 'kitchen') {
        this.add.image(pos.x + 32, pos.y, 'ramen_logo').setDepth(2);
      }
    }

    // Draw door
    const doorPos = gridToPixel(ENTRY_POINT.gridX, ENTRY_POINT.gridY);
    this.add.image(doorPos.x, doorPos.y, 'tile_door').setDepth(1);
    this.add.text(doorPos.x, doorPos.y + 20, 'ENTRANCE', { fontSize: '8px', color: '#2ecc71' }).setOrigin(0.5, 0).setDepth(2);
  }

  private setupWebSocket(): void {
    wsManager.onFullState((p: FullStatePayload) => {
      this.deviceList = p.devices;
      this.deskManager.syncWithDevices(p.devices);
      // Stagger character entries on refresh for a nice effect
      const onlineDevices = p.devices.filter(d => d.online && d.deskId !== null);
      onlineDevices.forEach((d, i) => {
        setTimeout(() => this.spawnWalking(d), i * 300); // 300ms stagger
      });
      this.updateSidebar();
    });

    wsManager.onDeviceConnected((p: DeviceEventPayload) => {
      const d = p.device;
      const idx = this.deviceList.findIndex((x) => x.id === d.id);
      if (idx >= 0) this.deviceList[idx] = d; else this.deviceList.push(d);
      if (d.deskId !== null) {
        this.spawnWalking(d);
        this.deskManager.occupyDesk(d.deskId, d.id);
      }
      this.updateSidebar();
    });

    wsManager.onDeviceDisconnected((p: DeviceEventPayload) => {
      const d = p.device;
      const idx = this.deviceList.findIndex((x) => x.id === d.id);
      if (idx >= 0) this.deviceList[idx] = d;
      const char = this.characters.get(d.id);
      if (char) {
        this.activityManager.onCharacterRemoved(d.id);  // Cleanup from activity manager
        if (d.deskId !== null) this.deskManager.releaseDesk(d.deskId);
        char.leave(ENTRY_POINT.gridX, ENTRY_POINT.gridY).then(() => this.characters.delete(d.id));
      }
      this.updateSidebar();
    });

    wsManager.onDeviceUpdated((p: DeviceEventPayload) => {
      const d = p.device;
      const idx = this.deviceList.findIndex((x) => x.id === d.id);
      if (idx >= 0) this.deviceList[idx] = d;
      this.characters.get(d.id)?.updateDevice(d);
      this.updateSidebar();
    });

    // Request full state after handlers are registered (with small delay for WS to be ready)
    setTimeout(() => wsManager.requestFullState(), 500);
  }

  private spawnAtDesk(d: Device): void {
    if (d.deskId === null) return;
    const pos = this.deskManager.getDeskGridPosition(d.deskId);
    if (!pos) return;
    const px = gridToPixel(pos.gridX, pos.gridY);
    this.characters.set(d.id, new Character(this, d, this.pathfinder, px.x, px.y));
  }

  private spawnWalking(d: Device): void {
    if (d.deskId === null) return;
    const pos = this.deskManager.getDeskGridPosition(d.deskId);
    if (!pos) return;
    const door = gridToPixel(ENTRY_POINT.gridX, ENTRY_POINT.gridY);
    const char = new Character(this, d, this.pathfinder, door.x, door.y);
    char.setAssignedDesk(pos.gridX, pos.gridY);  // Set desk for activity system
    this.characters.set(d.id, char);
    this.activityManager.onCharacterAdded(d.id);  // Register with activity manager
    char.walkToDesk(pos.gridX, pos.gridY);
  }

  private getDeviceEmoji(type?: string): string {
    switch (type) {
      case 'laptop': return '💻';
      case 'phone': return '📱';
      case 'tablet': return '📱';
      case 'router': return '📡';
      default: return '❓';
    }
  }

  private updateSidebar(): void {
    const list = document.getElementById('device-list');
    const countBadge = document.getElementById('device-count');
    if (!list) return;
    list.innerHTML = '';
    // Only show online devices
    const onlineDevices = this.deviceList.filter(d => d.online);
    // Update count badge
    if (countBadge) countBadge.textContent = String(onlineDevices.length);
    for (const d of onlineDevices) {
      const li = document.createElement('li');
      const color = CHARACTER_COLORS[d.characterId];
      const hex = color ? `#${color.color.toString(16).padStart(6, '0')}` : '#888';
      const emoji = this.getDeviceEmoji(d.deviceType);
      const vendor = d.vendor || 'Unknown';
      li.innerHTML = `<span class="device-color" style="background:${hex}"></span>${emoji} <strong>${d.displayName || `Device ${d.characterId + 1}`}</strong><br><small>${vendor} • ${d.ip}${d.deskId ? ` • Desk ${d.deskId}` : ''}</small>`;
      list.appendChild(li);
    }
  }

  getLastConnectedDevice(): Device | undefined {
    return this.deviceList.filter((d) => d.online).pop();
  }

  private updateClock(): void {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.clockText.setText(time);
  }
}
