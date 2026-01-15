export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 21;

// Table definitions
export interface TableConfig {
  id: number;
  gridX: number;      // Left edge X
  gridY: number;      // Top edge Y
  width: number;      // Tiles wide
  height: number;     // Tiles tall
  name: string;
}

export const TABLES: TableConfig[] = [
  { id: 1, gridX: 3, gridY: 4, width: 6, height: 2, name: 'Table 1' },   // Large (10 seats)
  { id: 2, gridX: 17, gridY: 4, width: 3, height: 2, name: 'Table 2' }, // Small (4 seats)
  { id: 3, gridX: 3, gridY: 9, width: 6, height: 2, name: 'Table 3' },  // Large (10 seats)
  { id: 4, gridX: 17, gridY: 9, width: 3, height: 2, name: 'Table 4' }, // Small (4 seats)
  { id: 5, gridX: 17, gridY: 13, width: 2, height: 4, name: 'Table 5' }, // Long vertical (below Table 4, near exit)
];

// Chair positions (where characters sit) - replaces old DESKS
export interface ChairConfig {
  id: number;
  gridX: number;
  gridY: number;
  tableId: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export const CHAIRS: ChairConfig[] = [
  // Table 1 - Top side (5 chairs)
  { id: 1, gridX: 3, gridY: 3, tableId: 1, side: 'top' },
  { id: 2, gridX: 4, gridY: 3, tableId: 1, side: 'top' },
  { id: 3, gridX: 5, gridY: 3, tableId: 1, side: 'top' },
  { id: 4, gridX: 6, gridY: 3, tableId: 1, side: 'top' },
  { id: 5, gridX: 7, gridY: 3, tableId: 1, side: 'top' },
  // Table 1 - Bottom side (5 chairs)
  { id: 6, gridX: 3, gridY: 6, tableId: 1, side: 'bottom' },
  { id: 7, gridX: 4, gridY: 6, tableId: 1, side: 'bottom' },
  { id: 8, gridX: 5, gridY: 6, tableId: 1, side: 'bottom' },
  { id: 9, gridX: 6, gridY: 6, tableId: 1, side: 'bottom' },
  { id: 10, gridX: 7, gridY: 6, tableId: 1, side: 'bottom' },

  // Table 2 - Top side (2 chairs)
  { id: 11, gridX: 17, gridY: 3, tableId: 2, side: 'top' },
  { id: 12, gridX: 18, gridY: 3, tableId: 2, side: 'top' },
  // Table 2 - Bottom side (2 chairs)
  { id: 13, gridX: 17, gridY: 6, tableId: 2, side: 'bottom' },
  { id: 14, gridX: 18, gridY: 6, tableId: 2, side: 'bottom' },

  // Table 3 - Top side (5 chairs)
  { id: 15, gridX: 3, gridY: 8, tableId: 3, side: 'top' },
  { id: 16, gridX: 4, gridY: 8, tableId: 3, side: 'top' },
  { id: 17, gridX: 5, gridY: 8, tableId: 3, side: 'top' },
  { id: 18, gridX: 6, gridY: 8, tableId: 3, side: 'top' },
  { id: 19, gridX: 7, gridY: 8, tableId: 3, side: 'top' },
  // Table 3 - Bottom side (5 chairs)
  { id: 20, gridX: 3, gridY: 11, tableId: 3, side: 'bottom' },
  { id: 21, gridX: 4, gridY: 11, tableId: 3, side: 'bottom' },
  { id: 22, gridX: 5, gridY: 11, tableId: 3, side: 'bottom' },
  { id: 23, gridX: 6, gridY: 11, tableId: 3, side: 'bottom' },
  { id: 24, gridX: 7, gridY: 11, tableId: 3, side: 'bottom' },

  // Table 4 - Top side (2 chairs)
  { id: 25, gridX: 17, gridY: 8, tableId: 4, side: 'top' },
  { id: 26, gridX: 18, gridY: 8, tableId: 4, side: 'top' },
  // Table 4 - Bottom side (2 chairs)
  { id: 27, gridX: 17, gridY: 11, tableId: 4, side: 'bottom' },
  { id: 28, gridX: 18, gridY: 11, tableId: 4, side: 'bottom' },

  // Table 5 - Left side (4 chairs)
  { id: 29, gridX: 16, gridY: 13, tableId: 5, side: 'left' },
  { id: 30, gridX: 16, gridY: 14, tableId: 5, side: 'left' },
  { id: 31, gridX: 16, gridY: 15, tableId: 5, side: 'left' },
  { id: 32, gridX: 16, gridY: 16, tableId: 5, side: 'left' },
  // Table 5 - Right side (4 chairs)
  { id: 33, gridX: 19, gridY: 13, tableId: 5, side: 'right' },
  { id: 34, gridX: 19, gridY: 14, tableId: 5, side: 'right' },
  { id: 35, gridX: 19, gridY: 15, tableId: 5, side: 'right' },
  { id: 36, gridX: 19, gridY: 16, tableId: 5, side: 'right' },
];

// Legacy alias for DeskManager compatibility
export interface DeskConfig { id: number; gridX: number; gridY: number; name?: string; }
export const DESKS: DeskConfig[] = CHAIRS.map(c => ({ id: c.id, gridX: c.gridX, gridY: c.gridY }));

// Pool table - between Table 3 and Kitchen (96x112 pixels = 3x3.5 tiles)
export const POOL_TABLE = { gridX: 4, gridY: 13, width: 3, height: 4 };

// Meeting room - glass-walled room at the back (top) of the office
export interface MeetingRoomConfig {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  doors: { gridX: number; gridY: number }[];
}

export const MEETING_ROOM: MeetingRoomConfig = {
  id: 'meeting-room-1',
  name: 'Meeting Room',
  gridX: 1,
  gridY: 1,
  width: 23,  // Full width minus side walls
  height: 2,
  doors: [
    { gridX: 5, gridY: 2 },   // Door near Table 1
    { gridX: 18, gridY: 2 },  // Door near Table 2
  ],
};

// Communal spaces - Kitchen left, Lounge center, Door right
export const COMMUNAL_SPACES = [
  { id: 'kitchen', gridX: 3, gridY: 19, name: 'Kitchen' },
  { id: 'lounge', gridX: 11, gridY: 19, name: 'Lounge' },
];

// Entry point - bottom right
export const ENTRY_POINT = { gridX: 22, gridY: 17 };

// Activity zones - destinations for autonomous character movement
export interface ActivityZone {
  id: string;
  name: string;
  waypoints: { x: number; y: number }[];  // Standing spots around the activity
  capacity: number;                        // Max characters at once
  durationRange: [number, number];         // [minMs, maxMs] time spent at activity
  weight: number;                          // Probability weight for selection
}

export const ACTIVITY_ZONES: ActivityZone[] = [
  {
    id: 'pool_table',
    name: 'Pool Table',
    waypoints: [
      { x: 3, y: 13 }, { x: 3, y: 15 },   // Left side
      { x: 7, y: 13 }, { x: 7, y: 15 },   // Right side
      { x: 5, y: 12 }, { x: 5, y: 17 },   // Top/bottom
    ],
    capacity: 4,
    durationRange: [15000, 45000],  // 15-45 seconds
    weight: 3,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    waypoints: [
      { x: 2, y: 19 }, { x: 4, y: 19 },
      { x: 3, y: 18 }, { x: 2, y: 18 },
    ],
    capacity: 3,
    durationRange: [10000, 30000],  // 10-30 seconds (coffee break)
    weight: 4,  // Most popular
  },
  {
    id: 'lounge',
    name: 'Lounge',
    waypoints: [
      { x: 10, y: 19 }, { x: 12, y: 19 },
      { x: 11, y: 18 }, { x: 10, y: 18 },
    ],
    capacity: 3,
    durationRange: [20000, 60000],  // 20-60 seconds (longer break)
    weight: 2,
  },
  {
    id: 'meeting_room',
    name: 'Meeting Room',
    waypoints: [
      { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },     // Left side inside
      { x: 17, y: 1 }, { x: 18, y: 1 }, { x: 19, y: 1 },  // Right side inside
    ],
    capacity: 6,
    durationRange: [30000, 90000],  // 30-90 seconds (meetings take longer)
    weight: 1,  // Less frequent
  },
  {
    id: 'table_5_social',
    name: 'Table 5 Area',
    waypoints: [
      { x: 15, y: 13 }, { x: 15, y: 14 }, { x: 15, y: 15 }, { x: 15, y: 16 },  // Left side
      { x: 20, y: 13 }, { x: 20, y: 14 }, { x: 20, y: 15 }, { x: 20, y: 16 },  // Right side
      { x: 16, y: 17 }, { x: 19, y: 17 },  // Bottom area
    ],
    capacity: 10,
    durationRange: [15000, 40000],  // 15-40 seconds
    weight: 2,
  },
];

// Activity system configuration
export const ACTIVITY_CONFIG = {
  tickIntervalMs: 12000,        // Check every 12 seconds
  minCooldownMs: 120000,        // 2 min minimum between activities
  maxCooldownMs: 300000,        // 5 min maximum between activities
  activityProbability: 0.15,    // 15% chance per tick when eligible
  maxSimultaneousStarts: 2,     // Prevent mass exodus
  minCharactersForActivity: 3,  // Need 3+ people for activities to start
};

export function generateCollisionMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Walls on edges
      map[y][x] = (x === 0 || x === MAP_WIDTH - 1 || y === 0) ? 1 : 0;
    }
  }
  // Block table areas
  for (const table of TABLES) {
    for (let ty = table.gridY; ty < table.gridY + table.height; ty++) {
      for (let tx = table.gridX; tx < table.gridX + table.width; tx++) {
        if (ty < MAP_HEIGHT && tx < MAP_WIDTH) map[ty][tx] = 1;
      }
    }
  }
  // Block pool table area
  for (let ty = POOL_TABLE.gridY; ty < POOL_TABLE.gridY + POOL_TABLE.height; ty++) {
    for (let tx = POOL_TABLE.gridX; tx < POOL_TABLE.gridX + POOL_TABLE.width; tx++) {
      if (ty < MAP_HEIGHT && tx < MAP_WIDTH) map[ty][tx] = 1;
    }
  }
  // Block meeting room front glass wall (except doors)
  const frontWallY = MEETING_ROOM.gridY + MEETING_ROOM.height - 1;
  for (let x = MEETING_ROOM.gridX; x < MEETING_ROOM.gridX + MEETING_ROOM.width; x++) {
    const isDoor = MEETING_ROOM.doors.some(d => d.gridX === x && d.gridY === frontWallY);
    if (!isDoor) {
      map[frontWallY][x] = 1;
    }
  }
  return map;
}

export const COLLISION_MAP = generateCollisionMap();

export function gridToPixel(gridX: number, gridY: number) {
  return { x: gridX * TILE_SIZE + TILE_SIZE / 2, y: gridY * TILE_SIZE + TILE_SIZE / 2 };
}

export function pixelToGrid(x: number, y: number) {
  return { gridX: Math.floor(x / TILE_SIZE), gridY: Math.floor(y / TILE_SIZE) };
}
