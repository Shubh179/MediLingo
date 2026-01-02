/**
 * Vehicle Tracker - High-Level GPS Tracking with Kalman Filter
 * 
 * Integrates Kalman Filter with GPS updates for smooth 60fps rendering.
 * Handles:
 * - 5-second GPS bursts from server
 * - Smooth interpolation between updates
 * - Automatic velocity calculation
 * - Position prediction for real-time rendering
 */

import { KalmanFilter, KalmanState, KalmanConfig } from './kalmanFilter';
import { GPSCoordinate, calculateVelocity, haversineDistance, isValidGPS } from './gpsUtils';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  speed?: number; // km/h (optional from GPS)
  timestamp: number;
  accuracy?: number; // meters
  heading?: number; // degrees
}

export interface TrackerConfig extends Partial<KalmanConfig> {
  // Maximum time gap before resetting filter (seconds)
  maxGapBeforeReset?: number;
  
  // Minimum speed to consider vehicle as moving (km/h)
  minMovingSpeed?: number;
  
  // Enable automatic turn detection
  enableTurnDetection?: boolean;
}

export interface PredictedPosition {
  position: GPSCoordinate;
  velocity: { vLat: number; vLng: number; speedKmh: number };
  confidence: number; // 0-1, based on uncertainty
  timeSinceLastUpdate: number; // seconds
}

/**
 * VehicleTracker - Main class for smooth GPS tracking
 * 
 * Usage:
 * ```ts
 * const tracker = new VehicleTracker();
 * 
 * // When GPS update arrives (every 5 seconds)
 * tracker.addGPSUpdate({
 *   latitude: 28.6139,
 *   longitude: 77.2090,
 *   speed: 45,
 *   timestamp: Date.now()
 * });
 * 
 * // For 60fps rendering (called every 16ms)
 * const position = tracker.getCurrentPosition();
 * updateMapMarker(position);
 * ```
 */
export class VehicleTracker {
  private kalmanFilter: KalmanFilter | null = null;
  private lastGPSUpdate: LocationUpdate | null = null;
  private previousGPSUpdate: LocationUpdate | null = null;
  private config: Required<TrackerConfig>;
  private isInitialized = false;
  
  // Performance tracking
  private updateCount = 0;
  private lastPredictionTime = 0;

  constructor(config?: TrackerConfig) {
    this.config = {
      // Kalman Filter defaults (tuned for urban driving)
      processNoisePosition: 1e-6,
      processNoiseVelocity: 1e-4,
      measurementNoisePosition: 1e-5,
      measurementNoiseVelocity: 1e-3,
      initialUncertaintyPosition: 1e-4,
      initialUncertaintyVelocity: 1e-2,
      
      // Tracker-specific defaults
      maxGapBeforeReset: 30, // 30 seconds
      minMovingSpeed: 1, // 1 km/h
      enableTurnDetection: true,
      
      ...config,
    };
  }

