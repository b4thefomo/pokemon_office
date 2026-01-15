import type { WSMessage, FullStatePayload, DeviceEventPayload } from '../../../shared/types';

type Handler = (payload: unknown) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Handler[]> = new Map();
  private reconnectAttempts = 0;

  constructor(private url: string) {
    this.connect();
  }

  private connect(): void {
    console.log(`Connecting to WebSocket: ${this.url}`);
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { console.log('WebSocket connected'); this.reconnectAttempts = 0; };
    this.ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        (this.handlers.get(msg.type) || []).forEach((h) => h(msg.payload));
      } catch (err) { console.error('Failed to parse message:', err); }
    };
    this.ws.onclose = () => this.attemptReconnect();
    this.ws.onerror = (e) => console.error('WebSocket error:', e);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts++ < 10) {
      setTimeout(() => this.connect(), 2000);
    }
  }

  on(type: string, handler: Handler): void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  onFullState(h: (p: FullStatePayload) => void) { this.on('state:full', h as Handler); }
  onDeviceConnected(h: (p: DeviceEventPayload) => void) { this.on('device:connected', h as Handler); }
  onDeviceDisconnected(h: (p: DeviceEventPayload) => void) { this.on('device:disconnected', h as Handler); }
  onDeviceUpdated(h: (p: DeviceEventPayload) => void) { this.on('device:updated', h as Handler); }
}
