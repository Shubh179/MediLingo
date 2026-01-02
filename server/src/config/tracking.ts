/**
 * Vehicle Tracking Configuration
 * Settings for real-time GPS tracking system
 */

export const TRACKING_CONFIG = {
  // Location update intervals
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds - driver sends updates
  STALE_CONNECTION_THRESHOLD: 30000, // 30 seconds - mark driver as inactive
  CLEANUP_INTERVAL: 10000, // 10 seconds - cleanup check frequency
  
  // Socket.io settings
  PING_TIMEOUT: 60000, // 60 seconds
  PING_INTERVAL: 25000, // 25 seconds
  
  // GPS validation
  MAX_LATITUDE: 90,
  MIN_LATITUDE: -90,
  MAX_LONGITUDE: 180,
  MIN_LONGITUDE: -180,
  MIN_SPEED: 0,
  MAX_SPEED: 200, // km/h - maximum reasonable speed
  
  // Location accuracy thresholds (in meters)
  HIGH_ACCURACY: 10,
  MEDIUM_ACCURACY: 50,
  LOW_ACCURACY: 100,
  
  // Room settings
  MAX_USERS_PER_DRIVER: 100, // Maximum users tracking one driver
  
  // Feature flags
  ENABLE_LOCATION_HISTORY: true,
  ENABLE_GEOFENCING: false,
  ENABLE_ROUTE_OPTIMIZATION: false,
};

export type TrackingConfig = typeof TRACKING_CONFIG;
