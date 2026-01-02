/**
 * Kalman Filter for GPS Vehicle Tracking
 * 
 * STATE VECTOR [4x1]:
 * x = [latitude, longitude, vLat, vLng]^T
 * 
 * Where:
 * - latitude, longitude: Current position in degrees
 * - vLat, vLng: Velocity in degrees per second
 * 
 * This filter smooths GPS measurements and predicts positions between updates,
 * enabling 60fps rendering from 5-second GPS bursts.
 */

import * as Matrix from './matrixUtils';
import { GPSCoordinate, Velocity } from './gpsUtils';

export interface KalmanState {
  position: GPSCoordinate;
  velocity: Velocity;
  timestamp: number;
}

export interface KalmanConfig {
  // Process noise (Q matrix diagonal values)
  processNoisePosition: number; // Uncertainty in position prediction
  processNoiseVelocity: number; // Uncertainty in velocity prediction
  
  // Measurement noise (R matrix diagonal values)
  measurementNoisePosition: number; // GPS accuracy in degrees
  measurementNoiseVelocity: number; // Speed sensor accuracy
  
  // Initial uncertainty (P matrix diagonal values)
  initialUncertaintyPosition: number;
  initialUncertaintyVelocity: number;
}

/**
 * Kalman Filter Implementation for Vehicle Tracking
 * 
 * PREDICTION EQUATIONS:
 * x̂(k|k-1) = F × x̂(k-1|k-1)
 * P(k|k-1) = F × P(k-1|k-1) × F^T + Q
 * 
 * UPDATE EQUATIONS:
 * K = P(k|k-1) × H^T × [H × P(k|k-1) × H^T + R]^-1
 * x̂(k|k) = x̂(k|k-1) + K × [z(k) - H × x̂(k|k-1)]
 * P(k|k) = [I - K × H] × P(k|k-1)
 */
export class KalmanFilter {
  // State vector [4x1]: [lat, lng, vLat, vLng]
  private x: Matrix.Matrix;
  
  // Covariance matrix [4x4]: Uncertainty in state estimate
  private P: Matrix.Matrix;
  
  // Process noise covariance [4x4]
  private Q: Matrix.Matrix;
  
  // Measurement noise covariance [4x4]
  private R: Matrix.Matrix;
  
  // State transition matrix [4x4]
  private F: Matrix.Matrix;
  
  // Measurement matrix [4x4]
  private H: Matrix.Matrix;
  
  // Identity matrix [4x4]
  private I: Matrix.Matrix;
  
  private lastUpdateTime: number;
  private config: KalmanConfig;

  constructor(
    initialState: KalmanState,
    config?: Partial<KalmanConfig>
  ) {
    // Default configuration tuned for urban vehicle tracking
    this.config = {
      // Process noise: How much we expect the system to change
      // Position: Small, vehicle follows smooth paths
      processNoisePosition: 1e-6, // ~0.1 meters in degrees
      // Velocity: Moderate, vehicles can accelerate/decelerate
      processNoiseVelocity: 1e-4, // Allows for speed changes
      
      // Measurement noise: GPS and sensor accuracy
      // GPS accuracy: ~10 meters typical
      measurementNoisePosition: 1e-5, // ~1 meter in degrees
      // Speed sensor: Moderate accuracy
      measurementNoiseVelocity: 1e-3,
      
      // Initial uncertainty: Start with moderate confidence
      initialUncertaintyPosition: 1e-4,
      initialUncertaintyVelocity: 1e-2,
      
      ...config,
    };

    // Initialize state vector [lat, lng, vLat, vLng]
    this.x = [
      [initialState.position.latitude],
      [initialState.position.longitude],
      [initialState.velocity.vLat],
      [initialState.velocity.vLng],
    ];

    // Initialize covariance matrix P (uncertainty)
    this.P = Matrix.identity(4);
    this.P[0][0] = this.config.initialUncertaintyPosition;
    this.P[1][1] = this.config.initialUncertaintyPosition;
    this.P[2][2] = this.config.initialUncertaintyVelocity;
    this.P[3][3] = this.config.initialUncertaintyVelocity;

    // Process noise covariance Q
    // Models uncertainty in the physics model
    this.Q = Matrix.zeros(4, 4);
    this.Q[0][0] = this.config.processNoisePosition;
    this.Q[1][1] = this.config.processNoisePosition;
    this.Q[2][2] = this.config.processNoiseVelocity;
    this.Q[3][3] = this.config.processNoiseVelocity;

    // Measurement noise covariance R
    // Models sensor inaccuracy
    this.R = Matrix.zeros(4, 4);
    this.R[0][0] = this.config.measurementNoisePosition;
    this.R[1][1] = this.config.measurementNoisePosition;
    this.R[2][2] = this.config.measurementNoiseVelocity;
    this.R[3][3] = this.config.measurementNoiseVelocity;

    // Measurement matrix H (we observe all state variables)
    this.H = Matrix.identity(4);

    // Identity matrix
    this.I = Matrix.identity(4);

    // State transition matrix F (will be updated each prediction)
    this.F = Matrix.identity(4);

    this.lastUpdateTime = initialState.timestamp;
  }

