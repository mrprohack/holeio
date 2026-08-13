import { canSwallow } from './SwallowSystem.ts';

export type BotPersonality = 'collector' | 'hunter' | 'coward' | 'aggressive' | 'opportunist';
export type BotSnapshot = { x: number; z: number; radius: number; personality: BotPersonality };
export type BotTarget = { id: string; x: number; z: number; radius: number; value: number };
export type BotThreat = { x: number; z: number; radius: number };

const personalityValueWeight: Record<BotPersonality, number> = {
  collector: 1.15,
  hunter: 1,
  coward: 0.85,
  aggressive: 1.3,
  opportunist: 1.1,
};

export function chooseBotTarget(
  bot: BotSnapshot,
  candidates: BotTarget[],
  threats: BotThreat[],
  timeRemaining: number,
): BotTarget | null {
  let best: BotTarget | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    if (!canSwallow(bot.radius, candidate.radius)) continue;
    const dx = candidate.x - bot.x;
    const dz = candidate.z - bot.z;
    const distance = Math.max(1, Math.hypot(dx, dz));
    let threatPenalty = 1;
    for (const threat of threats) {
      if (threat.radius <= bot.radius * 1.1) continue;
      const td = Math.hypot(threat.x - candidate.x, threat.z - candidate.z);
      if (td < 12) threatPenalty *= bot.personality === 'coward' ? 0.12 : 0.55;
    }
    const urgency = timeRemaining <= 20 ? 1.25 : 1;
    const score = (candidate.value * personalityValueWeight[bot.personality] * urgency * threatPenalty) / distance;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
