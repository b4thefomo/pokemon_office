import Phaser from 'phaser';
import { wsManager, wsHost } from './managers/wsInstance';

// Debug logging
const consoleLog = document.getElementById('console-log');
const maxLogs = 50;

function addLog(message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (!consoleLog) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${message}`;
  consoleLog.insertBefore(entry, consoleLog.firstChild);

  // Limit log entries
  while (consoleLog.children.length > maxLogs) {
    consoleLog.removeChild(consoleLog.lastChild!);
  }
}

// Override console methods to capture logs
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog.apply(console, args);
  addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'info');
};

console.warn = (...args) => {
  originalWarn.apply(console, args);
  addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn');
};

console.error = (...args) => {
  originalError.apply(console, args);
  addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error');
};

// Catch unhandled errors
window.onerror = (msg, url, line) => {
  addLog(`Error: ${msg} at ${url}:${line}`, 'error');
};

// Update host info
document.getElementById('host-info')!.textContent = wsHost;

// Update time
setInterval(() => {
  document.getElementById('current-time')!.textContent = new Date().toLocaleTimeString();
}, 1000);

addLog(`TV Debug Mode Started - Host: ${wsHost}`);

// Dynamically import scenes to avoid circular dependency
async function startGame() {
  const { PreloadScene } = await import('./scenes/PreloadScene');
  const { OfficeScene } = await import('./scenes/OfficeScene');

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
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
    callbacks: {
      postBoot: (game) => {
        // Track FPS
        setInterval(() => {
          const fps = Math.round(game.loop.actualFps);
          const fpsEl = document.getElementById('fps-count');
          if (fpsEl) {
            fpsEl.textContent = String(fps);
            fpsEl.className = 'stat-value' + (fps < 30 ? ' error' : fps < 50 ? ' warning' : '');
          }
        }, 500);
      }
    }
  };

  const game = new Phaser.Game(config);
  addLog('Game initialized');

  // Track WebSocket status
  const wsStatusEl = document.getElementById('ws-status');
  const deviceCountEl = document.getElementById('device-count');

  // Monitor WebSocket
  const checkWsStatus = () => {
    const ws = (wsManager as any).ws as WebSocket | null;
    if (wsStatusEl) {
      if (!ws) {
        wsStatusEl.textContent = 'No connection';
        wsStatusEl.className = 'stat-value error';
      } else {
        switch (ws.readyState) {
          case WebSocket.CONNECTING:
            wsStatusEl.textContent = 'Connecting...';
            wsStatusEl.className = 'stat-value warning';
            break;
          case WebSocket.OPEN:
            wsStatusEl.textContent = 'Connected';
            wsStatusEl.className = 'stat-value';
            break;
          case WebSocket.CLOSING:
            wsStatusEl.textContent = 'Closing...';
            wsStatusEl.className = 'stat-value warning';
            break;
          case WebSocket.CLOSED:
            wsStatusEl.textContent = 'Disconnected';
            wsStatusEl.className = 'stat-value error';
            break;
        }
      }
    }
  };

  setInterval(checkWsStatus, 1000);

  // Track device count
  let deviceCount = 0;
  wsManager.onFullState((p) => {
    deviceCount = p.devices.filter(d => d.online).length;
    if (deviceCountEl) deviceCountEl.textContent = String(deviceCount);
    addLog(`Full state received: ${deviceCount} devices online`);
  });

  wsManager.onDeviceConnected((p) => {
    deviceCount++;
    if (deviceCountEl) deviceCountEl.textContent = String(deviceCount);
    addLog(`Device connected: ${p.device.displayName || p.device.mac}`);
  });

  wsManager.onDeviceDisconnected((p) => {
    deviceCount--;
    if (deviceCountEl) deviceCountEl.textContent = String(deviceCount);
    addLog(`Device disconnected: ${p.device.displayName || p.device.mac}`);
  });

  return game;
}

// Toggle debug panel
document.getElementById('toggle-debug')?.addEventListener('click', () => {
  document.getElementById('debug-panel')?.classList.toggle('hidden');
});

startGame().catch(e => addLog(`Error starting game: ${e}`, 'error'));
