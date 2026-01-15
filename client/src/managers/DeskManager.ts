import { DESKS, DeskConfig, gridToPixel } from '../config/officeLayout';
import type { Device } from '../../../shared/types';

export interface DeskState extends DeskConfig { occupied: boolean; occupantId?: string; }

export class DeskManager {
  private desks: Map<number, DeskState> = new Map();

  constructor() {
    for (const desk of DESKS) {
      this.desks.set(desk.id, { ...desk, occupied: false });
    }
  }

  getDesk(id: number) { return this.desks.get(id); }
  getAllDesks() { return Array.from(this.desks.values()); }

  getDeskGridPosition(id: number) {
    const desk = this.desks.get(id);
    return desk ? { gridX: desk.gridX, gridY: desk.gridY } : null;
  }

  occupyDesk(deskId: number, deviceId: string): boolean {
    const desk = this.desks.get(deskId);
    if (!desk || desk.occupied) return false;
    desk.occupied = true;
    desk.occupantId = deviceId;
    return true;
  }

  releaseDesk(deskId: number): boolean {
    const desk = this.desks.get(deskId);
    if (!desk || !desk.occupied) return false;
    desk.occupied = false;
    desk.occupantId = undefined;
    return true;
  }

  syncWithDevices(devices: Device[]): void {
    for (const desk of this.desks.values()) {
      desk.occupied = false;
      desk.occupantId = undefined;
    }
    for (const device of devices) {
      if (device.online && device.deskId !== null) {
        this.occupyDesk(device.deskId, device.id);
      }
    }
  }
}
