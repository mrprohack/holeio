export type MoveVector = { x: number; z: number };

export function normalizeInputVector(x: number, z: number): MoveVector {
  const length = Math.hypot(x, z);
  if (length <= 1e-8) return { x: 0, z: 0 };
  if (length <= 1) return { x, z };
  return { x: x / length, z: z / length };
}

export function clampToArena(position: MoveVector, halfSize: number): MoveVector {
  const h = Math.max(0, halfSize);
  return { x: Math.max(-h, Math.min(h, position.x)), z: Math.max(-h, Math.min(h, position.z)) };
}

export class InputManager {
  private readonly keys = new Set<string>();
  private touchVector: MoveVector = { x: 0, z: 0 };
  private pointerVector: MoveVector = { x: 0, z: 0 };
  private pointerActive = false;
  private readonly onKeyDownBound: (event: KeyboardEvent) => void;
  private readonly onKeyUpBound: (event: KeyboardEvent) => void;
  private readonly onPointerMoveBound: (event: PointerEvent) => void;
  private readonly canvas: HTMLElement;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    this.onKeyDownBound = (event) => this.onKeyDown(event);
    this.onKeyUpBound = (event) => this.onKeyUp(event);
    this.onPointerMoveBound = (event) => this.onPointerMove(event);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    canvas.addEventListener('pointermove', this.onPointerMoveBound);
    canvas.addEventListener('pointerdown', () => { this.pointerActive = true; });
    canvas.addEventListener('pointerleave', () => { this.pointerActive = false; });
  }

  setTouchVector(vector: MoveVector): void {
    this.touchVector = normalizeInputVector(vector.x, vector.z);
  }

  vector(): MoveVector {
    let x = 0;
    let z = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (x !== 0 || z !== 0) return normalizeInputVector(x, z);
    if (Math.hypot(this.touchVector.x, this.touchVector.z) > 0.05) return this.touchVector;
    if (this.pointerActive) return this.pointerVector;
    return { x: 0, z: 0 };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.canvas.removeEventListener('pointermove', this.onPointerMoveBound);
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onPointerMove(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / Math.max(1, rect.width * 0.3);
    const dz = (event.clientY - cy) / Math.max(1, rect.height * 0.3);
    this.pointerVector = normalizeInputVector(dx, dz);
  }
}
