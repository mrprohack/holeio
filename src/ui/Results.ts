export type ResultData = { score: number; rank: number; coins: number; bestScore: number };

export class Results {
  readonly element: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly rank: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly rewardButton: HTMLButtonElement;

  constructor(onReplay: () => void, onReward: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'overlay hidden';
    this.element.innerHTML = `
      <section class="panel" aria-labelledby="result-title">
        <div class="brand-mark" aria-hidden="true"></div>
        <h1 id="result-title">CITY<br>CONSUMED</h1>
        <div class="result-rank">#1 in the arena</div>
        <div class="stats result-stats"></div>
        <button class="primary-btn replay-btn" type="button">PLAY AGAIN</button>
        <button class="secondary-btn reward-btn" type="button">DOUBLE COINS · REWARDED AD</button>
      </section>`;
    this.title = this.element.querySelector('#result-title') as HTMLHeadingElement;
    this.rank = this.element.querySelector('.result-rank') as HTMLDivElement;
    this.stats = this.element.querySelector('.result-stats') as HTMLDivElement;
    this.rewardButton = this.element.querySelector('.reward-btn') as HTMLButtonElement;
    (this.element.querySelector('.replay-btn') as HTMLButtonElement).addEventListener('click', onReplay);
    this.rewardButton.addEventListener('click', onReward);
  }

  show(data: ResultData, rewardedAvailable: boolean): void {
    this.title.innerHTML = data.rank === 1 ? 'CITY<br>DOMINATED' : 'RUN<br>COMPLETE';
    this.rank.textContent = `#${data.rank} in the arena`;
    this.stats.innerHTML = `
      <div class="stat"><strong>${data.score.toLocaleString()}</strong><span>Score</span></div>
      <div class="stat"><strong>+${data.coins.toLocaleString()}</strong><span>Coins</span></div>
      <div class="stat"><strong>${data.bestScore.toLocaleString()}</strong><span>Best</span></div>`;
    this.rewardButton.style.display = rewardedAvailable ? '' : 'none';
    this.rewardButton.disabled = false;
    this.rewardButton.textContent = 'DOUBLE COINS · REWARDED AD';
    this.element.classList.remove('hidden');
  }

  markRewarded(): void {
    this.rewardButton.disabled = true;
    this.rewardButton.textContent = 'COINS DOUBLED';
  }

  hide(): void {
    this.element.classList.add('hidden');
  }
}
