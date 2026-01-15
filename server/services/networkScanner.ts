import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { config } from '../config.js';
import { deviceRegistry } from './deviceRegistry.js';
import type { Device } from '../../shared/types.js';

const execAsync = promisify(exec);

interface NetworkDevice {
  ip: string;
  mac: string;
}

class NetworkScanner extends EventEmitter {
  private scanInterval: NodeJS.Timeout | null = null;
  private lastKnownDevices: Set<string> = new Set();

  async scan(): Promise<NetworkDevice[]> {
    try {
      const { stdout } = await execAsync('arp -a');
      return this.parseArpOutput(stdout);
    } catch (error) {
      console.error('Network scan failed:', error);
      return [];
    }
  }

  private parseArpOutput(output: string): NetworkDevice[] {
    const devices: NetworkDevice[] = [];
    for (const line of output.split('\n')) {
      const ipMatch = line.match(/\((\d+\.\d+\.\d+\.\d+)\)/);
      const macMatch = line.match(/at\s+([0-9a-fA-F:]+)/);
      if (ipMatch && macMatch) {
        const mac = macMatch[1].toLowerCase();
        if (mac !== 'ff:ff:ff:ff:ff:ff' && !line.includes('incomplete')) {
          devices.push({ ip: ipMatch[1], mac });
        }
      }
    }
    return devices;
  }

  async processScannedDevices(scannedDevices: NetworkDevice[]): Promise<void> {
    const currentMacs = new Set(scannedDevices.map((d) => d.mac));

    for (const scanned of scannedDevices) {
      const wasOnline = this.lastKnownDevices.has(scanned.mac);
      const device = deviceRegistry.registerDevice(scanned.mac, scanned.ip);
      if (!wasOnline) {
        this.emit('device:connected', device);
      }
    }

    for (const mac of this.lastKnownDevices) {
      if (!currentMacs.has(mac)) {
        const device = deviceRegistry.markOffline(mac);
        if (device) this.emit('device:disconnected', device);
      }
    }

    for (const device of deviceRegistry.checkStaleDevices()) {
      this.emit('device:disconnected', device);
    }

    this.lastKnownDevices = currentMacs;
  }

  start(): void {
    console.log(`Starting network scanner (interval: ${config.network.scanInterval}ms)`);
    this.runScan();
    this.scanInterval = setInterval(() => this.runScan(), config.network.scanInterval);
  }

  private async runScan(): Promise<void> {
    console.log('Scanning network...');
    const devices = await this.scan();
    await this.processScannedDevices(devices);
  }

  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  simulateConnect(mac: string, ip: string): Device {
    const device = deviceRegistry.registerDevice(mac, ip);
    this.lastKnownDevices.add(mac);
    this.emit('device:connected', device);
    return device;
  }

  simulateDisconnect(mac: string): Device | undefined {
    const device = deviceRegistry.markOffline(mac);
    this.lastKnownDevices.delete(mac);
    if (device) this.emit('device:disconnected', device);
    return device;
  }
}

export const networkScanner = new NetworkScanner();
