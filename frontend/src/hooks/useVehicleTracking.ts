import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { VehicleTracker } from '../lib/vehicleTracker';
import { GPSCoordinate } from '../lib/gpsUtils';
import { MarkerAnimator } from '../lib/markerAnimation';

export interface UseVehicleTrackingOptions {
  userId: string;
  driverId: string;
  orderId?: string;
  serverUrl?: string;
  animationDuration?: number;
}

export interface VehicleTrackingState {
  position: GPSCoordinate | null;
  heading: number;
  speed: number;
  isMoving: boolean;
  confidence: number;
  lastUpdate: number;
  isConnected: boolean;
  isTracking: boolean;
  error: string | null;
  animationProgress: number;
}

/**
 * Custom hook for vehicle tracking with Kalman Filter
 * Handles Socket.io connection, GPS updates, smooth prediction, and smooth animation
 * 
 * Features:
 * - Snap-to-smooth transitions for GPS jumps
 * - 60fps marker animation between 5-second GPS updates
 * - Kalman Filter smoothing for GPS noise reduction
 * - Adaptive heading transition
 */
export function useVehicleTracking(options: UseVehicleTrackingOptions) {
  const {
    userId,
    driverId,
    orderId,
    serverUrl = 'http://localhost:5000',
    animationDuration = 5000,
  } = options;

  const [state, setState] = useState<VehicleTrackingState>({
    position: null,
    heading: 0,
    speed: 0,
    isMoving: false,
    confidence: 0,
    lastUpdate: 0,
    isConnected: false,
    isTracking: false,
    error: null,
    animationProgress: 1,
  });

  const trackerRef = useRef<VehicleTracker | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const animatorRef = useRef<MarkerAnimator | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number>(0);

  // Initialize tracker and socket
  useEffect(() => {
    // Create default position - Mumbai Kandivali West (not Delhi)
    // This matches the OSM/Leaflet map default location
    const defaultPosition: GPSCoordinate = { latitude: 19.1890, longitude: 72.8398 };

    trackerRef.current = new VehicleTracker();
    animatorRef.current = new MarkerAnimator(defaultPosition, 0, animationDuration);

    // Connect to server
    socketRef.current = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection handlers
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to tracking server');
      setState((s) => ({ ...s, isConnected: true, error: null }));

      // Start tracking
      socketRef.current?.emit('user:startTracking', {
        userId,
        driverId,
        orderId,
      });
    });

    socketRef.current.on('user:startTracking', (response) => {
      if (response.success) {
        console.log('✅ Tracking started for driver:', driverId);
        setState((s) => ({ ...s, isTracking: true }));
      } else {
        setState((s) => ({
          ...s,
          error: response.message || 'Failed to start tracking',
        }));
      }
    });

    // GPS update handler
    socketRef.current.on('user:locationUpdate', (data) => {
      if (trackerRef.current && animatorRef.current) {
        // Log accuracy level from driver
        const accuracy = data.location.accuracy || 10;
        const accuracyLevel = accuracy < 20 ? '🟢 HIGH' : accuracy < 50 ? '🟡 MEDIUM' : '🔴 LOW';
        console.log(
          `📍 Received ${accuracyLevel} Accuracy GPS: (${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}) ±${accuracy.toFixed(0)}m | Source: ${data.location.source || 'unknown'}`
        );

        // Update Kalman Filter with new GPS measurement
        trackerRef.current.addGPSUpdate({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: accuracy,
          timestamp: data.location.timestamp || Date.now(),
        });

        // Get smoothed position from Kalman Filter
        const smoothedPosition = trackerRef.current.getCurrentPosition();
        
        if (smoothedPosition) {
          // Calculate heading from velocity
          const heading = calculateHeadingFromVelocity(
            smoothedPosition.velocity.vLat,
            smoothedPosition.velocity.vLng
          );

          // Get current animation progress before updating animator
          const currentProgress = animatorRef.current.getProgress();

          // Update animator with new target (implements snap-to-smooth)
          animatorRef.current.setTarget(
            smoothedPosition.position,
            heading,
            currentProgress
          );
        }
      }
    });

    // Driver status handler
    socketRef.current.on('driver:statusChange', (status) => {
      console.log(`Driver ${status.driverId} is ${status.isActive ? 'online' : 'offline'}`);
    });

    // Error handler
    socketRef.current.on('tracking:error', (error) => {
      setState((s) => ({ ...s, error: error.message }));
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setState((s) => ({ ...s, isConnected: false, isTracking: false }));
    });

    socketRef.current.on('connect_error', (error) => {
      setState((s) => ({ ...s, error: `Connection error: ${error.message}` }));
    });

    // Start 60fps animation loop
    function animate() {
      if (trackerRef.current && animatorRef.current) {
        // Get animated frame from marker animator
        const frame = animatorRef.current.getFrame();

        // Get stats from tracker for speed/confidence
        const stats = trackerRef.current.getStats();
        const currentPos = trackerRef.current.getCurrentPosition();

        // Calculate heading from velocity
        let heading = 0;
        if (currentPos) {
          heading = calculateHeadingFromVelocity(
            currentPos.velocity.vLat,
            currentPos.velocity.vLng
          );
        }

        // Smooth heading transition
        const smoothedHeading = smoothHeadingTransition(
          lastHeadingRef.current,
          heading
        );
        lastHeadingRef.current = smoothedHeading;

        setState((s) => ({
          ...s,
          position: frame.position,
          heading: smoothedHeading,
          speed: stats.currentSpeed,
          isMoving: stats.isMoving,
          confidence: stats.confidence,
          lastUpdate: Date.now(),
          animationProgress: frame.progress,
        }));
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      socketRef.current?.emit('user:stopTracking', driverId);
      socketRef.current?.disconnect();
    };
  }, [userId, driverId, orderId, serverUrl, animationDuration]);

  return {
    ...state,
    tracker: trackerRef.current,
    socket: socketRef.current,
  };
}

/**
 * Calculate heading (bearing) from velocity components
 * Returns degrees (0-360, 0 = North)
 */
function calculateHeadingFromVelocity(vLat: number, vLng: number): number {
  const heading = Math.atan2(vLng, vLat) * (180 / Math.PI);
  return (heading + 360) % 360;
}

/**
 * Smooth heading transition to prevent spinning
 * Takes shortest path between angles
 */
function smoothHeadingTransition(current: number, target: number): number {
  let diff = target - current;

  // Normalize to -180 to 180
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  // Smooth transition (10% per frame at 60fps)
  const smoothFactor = 0.1;
  const newHeading = current + diff * smoothFactor;

  return (newHeading + 360) % 360;
}
