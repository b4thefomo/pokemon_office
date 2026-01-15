export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 19;

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
  { id: 3, gridX: 3, gridY: 11, width: 6, height: 2, name: 'Table 3' }, // Large (10 seats)
  { id: 4, gridX: 17, gridY: 11, width: 3, height: 2, name: 'Table 4' }, // Small (4 seats)
];

// Chair positions (where characters sit) - replaces old DESKS
export interface ChairConfig {
  id: number;
  gridX: number;
  gridY: number;
  tableId: number;
  side: 'top' | 'bottom';
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
  { id: 15, gridX: 3, gridY: 10, tableId: 3, side: 'top' },
  { id: 16, gridX: 4, gridY: 10, tableId: 3, side: 'top' },
  { id: 17, gridX: 5, gridY: 10, tableId: 3, side: 'top' },
  { id: 18, gridX: 6, gridY: 10, tableId: 3, side: 'top' },
  { id: 19, gridX: 7, gridY: 10, tableId: 3, side: 'top' },
  // Table 3 - Bottom side (5 chairs)
  { id: 20, gridX: 3, gridY: 13, tableId: 3, side: 'bottom' },
  { id: 21, gridX: 4, gridY: 13, tableId: 3, side: 'bottom' },
  { id: 22, gridX: 5, gridY: 13, tableId: 3, side: 'bottom' },
  { id: 23, gridX: 6, gridY: 13, tableId: 3, side: 'bottom' },
  { id: 24, gridX: 7, gridY: 13, tableId: 3, side: 'bottom' },

  // Table 4 - Top side (2 chairs)
  { id: 25, gridX: 17, gridY: 10, tableId: 4, side: 'top' },
  { id: 26, gridX: 18, gridY: 10, tableId: 4, side: 'top' },
  // Table 4 - Bottom side (2 chairs)
  { id: 27, gridX: 17, gridY: 13, tableId: 4, side: 'bottom' },
  { id: 28, gridX: 18, gridY: 13, tableId: 4, side: 'bottom' },
];

// Legacy alias for DeskManager compatibility
export interface DeskConfig { id: number; gridX: number; gridY: number; name?: string; }
export const DESKS: DeskConfig[] = CHAIRS.map(c => ({ id: c.id, gridX: c.gridX, gridY: c.gridY }));

// Communal spaces - Kitchen left, Lounge center, Door right
export const COMMUNAL_SPACES = [
  { id: 'kitchen', gridX: 3, gridY: 16, name: 'Kitchen' },
  { id: 'lounge', gridX: 11, gridY: 16, name: 'Lounge' },
];

// Entry point - bottom right
export const ENTRY_POINT = { gridX: 22, gridY: 17 };

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
  return map;
}

export const COLLISION_MAP = generateCollisionMap();

export function gridToPixel(gridX: number, gridY: number) {
  return { x: gridX * TILE_SIZE + TILE_SIZE / 2, y: gridY * TILE_SIZE + TILE_SIZE / 2 };
}

export function pixelToGrid(x: number, y: number) {
  return { gridX: Math.floor(x / TILE_SIZE), gridY: Math.floor(y / TILE_SIZE) };
}
