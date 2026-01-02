/**
 * Example: Using VehicleTracker with Socket.io for Smooth GPS Tracking
 * 
 * This demonstrates how to integrate the Kalman Filter-based tracker
 * with real-time GPS updates and render smoothly at 60fps.
 * 
 * NOTE: Install socket.io-client first: npm install socket.io-client
 */

import { VehicleTracker, LocationUpdate } from '../lib/vehicleTracker';

// Socket.io types (install socket.io-client to use)
type Socket = any;

/**
 * Example 1: Basic Integration with Socket.io
 * Install first: npm install socket.io-client
 */
export function basicTrackingExample() {
  // Initialize tracker
  const tracker = new VehicleTracker({
    // Use default configuration (tuned for urban driving)
  });

  // Connect to tracking server
  // Uncomment after installing socket.io-client:
  // const io = require('socket.io-client').io;
  // const socket: Socket = io('http://localhost:5000');

  const socket: any = null; // Placeholder

  if (!socket) {
    console.log('Install socket.io-client to run this example');
    return { tracker, socket: null };
  }

  // Start tracking a specific driver
  socket.emit('user:startTracking', {
    userId: 'USER123',
    driverId: 'DRIVER456',
    orderId: 'ORD789',
  });

  // When GPS update arrives (every 5 seconds)
  socket.on('user:locationUpdate', (data: any) => {
    console.log('📍 GPS Update received:', data.location);

    // Feed to Kalman Filter
    tracker.addGPSUpdate({
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      speed: data.location.speed,
      timestamp: data.location.timestamp,
      accuracy: data.location.accuracy,
      heading: data.location.heading,
    });

    console.log('✅ Kalman Filter updated');
  });

  // For smooth 60fps animation
  function render() {
    const predicted = tracker.getCurrentPosition();

    if (predicted) {
      console.log('📍 Smooth position:', {
        lat: predicted.position.latitude.toFixed(6),
        lng: predicted.position.longitude.toFixed(6),
        speed: predicted.velocity.speedKmh.toFixed(1) + ' km/h',
        confidence: (predicted.confidence * 100).toFixed(1) + '%',
      });

      // Update map marker here
      // map.setMarkerPosition(predicted.position);
    }

    requestAnimationFrame(render);
  }

  // Start 60fps rendering loop
  requestAnimationFrame(render);

  return { tracker, socket };
}

/**
 * Example 2: React Component with Kalman Filter
 */
export function ReactTrackingComponent() {
  // This is TypeScript/JSX pseudocode
  return `
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { VehicleTracker } from './lib/vehicleTracker';

export function LiveDeliveryMap({ driverId, orderId }) {
  const [position, setPosition] = useState(null);
  const [speed, setSpeed] = useState(0);
  const trackerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Initialize tracker
    trackerRef.current = new VehicleTracker();
    
    // Connect to server
    const socket = io('http://localhost:5000');
    
    // Start tracking
    socket.emit('user:startTracking', {
      userId: 'currentUser',
      driverId,
      orderId,
    });
    
    // Handle GPS updates (every 5 seconds)
    socket.on('user:locationUpdate', (data) => {
      trackerRef.current.addGPSUpdate({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        speed: data.location.speed,
        timestamp: data.location.timestamp,
        accuracy: data.location.accuracy,
      });
    });
    
    // 60fps rendering
    const animate = () => {
      const predicted = trackerRef.current.getCurrentPosition();
      if (predicted) {
        setPosition(predicted.position);
        setSpeed(predicted.velocity.speedKmh);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      socket.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [driverId, orderId]);

  return (
    <div>
      <h2>Live Delivery Tracking</h2>
      {position && (
        <>
          <Map center={position} zoom={15}>
            <Marker position={position} />
          </Map>
          <p>Speed: {speed.toFixed(1)} km/h</p>
        </>
      )}
    </div>
  );
}
  `;
}

