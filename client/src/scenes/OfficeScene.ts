import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { DeskManager } from '../managers/DeskManager';
import { PathfindingManager } from '../managers/PathfindingManager';
import { ActivityManager } from '../managers/ActivityManager';
import { wsManager } from '../managers/wsInstance';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TABLES, CHAIRS, COMMUNAL_SPACES, ENTRY_POINT, POOL_TABLE, MEETING_ROOMS, gridToPixel } from '../config/officeLayout';
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
    // Navbar - spans full width at top
    const navbarHeight = TILE_SIZE;
    const navbarY = navbarHeight / 2;
    const navbar = this.add.graphics();
    navbar.fillStyle(0x1a1a2e);
    navbar.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, navbarHeight);
    navbar.lineStyle(2, 0x57FDD0, 0.3);
    navbar.lineBetween(0, navbarHeight, MAP_WIDTH * TILE_SIZE, navbarHeight);
    navbar.setDepth(9);

    // Ramen logo in navbar
    const bowl = this.add.graphics();
    bowl.setPosition(50, navbarY);
    // Bowl (cream ceramic)
    bowl.fillStyle(0xf5f5dc);
    bowl.fillEllipse(0, 4, 24, 12);
    bowl.fillStyle(0xffe4c4);
    bowl.fillEllipse(0, 1, 22, 10);
    // Broth (golden)
    bowl.fillStyle(0xd4a056);
    bowl.fillEllipse(0, 1, 18, 7);
    // Noodles (yellow wavy)
    bowl.lineStyle(1.5, 0xf4d03f);
    bowl.beginPath();
    bowl.moveTo(-6, 0); bowl.lineTo(-4, 2); bowl.lineTo(-6, 4);
    bowl.moveTo(-2, -1); bowl.lineTo(0, 1); bowl.lineTo(-2, 3);
    bowl.moveTo(2, -1); bowl.lineTo(4, 1); bowl.lineTo(2, 3);
    bowl.strokePath();
    // Egg
    bowl.fillStyle(0xffffff);
    bowl.fillEllipse(5, 0, 5, 3);
    bowl.fillStyle(0xffa500);
    bowl.fillCircle(5, 0, 1.5);
    // Chopsticks
    bowl.lineStyle(1.5, 0x8b4513);
    bowl.beginPath();
    bowl.moveTo(7, -6); bowl.lineTo(10, 6);
    bowl.moveTo(9, -6); bowl.lineTo(12, 5);
    bowl.strokePath();
    bowl.setDepth(10);

    // Title text
    const title = this.add.text(80, navbarY, 'RAMEN SPACE', {
      fontSize: '18px',
      color: '#57FDD0',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(10);

    // Pulse animation for logo and title
    this.tweens.add({
      targets: [bowl, title],
      scale: { from: 1, to: 1.05 },
      alpha: { from: 1, to: 0.85 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Digital clock in navbar (right side)
    this.clockText = this.add.text(MAP_WIDTH * TILE_SIZE - 16, navbarY, '', {
      fontSize: '14px',
      color: '#57FDD0',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(10);
    this.updateClock();
    this.time.addEvent({ delay: 1000, callback: this.updateClock, callbackScope: this, loop: true });

    // Collapse icon in bottom right corner
    const collapseX = MAP_WIDTH * TILE_SIZE - 20;
    const collapseY = MAP_HEIGHT * TILE_SIZE - 20;
    const collapseIcon = this.add.graphics();
    collapseIcon.setPosition(collapseX, collapseY);
    // Background circle
    collapseIcon.fillStyle(0x1a1a2e, 0.9);
    collapseIcon.fillCircle(0, 0, 14);
    collapseIcon.lineStyle(2, 0x57FDD0, 0.8);
    collapseIcon.strokeCircle(0, 0, 14);
    // Double chevron (>>)
    collapseIcon.lineStyle(2, 0x57FDD0);
    collapseIcon.beginPath();
    collapseIcon.moveTo(-6, -5); collapseIcon.lineTo(-1, 0); collapseIcon.lineTo(-6, 5);
    collapseIcon.moveTo(1, -5); collapseIcon.lineTo(6, 0); collapseIcon.lineTo(1, 5);
    collapseIcon.strokePath();
    collapseIcon.setDepth(10);
    collapseIcon.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    collapseIcon.on('pointerover', () => collapseIcon.setAlpha(0.7));
    collapseIcon.on('pointerout', () => collapseIcon.setAlpha(1));
  }

  private drawOffice(): void {
    // Draw floor tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const pos = gridToPixel(x, y);
        let tile: string;
        if (x === 0) {
          tile = 'white_brick';  // Left wall is white brick
        } else if (x === MAP_WIDTH - 1) {
          tile = 'glass_wall';   // Right wall is glass panels
        } else if (y === 0) {
          tile = 'tile_wall';    // Top wall is black
        } else {
          tile = 'tile_floor';
        }
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

    // Draw meeting rooms with glass walls, doors, and dividers
    for (let i = 0; i < MEETING_ROOMS.length; i++) {
      const room = MEETING_ROOMS[i];
      const frontWallY = room.gridY + room.height - 1;

      // Front glass wall
      for (let x = room.gridX; x < room.gridX + room.width; x++) {
        const pos = gridToPixel(x, frontWallY);
        const isDoor = room.doors.some(d => d.gridX === x && d.gridY === frontWallY);
        if (isDoor) {
          this.add.image(pos.x, pos.y, 'glass_door').setDepth(1);
        } else {
          this.add.image(pos.x, pos.y, 'meeting_glass').setDepth(1);
        }
      }

      // Side divider between rooms - thin divider with green glass on sides, normal glass on bottom
      if (i < MEETING_ROOMS.length - 1) {
        const dividerX = room.gridX + room.width;
        const topPos = gridToPixel(dividerX, room.gridY);
        // Green glass on left side of thin divider
        this.add.image(topPos.x - 10, topPos.y, 'glass_green').setDepth(1);
        // Thin glass divider in center
        this.add.image(topPos.x, topPos.y, 'glass_divider').setDepth(2);
        // Green glass on right side of thin divider
        this.add.image(topPos.x + 10, topPos.y, 'glass_green').setDepth(1);
        // Bottom half - normal glass panel
        const bottomPos = gridToPixel(dividerX, frontWallY);
        this.add.image(bottomPos.x, bottomPos.y, 'meeting_glass').setDepth(1);
      }

      // Room floor (grass inside)
      for (let y = room.gridY; y < room.gridY + room.height - 1; y++) {
        for (let x = room.gridX; x < room.gridX + room.width; x++) {
          const pos = gridToPixel(x, y);
          this.add.image(pos.x, pos.y, 'grass').setDepth(0);
        }
      }

      // Room label (below the glass wall)
      const labelPos = gridToPixel(room.gridX + room.width / 2, room.gridY + room.height);
      this.add.text(labelPos.x, labelPos.y - 8, room.name, { fontSize: '10px', color: '#7fdbff' })
        .setOrigin(0.5).setDepth(2);
    }

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

    // Draw entrance door (glass panel)
    const doorPos = gridToPixel(ENTRY_POINT.gridX, ENTRY_POINT.gridY);
    this.add.image(doorPos.x, doorPos.y, 'glass_door').setDepth(1);
    this.add.text(doorPos.x, doorPos.y + 20, 'ENTRANCE', { fontSize: '8px', color: '#57FDD0' }).setOrigin(0.5, 0).setDepth(2);

    // Draw TV at end of Table 5 (conference area) - centered on 2-tile wide table
    const tvX = 17 * TILE_SIZE + TILE_SIZE;  // Center of Table 5 (spans tiles 17-18)
    const tvY = 17 * TILE_SIZE + TILE_SIZE / 2;
    this.add.image(tvX, tvY, 'tv').setDepth(1);

    // Draw plants along right border
    const plantPositions = [4, 7, 15, 18];
    for (const y of plantPositions) {
      const plantPos = gridToPixel(23, y);
      this.add.image(plantPos.x, plantPos.y, 'plant').setDepth(1);
    }
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
