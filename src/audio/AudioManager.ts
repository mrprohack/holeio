export class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    if (this.context) return;
    const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) this.context = new AudioCtx();
  }

  consume(size = 1): void {
    const frequency = Math.max(75, 190 - size * 12);
    this.beep(frequency, 0.055, 'sine', 0.035);
  }

  power(): void {
    this.beep(520, 0.09, 'triangle', 0.05);
  }

  rival(): void {
    this.beep(95, 0.16, 'sawtooth', 0.055);
  }

  end(): void {
    this.beep(330, 0.12, 'triangle', 0.045, 0);
    window.setTimeout(() => this.beep(440, 0.18, 'triangle', 0.045, 0), 120);
  }

  click(): void {
    this.beep(280, 0.04, 'sine', 0.025);
  }

  private beep(frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
    if (this.muted || !this.context) return;
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }
}
