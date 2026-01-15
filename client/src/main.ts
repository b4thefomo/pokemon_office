import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { OfficeScene } from './scenes/OfficeScene';
import { WebSocketManager } from './managers/WebSocketManager';

export const wsManager = new WebSocketManager('ws://localhost:3001/ws');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 608,
  parent: 'game',
  backgroundColor: '#2d2d44',
  pixelArt: true,
  scene: [PreloadScene, OfficeScene],
};

const game = new Phaser.Game(config);

document.getElementById('btn-simulate-connect')?.addEventListener('click', async () => {
  await fetch('http://localhost:3001/api/simulate/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
});

document.getElementById('btn-simulate-disconnect')?.addEventListener('click', async () => {
  const scene = game.scene.getScene('OfficeScene') as OfficeScene;
  const device = scene?.getLastConnectedDevice();
  if (device) {
    await fetch('http://localhost:3001/api/simulate/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: device.mac }),
    });
  }
});

export { game };
