type CrazyAdType = 'midgame' | 'rewarded';

type CrazySdk = {
  init?: () => Promise<void>;
  environment?: string;
  game?: { gameplayStart?: () => void; gameplayStop?: () => void };
  ad?: { requestAd?: (type: CrazyAdType, callbacks: { adStarted?: () => void; adFinished?: () => void; adError?: (error?: unknown) => void }) => void };
};

function getSdk(): CrazySdk | undefined {
  const root = globalThis as typeof globalThis & { CrazyGames?: { SDK?: CrazySdk } };
  return root.CrazyGames?.SDK;
}

export class CrazyGamesPlatform {
  available = false;
  private sdk: CrazySdk | undefined;

  async init(): Promise<void> {
    this.sdk = getSdk();
    if (!this.sdk) {
      this.available = false;
      return;
    }
    try {
      await this.sdk.init?.();
      this.available = this.sdk.environment !== 'disabled';
    } catch {
      this.sdk = undefined;
      this.available = false;
    }
  }

  gameplayStart(): void {
    if (!this.available) return;
    this.sdk?.game?.gameplayStart?.();
  }

  gameplayStop(): void {
    if (!this.available) return;
    this.sdk?.game?.gameplayStop?.();
  }

  showMidgameAd(): Promise<boolean> {
    return this.requestAd('midgame');
  }

  showRewardedAd(): Promise<boolean> {
    return this.requestAd('rewarded');
  }

  private requestAd(type: CrazyAdType): Promise<boolean> {
    if (!this.available || !this.sdk?.ad?.requestAd) return Promise.resolve(false);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      try {
        this.sdk?.ad?.requestAd?.(type, {
          adFinished: () => finish(true),
          adError: () => finish(false),
        });
      } catch {
        finish(false);
      }
    });
  }
}
