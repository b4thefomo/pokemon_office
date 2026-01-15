import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { OfficeScene } from './scenes/OfficeScene';
import { WebSocketManager } from './managers/WebSocketManager';

// Use current hostname for network access (smart TV, etc.)
const wsHost = window.location.hostname || 'localhost';
const apiBase = `http://${wsHost}:3001`;
export const wsManager = new WebSocketManager(`ws://${wsHost}:3001/ws`);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS, // Force Canvas for TV compatibility
  width: 800,
  height: 608,
  parent: 'game',
  backgroundColor: '#2d2d44',
  pixelArt: true,
  scene: [PreloadScene, OfficeScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Sidebar toggle functionality
const sidebar = document.getElementById('sidebar');
const toggle = document.getElementById('sidebar-toggle');
toggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('collapsed');
  toggle.textContent = sidebar?.classList.contains('collapsed') ? '☰' : '✕';
});

document.getElementById('btn-simulate-connect')?.addEventListener('click', async () => {
  await fetch(`${apiBase}/api/simulate/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
});

document.getElementById('btn-simulate-disconnect')?.addEventListener('click', async () => {
  const scene = game.scene.getScene('OfficeScene') as OfficeScene;
  const device = scene?.getLastConnectedDevice();
  if (device) {
    await fetch(`${apiBase}/api/simulate/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: device.mac }),
    });
  }
});

export { game };
