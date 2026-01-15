import { WebSocketManager } from './WebSocketManager';

// Use current hostname for network access (smart TV, etc.)
const wsHost = window.location.hostname || 'localhost';
export const apiBase = `http://${wsHost}:3001`;
export const wsManager = new WebSocketManager(`ws://${wsHost}:3001/ws`);
export { wsHost };
