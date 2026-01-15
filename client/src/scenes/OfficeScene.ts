import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { DeskManager } from '../managers/DeskManager';
import { PathfindingManager } from '../managers/PathfindingManager';
import { wsManager } from '../main';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, DESKS, COMMUNAL_SPACES, ENTRY_POINT, gridToPixel } from '../config/officeLayout';
import type { Device, FullStatePayload, DeviceEventPayload } from '../../../shared/types';
import { CHARACTER_COLORS } from '../../../shared/types';

export class OfficeScene extends Phaser.Scene {
  private deskManager!: DeskManager;
  private pathfinder!: PathfindingManager;
  private characters: Map<string, Character> = new Map();
  private deviceList: Device[] = [];

  constructor() { super({ key: 'OfficeScene' }); }

  create(): void {
    this.deskManager = new DeskManager();
    this.pathfinder = new PathfindingManager();
    this.drawOffice();
    this.setupWebSocket();
    this.add.text(400, 16, 'POKEMON OFFICE', { fontSize: '20px', color: '#7fdbff', fontStyle: 'bold' }).setOrigin(0.5, 0);
  }

  private drawOffice(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const pos = gridToPixel(x, y);
        const tile = (x === 0 || x === MAP_WIDTH - 1 || y === 0) ? 'tile_wall' : 'tile_floor';
        this.add.image(pos.x, pos.y, tile).setDepth(0);
      }
    }
    for (const desk of DESKS) {
      const deskPos = gridToPixel(desk.gridX, desk.gridY - 1);
      const chairPos = gridToPixel(desk.gridX, desk.gridY);
      this.add.image(deskPos.x, deskPos.y, 'tile_desk').setDepth(1);
      this.add.image(chairPos.x, chairPos.y, 'tile_chair').setDepth(1);
      this.add.text(deskPos.x, deskPos.y - 12, `${desk.id}`, { fontSize: '8px', color: '#888' }).setOrigin(0.5).setDepth(2);
    }
    for (const space of COMMUNAL_SPACES) {
      const pos = gridToPixel(space.gridX, space.gridY);
      this.add.image(pos.x, pos.y, space.id === 'kitchen' ? 'tile_kitchen' : 'tile_lounge').setDepth(1);
      this.add.text(pos.x, pos.y + 20, space.name, { fontSize: '8px', color: '#aaa' }).setOrigin(0.5, 0).setDepth(2);
      // Add ramen bowl to kitchen
      if (space.id === 'kitchen') {
        this.add.image(pos.x + 32, pos.y, 'ramen').setDepth(2);
      }
    }
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
    this.characters.set(d.id, char);
    char.walkToDesk(pos.gridX, pos.gridY);
  }

  private updateSidebar(): void {
    const list = document.getElementById('device-list');
    if (!list) return;
    list.innerHTML = '';
    for (const d of this.deviceList) {
      const li = document.createElement('li');
      li.className = d.online ? '' : 'offline';
      const color = CHARACTER_COLORS[d.characterId];
      const hex = color ? `#${color.color.toString(16).padStart(6, '0')}` : '#888';
      li.innerHTML = `<span class="device-color" style="background:${hex}"></span><strong>${d.displayName || `Device ${d.characterId + 1}`}</strong><br><small>${d.ip}${d.deskId ? ` • Desk ${d.deskId}` : ''}</small>`;
      list.appendChild(li);
    }
  }

  getLastConnectedDevice(): Device | undefined {
    return this.deviceList.filter((d) => d.online).pop();
  }
}
