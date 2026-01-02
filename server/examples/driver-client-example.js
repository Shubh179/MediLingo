/**
 * Example Driver Client for Testing Vehicle Tracking
 * 
 * Usage:
 * 1. Install socket.io-client: npm install socket.io-client
 * 2. Run: node driver-client-example.js <driverId>
 * 
 * This simulates a delivery driver sending GPS updates every 5 seconds
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const DRIVER_ID = process.argv[2] || 'DRIVER001';
const DRIVER_NAME = process.argv[3] || 'John Doe';
const VEHICLE_NUMBER = process.argv[4] || 'DL01AB1234';

// Simulate starting location (Delhi coordinates)
let currentLat = 28.6139;
let currentLng = 77.2090;
let currentSpeed = 0;

console.log('🚗 Driver Client Starting...');
console.log(`📍 Driver ID: ${DRIVER_ID}`);
console.log(`🔌 Connecting to: ${SERVER_URL}`);

// Connect to Socket.io server
const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log(`📡 Socket ID: ${socket.id}`);
  
  // Register as driver
  socket.emit('driver:connect', {
    driverId: DRIVER_ID,
    driverName: DRIVER_NAME,
    vehicleNumber: VEHICLE_NUMBER,
    phoneNumber: '+91-9876543210',
    isActive: true,
  });
});

socket.on('driver:connect', (response) => {
  console.log('✅ Driver registration response:', response);
  
  if (response.success) {
    console.log(`⏱️  Update interval: ${response.updateInterval}ms`);
    startSendingLocationUpdates(response.updateInterval);
  }
});

socket.on('tracking:error', (error) => {
  console.error('❌ Tracking error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Simulate GPS location updates
function startSendingLocationUpdates(interval = 5000) {
  console.log(`📍 Starting location updates every ${interval}ms`);
  
  setInterval(() => {
    // Simulate movement (random walk)
    const deltaLat = (Math.random() - 0.5) * 0.001; // ~100m change
    const deltaLng = (Math.random() - 0.5) * 0.001;
    currentLat += deltaLat;
    currentLng += deltaLng;
    
    // Simulate speed variation (0-60 km/h)
    currentSpeed = Math.random() * 60;
    
    const locationUpdate = {
      driverId: DRIVER_ID,
      location: {
        latitude: currentLat,
        longitude: currentLng,
        speed: currentSpeed,
        timestamp: Date.now(),
        accuracy: 10, // High accuracy
        heading: Math.random() * 360, // Random direction
      },
    };
    
    socket.emit('driver:location', locationUpdate);
    
    console.log(`📍 Sent location: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)} | Speed: ${currentSpeed.toFixed(1)} km/h`);
  }, interval);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting driver...');
  socket.disconnect();
  process.exit(0);
});

console.log('⏳ Waiting for connection...');
