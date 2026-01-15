// Shared types between server and client

export interface GridPoint {
  x: number;
  y: number;
}

export interface Desk {
  id: number;
  gridX: number;
  gridY: number;
  name?: string;
  occupantId?: string;
}

export interface Device {
  id: string;
  ip: string;
  mac: string;
  characterId: number;
  deskId: number | null;
  displayName?: string;
  online: boolean;
  lastSeen: number;
}

export interface CharacterConfig {
  id: number;
  color: number;
  name: string;
}

export type WSMessageType = 'state:full' | 'device:connected' | 'device:disconnected' | 'device:updated';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}

export interface FullStatePayload {
  devices: Device[];
  desks: Desk[];
}

export interface DeviceEventPayload {
  device: Device;
}

export const CHARACTER_COLORS: CharacterConfig[] = [
  { id: 0, color: 0xe74c3c, name: 'Red' },
  { id: 1, color: 0x3498db, name: 'Blue' },
  { id: 2, color: 0x2ecc71, name: 'Green' },
  { id: 3, color: 0xf39c12, name: 'Orange' },
  { id: 4, color: 0x9b59b6, name: 'Purple' },
  { id: 5, color: 0x1abc9c, name: 'Teal' },
  { id: 6, color: 0xe91e63, name: 'Pink' },
  { id: 7, color: 0x00bcd4, name: 'Cyan' },
  { id: 8, color: 0xcddc39, name: 'Lime' },
  { id: 9, color: 0xff5722, name: 'Deep Orange' },
];
