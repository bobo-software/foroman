/**
 * Skaftin Backend SDK - Main Export
 */

export { skaftinClient, SkaftinClient } from './client/SkaftinClient';
export type { ApiResponse } from './client/SkaftinClient';

// WebSocket service
export { default as webSocketService, webSocketService as ws } from './services/WebSocketService';
export type {
  DatabaseEvent,
  ProjectEvent,
  ConnectionStatus,
  DatabaseEventType,
} from './services/WebSocketService';
