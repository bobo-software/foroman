// src/hooks/index.ts

// Auth hooks
export { useAuth } from './useAuth';
export { useAuthSync } from './useAuthSync';
export { useSessionCheck } from './useSessionCheck';
export { useTokenRefresh } from './useTokenRefresh';

// WebSocket hooks
export {
  useWebSocket,
  useDatabaseEvents,
  useProjectEvents,
  useAutoRefresh,
  useLastDatabaseEvent,
} from './useWebSocket';

// WebSocket context hooks
export { useWebSocketContext, useProjectId } from '../components/WebSocketProvider';
