export type GamePhase = 'menu' | 'countdown' | 'playing' | 'paused' | 'results';

export class GameState {
  phase: GamePhase = 'menu';
  timeRemaining: number;
  private readonly duration: number;
  private resumePhase: GamePhase = 'playing';

  constructor(durationSeconds = 90) {
    this.duration = Math.max(1, durationSeconds);
    this.timeRemaining = this.duration;
  }

  start(): void {
    this.timeRemaining = this.duration;
    this.phase = 'playing';
  }

  setPaused(paused: boolean): void {
    if (paused && this.phase === 'playing') {
      this.resumePhase = this.phase;
      this.phase = 'paused';
    } else if (!paused && this.phase === 'paused') {
      this.phase = this.resumePhase;
    }
  }

  update(dt: number): void {
    if (this.phase !== 'playing') return;
    this.timeRemaining = Math.max(0, this.timeRemaining - Math.max(0, dt));
    if (this.timeRemaining <= 0) this.phase = 'results';
  }
}
