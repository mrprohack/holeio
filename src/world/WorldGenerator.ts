export type DistrictKind = 'park' | 'traffic' | 'industrial' | 'downtown';
export type ObjectKind = 'cone' | 'person' | 'bench' | 'tree' | 'car' | 'van' | 'bus' | 'crate' | 'container' | 'warehouse' | 'building' | 'tower';

export type DistrictDefinition = {
  kind: DistrictKind;
  centerX: number;
  centerZ: number;
  halfSize: number;
};

export type WorldObjectDefinition = {
  id: string;
  kind: ObjectKind;
  district: DistrictKind;
  x: number;
  z: number;
  radius: number;
  mass: number;
  value: number;
  height: number;
  hue: number;
};

export type WorldDefinition = {
  arenaHalfSize: number;
  districts: DistrictDefinition[];
  objects: WorldObjectDefinition[];
};

type ObjectPreset = Omit<WorldObjectDefinition, 'id' | 'district' | 'x' | 'z' | 'hue'>;

const PRESETS: Record<ObjectKind, ObjectPreset> = {
  cone: { kind: 'cone', radius: 0.38, mass: 0.9, value: 4, height: 0.9 },
  person: { kind: 'person', radius: 0.48, mass: 1.1, value: 6, height: 1.8 },
  bench: { kind: 'bench', radius: 0.82, mass: 2.8, value: 12, height: 0.7 },
  tree: { kind: 'tree', radius: 1.15, mass: 5.2, value: 20, height: 3.4 },
  car: { kind: 'car', radius: 1.45, mass: 7.5, value: 28, height: 1.25 },
  van: { kind: 'van', radius: 1.85, mass: 10.5, value: 40, height: 1.8 },
  bus: { kind: 'bus', radius: 2.55, mass: 18, value: 70, height: 2.4 },
  crate: { kind: 'crate', radius: 1.3, mass: 8, value: 32, height: 1.6 },
  container: { kind: 'container', radius: 2.25, mass: 16, value: 58, height: 2.5 },
  warehouse: { kind: 'warehouse', radius: 3.25, mass: 28, value: 110, height: 4.8 },
  building: { kind: 'building', radius: 4.8, mass: 55, value: 210, height: 9 },
  tower: { kind: 'tower', radius: 7.2, mass: 105, value: 420, height: 17 },
};

const DISTRICT_POOLS: Record<DistrictKind, ObjectKind[]> = {
  park: ['cone', 'person', 'person', 'bench', 'bench', 'tree'],
  traffic: ['bench', 'tree', 'car', 'car', 'van', 'bus'],
  industrial: ['car', 'van', 'crate', 'container', 'container', 'warehouse'],
  downtown: ['bus', 'container', 'warehouse', 'building', 'building', 'tower'],
};

function rngFromSeed(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function generateWorld(seed = 1): WorldDefinition {
  const arenaHalfSize = 70;
  const half = 32;
  const districts: DistrictDefinition[] = [
    { kind: 'park', centerX: -35, centerZ: -35, halfSize: half },
    { kind: 'traffic', centerX: 35, centerZ: -35, halfSize: half },
    { kind: 'industrial', centerX: -35, centerZ: 35, halfSize: half },
    { kind: 'downtown', centerX: 35, centerZ: 35, halfSize: half },
  ];
  const random = rngFromSeed(seed);
  const objects: WorldObjectDefinition[] = [];
  let id = 0;
  for (const district of districts) {
    const pool = DISTRICT_POOLS[district.kind];
    const count = 88;
    for (let i = 0; i < count; i++) {
      const kind = pool[Math.floor(random() * pool.length)] ?? pool[0];
      const base = PRESETS[kind];
      const scale = 0.88 + random() * 0.24;
      const margin = Math.max(2, base.radius * 1.5);
      const usable = district.halfSize - margin;
      const x = district.centerX + (random() * 2 - 1) * usable;
      const z = district.centerZ + (random() * 2 - 1) * usable;
      objects.push({
        ...base,
        id: `obj-${id++}`,
        district: district.kind,
        x: Number(x.toFixed(3)),
        z: Number(z.toFixed(3)),
        radius: Number%€I3Ž,ãF„ë„ÑPÐ€L@Ç9”0À