import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { ACTIVITY_ZONES, ACTIVITY_CONFIG, ActivityZone } from '../config/officeLayout';

/**
 * ActivityManager - Schedules autonomous character activities
 *
 * Characters periodically leave their desks to visit activity zones
 * (pool table, kitchen, lounge, meeting room, Table 5) and return
 * to their assigned desks afterward.
 */
export class ActivityManager {
  private scene: Phaser.Scene;
  private characters: Map<string, Character>;
  private zoneOccupancy: Map<string, Set<string>> = new Map();  // zoneId -> deviceIds
  private characterCooldowns: Map<string, number> = new Map();   // deviceId -> timestamp when cooldown expires
  private tickTimer: Phaser.Time.TimerEvent | null = null;
  private enabled = false;

  constructor(scene: Phaser.Scene, characters: Map<string, Character>) {
    this.scene = scene;
    this.characters = characters;

    // Initialize zone occupancy tracking
    for (const zone of ACTIVITY_ZONES) {
      this.zoneOccupancy.set(zone.id, new Set());
    }
  }

  /** Start the activity scheduling loop */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    this.tickTimer = this.scene.time.addEvent({
      delay: ACTIVITY_CONFIG.tickIntervalMs,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });

    console.log('[ActivityManager] Started with tick interval:', ACTIVITY_CONFIG.tickIntervalMs);
  }

  /** Stop the activity scheduling loop */
  stop(): void {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.tickTimer) {
      this.tickTimer.destroy();
      this.tickTimer = null;
    }

    console.log('[ActivityManager] Stopped');
  }

  /** Called when a character is added to the scene */
  onCharacterAdded(deviceId: string): void {
    // Set initial cooldown (random time before first activity)
    const cooldownMs = this.randomInRange(
      ACTIVITY_CONFIG.minCooldownMs / 2,  // Shorter initial cooldown
      ACTIVITY_CONFIG.maxCooldownMs / 2
    );
    this.characterCooldowns.set(deviceId, Date.now() + cooldownMs);
  }

  /** Called when a character is removed from the scene */
  onCharacterRemoved(deviceId: string): void {
    this.characterCooldowns.delete(deviceId);

    // Remove from any zone occupancy
    for (const occupants of this.zoneOccupancy.values()) {
      occupants.delete(deviceId);
    }
  }

  /** Main tick - select and dispatch character activities */
  private tick(): void {
    if (!this.enabled) return;

    // Need minimum characters for activities to feel natural
    if (this.characters.size < ACTIVITY_CONFIG.minCharactersForActivity) {
      return;
    }

    // Find eligible characters
    const eligibleCharacters: Character[] = [];
    const now = Date.now();

    for (const [deviceId, character] of this.characters) {
      if (this.isCharacterEligible(character, deviceId, now)) {
        eligibleCharacters.push(character);
      }
    }

    if (eligibleCharacters.length === 0) return;

    // Shuffle and limit simultaneous starts
    this.shuffle(eligibleCharacters);
    const toStart = eligibleCharacters.slice(0, ACTIVITY_CONFIG.maxSimultaneousStarts);

    // Apply probability and start activities
    for (const character of toStart) {
      if (Math.random() < ACTIVITY_CONFIG.activityProbability) {
        this.startCharacterActivity(character);
      }
    }
  }

  /** Check if a character is eligible to start an activity */
  private isCharacterEligible(character: Character, deviceId: string, now: number): boolean {
    // Must be available (at desk, not walking)
    if (!character.isAvailableForActivity()) return false;

    // Check cooldown
    const cooldownExpires = this.characterCooldowns.get(deviceId) || 0;
    if (now < cooldownExpires) return false;

    return true;
  }

  /** Start an activity for a character */
  private async startCharacterActivity(character: Character): Promise<void> {
    const deviceId = character.device.id;

    // Select a zone with available capacity
    const zone = this.selectActivityZone();
    if (!zone) return;

    // Select an available waypoint
    const waypoint = this.selectWaypoint(zone);
    if (!waypoint) return;

    // Mark zone as occupied
    this.zoneOccupancy.get(zone.id)?.add(deviceId);

    console.log(`[ActivityManager] ${character.device.displayName || deviceId} going to ${zone.name}`);

    // Start the activity
    const arrived = await character.startActivity(zone, waypoint);

    if (arrived) {
      // Schedule return to desk after activity duration
      const duration = this.randomInRange(zone.durationRange[0], zone.durationRange[1]);

      character.setActivityTimeout(async () => {
        // Release zone occupancy
        this.zoneOccupancy.get(zone.id)?.delete(deviceId);

        console.log(`[ActivityManager] ${character.device.displayName || deviceId} returning to desk`);

        // Return to desk
        await character.returnToDesk();

        // Set new cooldown
        const cooldown = this.randomInRange(
          ACTIVITY_CONFIG.minCooldownMs,
          ACTIVITY_CONFIG.maxCooldownMs
        );
        this.characterCooldowns.set(deviceId, Date.now() + cooldown);
      }, duration);
    } else {
      // Failed to arrive - release occupancy
      this.zoneOccupancy.get(zone.id)?.delete(deviceId);
    }
  }

  /** Select an activity zone using weighted random selection */
  private selectActivityZone(): ActivityZone | null {
    // Filter to zones with available capacity
    const availableZones = ACTIVITY_ZONES.filter(zone => {
      const occupants = this.zoneOccupancy.get(zone.id)?.size || 0;
      return occupants < zone.capacity;
    });

    if (availableZones.length === 0) return null;

    // Weighted random selection
    const totalWeight = availableZones.reduce((sum, z) => sum + z.weight, 0);
    let random = Math.random() * totalWeight;

    for (const zone of availableZones) {
      random -= zone.weight;
      if (random <= 0) return zone;
    }

    return availableZones[0];
  }

  /** Select an available waypoint in a zone */
  private selectWaypoint(zone: ActivityZone): { x: number; y: number } | null {
    // Get device IDs currently at this zone
    const occupantIds = this.zoneOccupancy.get(zone.id) || new Set();

    // Find waypoints not currently occupied
    // (Simple approach - just pick a random waypoint for now)
    const shuffledWaypoints = [...zone.waypoints];
    this.shuffle(shuffledWaypoints);

    return shuffledWaypoints[0] || null;
  }

  /** Get current occupancy count for a zone */
  getZoneOccupancy(zoneId: string): number {
    return this.zoneOccupancy.get(zoneId)?.size || 0;
  }

  /** Check if a zone has available capacity */
  isZoneAvailable(zoneId: string): boolean {
    const zone = ACTIVITY_ZONES.find(z => z.id === zoneId);
    if (!zone) return false;
    return this.getZoneOccupancy(zoneId) < zone.capacity;
  }

  // Utility methods

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
