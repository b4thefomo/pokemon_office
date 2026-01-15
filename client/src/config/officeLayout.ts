export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 19;

export interface DeskConfig { id: number; gridX: number; gridY: number; name?: string; }

export const DESKS: DeskConfig[] = [
  { id: 1, gridX: 3, gridY: 3 }, { id: 2, gridX: 6, gridY: 3 },
  { id: 3, gridX: 9, gridY: 3 }, { id: 4, gridX: 12, gridY: 3 },
  { id: 5, gridX: 15, gridY: 3 }, { id: 6, gridX: 18, gridY: 3 },
  { id: 7, gridX: 3, gridY: 7 }, { id: 8, gridX: 6, gridY: 7 },
  { id: 9, gridX: 9, gridY: 7 }, { id: 10, gridX: 12, gridY: 7 },
  { id: 11, gridX: 15, gridY: 7 }, { id: 12, gridX: 18, gridY: 7 },
  { id: 13, gridX: 3, gridY: 11 }, { id: 14, gridX: 6, gridY: 11 },
  { id: 15, gridX: 9, gridY: 11 }, { id: 16, gridX: 12, gridY: 11 },
  { id: 17, gridX: 15, gridY: 11 }, { id: 18, gridX: 18, gridY: 11 },
  { id: 19, gridX: 3, gridY: 15 }, { id: 20, gridX: 6, gridY: 15 },
  { id: 21, gridX: 9, gridY: 15 }, { id: 22, gridX: 12, gridY: 15 },
];

export const COMMUNAL_SPACES = [
  { id: 'kitchen', gridX: 21, gridY: 3, name: 'Kitchen' },
  { id: 'lounge', gridX: 21, gridY: 15, name: 'Lounge' },
];

export const ENTRY_POINT = { gridX: 12, gridY: 18 };

export function generateCollisionMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = (x === 0 || x === MAP_WIDTH - 1 || y === 0) ? 1 : 0;
    }
  }
  for (const desk of DESKS) {
    if (desk.gridY - 1 >= 0) map[desk.gridY - 1][desk.gridX] = 1;
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
