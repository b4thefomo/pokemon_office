import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { config } from './config.js';
import { networkScanner } from './services/networkScanner.js';
import { deviceRegistry } from './services/deviceRegistry.js';
import type { Device, WSMessage, FullStatePayload, DeviceEventPayload } from '../shared/types.js';

// 28 chairs around 4 tables (matching client layout)
const DESKS = [
  // Table 1 - Top side (5 chairs)
  { id: 1, gridX: 3, gridY: 3 }, { id: 2, gridX: 4, gridY: 3 },
  { id: 3, gridX: 5, gridY: 3 }, { id: 4, gridX: 6, gridY: 3 },
  { id: 5, gridX: 7, gridY: 3 },
  // Table 1 - Bottom side (5 chairs)
  { id: 6, gridX: 3, gridY: 6 }, { id: 7, gridX: 4, gridY: 6 },
  { id: 8, gridX: 5, gridY: 6 }, { id: 9, gridX: 6, gridY: 6 },
  { id: 10, gridX: 7, gridY: 6 },
  // Table 2 - Top side (2 chairs)
  { id: 11, gridX: 17, gridY: 3 }, { id: 12, gridX: 18, gridY: 3 },
  // Table 2 - Bottom side (2 chairs)
  { id: 13, gridX: 17, gridY: 6 }, { id: 14, gridX: 18, gridY: 6 },
  // Table 3 - Top side (5 chairs)
  { id: 15, gridX: 3, gridY: 10 }, { id: 16, gridX: 4, gridY: 10 },
  { id: 17, gridX: 5, gridY: 10 }, { id: 18, gridX: 6, gridY: 10 },
  { id: 19, gridX: 7, gridY: 10 },
  // Table 3 - Bottom side (5 chairs)
  { id: 20, gridX: 3, gridY: 13 }, { id: 21, gridX: 4, gridY: 13 },
  { id: 22, gridX: 5, gridY: 13 }, { id: 23, gridX: 6, gridY: 13 },
  { id: 24, gridX: 7, gridY: 13 },
  // Table 4 - Top side (2 chairs)
  { id: 25, gridX: 17, gridY: 10 }, { id: 26, gridX: 18, gridY: 10 },
  // Table 4 - Bottom side (2 chairs)
  { id: 27, gridX: 17, gridY: 13 }, { id: 28, gridX: 18, gridY: 13 },
];

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}

function getAvailableDesk(): number | null {
  const occupied = new Set(
    deviceRegistry.getOnlineDevices()
      .filter((d) => d.deskId !== null)
      .map((d) => d.deskId)
  );
  for (const desk of DESKS) {
    if (!occupied.has(desk.id)) return desk.id;
  }
  return null;
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  const fullState: FullStatePayload = { devices: deviceRegistry.getAllDevices(), desks: DESKS };
  ws.send(JSON.stringify({ type: 'state:full', payload: fullState }));
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'request:state') {
        const state: FullStatePayload = { devices: deviceRegistry.getAllDevices(), desks: DESKS };
        ws.send(JSON.stringify({ type: 'state:full', payload: state }));
      }
    } catch (e) { /* ignore */ }
  });
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

networkScanner.on('device:connected', (device: Device) => {
  if (device.deskId === null) {
    const deskId = getAvailableDesk();
    if (deskId !== null) {
      deviceRegistry.assignDesk(device.mac, deskId);
      device.deskId = deskId;
    }
  }
  broadcast({ type: 'device:connected', payload: { device } });
});

networkScanner.on('device:disconnected', (device: Device) => {
  broadcast({ type: 'device:disconnected', payload: { device } });
});

app.get('/api/devices', (_, res) => res.json(deviceRegistry.getAllDevices()));
app.get('/api/devices/online', (_, res) => res.json(deviceRegistry.getOnlineDevices()));

app.post('/api/devices/:mac/name', (req, res) => {
  const device = deviceRegistry.setDisplayName(req.params.mac, req.body.name);
  if (device) {
    broadcast({ type: 'device:updated', payload: { device } });
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/api/simulate/connect', (req, res) => {
  const testMac = req.body.mac || `test:${Date.now().toString(16)}`;
  const testIp = req.body.ip || `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
  const device = networkScanner.simulateConnect(testMac, testIp);
  res.json(device);
});

app.post('/api/simulate/disconnect', (req, res) => {
  const device = networkScanner.simulateDisconnect(req.body.mac);
  if (device) res.json(device);
  else res.status(404).json({ error: 'Device not found' });
});

server.listen(config.server.port, '0.0.0.0', () => {
  console.log(`Server: http://0.0.0.0:${config.server.port}`);
  console.log(`WebSocket: ws://0.0.0.0:${config.server.port}/ws`);
  console.log(`Access from network: http://192.168.1.192:${config.server.port}`);
  networkScanner.start();
});

process.on('SIGTERM', () => {
  networkScanner.stop();
  server.close();
});
