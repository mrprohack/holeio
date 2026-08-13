import type { BotPersonality } from '../systems/BotAISystem.ts';

export type HoleActor = {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  score: number;
  active: boolean;
  color: number;
  personality?: BotPersonality;
  targetId?: string;
  retargetAt: number;
  respawnAt: number;
};

export function createPlayer(): HoleActor {
  return {
    id: 'player',
    name: 'YOU',
    x: -45,
    z: -45,
    radius: 1.15,
    score: 0,
    active: true,
    color: 0x9b7bff,
    retargetAt: 0,
    respawnAt: 0,
  };
}
