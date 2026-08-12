type Entry<T> = { id: string; x: number; z: number; value: T };

export class SpatialGrid<T> {
  private readonly cells = new Map<string, Map<string, Entry<T>>>();
  private readonly byId = new Map<string, { key: string; entry: Entry<T> }>();

  private readonly cellSize: number;

  constructor(cellSize = 10) {
    this.cellSize = cellSize;
  }

  private key(x: number, z: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }

  insert(id: string, x: number, z: number, value: T): void {
    this.remove(id);
    const key = this.key(x, z);
    const entry = { id, x, z, value };
    const cell = this.cells.get(key) ?? new Map<string, Entry<T>>();
    cell.set(id, entry);
    this.cells.set(key, cell);
    this.byId.set(id, { key, entry });
  }

  remove(id: string): void {
    const previous = this.byId.get(id);
    if (!previous) return;
    const cell = this.cells.get(previous.key);
    cell?.delete(id);
    if (cell?.size === 0) this.cells.delete(previous.key);
    this.byId.delete(id);
  }

  queryRadius(x: number, z: number, radius: number): T[] {
    const safeRadius = Math.max(0, radius);
    const minX = Math.floor((x - safeRadius) / this.cellSize);
    const maxX = Math.floor((x + safeRadius) / this.cellSize);
    const minZ = Math.floor((z - safeRadius) / this.cellSize);
    const maxZ = Math.floor((z + safeRadius) / this.cellSize);
    const r2 = safeRadius * safeRadius;
    const result: T[] = [];
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const cell = this.cells.get(`${cx},${cz}`);
        if (!cell) continue;
        for (const entry of cell.values()) {
          const dx = entry.x - x;
          const dz = entry.z - z;
          if (dx * dx + dz * dz <= r2) result.push(entry.value);
        }
      }
    }
    return result;
  }
}
