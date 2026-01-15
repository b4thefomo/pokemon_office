import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { Device } from '../../shared/types.js';
import { config } from '../config.js';
import { lookupMacVendor } from './macVendor.js';

interface DeviceStore {
  devices: Record<string, Device>;
  nextCharacterId: number;
}

class DeviceRegistry {
  private store: DeviceStore = { devices: {}, nextCharacterId: 0 };
  private filePath: string;

  constructor() {
    this.filePath = config.persistence.dataPath;
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, 'utf-8');
        this.store = JSON.parse(data);
        console.log(`Loaded ${Object.keys(this.store.devices).length} devices`);
      }
    } catch (error) {
      console.error('Failed to load device registry:', error);
    }
  }

  private save(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.error('Failed to save device registry:', error);
    }
  }

  getDevice(mac: string): Device | undefined {
    return this.store.devices[mac];
  }

  getAllDevices(): Device[] {
    return Object.values(this.store.devices);
  }

  getOnlineDevices(): Device[] {
    return this.getAllDevices().filter((d) => d.online);
  }

  registerDevice(mac: string, ip: string): Device {
    let device = this.store.devices[mac];
    const vendorInfo = lookupMacVendor(mac);

    if (!device) {
      device = {
        id: mac,
        ip,
        mac,
        characterId: this.store.nextCharacterId % 10,
        deskId: null,
        online: true,
        lastSeen: Date.now(),
        deviceType: vendorInfo.type,
        vendor: vendorInfo.vendor,
      };
      this.store.nextCharacterId++;
      this.store.devices[mac] = device;
      console.log(`New device: ${mac} -> ${vendorInfo.vendor} (${vendorInfo.type})`);
    } else {
      device.ip = ip;
      device.online = true;
      device.lastSeen = Date.now();
      // Update vendor info if not set
      if (!device.deviceType) {
        device.deviceType = vendorInfo.type;
        device.vendor = vendorInfo.vendor;
      }
    }
    this.save();
    return device;
  }

  markOffline(mac: string): Device | undefined {
    const device = this.store.devices[mac];
    if (device) {
      device.online = false;
      this.save();
    }
    return device;
  }

  assignDesk(mac: string, deskId: number): Device | undefined {
    const device = this.store.devices[mac];
    if (device) {
      device.deskId = deskId;
      this.save();
    }
    return device;
  }

  setDisplayName(mac: string, name: string): Device | undefined {
    const device = this.store.devices[mac];
    if (device) {
      device.displayName = name;
      this.save();
    }
    return device;
  }

  checkStaleDevices(): Device[] {
    const now = Date.now();
    const stale: Device[] = [];
    for (const device of Object.values(this.store.devices)) {
      if (device.online && now - device.lastSeen > config.network.offlineThreshold) {
        device.online = false;
        stale.push(device);
      }
    }
    if (stale.length > 0) this.save();
    return stale;
  }
}

export const deviceRegistry = new DeviceRegistry();
