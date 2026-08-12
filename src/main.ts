import './styles.css';
import { Game } from './game/Game.ts';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app root');

try {
  new Game(app);
} catch (error) {
  console.error(error);
  app.innerHTML = `
    <main style="height:100%;display:grid;place-items:center;padding:24px;background:#101126;color:white;font-family:system-ui,sans-serif;text-align:center">
      <section style="max-width:520px">
        <h1 style="font-size:42px;margin:0 0 12px">Void Rush needs WebGL</h1>
        <p style="color:#c9cbe0;line-height:1.6">Your browser could not start the 3D renderer. Enable hardware acceleration or open the game in a modern browser with WebGL support.</p>
      </section>
    </main>`;
}
