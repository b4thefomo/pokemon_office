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
        const ip = ipMatch[1];
        const mac = macMatch[1].toLowerCase();

        // Skip invalid entries
        if (mac === 'ff:ff:ff:ff:ff:ff' || line.includes('incomplete')) continue;

        // Skip multicast IPs (224.x.x.x, 239.x.x.x)
        if (ip.startsWith('224.') || ip.startsWith('239.')) continue;

        // Skip randomized MAC addresses (phones use these)
        // Randomized MACs have bit 1 of first octet set (x2, x6, xA, xE as second char)
        if (this.isRandomizedMac(mac)) continue;

        devices.push({ ip, mac });
      }
    }
    return devices;
  }

  // Phones typically use randomized/private MAC addresses
  // These have the "locally administered" bit set (second hex char is 2, 6, A, or E)
  private isRandomizedMac(mac: string): boolean {
    const firstOctet = mac.split(':')[0];
    if (firstOctet.length < 2) return false;
    const secondChar = firstOctet[1].toLowerCase();
    return ['2', '6', 'a', 'e'].includes(secondChar);
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
    // Initialize lastKnownDevices with currently online devices from storage
    for (const device of deviceRegistry.getOnlineDevices()) {
      this.lastKnownDevices.add(device.mac);
    }
    console.log(`Initialized with ${this.lastKnownDevices.size} known devices`);
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
