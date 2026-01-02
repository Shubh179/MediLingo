/**
 * Real-time Vehicle Tracking Service
 * Handles GPS location updates from delivery drivers and broadcasts to users
 */

import { Server, Socket } from 'socket.io';
import {
  LocationData,
  DriverInfo,
  TrackingUpdate,
  UserTrackingRequest,
  DriverConnectionInfo,
  TrackingRoom,
  TrackingEvents,
  TrackingError,
} from '../types/tracking';

export class TrackingService {
  private io: Server;
  private activeDrivers: Map<string, DriverConnectionInfo> = new Map();
  private trackingRooms: Map<string, TrackingRoom> = new Map();
  private driverLocations: Map<string, LocationData> = new Map();
  
  // Configuration
  private readonly LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly STALE_THRESHOLD = 30000; // 30 seconds - consider driver inactive
  
  constructor(io: Server) {
    this.io = io;
    this.initializeSocketHandlers();
    this.startStaleConnectionCleanup();
  }

  /**
   * Initialize Socket.io event handlers
   */
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      // Handle driver connection
      socket.on(TrackingEvents.DRIVER_CONNECT, (driverInfo: DriverInfo) => {
        this.handleDriverConnect(socket, driverInfo);
      });

      // Handle driver location updates (every 5 seconds)
      socket.on(TrackingEvents.DRIVER_LOCATION_UPDATE, (update: TrackingUpdate) => {
        this.handleLocationUpdate(socket, update);
      });

      // Handle user starting to track a driver
      socket.on(TrackingEvents.USER_START_TRACKING, (request: UserTrackingRequest) => {
        this.handleUserStartTracking(socket, request);
      });

