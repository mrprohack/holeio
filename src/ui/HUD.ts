import type { HoleActor } from '../entities/Hole.ts';
import type { PowerUpKind, PowerUpState } from '../entities/PowerUp.ts';

export class HUD {
  readonly element: HTMLDivElement;
  private readonly scoreValue: HTMLSpanElement;
  private readonly timer: HTMLDivElement;
  private readonly leaderboard: HTMLDivElement;
  private readonly growthFill: HTMLDivElement;
  private readonly growthText: HTMLDivElement;
  private readonly powerStatus: HTMLDivElement;
  private readonly muteButton: HTMLButtonElement;

  constructor(onPause: () => void, onMute: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'hud';
    this.element.innerHTML = `
      <div class="hud-top">
        <div class="hud-card score-card"><span class="score-label">Score</span><span class="score-value">0</span></div>
        <div class="hud-card timer">1:30</div>
        <div class="hud-card leaderboard"><div class="leaderboard-title">Arena ranking</div><div class="leader-list"></div></div>
      </div>
      <div class="growth-wrap">
        <div class="growth-track"><div class="growth-fill"></div></div>
        <div class="growth-copy">Grow to swallow bigger targets</div>
      </div>
      <div class="power-status"></div>
      <div class="hud-actions">
        <button class="icon-btn pause-btn" type="button" aria-label="Pause game">Ⅱ</button>
        <button class="icon-btn mute-btn" type="button" aria-label="Toggle sound">♪</button>
      </div>`;
    this.scoreValue = this.element.querySelector('.score-value') as HTMLSpanElement;
    this.timer = this.element.querySelector('.timer') as HTMLDivElement;
    this.leaderboard = this.element.querySelector('.leader-list') as HTMLDivElement;
    this.growthFill = this.element.querySelector('.growth-fill') as HTMLDivElement;
    this.growthText = this.element.querySelector('.growth-copy') as HTMLDivElement;
    this.powerStatus = this.element.querySelector('.power-status') as HTMLDivElement;
    this.muteButton = this.element.querySelector('.mute-btn') as HTMLButtonElement;
    (this.element.querySelector('.pause-btn') as HTMLButtonElement).addEventListener('click', onPause);
    this.muteButton.addEventListener('click', onMute);
  }

  update(timeRemaining: number, player: HoleActor, actors: HoleActor[], combo: number, powerUps: PowerUpState, nowMs: number): void {
    this.scoreValue.textContent = player.score.toLocaleString();
    const seconds = Math.max(0, Math.ceil(timeRemaining));
    this.timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    this.timer.classList.toggle('urgent', seconds <= 15);
    const sorted = actors.filter((actor) => actor.active || actor.id === 'player').slice().sort((a, b) => b.score - a.score);
    this.leaderboard.innerHTML = sorted.map((actor, index) => `
      <div class="leader-row ${actor.id === 'player' ? 'player' : ''}">
        <span>${index + 1}</span><span class="name">${actor.name}</span><span>${actor.score.toLocaleString()}</span>
      </div>`).join('');
    const milestones = [1.15, 1.8, 2.6, 3.8, 5.6, 8, 11.5];
    let previous = milestones[0];
    let next = milestones[milestones.length - 1];
    for (const milestone of milestones) {
      if (milestone > player.radius) { next = milestone; break; }
      previous = milestone;
    }
    const progress = next === previous ? 1 : Math.max(0, Math.min(1, (player.radius - previous) / (next - previous)));
    this.growthFill.style.width = `${Math.round(progress * 100)}%`;
    this.growthText.innerHTML = `<span>Size ${player.radius.toFixed(1)}</span>${combo > 1 ? `<span class="combo">×${combo} combo</span>` : '<span>Keep feeding</span>'}`;
    const labels: Record<PowerUpKind, string> = { magnet: 'MAGNET', speed: 'SPEED', growth: '2× GROWTH' };
    const chips: string[] = [];
    for (const kind of ['magnet', 'speed', 'growth'] as PowerUpKind[]) {
      const remaining = powerUps.remaining(kind, nowMs);
      if (remaining > 0) chips.push(`<div class="power-chip">${labels[kind]} ${(remaining / 1000).toFixed(1)}s</div>`);
    }
    this.powerStatus.innerHTML = chips.join('');
  }

  setMuted(muted: boolean): void {
    this.muteButton.textContent = muted ? '×♪' : '♪';
    this.muteButton.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }

  setVisible(visible: boolean): void {
    this.element.style.display = visible ? '' : 'none';
  }
}
