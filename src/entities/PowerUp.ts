export type PowerUpKind = 'magnet' | 'speed' | 'growth';

export class PowerUpState {
  private readonly endsAt = new Map<PowerUpKind, number>();

  activate(kind: PowerUpKind, nowMs: number, durationMs = 7000): void {
    this.endsAt.set(kind, nowMs + Math.max(0, durationMs));
  }

  isActive(kind: PowerUpKind, nowMs: number): boolean {
    const end = this.endsAt.get(kind);
    if (end === undefined) return false;
    if (nowMs >= end) {
      this.endsAt.delete(kind);
      return false;
    }
    return true;
  }

  remaining(kind: PowerUpKind, nowMs: number): number {
    const end = this.endsAt.get(kind) ?? nowMs;
    return Math.max(0, end - nowMs);
  }

  clear(): void {
    this.endsAt.clear();
  }
}