/**
 * Example 3: Custom Configuration for Different Scenarios
 */
export function customConfigurationExamples() {
  // High-accuracy configuration (for slower vehicles, more GPS updates)
  const highAccuracyTracker = new VehicleTracker({
    processNoisePosition: 5e-7, // Lower - expect smooth motion
    processNoiseVelocity: 5e-5, // Lower - gradual speed changes
    measurementNoisePosition: 5e-6, // Trust GPS more
    measurementNoiseVelocity: 5e-4,
  });

  // Urban/aggressive driving configuration
  const urbanTracker = new VehicleTracker({
    processNoisePosition: 2e-6, // Higher - expect quick turns
    processNoiseVelocity: 2e-4, // Higher - sudden accelerations
    measurementNoisePosition: 1e-5,
    measurementNoiseVelocity: 1e-3,
    enableTurnDetection: true,
  });

  // Highway configuration (straighter paths, higher speeds)
  const highwayTracker = new VehicleTracker({
    processNoisePosition: 5e-7, // Lower - straighter paths
    processNoiseVelocity: 1e-4,
    measurementNoisePosition: 1e-5,
    measurementNoiseVelocity: 5e-4,
    maxGapBeforeReset: 60, // Longer tolerance
  });

  return { highAccuracyTracker, urbanTracker, highwayTracker };
}

/**
 * Example 4: Simulating GPS Updates for Testing
 */
