/**
 * Simple Test - Kalman Filter Demo
 * Run this to see the filter in action
 */

import { VehicleTracker } from '../lib/vehicleTracker';

console.log('🎯 Kalman Filter Test - Smooth GPS Tracking\n');
console.log('='.repeat(60));

// Create tracker
const tracker = new VehicleTracker({
  processNoisePosition: 1e-6,
  processNoiseVelocity: 1e-4,
  measurementNoisePosition: 1e-5,
});

console.log('✅ Tracker initialized\n');

// Simulate a vehicle route (Delhi)
const route = [
  { lat: 28.6139, lng: 77.2090, time: 0 },     // Connaught Place
  { lat: 28.6200, lng: 77.2150, time: 5000 },  // Northeast
  { lat: 28.6280, lng: 77.2200, time: 10000 }, // Continue
  { lat: 28.6350, lng: 77.2180, time: 15000 }, // Turn west
  { lat: 28.6400, lng: 77.2100, time: 20000 }, // West
];

console.log('📍 Simulating GPS updates every 5 seconds...\n');

let currentIndex = 0;
const startTime = Date.now();

// Simulate GPS updates every 5 seconds
const updateInterval = setInterval(() => {
  if (currentIndex >= route.length) {
    clearInterval(updateInterval);
    console.log('\n✅ Test complete!\n');
    
    const stats = tracker.getStats();
    console.log('📊 Final Statistics:');
    console.log(`   Total Updates: ${stats.updateCount}`);
    console.log(`   Final Speed: ${stats.currentSpeed.toFixed(1)} km/h`);
    console.log(`   Confidence: ${(stats.confidence * 100).toFixed(1)}%`);
    
    process.exit(0);
    return;
  }

  const point = route[currentIndex];
  
  // Add some GPS noise (realistic ±5 meters)
  const noiseLat = (Math.random() - 0.5) * 0.00005;
  const noiseLng = (Math.random() - 0.5) * 0.00005;
  
  const gpsUpdate = {
    latitude: point.lat + noiseLat,
    longitude: point.lng + noiseLng,
    speed: 40 + Math.random() * 10, // 40-50 km/h
    timestamp: startTime + point.time,
    accuracy: 8 + Math.random() * 4, // 8-12m accuracy
  };

  console.log(`[${currentIndex}] GPS Update @ ${point.time / 1000}s:`);
  console.log(`   Raw: ${gpsUpdate.latitude.toFixed(6)}, ${gpsUpdate.longitude.toFixed(6)}`);
  
  tracker.addGPSUpdate(gpsUpdate);
  
  const filtered = tracker.getCurrentPosition();
  if (filtered) {
    console.log(`   Filtered: ${filtered.position.latitude.toFixed(6)}, ${filtered.position.longitude.toFixed(6)}`);
    console.log(`   Speed: ${filtered.velocity.speedKmh.toFixed(1)} km/h`);
    console.log(`   Confidence: ${(filtered.confidence * 100).toFixed(1)}%`);
  }
  console.log();

  currentIndex++;
}, 1000); // 1 second for demo (5 seconds in production)

// Simulate 60fps rendering
let frameCount = 0;
function renderLoop() {
  const position = tracker.getCurrentPosition();
  
  if (position && frameCount % 60 === 0) { // Log every 60 frames
    console.log(`   [Render] Smooth position: ${position.position.latitude.toFixed(6)}, ${position.position.longitude.toFixed(6)}`);
  }
  
  frameCount++;
  setTimeout(renderLoop, 16); // ~60fps
}

console.log('🎬 Starting 60fps render loop...\n');
renderLoop();
