import type { MoveVector } from './InputManager.ts';

export class TouchJoystick {
  readonly element: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private pointerId: number | null = null;
  private readonly onChange: (vector: MoveVector) => void;

  constructor(onChange: (vector: MoveVector) => void) {
    this.onChange = onChange;
    this.element = document.createElement('div');
    this.element.className = 'joystick';
    this.element.setAttribute('aria-label', 'Movement joystick');
    this.knob = document.createElement('div');
    this.knob.className = 'joystick-knob';
    this.element.append(this.knob);
    this.element.addEventListener('pointerdown', (event) => this.begin(event));
    this.element.addEventListener('pointermove', (event) => this.move(event));
    this.element.addEventListener('pointerup', (event) => this.end(event));
    this.element.addEventListener('pointercancel', (event) => this.end(event));
  }

  private begin(event: PointerEvent): void {
    this.pointerId = event.pointerId;
    this.element.setPointerCapture(event.pointerId);
    this.move(event);
  }

  private move(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.31;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const length = Math.hypot(dx, dy);
    const scale = length > max ? max / length : 1;
    const px = dx * scale;
    const py = dy * scale;
    this.knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    this.onChange({ x: px / max, z: py / max });
  }

  private end(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.onChange({ x: 0, z: 0 });
  }
}
