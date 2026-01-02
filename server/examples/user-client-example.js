/**
 * Example User Client for Testing Vehicle Tracking
 * 
 * Usage:
 * 1. Install socket.io-client: npm install socket.io-client
 * 2. Run: node user-client-example.js <driverId>
 * 
 * This simulates a user tracking a delivery driver in real-time
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const USER_ID = process.argv[2] || 'USER001';
const DRIVER_ID_TO_TRACK = process.argv[3] || 'DRIVER001';
const ORDER_ID = process.argv[4] || 'ORD123456';

console.log('👤 User Client Starting...');
console.log(`🆔 User ID: ${USER_ID}`);
console.log(`🎯 Tracking Driver: ${DRIVER_ID_TO_TRACK}`);
console.log(`📦 Order ID: ${ORDER_ID}`);
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
  
  // Start tracking driver
  socket.emit('user:startTracking', {
    userId: USER_ID,
    driverId: DRIVER_ID_TO_TRACK,
    orderId: ORDER_ID,
  });
});

socket.on('user:startTracking', (response) => {
  console.log('✅ Tracking started:', response);
  
  if (response.currentLocation) {
    console.log('📍 Initial location received:');
    displayLocation(response.currentLocation);
  } else {
    console.log('⏳ Waiting for driver location updates...');
  }
});

socket.on('user:locationUpdate', (update) => {
  console.log('\n📍 New location update received:');
  console.log(`   Driver: ${update.driverId}`);
  console.log(`   Order: ${update.orderId || 'N/A'}`);
  displayLocation(update.location);
});

socket.on('driver:statusChange', (status) => {
  console.log('\n📊 Driver status changed:');
  console.log(`   Driver: ${status.driverId}`);
  console.log(`   Active: ${status.isActive ? '✅ Online' : '❌ Offline'}`);
  console.log(`   Reason: ${status.reason || 'N/A'}`);
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

// Helper function to display location
function displayLocation(location) {
  console.log(`   Lat: ${location.latitude.toFixed(6)}`);
  console.log(`   Lng: ${location.longitude.toFixed(6)}`);
  console.log(`   Speed: ${location.speed.toFixed(1)} km/h`);
  console.log(`   Accuracy: ${location.accuracy || 'N/A'}m`);
  console.log(`   Heading: ${location.heading ? location.heading.toFixed(0) + '°' : 'N/A'}`);
  console.log(`   Time: ${new Date(location.timestamp).toLocaleTimeString()}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping tracking...');
  socket.emit('user:stopTracking', DRIVER_ID_TO_TRACK);
  socket.disconnect();
  process.exit(0);
});

console.log('⏳ Waiting for connection...');
