/**
 * Vehicle Tracking Types for Medicine Delivery
 * Handles real-time GPS tracking of delivery drivers
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number; // in km/h
  timestamp: number; // Unix timestamp in milliseconds
  accuracy?: number; // GPS accuracy in meters
  heading?: number; // Direction in degrees (0-360)
}

export interface DriverInfo {
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  phoneNumber: string;
  currentLocation?: LocationData;
  isActive: boolean;
  lastUpdateTime?: number;
}

export interface TrackingUpdate {
  driverId: string;
  location: LocationData;
  orderId?: string; // Optional: link to specific order
}

export interface UserTrackingRequest {
  userId: string;
  driverId: string; // Which driver to track
  orderId?: string; // Optional: order being tracked
}

export interface DriverConnectionInfo {
  socketId: string;
  driverId: string;
  connectedAt: number;
  lastLocationUpdate?: number;
}

export interface TrackingRoom {
  driverId: string;
  users: Set<string>; // Set of user socket IDs tracking this driver
  lastLocation?: LocationData;
}

// Socket.io event names
export enum TrackingEvents {
  // Driver events
  DRIVER_CONNECT = 'driver:connect',
  DRIVER_DISCONNECT = 'driver:disconnect',
  DRIVER_LOCATION_UPDATE = 'driver:location',
  
  // User events
  USER_START_TRACKING = 'user:startTracking',
  USER_STOP_TRACKING = 'user:stopTracking',
  USER_LOCATION_RECEIVED = 'user:locationUpdate',
  
  // System events
  TRACKING_ERROR = 'tracking:error',
  DRIVER_STATUS_CHANGE = 'driver:statusChange',
}

export interface TrackingError {
  code: string;
  message: string;
  timestamp: number;
}
