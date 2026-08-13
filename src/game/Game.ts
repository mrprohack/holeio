import { AudioManager } from '../audio/AudioManager.ts';
import { createBots } from '../entities/Bot.ts';
import { createPlayer, type HoleActor } from '../entities/Hole.ts';
import { PowerUpState, type PowerUpKind } from '../entities/PowerUp.ts';
import { InputManager, clampToArena } from '../input/InputManager.ts';
import { TouchJoystick } from '../input/TouchJoystick.ts';
import { CrazyGamesPlatform } from '../platform/CrazyGamesPlatform.ts';
import { SaveManager, type SaveData } from '../platform/SaveManager.ts';
import { Renderer3D, type PowerUpVisual } from '../rendering/Renderer.ts';
import { chooseBotTarget } from '../systems/BotAISystem.ts';
import { computeRadiusAfterMass } from '../systems/GrowthSystem.ts';
import { ScoreSystem } from '../systems/ScoreSystem.ts';
import { canConsumeRival, canSwallow } from '../systems/SwallowSystem.ts';
import { HUD } from '../ui/HUD.ts';
import { Menu } from '../ui/Menu.ts';
import { Results } from '../ui/Results.ts';
import { SpatialGrid } from '../world/SpatialGrid.ts';
import { generateWorld, type WorldObjectDefinition } from '../world/WorldGenerator.ts';
import { GameState } from './GameState.ts';

type RuntimeObject = WorldObjectDefinition & { active: boolean };
type RuntimePower = PowerUpVisual & { respawnAt: number };

const MATCH_SECONDS = 90;
const BOT_SPEED = 7.2;
const PLAYER_SPEED = 9.4;

