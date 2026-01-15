import type { WSMessage, FullStatePayload, DeviceEventPayload } from '../../../shared/types';

type Handler = (payload: unknown) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Handler[]> = new Map();
  private reconnectAttempts = 0;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly CONNECTION_TIMEOUT_MS = 5000; // 5 second timeout

  constructor(private url: string) {
    this.connect();
  }

  getUrl(): string {
    return this.url;
  }

  private connect(): void {
    console.log(`Connecting to WebSocket: ${this.url}`);

    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('WebSocket creation failed:', e);
      this.attemptReconnect();
      return;
    }

    // Set connection timeout - if stuck in CONNECTING state, force reconnect
    this.connectionTimeout = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection timeout - forcing reconnect');
        try {
          this.ws.close();
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
        this.attemptReconnect();
      }
    }, this.CONNECTION_TIMEOUT_MS);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        (this.handlers.get(msg.type) || []).forEach((h) => h(msg.payload));
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    this.ws.onclose = (e) => {
      console.log(`WebSocket closed: code=${e.code}, reason=${e.reason || 'none'}`);
      this.attemptReconnect();
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
  }

  private attemptReconnect(): void {
    // Clear timeout if exists
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.reconnectAttempts++ < 10) {
      // Exponential backoff: 2s, 3s, 4.5s, 6.75s... max 30s
      const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
      console.log(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/10)`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached - giving up');
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

  requestFullState(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request:state' }));
    }
  }
}
