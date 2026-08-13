export type SaveData = {
  bestScore: number;
  coins: number;
  muted: boolean;
  skin: string;
};

export const DEFAULT_SAVE: SaveData = { bestScore: 0, coins: 0, muted: false, skin: 'violet' };

export function sanitizeSave(input: unknown): SaveData {
  if (!input || typeof input !== 'object') return { ...DEFAULT_SAVE };
  const value = input as Record<string, unknown>;
  return {
    bestScore: typeof value.bestScore === 'number' && Number.isFinite(value.bestScore) && value.bestScore >= 0 ? Math.floor(value.bestScore) : 0,
    coins: typeof value.coins === 'number' && Number.isFinite(value.coins) && value.coins >= 0 ? Math.floor(value.coins) : 0,
    muted: typeof value.muted === 'boolean' ? value.muted : false,
    skin: typeof value.skin === 'string' && value.skin.length > 0 && value.skin.length < 32 ? value.skin : DEFAULT_SAVE.skin,
  };
}

export class SaveManager {
  private readonly key: string;

  constructor(key = 'void-rush-save-v1') {
    this.key = key;
  }

  load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? sanitizeSave(JSON.parse(raw)) : { ...DEFAULT_SAVE };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(sanitizeSave(data)));
    } catch {
      // Storage is optional; gameplay continues without persistence.
    }
  }
}