  /**
   * Add a new GPS update (called when server sends location)
   * This is the main input - receives updates every ~5 seconds
   */
  public addGPSUpdate(update: LocationUpdate): void {
    if (!isValidGPS({ latitude: update.latitude, longitude: update.longitude })) {
      console.warn('Invalid GPS coordinates received:', update);
      return;
    }

    const now = Date.now();
    
    // Store previous update
    if (this.lastGPSUpdate) {
      this.previousGPSUpdate = this.lastGPSUpdate;
    }
    
    this.lastGPSUpdate = update;
    this.updateCount++;

    // Calculate time difference
    const timeDiff = this.previousGPSUpdate
      ? (update.timestamp - this.previousGPSUpdate.timestamp) / 1000
      : 0;

    // Check for large time gap - reset filter
    if (timeDiff > this.config.maxGapBeforeReset || !this.isInitialized) {
      this.initializeFilter(update);
      return;
    }

    // Calculate velocity from GPS updates
    const velocity = this.previousGPSUpdate
      ? calculateVelocity(
          { latitude: this.previousGPSUpdate.latitude, longitude: this.previousGPSUpdate.longitude },
          { latitude: update.latitude, longitude: update.longitude },
          timeDiff
        )
      : { vLat: 0, vLng: 0, speedKmh: 0 };

    // Create Kalman state from GPS measurement
    const measurement: KalmanState = {
      position: {
        latitude: update.latitude,
        longitude: update.longitude,
      },
      velocity: velocity,
      timestamp: update.timestamp,
    };

    // Predict forward to current measurement time
    if (this.kalmanFilter) {
      this.kalmanFilter.predict(timeDiff);
      
      // Adjust measurement noise based on GPS accuracy
      if (update.accuracy) {
        this.kalmanFilter.setMeasurementNoise(update.accuracy);
      }
      
      // Detect sharp turns and increase process noise
      if (this.config.enableTurnDetection && this.previousGPSUpdate) {
        this.detectAndHandleTurn(update, this.previousGPSUpdate);
      }
      
      // Update filter with new measurement
      this.kalmanFilter.update(measurement);
      this.kalmanFilter.resetProcessNoise(); // Reset after update
    }

    this.lastPredictionTime = now;
  }

  /**
   * Get current smoothed position for rendering
   * Call this at 60fps (every ~16ms) for smooth animation
   * 
   * @returns Predicted position with velocity and confidence
   */
  public getCurrentPosition(): PredictedPosition | null {
    if (!this.kalmanFilter || !this.lastGPSUpdate) {
      return null;
    }

    const now = Date.now();
    const timeSinceLastUpdate = (now - this.lastGPSUpdate.timestamp) / 1000;

    // If too much time has passed, don't extrapolate
    if (timeSinceLastUpdate > this.config.maxGapBeforeReset) {
      console.warn('GPS data stale, returning last known position');
      return {
        position: {
          latitude: this.lastGPSUpdate.latitude,
          longitude: this.lastGPSUpdate.longitude,
        },
        velocity: { vLat: 0, vLng: 0, speedKmh: 0 },
        confidence: 0,
        timeSinceLastUpdate,
      };
    }

    // Predict position at current time
    const timeSinceLastPrediction = (now - this.lastPredictionTime) / 1000;
    
    // Don't predict too far ahead (max 1 second)
    const safeDeltaTime = Math.min(timeSinceLastPrediction, 1.0);
    
    const predictedPos = this.kalmanFilter.predictNextPosition(safeDeltaTime);
    const state = this.kalmanFilter.getState();
    
    // Calculate confidence based on uncertainty and time
    const uncertainty = this.kalmanFilter.getPositionUncertainty();
    const avgUncertainty = (uncertainty.lat + uncertainty.lng) / 2;
    
    // Confidence decreases with uncertainty and time since last update
    const baseConfidence = Math.exp(-avgUncertainty * 1000); // Normalize
    const timeDecay = Math.exp(-timeSinceLastUpdate / 10); // Decay over 10 seconds
    const confidence = baseConfidence * timeDecay;

    // Calculate speed from velocity
    const speedKmh = Math.sqrt(
      state.velocity.vLat * state.velocity.vLat +
      state.velocity.vLng * state.velocity.vLng
    ) * 111320 * 3.6; // Convert to km/h

    return {
      position: predictedPos,
      velocity: {
        vLat: state.velocity.vLat,
        vLng: state.velocity.vLng,
        speedKmh,
      },
      confidence,
      timeSinceLastUpdate,
    };
  }

  /**
   * Get predicted position at a specific future time
   * Useful for showing estimated arrival or path
   * 
   * @param secondsAhead - How many seconds in the future
   */
  public predictPositionAhead(secondsAhead: number): GPSCoordinate | null {
    if (!this.kalmanFilter) return null;
    
    // Limit prediction to reasonable timeframe
    const safeDeltaTime = Math.min(secondsAhead, 60); // Max 60 seconds
    
    return this.kalmanFilter.predictNextPosition(safeDeltaTime);
  }