export function simulateGPSUpdates() {
  const tracker = new VehicleTracker();

  // Simulate vehicle moving along a route
  const route = [
    { lat: 28.6139, lng: 77.2090 }, // Start (Connaught Place, Delhi)
    { lat: 28.6200, lng: 77.2150 }, // Move northeast
    { lat: 28.6280, lng: 77.2200 }, // Continue
    { lat: 28.6350, lng: 77.2180 }, // Turn west
    { lat: 28.6400, lng: 77.2100 }, // Continue west
  ];

  let currentIndex = 0;
  const baseTime = Date.now();

  // Simulate GPS updates every 5 seconds
  const updateInterval = setInterval(() => {
    if (currentIndex >= route.length) {
      clearInterval(updateInterval);
      return;
    }

    const point = route[currentIndex];
    const update: LocationUpdate = {
      latitude: point.lat,
      longitude: point.lng,
      speed: 45 + Math.random() * 10, // 45-55 km/h
      timestamp: baseTime + currentIndex * 5000,
      accuracy: 10 + Math.random() * 5, // 10-15m accuracy
      heading: Math.random() * 360,
    };

    console.log(`[${currentIndex}] GPS Update:`, update);
    tracker.addGPSUpdate(update);

    currentIndex++;
  }, 5000);

  // Render at 60fps
  function render() {
    const predicted = tracker.getCurrentPosition();
    if (predicted) {
      console.log('Smooth Position:', {
        lat: predicted.position.latitude.toFixed(6),
        lng: predicted.position.longitude.toFixed(6),
        speed: predicted.velocity.speedKmh.toFixed(1),
        confidence: (predicted.confidence * 100).toFixed(1) + '%',
        timeSinceUpdate: predicted.timeSinceLastUpdate.toFixed(2) + 's',
      });
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  return tracker;
}

/**
 * Example 5: Comparing Raw GPS vs Kalman Filtered
 */
export function compareRawVsFiltered() {
  const tracker = new VehicleTracker();
  const rawPositions: any[] = [];
  const filteredPositions: any[] = [];

  // Simulate noisy GPS
  function simulateNoisyGPS(baseLat: number, baseLng: number): LocationUpdate {
    // Add random noise (±10 meters)
    const noiseLat = (Math.random() - 0.5) * 0.0001;
    const noiseLng = (Math.random() - 0.5) * 0.0001;

    return {
      latitude: baseLat + noiseLat,
      longitude: baseLng + noiseLng,
      speed: 40 + Math.random() * 10,
      timestamp: Date.now(),
      accuracy: 10,
    };
  }

  // Simulate movement
  let baseLat = 28.6139;
  let baseLng = 77.2090;

  setInterval(() => {
    // Move slightly northeast
    baseLat += 0.0001;
    baseLng += 0.0001;

    const rawUpdate = simulateNoisyGPS(baseLat, baseLng);
    rawPositions.push({ lat: rawUpdate.latitude, lng: rawUpdate.longitude });

    tracker.addGPSUpdate(rawUpdate);

    const filtered = tracker.getCurrentPosition();
    if (filtered) {
      filteredPositions.push({
        lat: filtered.position.latitude,
        lng: filtered.position.longitude,
      });
    }

    // Compare
    if (rawPositions.length > 1) {
      const lastRaw = rawPositions[rawPositions.length - 1];
      const lastFiltered = filteredPositions[filteredPositions.length - 1];

      console.log('Raw GPS:', lastRaw.lat.toFixed(6), lastRaw.lng.toFixed(6));
      console.log(
        'Filtered:',
        lastFiltered.lat.toFixed(6),
        lastFiltered.lng.toFixed(6)
      );
      console.log('---');
    }
  }, 5000);

  return { rawPositions, filteredPositions };
}

/**
 * Example 6: Predicting Future Position (ETA calculation)
 */
export function predictFuturePosition() {
  const tracker = new VehicleTracker();

  // After receiving GPS updates...
  // (assume tracker is initialized and has recent data)

  // Predict where vehicle will be in 30 seconds
  const futurePos30s = tracker.predictPositionAhead(30);
  console.log('Predicted position in 30s:', futurePos30s);

  // Predict position in 1 minute
  const futurePos60s = tracker.predictPositionAhead(60);
  console.log('Predicted position in 60s:', futurePos60s);

  // Calculate ETA to destination
  function calculateETA(
    tracker: VehicleTracker,
    destination: { lat: number; lng: number }
  ): number {
    const current = tracker.getCurrentPosition();
    if (!current) return 0;

    const currentSpeed = current.velocity.speedKmh;
    if (currentSpeed < 1) return Infinity; // Not moving

    // Simple distance calculation (Haversine)
    const R = 6371; // Earth radius in km
    const dLat = ((destination.lat - current.position.latitude) * Math.PI) / 180;
    const dLng = ((destination.lng - current.position.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((current.position.latitude * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // ETA in seconds
    const etaSeconds = (distanceKm / currentSpeed) * 3600;

    return etaSeconds;
  }

  const destination = { lat: 28.7041, lng: 77.1025 }; // India Gate
  const eta = calculateETA(tracker, destination);
  console.log(`ETA: ${(eta / 60).toFixed(1)} minutes`);

  return eta;
}

/**
 * Example 7: Handling Connection Loss and Recovery
 */
export function handleConnectionLoss() {
  const tracker = new VehicleTracker({
    maxGapBeforeReset: 30, // Reset if no update for 30 seconds
  });

  let lastUpdateTime = Date.now();

  // Check for stale data
  setInterval(() => {
    const stats = tracker.getStats();
    const timeSinceUpdate = stats.timeSinceLastUpdate;

    if (timeSinceUpdate > 15) {
      console.warn(`⚠️  No GPS update for ${timeSinceUpdate.toFixed(0)}s`);
    }

    if (timeSinceUpdate > 30) {
      console.error('❌ GPS connection lost, showing last known position');
      // Show warning to user
      // displayConnectionLostWarning();
    }

    if (stats.confidence < 0.3) {
      console.warn('⚠️  Low tracking confidence');
    }
  }, 1000);

  return tracker;
}

// Export all examples
export default {
  basicTrackingExample,
  customConfigurationExamples,
  simulateGPSUpdates,
  compareRawVsFiltered,
  predictFuturePosition,
  handleConnectionLoss,
};
