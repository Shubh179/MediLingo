import { GPSCoordinate } from '../lib/gpsUtils';

export interface AnimationFrame {
  position: GPSCoordinate;
  heading: number;
  progress: number;
}

/**
 * Smooth animation controller for vehicle marker
 * Interpolates between positions and headings smoothly
 */
export class MarkerAnimator {
  private startPosition: GPSCoordinate;
  private endPosition: GPSCoordinate;
  private startHeading: number;
  private endHeading: number;
  private startTime: number;
  private duration: number;
  private snapThreshold: number; // Distance threshold for snap-to-smooth

  constructor(
    startPosition: GPSCoordinate,
    startHeading: number,
    duration: number = 5000, // 5 seconds
    snapThreshold: number = 0.0001 // ~11 meters in degrees
  ) {
    this.startPosition = startPosition;
    this.endPosition = startPosition;
    this.startHeading = startHeading;
    this.endHeading = startHeading;
    this.startTime = Date.now();
    this.duration = duration;
    this.snapThreshold = snapThreshold;
  }

  /**
   * Update target position
   * Implements snap-to-smooth: if GPS jump is too large, snap then smooth
   */
  setTarget(
    endPosition: GPSCoordinate,
    endHeading: number,
    currentProgress: number = 0
  ) {
    const latDiff = Math.abs(endPosition.latitude - this.endPosition.latitude);
    const lngDiff = Math.abs(endPosition.longitude - this.endPosition.longitude);

    // Calculate if this is a "hop" (large jump in GPS)
    const isHop = latDiff > this.snapThreshold || lngDiff > this.snapThreshold;

    if (isHop) {
      // Snap to current prediction position if progress is advanced
      // This prevents full jumps while smoothly recovering from GPS noise
      if (currentProgress > 0.2) {
        const snappedLat =
          this.startPosition.latitude +
          (this.endPosition.latitude - this.startPosition.latitude) * currentProgress;
        const snappedLng =
          this.startPosition.longitude +
          (this.endPosition.longitude - this.startPosition.longitude) * currentProgress;

        this.startPosition = {
          latitude: snappedLat,
          longitude: snappedLng,
        };
      } else {
        // If early in animation, snap immediately to current position
        this.startPosition = this.endPosition;
      }
    } else {
      // Normal update - continue from current position
      this.startPosition = this.endPosition;
    }

    this.endPosition = endPosition;
    this.endHeading = endHeading;
    this.startHeading = this.getHeading(currentProgress);
    this.startTime = Date.now();
  }

  /**
   * Get current animated position and heading
   * Returns progress 0-1 for external use
   */
  getFrame(): AnimationFrame {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Cubic ease-in-out for smooth motion
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Interpolate position
    const position: GPSCoordinate = {
      latitude:
        this.startPosition.latitude +
        (this.endPosition.latitude - this.startPosition.latitude) * eased,
      longitude:
        this.startPosition.longitude +
        (this.endPosition.longitude - this.startPosition.longitude) * eased,
    };

    // Interpolate heading (shortest path)
    const heading = this.interpolateHeading(
      this.startHeading,
      this.endHeading,
      eased
    );

    return {
      position,
      heading,
      progress: eased,
    };
  }

  /**
   * Get position at specific progress (0-1)
   */
  getPositionAt(progress: number): GPSCoordinate {
    const clamped = Math.max(0, Math.min(progress, 1));

    return {
      latitude:
        this.startPosition.latitude +
        (this.endPosition.latitude - this.startPosition.latitude) * clamped,
      longitude:
        this.startPosition.longitude +
        (this.endPosition.longitude - this.startPosition.longitude) * clamped,
    };
  }

  /**
   * Get heading at specific progress
   */
  getHeading(progress: number): number {
    const clamped = Math.max(0, Math.min(progress, 1));
    return this.interpolateHeading(this.startHeading, this.endHeading, clamped);
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    const elapsed = Date.now() - this.startTime;
    return Math.min(elapsed / this.duration, 1);
  }

  /**
   * Check if animation is complete
   */
  isComplete(): boolean {
    return this.getProgress() >= 1;
  }

  /**
   * Interpolate between two headings (shortest path)
   */
  private interpolateHeading(
    start: number,
    end: number,
    progress: number
  ): number {
    let diff = end - start;

    // Normalize to -180 to 180
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    // Cubic ease
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const newHeading = start + diff * eased;
    return (newHeading + 360) % 360;
  }
}

/**
 * Advanced marker position predictor with multi-step interpolation
 * Handles smooth transitions between GPS updates
 */
export class SmoothPositionPredictor {
  private currentFrame: AnimationFrame;
  private lastFrame: AnimationFrame;
  private updateInterval: number;
  private lastUpdateTime: number;
  private animationDuration: number;

  constructor(
    initialPosition: GPSCoordinate,
    initialHeading: number = 0,
    updateInterval: number = 5000
  ) {
    this.currentFrame = {
      position: initialPosition,
      heading: initialHeading,
      progress: 1,
    };
    this.lastFrame = { ...this.currentFrame };
    this.updateInterval = updateInterval;
    this.lastUpdateTime = Date.now();
    this.animationDuration = updateInterval;
  }

  /**
   * Update prediction with new measurement
   */
  updateWithMeasurement(position: GPSCoordinate, heading: number): void {
    this.lastFrame = { ...this.currentFrame };
    this.currentFrame = {
      position,
      heading,
      progress: 1,
    };
    this.lastUpdateTime = Date.now();
  }

  /**
   * Get interpolated position at current time
   */
  getCurrentPosition(): GPSCoordinate {
    const elapsed = Date.now() - this.lastUpdateTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);

    // Cubic ease-in-out
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    return {
      latitude:
        this.lastFrame.position.latitude +
        (this.currentFrame.position.latitude - this.lastFrame.position.latitude) *
          eased,
      longitude:
        this.lastFrame.position.longitude +
        (this.currentFrame.position.longitude - this.lastFrame.position.longitude) *
          eased,
    };
  }

  /**
   * Get interpolated heading
   */
  getCurrentHeading(): number {
    const elapsed = Date.now() - this.lastUpdateTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);

    // Cubic ease
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const start = this.lastFrame.heading;
    let end = this.currentFrame.heading;
    let diff = end - start;

    // Shortest path
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    const heading = start + diff * eased;
    return (heading + 360) % 360;
  }

  /**
   * Get animation progress (0-1)
   */
  getProgress(): number {
    const elapsed = Date.now() - this.lastUpdateTime;
    return Math.min(elapsed / this.animationDuration, 1);
  }
}

/**
 * Easing functions for smooth animations
 */
export const EasingFunctions = {
  // Linear
  linear: (t: number) => t,

  // Cubic easing
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Quadratic easing
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // Exponential easing
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Elastic easing
  easeOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
  },
};
