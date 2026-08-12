export function computeRadiusAfterMass(radius: number, mass: number, growthFactor = 0.24): number {
  const safeRadius = Math.max(0.01, radius);
  const area = Math.PI * safeRadius * safeRadius;
  const nextArea = area + Math.max(0, mass) * Math.max(0, growthFactor);
  return Math.sqrt(nextArea / Math.PI);
}
