import EasyStar from 'easystarjs';
import { COLLISION_MAP } from '../config/officeLayout';

export interface GridPoint { x: number; y: number; }

export class PathfindingManager {
  private easystar: EasyStar.js;

  constructor() {
    this.easystar = new EasyStar.js();
    this.easystar.setGrid(COLLISION_MAP);
    this.easystar.setAcceptableTiles([0]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
  }

  findPath(startX: number, startY: number, endX: number, endY: number): Promise<GridPoint[]> {
    return new Promise((resolve) => {
      this.easystar.findPath(startX, startY, endX, endY, (path) => {
        resolve(path || []);
      });
      this.easystar.calculate();
    });
  }
}