  /**
   * PREDICTION STEP
   * Predict the next state based on motion model
   * 
   * Motion Model (Constant Velocity):
   * lat(t+Δt) = lat(t) + vLat × Δt
   * lng(t+Δt) = lng(t) + vLng × Δt
   * vLat(t+Δt) = vLat(t)
   * vLng(t+Δt) = vLng(t)
   * 
   * @param deltaTime - Time step in seconds
   * @returns Predicted state
   */
  public predict(deltaTime: number): KalmanState {
    // Update state transition matrix F based on deltaTime
    // F = | 1   0   Δt  0  |
    //     | 0   1   0   Δt |
    //     | 0   0   1   0  |
    //     | 0   0   0   1  |
    this.F = [
      [1, 0, deltaTime, 0],
      [0, 1, 0, deltaTime],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // Predict state: x̂(k|k-1) = F × x̂(k-1|k-1)
    this.x = Matrix.multiply(this.F, this.x);

    // Predict covariance: P(k|k-1) = F × P(k-1|k-1) × F^T + Q
    const F_T = Matrix.transpose(this.F);
    const FPF_T = Matrix.multiply(Matrix.multiply(this.F, this.P), F_T);
    this.P = Matrix.add(FPF_T, this.Q);

    this.lastUpdateTime += deltaTime * 1000; // Convert to ms

    return this.getState();
  }

  /**
   * UPDATE STEP
   * Correct the prediction using new GPS measurement
   * 
   * Kalman Gain: K = P × H^T × [H × P × H^T + R]^-1
   * State Update: x̂ = x̂ + K × (z - H × x̂)
   * Covariance Update: P = (I - K × H) × P
   * 
   * @param measurement - New GPS measurement
   */
  public update(measurement: KalmanState): void {
    // Measurement vector z
    const z: Matrix.Matrix = [
      [measurement.position.latitude],
      [measurement.position.longitude],
      [measurement.velocity.vLat],
      [measurement.velocity.vLng],
    ];

    // Innovation (measurement residual): y = z - H × x̂
    const Hx = Matrix.multiply(this.H, this.x);
    const y = Matrix.subtract(z, Hx);

    // Innovation covariance: S = H × P × H^T + R
    const H_T = Matrix.transpose(this.H);
    const HPH_T = Matrix.multiply(Matrix.multiply(this.H, this.P), H_T);
    const S = Matrix.add(HPH_T, this.R);

    // Kalman gain: K = P × H^T × S^-1
    const S_inv = Matrix.inverse(S);
    const PH_T = Matrix.multiply(this.P, H_T);
    const K = Matrix.multiply(PH_T, S_inv);

    // Update state: x̂ = x̂ + K × y
    const Ky = Matrix.multiply(K, y);
    this.x = Matrix.add(this.x, Ky);

    // Update covariance: P = (I - K × H) × P
    const KH = Matrix.multiply(K, this.H);
    const I_KH = Matrix.subtract(this.I, KH);
    this.P = Matrix.multiply(I_KH, this.P);

    this.lastUpdateTime = measurement.timestamp;
  }

  /**
   * Predict position at a future time without updating internal state
   * Useful for 60fps rendering between GPS updates
   * 
   * @param deltaTime - Time in seconds from current state
   * @returns Predicted position
   */
  public predictNextPosition(deltaTime: number): GPSCoordinate {
    const lat = this.x[0][0];
    const lng = this.x[1][0];
    const vLat = this.x[2][0];
    const vLng = this.x[3][0];

    return {
      latitude: lat + vLat * deltaTime,
      longitude: lng + vLng * deltaTime,
    };
  }

  /**
   * Get current state estimate
   */
  public getState(): KalmanState {
    return {
      position: {
        latitude: this.x[0][0],
        longitude: this.x[1][0],
      },
      velocity: {
        vLat: this.x[2][0],
        vLng: this.x[3][0],
      },
      timestamp: this.lastUpdateTime,
    };
  }

  /**
   * Get current position uncertainty (standard deviation in degrees)
   */
  public getPositionUncertainty(): { lat: number; lng: number } {
    return {
      lat: Math.sqrt(this.P[0][0]),
      lng: Math.sqrt(this.P[1][1]),
    };
  }

  /**
   * Get current velocity uncertainty
   */
  public getVelocityUncertainty(): { vLat: number; vLng: number } {
    return {
      vLat: Math.sqrt(this.P[2][2]),
      vLng: Math.sqrt(this.P[3][3]),
    };
  }

  /**
   * Reset filter with new state
   */
  public reset(newState: KalmanState): void {
    this.x = [
      [newState.position.latitude],
      [newState.position.longitude],
      [newState.velocity.vLat],
      [newState.velocity.vLng],
    ];
    
    this.P = Matrix.identity(4);
    this.P[0][0] = this.config.initialUncertaintyPosition;
    this.P[1][1] = this.config.initialUncertaintyPosition;
    this.P[2][2] = this.config.initialUncertaintyVelocity;
    this.P[3][3] = this.config.initialUncertaintyVelocity;
    
    this.lastUpdateTime = newState.timestamp;
  }

  /**
   * Adjust measurement noise based on GPS accuracy
   * Call this when GPS accuracy changes
   */
  public setMeasurementNoise(accuracyMeters: number): void {
    // Convert meters to degrees (approximate)
    const accuracyDegrees = accuracyMeters / 111320;
    this.R[0][0] = accuracyDegrees * accuracyDegrees;
    this.R[1][1] = accuracyDegrees * accuracyDegrees;
  }

  /**
   * Increase process noise for sharp turns or maneuvers
   * Call this when detecting sudden direction changes
   */
  public increaseProcessNoise(factor: number = 2): void {
    this.Q = Matrix.scale(this.Q, factor);
  }

  /**
   * Reset process noise to default
   */
  public resetProcessNoise(): void {
    this.Q[0][0] = this.config.processNoisePosition;
    this.Q[1][1] = this.config.processNoisePosition;
    this.Q[2][2] = this.config.processNoiseVelocity;
    this.Q[3][3] = this.config.processNoiseVelocity;
  }
}
