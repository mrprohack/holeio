import * as THREE from 'three';
import type { HoleActor } from '../entities/Hole.ts';
import type { PowerUpKind } from '../entities/PowerUp.ts';
import type { ObjectKind, WorldDefinition, WorldObjectDefinition } from '../world/WorldGenerator.ts';

type InstanceRef = { mesh: THREE.InstancedMesh; index: number; definition: WorldObjectDefinition };
type Effect = { mesh: THREE.Mesh; life: number; maxLife: number };
export type PowerUpVisual = { id: string; kind: PowerUpKind; x: number; z: number; active: boolean };

const KIND_COLORS: Record<ObjectKind, number> = {
  cone: 0xff8f46,
  person: 0xf8d0a6,
  bench: 0x9c724d,
  tree: 0x53a86b,
  car: 0x4e8fff,
  van: 0xe8e8f0,
  bus: 0xffc74c,
  crate: 0xb9834d,
  container: 0x5da7a7,
  warehouse: 0x8892a6,
  building: 0x9d8fd1,
  tower: 0x7468ae,
};

const DISTRICT_COLORS = {
  park: 0x9bd596,
  traffic: 0xc6ccd5,
  industrial: 0xc0aa8c,
  downtown: 0xbab7cf,
} as const;

export class Renderer3D {
  readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
  private readonly worldRoot = new THREE.Group();
  private readonly holeRoot = new THREE.Group();
  private readonly powerRoot = new THREE.Group();
  private readonly effectRoot = new THREE.Group();
  private readonly objectRefs = new Map<string, InstanceRef>();
  private readonly holes = new Map<string, THREE.Group>();
  private readonly powers = new Map<string, THREE.Group>();
  private readonly effects: Effect[] = [];
  private readonly cameraTarget = new THREE.Vector3();
  private readonly desiredCamera = new THREE.Vector3();
  private readonly tmpMatrix = new THREE.Matrix4();
  private readonly tmpPosition = new THREE.Vector3();
  private readonly tmpQuaternion = new THREE.Quaternion();
  private readonly tmpScale = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.setAttribute('aria-label', '3D Void Rush arena');
    container.append(this.canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = false;
    this.scene.background = new THREE.Color(0x88bee5);
    this.scene.fog = new THREE.Fog(0x88bee5, 100, 205);
    this.scene.add(this.worldRoot, this.holeRoot, this.powerRoot, this.effectRoot);
    const hemi = new THREE.HemisphereLight(0xeaf7ff, 0x5c694f, 2.25);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4dc, 2.35);
    sun.position.set(-45, 75, -35);
    this.scene.add(sun);
    this.camera.position.set(20, 28, 24);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setWorld(world: WorldDefinition): void {
    this.disposeWorld();
    this.worldRoot.clear();
    this.objectRefs.clear();
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.95 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(world.arenaHalfSize * 2 + 8, world.arenaHalfSize * 2 + 8), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    this.worldRoot.add(ground);

    for (const district of world.districts) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(district.halfSize * 2 - 1, district.halfSize * 2 - 1),
        new THREE.MeshStandardMaterial({ color: DISTRICT_COLORS[district.kind], roughness: 1 }),
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(district.centerX, 0, district.centerZ);
      this.worldRoot.add(plane);
    }

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x3f4652, roughness: 1 });
    const roadA = new THREE.Mesh(new THREE.PlaneGeometry(6, world.arenaHalfSize * 2 + 2), roadMat);
    roadA.rotation.x = -Math.PI / 2;
    roadA.position.y = 0.01;
    const roadB = new THREE.Mesh(new THREE.PlaneGeometry(world.arenaHalfSize * 2 + 2, 6), roadMat);
    roadB.rotation.x = -Math.PI / 2;
    roadB.position.y = 0.012;
    this.worldRoot.add(roadA, roadB);

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(world.arenaHalfSize * 2, 0.2, world.arenaHalfSize * 2)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
    );
    border.position.y = 0.04;
    this.worldRoot.add(border);

    const grouped = new Map<ObjectKind, WorldObjectDefinition[]>();
    for (const object of world.objects) {
      const list = grouped.get(object.kind) ?? [];
      list.push(object);
      grouped.set(object.kind, list);
    }
    for (const [kind, items] of grouped) {
      const geometry = this.geometryFor(kind);
      const material = new THREE.MeshStandardMaterial({ color: KIND_COLORS[kind], roughness: 0.72, metalness: kind === 'car' || kind === 'van' || kind === 'bus' ? 0.16 : 0 });
      const mesh = new THREE.InstancedMesh(geometry, material, items.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        this.composeObjectMatrix(item, this.tmpMatrix);
        mesh.setMatrixAt(index, this.tmpMatrix);
        const color = new THREE.Color(KIND_COLORS[kind]);
        color.offsetHSL(((item.hue % 35) - 17) / 360, 0, ((item.hue % 17) - 8) / 160);
        mesh.setColorAt(index, color);
        this.objectRefs.set(item.id, { mesh, index, definition: item });
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.worldRoot.add(mesh);
    }
  }

  consumeObject(id: string, accent = 0xffffff): void {
    const ref = this.objectRefs.get(id);
    if (!ref) return;
    this.tmpMatrix.makeScale(0, 0, 0);
    ref.mesh.setMatrixAt(ref.index, this.tmpMatrix);
    ref.mesh.instanceMatrix.needsUpdate = true;
    this.spawnRing(ref.definition.x, ref.definition.z, Math.max(0.5, ref.definition.radius), accent);
  }

  resetObject(id: string): void {
    const ref = this.objectRefs.get(id);
    if (!ref) return;
    this.composeObjectMatrix(ref.definition, this.tmpMatrix);
    ref.mesh.setMatrixAt(ref.index, this.tmpMatrix);
    ref.mesh.instanceMatrix.needsUpdate = true;
  }

  syncHoles(actors: HoleActor[]): void {
    for (const actor of actors) {
      let group = this.holes.get(actor.id);
      if (!group) {
        group = this.createHole(actor.color);
        this.holes.set(actor.id, group);
        this.holeRoot.add(group);
      }
      group.visible = actor.active;
      group.position.set(actor.x, 0.06, actor.z);
      group.scale.setScalar(actor.radius);
    }
  }

  syncPowerUps(powerUps: PowerUpVisual[], timeSeconds: number): void {
    for (const pickup of powerUps) {
      let group = this.powers.get(pickup.id);
      if (!group) {
        group = this.createPower(pickup.kind);
        this.powers.set(pickup.id, group);
        this.powerRoot.add(group);
      }
      group.visible = pickup.active;
      group.position.set(pickup.x, 1.1 + Math.sin(timeSeconds * 3 + pickup.x) * 0.15, pickup.z);
      group.rotation.y = timeSeconds * 1.8;
    }
  }

  followPlayer(player: HoleActor, dt: number): void {
    const radius = Math.max(1, player.radius);
    const distance = 20 + radius * 2.5;
    const height = 22 + radius * 3.1;
    const desiredTarget = this.tmpPosition.set(player.x, 0, player.z);
    const t = 1 - Math.exp(-dt * 7);
    this.cameraTarget.lerp(desiredTarget, t);
    const desired = this.desiredCamera.set(player.x + distance * 0.62, height, player.z + distance * 0.72);
    this.camera.position.lerp(desired, 1 - Math.exp(-dt * 4.4));
    this.camera.lookAt(this.cameraTarget);
  }

  render(dt: number): void {
    this.updateEffects(dt);
    this.renderer.render(this.scene, this.camera);
  }

  resize(): void {
    const width = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private disposeWorld(): void {
    this.worldRoot.traverse((object: unknown) => {
      const renderable = object as THREE.Mesh;
      renderable.geometry?.dispose?.();
      const material = renderable.material;
      if (Array.isArray(material)) {
        for (const item of material) item.dispose();
      } else {
        material?.dispose?.();
      }
    });
  }

  private geometryFor(kind: ObjectKind): THREE.BufferGeometry {
    if (kind === 'cone') return new THREE.ConeGeometry(0.45, 1, 7);
    if (kind === 'person') return new THREE.CapsuleGeometry(0.28, 0.8, 3, 6);
    if (kind === 'tree') return new THREE.ConeGeometry(0.85, 2.2, 7);
    if (kind === 'building' || kind === 'tower' || kind === 'warehouse' || kind === 'container' || kind === 'crate') return new THREE.BoxGeometry(1, 1, 1);
    if (kind === 'car' || kind === 'van' || kind === 'bus') return new THREE.BoxGeometry(1.8, 0.75, 1);
    return new THREE.BoxGeometry(1.4, 0.55, 0.65);
  }

  private composeObjectMatrix(item: WorldObjectDefinition, matrix: THREE.Matrix4): void {
    const y = item.height * 0.5;
    const scaleY = item.kind === 'tree' ? item.height / 2.2 : item.kind === 'cone' ? item.height : item.kind === 'person' ? item.height / 1.36 : item.height;
    const xz = Math.max(0.4, item.radius * (item.kind === 'building' || item.kind === 'tower' ? 1.25 : 1));
    const sx = item.kind === 'car' || item.kind === 'van' || item.kind === 'bus' ? item.radius / 1.2 : xz;
    const sz = item.kind === 'car' || item.kind === 'van' || item.kind === 'bus' ? item.radius / 1.65 : xz;
    this.tmpPosition.set(item.x, y, item.z);
    this.tmpQuaternion.setFromEuler(new THREE.Euler(0, ((item.hue % 8) * Math.PI) / 4, 0));
    this.tmpScale.set(sx, scaleY, sz);
    matrix.compose(this.tmpPosition, this.tmpQuaternion, this.tmpScale);
  }

  private createHole(color: number): THREE.Group {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x02030a, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.04;
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.91, 1.08, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.045;
    group.add(disc, rim);
    return group;
  }

  private createPower(kind: PowerUpKind): THREE.Group {
    const group = new THREE.Group();
    const color = kind === 'magnet' ? 0x49e7c2 : kind === 'speed' ? 0xffcf5a : 0xd873ff;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.17, 8, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.35 }));
    ring.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.5 }));
    group.add(ring, core);
    return group;
  }

  private spawnRing(x: number, z: number, radius: number, color: number): void {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.55, radius * 0.72, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.12, z);
    this.effectRoot.add(mesh);
    this.effects.push({ mesh, life: 0, maxLife: 0.38 });
  }

  private updateEffects(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.life += dt;
      const p = effect.life / effect.maxLife;
      effect.mesh.scale.setScalar(1 + p * 1.8);
      const material = effect.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.8 * (1 - p));
      if (p >= 1) {
        this.effectRoot.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        material.dispose();
        this.effects.splice(i, 1);
      }
    }
  }
}
