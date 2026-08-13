export class ScoreSystem {
  score = 0;
  combo = 0;
  private lastConsumeAt = Number.NEGATIVE_INFINITY;

  private readonly comboWindowMs: number;

  constructor(comboWindowMs = 1200) {
    this.comboWindowMs = comboWindowMs;
  }

  consume(value: number, nowMs: number): number {
    const safeValue = Math.max(0, Math.round(value));
    if (nowMs - this.lastConsumeAt <= this.comboWindowMs) this.combo += 1;
    else this.combo = 1;
    this.lastConsumeAt = nowMs;
    const multiplier = 1 + Math.min(4, this.combo - 1) * 1.5;
    const gained = Math.round(safeValue * multiplier);
    this.score += gained;
    return gained;
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.lastConsumeAt = Number.NEGATIVE_INFINITY;
  }
}
