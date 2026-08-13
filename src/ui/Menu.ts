export class Menu {
  readonly element: HTMLDivElement;
  private readonly best: HTMLSpanElement;
  private readonly coins: HTMLSpanElement;

  constructor(onStart: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'overlay';
    this.element.innerHTML = `
      <section class="panel" aria-labelledby="game-title">
        <div class="brand-mark" aria-hidden="true"></div>
        <h1 id="game-title">VOID<br>RUSH</h1>
        <p class="subtitle">Devour the city. Grow through four districts. Outsmart seven rival voids before the clock hits zero.</p>
        <div class="control-copy"><strong>Desktop:</strong> WASD / arrows or steer with pointer &nbsp;•&nbsp; <strong>Mobile:</strong> drag the joystick</div>
        <div class="stats">
          <div class="stat"><strong>90s</strong><span>Round</span></div>
          <div class="stat"><strong class="best-score">0</strong><span>Best</span></div>
          <div class="stat"><strong class="coin-count">0</strong><span>Coins</span></div>
        </div>
        <button class="primary-btn" type="button">ENTER THE CITY</button>
      </section>`;
    this.best = this.element.querySelector('.best-score') as HTMLSpanElement;
    this.coins = this.element.querySelector('.coin-count') as HTMLSpanElement;
    (this.element.querySelector('.primary-btn') as HTMLButtonElement).addEventListener('click', onStart);
  }

  updateStats(bestScore: number, coins: number): void {
    this.best.textContent = bestScore.toLocaleString();
    this.coins.textContent = coins.toLocaleString();
  }

  setVisible(visible: boolean): void {
    this.element.classList.toggle('hidden', !visible);
  }
}