export class Game {
  private readonly root: HTMLElement;
  private readonly shell: HTMLDivElement;
  private readonly renderer: Renderer3D;
  private readonly input: InputManager;
  private readonly joystick: TouchJoystick;
  private readonly hud: HUD;
  private readonly menu: Menu;
  private readonly results: Results;
  private readonly audio = new AudioManager();
  private readonly platform = new CrazyGamesPlatform();
  private readonly saveManager = new SaveManager();
  private save: SaveData;
  private state = new GameState(MATCH_SECONDS);
  private score = new ScoreSystem();
  private powerState = new PowerUpState();
  private player = createPlayer();
  private bots = createBots();
  private grid = new SpatialGrid<RuntimeObject>(10);
  private readonly objects = new Map<string, RuntimeObject>();
  private powers: RuntimePower[] = [];
  private lastFrame = performance.now();
  private countdownRemaining = 0;
  private finished = false;
  private seed = 1701;
  private toastTimer = 0;
  private readonly toast: HTMLDivElement;
  private rewardedThisRound = false;
  private destroyed = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.shell = document.createElement('div');
    this.shell.className = 'game-shell';
    this.root.append(this.shell);
    this.renderer = new Renderer3D(this.shell);
    this.input = new InputManager(this.renderer.canvas);
    this.joystick = new TouchJoystick((vector) => this.input.setTouchVector(vector));
    this.hud = new HUD(() => this.togglePause(), () => this.toggleMute());
    this.menu = new Menu(() => void this.startMatch());
    this.results = new Results(() => void this.startMatch(), () => void this.doubleCoins());
    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    this.toast.setAttribute('role', 'status');
    this.shell.append(this.hud.element, this.joystick.element, this.menu.element, this.results.element, this.toast);
    this.save = this.saveManager.load();
    this.audio.setMuted(this.save.muted);
    this.hud.setMuted(this.save.muted);
    this.menu.updateStats(this.save.bestScore, this.save.coins);
    this.hud.setVisible(false);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') this.togglePause();
      if (event.code === 'KeyM') this.toggleMute();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.phase === 'playing') this.setPaused(true);
    });
    void this.platform.init();
    requestAnimationFrame((time) => this.loop(time));
  }

  private async startMatch(): Promise<void> {
    const restartingAfterResults = this.finished;
    if (restartingAfterResults && this.platform.available) {
      const mutedBeforeAd = this.save.muted;
      this.audio.setMuted(true);
      await this.platform.showMidgameAd();
      this.audio.setMuted(mutedBeforeAd);
    }
    this.audio.unlock();
    this.audio.click();
    this.finished = false;
    this.rewardedThisRound = false;
    this.state = new GameState(MATCH_SECONDS);
    this.state.phase = 'countdown';
    this.countdownRemaining = 3;
    this.score = new ScoreSystem();
    this.powerState = new PowerUpState();
    this.player = createPlayer();
    this.bots = createBots();
    this.grid = new SpatialGrid<RuntimeObject>(10);
    this.objects.clear();
    this.seed += 1337;
    const world = generateWorld(this.seed);
    for (const definition of world.objects) {
      const runtime: RuntimeObject = { ...definition, active: true };
      this.objects.set(runtime.id, runtime);
      this.grid.insert(runtime.id, runtime.x, runtime.z, runtime);
    }
    this.powers = [
      { id: 'power-0', kind: 'speed', x: -10, z: -18, active: true, respawnAt: 0 },
      { id: 'power-1', kind: 'magnet', x: 22, z: -24, active: true, respawnAt: 0 },
      { id: 'power-2', kind: 'growth', x: -28, z: 20, active: true, respawnAt: 0 },
      { id: 'power-3', kind: 'speed', x: 26, z: 28, active: true, respawnAt: 0 },
      { id: 'power-4', kind: 'magnet', x: 6, z: 44, active: true, respawnAt: 0 },
      { id: 'power-5', kind: 'growth', x: -42, z: 2, active: true, respawnAt: 0 },
    ];
    this.renderer.setWorld(world);
    this.renderer.syncHoles(this.allActors());
    this.results.hide();
    this.menu.setVisible(false);
    this.hud.setVisible(true);
    this.showToast('3', 850);
  }

  private loop(time: number): void {
    if (this.destroyed) return;
    const dt = Math.min(0.05, Math.max(0, (time - this.lastFrame) / 1000));
    this.lastFrame = time;

    if (this.state.phase === 'countdown') this.updateCountdown(dt);
    if (this.state.phase === 'playing') this.updatePlaying(dt, time);
    if (this.toastTimer > 0) {
      this.toastTimer -= dt * 1000;
      if (this.toastTimer <= 0) this.toast.classList.remove('show');
    }

    const actors = this.allActors();
    this.renderer.syncHoles(actors);
    this.renderer.syncPowerUps(this.powers, time / 1000);
    this.renderer.followPlayer(this.player, dt);
    this.renderer.render(dt);
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  private updateCountdown(dt: number): void {
    const before = Math.ceil(this.countdownRemaining);
    this.countdownRemaining = Math.max(0, this.countdownRemaining - dt);
    const after = Math.ceil(this.countdownRemaining);
    if (after !== before && after > 0) this.showToast(String(after), 800);
    if (this.countdownRemaining <= 0) {
      this.state.start();
      this.platform.gameplayStart();
      this.showToast('GO!', 700);
    }
  }

  private updatePlaying(dt: number, nowMs: number): void {
    this.state.update(dt);
    this.updateRespawns(nowMs);
    this.updatePlayer(dt, nowMs);
    this.updateBots(dt, nowMs);
    this.updatePowerUps(nowMs);
    this.resolveRivalCollisions(nowMs);
    this.player.score = this.score.score;
    this.hud.update(this.state.timeRemaining, this.player, this.allActors(), this.score.combo, this.powerState, nowMs);
    if (this.state.phase === 'results') this.finishMatch();
  }

  private updatePlayer(dt: number, nowMs: number): void {
    if (!this.player.active) return;
    const vector = this.input.vector();
    const speedBoost = this.powerState.isActive('speed', nowMs) ? 1.55 : 1;
    const speedPenalty = Math.max(0.58, 1 - Math.max(0, this.player.radius - 1) * 0.025);
    const next = clampToArena({
      x: this.player.x + vector.x * PLAYER_SPEED * speedBoost * speedPenalty * dt,
      z: this.player.z + vector.z * PLAYER_SPEED * speedBoost * speedPenalty * dt,
    }, 67.5);
    this.player.x = next.x;
    this.player.z = next.z;
    const magnet = this.powerState.isActive('magnet', nowMs) ? 2.2 : 0;
    this.consumeNearby(this.player, nowMs, magnet);
  }

  private updateBots(dt: number, nowMs: number): void {
    const threats = this.allActors().filter((actor) => actor.active).map((actor) => ({ x: actor.x, z: actor.z, radius: actor.radius }));
    for (let index = 0; index < this.bots.length; index++) {
      const bot = this.bots[index];
      if (!bot.active) continue;
      if (nowMs >= bot.retargetAt) {
        const candidates = this.grid.queryRadius(bot.x, bot.z, 22 + bot.radius * 4).filter((object) => object.active);
        const target = chooseBotTarget(
          { x: bot.x, z: bot.z, radius: bot.radius, personality: bot.personality ?? 'collector' },
          candidates,
          threats.filter((_, threatIndex) => threatIndex !== index + 1),
          this.state.timeRemaining,
        );
        bot.targetId = target?.id;
        bot.retargetAt = nowMs + 360 + index * 27;
      }
      const target = bot.targetId ? this.objects.get(bot.targetId) : undefined;
      let dx: number;
      let dz: number;
      if (target?.active) {
        dx = target.x - bot.x;
        dz = target.z - bot.z;
      } else {
        const angle = nowMs * 0.00022 + index * 0.89;
        dx = Math.cos(angle) * 14 + Math.sin(index * 1.7) * 8;
        dz = Math.sin(angle) * 14 + Math.cos(index * 1.3) * 8;
      }
      const length = Math.max(0.001, Math.hypot(dx, dz));
      const urgency = this.state.timeRemaining <= 20 ? 1.16 : 1;
      const speedPenalty = Math.max(0.62, 1 - Math.max(0, bot.radius - 1) * 0.023);
      const next = clampToArena({
        x: bot.x + (dx / length) * BOT_SPEED * urgency * speedPenalty * dt,
        z: bot.z + (dz / length) * BOT_SPEED * urgency * speedPenalty * dt,
      }, 67.5);
      bot.x = next.x;
      bot.z = next.z;
      this.consumeNearby(bot, nowMs, 0);
    }
  }

  private consumeNearby(actor: HoleActor, nowMs: number, magnetBonus: number): void {
    const queryRadius = actor.radius * 1.22 + 2.3 + magnetBonus;
    const nearby = this.grid.queryRadius(actor.x, actor.z, queryRadius);
    for (const object of nearby) {
      if (!object.active || !canSwallow(actor.radius, object.radius)) continue;
      const distance = Math.hypot(object.x - actor.x, object.z - actor.z);
      const capture = actor.radius * 0.72 + magnetBonus;
      if (distance > capture) continue;
      object.active = false;
      this.grid.remove(object.id);
      this.renderer.consumeObject(object.id, actor.color);
      const growthMultiplier = actor.id === 'player' && this.powerState.isActive('growth', nowMs) ? 0.82 : 0.43;
      actor.radius = computeRadiusAfterMass(actor.radius, object.mass, growthMultiplier);
      if (actor.id === 'player') {
        this.score.consume(object.value, nowMs);
        this.audio.consume(object.radius);
      } else {
        actor.score += object.value;
      }
    }
  }

  private resolveRivalCollisions(nowMs: number): void {
    const actors = this.allActors();
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      if (!a.active) continue;
      for (let j = i + 1; j < actors.length; j++) {
        const b = actors[j];
        if (!b.active) continue;
        const distance = Math.hypot(a.x - b.x, a.z - b.z);
        if (distance > Math.max(a.radius, b.radius) * 0.68) continue;
        if (canConsumeRival(a.radius, b.radius)) this.consumeRival(a, b, nowMs);
        else if (canConsumeRival(b.radius, a.radius)) this.consumeRival(b, a, nowMs);
      }
    }
  }

  private consumeRival(attacker: HoleActor, victim: HoleActor, nowMs: number): void {
    if (!attacker.active || !victim.active) return;
    victim.active = false;
    victim.respawnAt = nowMs + (victim.id === 'player' ? 1900 : 2600);
    const reward = 120 + Math.floor(victim.score * 0.08);
    attacker.radius = computeRadiusAfterMass(attacker.radius, Math.max(8, victim.radius * victim.radius * 5), 0.52);
    if (attacker.id === 'player') {
      this.score.consume(reward, nowMs);
      this.audio.rival();
      this.showToast(`VOID +${reward}`, 900);
    } else {
      attacker.score += reward;
      if (victim.id === 'player') {
        this.showToast(`${attacker.name} swallowed you`, 1200);
        this.audio.rival();
      }
    }
  }

  private updateRespawns(nowMs: number): void {
    for (const actor of this.allActors()) {
      if (actor.active || actor.respawnAt <= 0 || nowMs < actor.respawnAt) continue;
      const hash = actor.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      actor.x = -50 + (hash % 17);
      actor.z = -51 + ((hash * 7) % 19);
      actor.radius = Math.max(1.05, actor.radius * 0.62);
      actor.active = true;
      actor.targetId = undefined;
      actor.retargetAt = 0;
      actor.respawnAt = 0;
      if (actor.id === 'player') this.showToast('BACK IN!', 700);
    }
  }

  private updatePowerUps(nowMs: number): void {
    for (const pickup of this.powers) {
      if (!pickup.active && nowMs >= pickup.respawnAt) pickup.active = true;
      if (!pickup.active || !this.player.active) continue;
      const distance = Math.hypot(pickup.x - this.player.x, pickup.z - this.player.z);
      if (distance > this.player.radius + 1.1) continue;
      pickup.active = false;
      pickup.respawnAt = nowMs + 14000;
      this.powerState.activate(pickup.kind, nowMs, 7000);
      this.audio.power();
      const label: Record<PowerUpKind, string> = { magnet: 'MAGNET FIELD', speed: 'SPEED BURST', growth: '2× GROWTH' };
      this.showToast(label[pickup.kind], 1050);
    }
  }

  private finishMatch(): void {
    if (this.finished) return;
    this.finished = true;
    this.platform.gameplayStop();
    this.audio.end();
    const sorted = this.allActors().slice().sort((a, b) => b.score - a.score);
    const rank = Math.max(1, sorted.findIndex((actor) => actor.id === 'player') + 1);
    const baseCoins = Math.max(5, Math.floor(this.player.score / 35) + (9 - rank) * 8);
    this.save.bestScore = Math.max(this.save.bestScore, this.player.score);
    this.save.coins += baseCoins;
    this.saveManager.save(this.save);
    this.menu.updateStats(this.save.bestScore, this.save.coins);
    this.hud.setVisible(false);
    this.results.show({ score: this.player.score, rank, coins: baseCoins, bestScore: this.save.bestScore }, this.platform.available);
  }

  private async doubleCoins(): Promise<void> {
    if (this.rewardedThisRound || !this.finished) return;
    const mutedBeforeAd = this.save.muted;
    this.audio.setMuted(true);
    const watched = await this.platform.showRewardedAd();
    this.audio.setMuted(mutedBeforeAd);
    if (!watched) {
      this.showToast('Ad unavailable', 1000);
      return;
    }
    const rank = Math.max(1, this.allActors().slice().sort((a, b) => b.score - a.score).findIndex((actor) => actor.id === 'player') + 1);
    const bonus = Math.max(5, Math.floor(this.player.score / 35) + (9 - rank) * 8);
    this.save.coins += bonus;
    this.saveManager.save(this.save);
    this.menu.updateStats(this.save.bestScore, this.save.coins);
    this.rewardedThisRound = true;
    this.results.markRewarded();
    this.showToast(`+${bonus} BONUS COINS`, 1200);
  }

  private togglePause(): void {
    if (this.state.phase !== 'playing' && this.state.phase !== 'paused') return;
    this.setPaused(this.state.phase === 'playing');
  }

  private setPaused(paused: boolean): void {
    this.state.setPaused(paused);
    if (paused) {
      this.platform.gameplayStop();
      this.showToast('PAUSED', 1200);
    } else {
      this.platform.gameplayStart();
      this.showToast('GO!', 500);
    }
  }

  private toggleMute(): void {
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    this.hud.setMuted(this.save.muted);
    this.saveManager.save(this.save);
  }

  private showToast(message: string, durationMs: number): void {
    this.toast.textContent = message;
    this.toast.classList.add('show');
    this.toastTimer = durationMs;
  }

  private allActors(): HoleActor[] {
    return [this.player, ...this.bots];
  }
}