      // Handle user stopping tracking
      socket.on(TrackingEvents.USER_STOP_TRACKING, (driverId: string) => {
        this.handleUserStopTracking(socket, driverId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle driver connection and registration
   */
  private handleDriverConnect(socket: Socket, driverInfo: DriverInfo): void {
    const { driverId } = driverInfo;
    
    console.log(`Driver connected: ${driverId} (Socket: ${socket.id})`);

    // Store driver connection info
    this.activeDrivers.set(driverId, {
      socketId: socket.id,
      driverId,
      connectedAt: Date.now(),
    });

    // Join driver to their personal room
    socket.join(`driver:${driverId}`);

    // Initialize tracking room if doesn't exist
    if (!this.trackingRooms.has(driverId)) {
      this.trackingRooms.set(driverId, {
        driverId,
        users: new Set(),
      });
    }

    // Notify all users tracking this driver that driver is online
    this.io.to(`tracking:${driverId}`).emit(TrackingEvents.DRIVER_STATUS_CHANGE, {
      driverId,
      isActive: true,
      timestamp: Date.now(),
    });

    // Acknowledge connection
    socket.emit(TrackingEvents.DRIVER_CONNECT, {
      success: true,
      message: 'Driver connected successfully',
      updateInterval: this.LOCATION_UPDATE_INTERVAL,
    });
  }

  /**
   * Handle location update from driver (every 5 seconds)
   * Broadcasts to all users tracking this driver
   */
  private handleLocationUpdate(socket: Socket, update: TrackingUpdate): void {
    const { driverId, location } = update;

    // Validate location data
    if (!this.isValidLocation(location)) {
      const error: TrackingError = {
        code: 'INVALID_LOCATION',
        message: 'Invalid location data received',
        timestamp: Date.now(),
      };
      socket.emit(TrackingEvents.TRACKING_ERROR, error);
      return;
    }

    // Update driver's last update time
    const driverInfo = this.activeDrivers.get(driverId);
    if (driverInfo) {
      driverInfo.lastLocationUpdate = Date.now();
      this.activeDrivers.set(driverId, driverInfo);
    }

    // Store latest location
    this.driverLocations.set(driverId, location);

    // Update tracking room
    const room = this.trackingRooms.get(driverId);
    if (room) {
      room.lastLocation = location;
    }

    // Broadcast to all users in the tracking room
    const trackingRoomName = `tracking:${driverId}`;
    this.io.to(trackingRoomName).emit(TrackingEvents.USER_LOCATION_RECEIVED, {
      driverId,
      location,
      orderId: update.orderId,
      timestamp: location.timestamp,
    });

    console.log(`Location broadcast for driver ${driverId} to ${room?.users.size || 0} users`);
  }

  /**
   * Handle user starting to track a specific driver
   */
  private handleUserStartTracking(socket: Socket, request: UserTrackingRequest): void {
    const { userId, driverId, orderId } = request;

    console.log(`User ${userId} started tracking driver ${driverId}`);

    // Join user to tracking room for this driver
    const trackingRoomName = `tracking:${driverId}`;
    socket.join(trackingRoomName);

    // Add user to tracking room record
    let room = this.trackingRooms.get(driverId);
    if (!room) {
      room = {
        driverId,
        users: new Set(),
      };
      this.trackingRooms.set(driverId, room);
    }
    room.users.add(socket.id);

    // Send current location if available
    const currentLocation = this.driverLocations.get(driverId);
    const isDriverActive = this.activeDrivers.has(driverId);

    socket.emit(TrackingEvents.USER_START_TRACKING, {
      success: true,
      driverId,
      orderId,
      isDriverActive,
      currentLocation: currentLocation || null,
      message: isDriverActive 
        ? 'Tracking started successfully' 
        : 'Driver is currently offline',
    });

    // If driver is active and has location, send immediate update
    if (currentLocation && isDriverActive) {
      socket.emit(TrackingEvents.USER_LOCATION_RECEIVED, {
        driverId,
        location: currentLocation,
        orderId,
        timestamp: currentLocation.timestamp,
      });
    }
  }

  /**
   * Handle user stopping tracking a driver
   */
  private handleUserStopTracking(socket: Socket, driverId: string): void {
    console.log(`Socket ${socket.id} stopped tracking driver ${driverId}`);

    // Leave tracking room
    const trackingRoomName = `tracking:${driverId}`;
    socket.leave(trackingRoomName);

    // Remove user from tracking room record
    const room = this.trackingRooms.get(driverId);
    if (room) {
      room.users.delete(socket.id);
      
      // Clean up room if no users are tracking
      if (room.users.size === 0) {
        this.trackingRooms.delete(driverId);
        console.log(`Tracking room for driver ${driverId} removed (no active users)`);
      }
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: Socket): void {
    console.log(`Socket disconnected: ${socket.id}`);

    // Check if this was a driver
    let disconnectedDriverId: string | null = null;
    for (const [driverId, info] of this.activeDrivers.entries()) {
      if (info.socketId === socket.id) {
        disconnectedDriverId = driverId;
        this.activeDrivers.delete(driverId);
        
        // Notify users tracking this driver
        this.io.to(`tracking:${driverId}`).emit(TrackingEvents.DRIVER_STATUS_CHANGE, {
          driverId,
          isActive: false,
          timestamp: Date.now(),
        });
        
        console.log(`Driver ${driverId} disconnected`);
        break;
      }
    }

    // Remove user from all tracking rooms they were in
    for (const [driverId, room] of this.trackingRooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          this.trackingRooms.delete(driverId);
        }
      }
    }
  }

  /**
   * Validate location data
   */
  private isValidLocation(location: LocationData): boolean {
    return (
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      typeof location.speed === 'number' &&
      typeof location.timestamp === 'number' &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180 &&
      location.speed >= 0 &&
      location.timestamp > 0
    );
  }

  /**
   * Cleanup stale connections (drivers who haven't sent updates)
   */
  private startStaleConnectionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [driverId, info] of this.activeDrivers.entries()) {
        const timeSinceLastUpdate = now - (info.lastLocationUpdate || info.connectedAt);
        
        if (timeSinceLastUpdate > this.STALE_THRESHOLD) {
          console.log(`Removing stale driver connection: ${driverId}`);
          this.activeDrivers.delete(driverId);
          
          // Notify users
          this.io.to(`tracking:${driverId}`).emit(TrackingEvents.DRIVER_STATUS_CHANGE, {
            driverId,
            isActive: false,
            timestamp: now,
            reason: 'Connection timeout',
          });
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get current tracking statistics
   */
  public getStats() {
    return {
      activeDrivers: this.activeDrivers.size,
      trackingRooms: this.trackingRooms.size,
      totalUsersTracking: Array.from(this.trackingRooms.values())
        .reduce((sum, room) => sum + room.users.size, 0),
    };
  }

  /**
   * Manually set/update a driver's location (for testing or manual updates)
   */
  public updateDriverLocation(driverId: string, location: LocationData): void {
    if (!this.isValidLocation(location)) {
      throw new Error('Invalid location data');
    }

    this.driverLocations.set(driverId, location);
    
    const room = this.trackingRooms.get(driverId);
    if (room) {
      room.lastLocation = location;
    }

    // Broadcast to tracking users
    this.io.to(`tracking:${driverId}`).emit(TrackingEvents.USER_LOCATION_RECEIVED, {
      driverId,
      location,
      timestamp: location.timestamp,
    });
  }

  /**
   * Get active driver IDs
   */
  public getActiveDriverIds(): string[] {
    return Array.from(this.activeDrivers.keys());
  }

  /**
   * Get location for a specific driver
   */
  public getDriverLocation(driverId: string): LocationData | null {
    return this.driverLocations.get(driverId) || null;
  }
}