  /**
   * Check if vehicle is currently moving
   */
  public isMoving(): boolean {
    const current = this.getCurrentPosition();
    return current ? current.velocity.speedKmh > this.config.minMovingSpeed : false;
  }

  /**
   * Get current speed in km/h
   */
  public getCurrentSpeed(): number {
    const current = this.getCurrentPosition();
    return current ? current.velocity.speedKmh : 0;
  }

  /**
   * Get tracking statistics
   */
  public getStats() {
    const current = this.getCurrentPosition();
    const uncertainty = this.kalmanFilter?.getPositionUncertainty();
    
    return {
      isInitialized: this.isInitialized,
      updateCount: this.updateCount,
      lastUpdateTime: this.lastGPSUpdate?.timestamp || 0,
      timeSinceLastUpdate: current?.timeSinceLastUpdate || 0,
      currentSpeed: current?.velocity.speedKmh || 0,
      confidence: current?.confidence || 0,
      positionUncertainty: uncertainty || { lat: 0, lng: 0 },
      isMoving: this.isMoving(),
    };
  }

  /**
   * Reset the tracker
   */
  public reset(): void {
    this.kalmanFilter = null;
    this.lastGPSUpdate = null;
    this.previousGPSUpdate = null;
    this.isInitialized = false;
    this.updateCount = 0;
  }

  /**
   * Initialize Kalman Filter with first GPS update
   */
  private initializeFilter(update: LocationUpdate): void {
    const initialState: KalmanState = {
      position: {
        latitude: update.latitude,
        longitude: update.longitude,
      },
      velocity: {
        vLat: 0,
        vLng: 0,
      },
      timestamp: update.timestamp,
    };

    this.kalmanFilter = new KalmanFilter(initialState, this.config);
    this.isInitialized = true;
    this.lastPredictionTime = Date.now();
    
    console.log('Vehicle tracker initialized at:', update.latitude, update.longitude);
  }

  /**
   * Detect sharp turns and adjust filter parameters
   * Sharp turns violate the constant velocity assumption
   */
  private detectAndHandleTurn(
    current: LocationUpdate,
    previous: LocationUpdate
  ): void {
    if (!this.kalmanFilter) return;

    // Calculate distance traveled
    const distance = haversineDistance(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: current.latitude, longitude: current.longitude }
    );

    // Calculate time difference
    const timeDiff = (current.timestamp - previous.timestamp) / 1000;
    if (timeDiff <= 0) return;

    // Calculate average velocity
    const avgSpeed = (distance / timeDiff) * 3.6; // km/h

    // If speed changed significantly, it might be a turn or maneuver
    if (previous.speed && current.speed) {
      const speedChange = Math.abs(current.speed - previous.speed);
      const speedChangePercent = speedChange / Math.max(previous.speed, 1);

      // If speed changed by more than 30%, increase process noise
      if (speedChangePercent > 0.3) {
        this.kalmanFilter.increaseProcessNoise(3);
        console.log('Turn/maneuver detected, increased process noise');
      }
    }

    // Check for heading change if available
    if (previous.heading !== undefined && current.heading !== undefined) {
      let headingChange = Math.abs(current.heading - previous.heading);
      
      // Normalize to 0-180
      if (headingChange > 180) {
        headingChange = 360 - headingChange;
      }

      // If heading changed by more than 30 degrees, it's a turn
      if (headingChange > 30) {
        this.kalmanFilter.increaseProcessNoise(2);
        console.log(`Sharp turn detected: ${headingChange.toFixed(1)}°`);
      }
    }
  }

  /**
   * Get last raw GPS update (before filtering)
   */
  public getLastRawGPS(): LocationUpdate | null {
    return this.lastGPSUpdate;
  }

  /**
   * Force update the filter state (for debugging)
   */
  public forceUpdate(state: KalmanState): void {
    if (this.kalmanFilter) {
      this.kalmanFilter.reset(state);
    } else {
      this.kalmanFilter = new KalmanFilter(state, this.config);
      this.isInitialized = true;
    }
  }
}
