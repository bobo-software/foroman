import { io, Socket } from 'socket.io-client';
import { SKAFTIN_CONFIG } from '../../config/skaftin.config';

/**
 * Database change event types
 */
export type DatabaseEventType =
  | 'insert'
  | 'update'
  | 'delete'
  | 'create_table'
  | 'drop_table'
  | 'rename_table'
  | 'add_column'
  | 'alter_column'
  | 'drop_column'
  | 'create_constraint'
  | 'drop_constraint'
  | 'create_cron_job'
  | 'update_cron_job'
  | 'delete_cron_job'
  | 'toggle_cron_job'
  | 'import_dump';

/**
 * Database change event
 */
export interface DatabaseEvent {
  type: DatabaseEventType;
  projectId: string;
  tableName: string;
  data?: any;
  oldData?: any;
  timestamp: string;
}

/**
 * Project-level event
 */
export interface ProjectEvent {
  type: string;
  projectId: string;
  data: any;
  timestamp: string;
}

/**
 * Connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  reconnectAttempts: number;
  socketId: string | null;
}

type ConnectionListener = (status: ConnectionStatus) => void;

/**
 * WebSocket service for real-time updates
 *
 * Automatically connects to Skaftin WebSocket server using API URL from config.
 * Project ID is automatically extracted from API key/token.
 */
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentProjectId: string | null = null;
  private connectionListeners: Set<ConnectionListener> = new Set();
  private initialized = false;

  /**
   * Initialize and connect to WebSocket server
   * Call this when your app starts (e.g., in App.tsx or a provider)
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect() {
    const apiUrl = SKAFTIN_CONFIG.apiUrl;

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Skaftin WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners();

      // Rejoin project room if we were in one
      if (this.currentProjectId) {
        this.joinProject(this.currentProjectId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      this.notifyConnectionListeners();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.notifyConnectionListeners();
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔌 Failed to reconnect to WebSocket server');
    });

    // Handle project room join confirmation
    this.socket.on('joined-project', ({ projectId, room }) => {
      console.log(`📁 Joined project room: ${room}`);
    });

    // Handle project room leave confirmation
    this.socket.on('left-project', ({ projectId, room }) => {
      console.log(`📁 Left project room: ${room}`);
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: ConnectionListener) {
    this.connectionListeners.add(callback);
    // Immediately notify with current status
    callback(this.getConnectionStatus());
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyConnectionListeners() {
    const status = this.getConnectionStatus();
    this.connectionListeners.forEach((listener) => listener(status));
  }

  /**
   * Join a project room to receive project-specific updates
   * Project ID is automatically extracted from your API key/token
   */
  joinProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.currentProjectId = projectId;
      this.socket.emit('join-project', projectId);
      console.log(`📁 Joining project room: ${projectId}`);
    } else {
      // Store project ID to join when connected
      this.currentProjectId = projectId;
    }
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-project', projectId);
      if (this.currentProjectId === projectId) {
        this.currentProjectId = null;
      }
      console.log(`📁 Leaving project room: ${projectId}`);
    }
  }

  /**
   * Listen for database change events
   */
  onDatabaseChange(callback: (event: DatabaseEvent) => void) {
    if (this.socket) {
      this.socket.on('database-change', callback);
    }
  }

  /**
   * Remove database change listener
   */
  offDatabaseChange(callback: (event: DatabaseEvent) => void) {
    if (this.socket) {
      this.socket.off('database-change', callback);
    }
  }

  /**
   * Listen for project events
   */
  onProjectEvent(callback: (event: ProjectEvent) => void) {
    if (this.socket) {
      this.socket.on('project-event', callback);
    }
  }

  /**
   * Remove project event listener
   */
  offProjectEvent(callback: (event: ProjectEvent) => void) {
    if (this.socket) {
      this.socket.off('project-event', callback);
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }

  /**
   * Get current project ID
   */
  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentProjectId = null;
      this.notifyConnectionListeners();
    }
  }

  /**
   * Reconnect to server
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
export { webSocketService };
export type { DatabaseEvent, ProjectEvent, ConnectionStatus, DatabaseEventType };
