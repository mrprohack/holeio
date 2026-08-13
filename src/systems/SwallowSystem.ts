export function canSwallow(holeRadius: number, targetRadius: number, tolerance = 0.88): boolean {
  return targetRadius > 0 && targetRadius <= Math.max(0, holeRadius) * tolerance;
}

export function captureDistance(holeRadius: number, targetRadius: number): number {
  return Math.max(0, holeRadius - targetRadius * 0.35);
}

export function canConsumeRival(attackerRadius: number, victimRadius: number): boolean {
  return victimRadius > 0 && attackerRadius >= victimRadius * 1.16;
}
