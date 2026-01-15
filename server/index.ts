import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { config } from './config.js';
import { networkScanner } from './services/networkScanner.js';
import { deviceRegistry } from './services/deviceRegistry.js';
import type { Device, WSMessage, FullStatePayload, DeviceEventPayload } from '../shared/types.js';

const DESKS = [
  { id: 1, gridX: 3, gridY: 3 }, { id: 2, gridX: 6, gridY: 3 },
  { id: 3, gridX: 9, gridY: 3 }, { id: 4, gridX: 12, gridY: 3 },
  { id: 5, gridX: 15, gridY: 3 }, { id: 6, gridX: 18, gridY: 3 },
  { id: 7, gridX: 3, gridY: 7 }, { id: 8, gridX: 6, gridY: 7 },
  { id: 9, gridX: 9, gridY: 7 }, { id: 10, gridX: 12, gridY: 7 },
  { id: 11, gridX: 15, gridY: 7 }, { id: 12, gridX: 18, gridY: 7 },
  { id: 13, gridX: 3, gridY: 11 }, { id: 14, gridX: 6, gridY: 11 },
  { id: 15, gridX: 9, gridY: 11 }, { id: 16, gridX: 12, gridY: 11 },
  { id: 17, gridX: 15, gridY: 11 }, { id: 18, gridX: 18, gridY: 11 },
  { id: 19, gridX: 3, gridY: 15 }, { id: 20, gridX: 6, gridY: 15 },
  { id: 21, gridX: 9, gridY: 15 }, { id: 22, gridX: 12, gridY: 15 },
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

server.listen(config.server.port, () => {
  console.log(`Server: http://localhost:${config.server.port}`);
  console.log(`WebSocket: ws://localhost:${config.server.port}/ws`);
  networkScanner.start();
});

process.on('SIGTERM', () => {
  networkScanner.stop();
  server.close();
});
