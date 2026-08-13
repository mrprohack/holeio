import type { BotPersonality } from '../systems/BotAISystem.ts';
import type { HoleActor } from './Hole.ts';

const BOT_NAMES = ['NOVA', 'BITE', 'ORBIT', 'NIBBLE', 'VANTA', 'CHOMP', 'ZERO'];
const BOT_COLORS = [0x49e7c2, 0xffcf5a, 0xff6b8b, 0x62b8ff, 0xff985a, 0x7ef07b, 0xd873ff];
const PERSONALITIES: BotPersonality[] = ['collector', 'hunter', 'coward', 'aggressive', 'opportunist', 'collector', 'hunter'];

export function createBots(): HoleActor[] {
  return BOT_NAMES.map((name, index) => {
    const angle = (index / BOT_NAMES.length) * Math.PI * 2;
    const distance = 34 + (index % 3) * 7;
    return {
      id: `bot-${index}`,
      name,
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      radius: 1.08 + (index % 3) * 0.08,
      score: 0,
      active: true,
      color: BOT_COLORS[index] ?? 0xffffff,
      personality: PERSONALITIES[index] ?? 'collector',
      retargetAt: 0,
      respawnAt: 0,
    };
  });
}
