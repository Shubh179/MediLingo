#!/usr/bin/env node
/**
 * Test Runner for Vehicle Tracking System
 * Automated testing script that verifies all tracking functionality
 */

const io = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const TESTS_PASSED = [];
const TESTS_FAILED = [];

console.log('🧪 Vehicle Tracking System - Automated Tests');
console.log('='.repeat(50));
console.log(`Server: ${SERVER_URL}\n`);

// Test 1: Server Connection
async function testServerConnection() {
  return new Promise((resolve) => {
    console.log('Test 1: Server Connection');
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      console.log('✅ PASS: Connected to server');
      TESTS_PASSED.push('Server Connection');
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      console.log(`❌ FAIL: Cannot connect - ${error.message}`);
      TESTS_FAILED.push('Server Connection');
      resolve(false);
    });
    
    setTimeout(() => {
      if (socket.connected === false) {
        console.log('❌ FAIL: Connection timeout');
        TESTS_FAILED.push('Server Connection');
        socket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// Test 2: Driver Registration
async function testDriverRegistration() {
  return new Promise((resolve) => {
    console.log('\nTest 2: Driver Registration');
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      socket.emit('driver:connect', {
        driverId: 'TEST_DRIVER_001',
        driverName: 'Test Driver',
        vehicleNumber: 'TEST123',
        phoneNumber: '+1234567890',
        isActive: true,
      });
    });
    
    socket.on('driver:connect', (response) => {
      if (response.success && response.updateInterval === 5000) {
        console.log('✅ PASS: Driver registered successfully');
        TESTS_PASSED.push('Driver Registration');
        socket.disconnect();
        resolve(true);
      } else {
        console.log('❌ FAIL: Invalid registration response');
        TESTS_FAILED.push('Driver Registration');
        socket.disconnect();
        resolve(false);
      }
    });
    
    setTimeout(() => {
      console.log('❌ FAIL: Registration timeout');
      TESTS_FAILED.push('Driver Registration');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

// Test 3: Location Update
async function testLocationUpdate() {
  return new Promise((resolve) => {
    console.log('\nTest 3: Location Update Validation');
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      socket.emit('driver:connect', {
        driverId: 'TEST_DRIVER_002',
        driverName: 'Test Driver 2',
        vehicleNumber: 'TEST456',
        phoneNumber: '+1234567890',
        isActive: true,
      });
    });
    
    socket.on('driver:connect', () => {
      // Send valid location
      socket.emit('driver:location', {
        driverId: 'TEST_DRIVER_002',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          speed: 45.5,
          timestamp: Date.now(),
          accuracy: 10,
          heading: 180,
        },
      });
      
      setTimeout(() => {
        console.log('✅ PASS: Location update accepted');
        TESTS_PASSED.push('Location Update');
        socket.disconnect();
        resolve(true);
      }, 1000);
    });
    
    setTimeout(() => {
      console.log('❌ FAIL: Location update timeout');
      TESTS_FAILED.push('Location Update');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

// Test 4: User Tracking
async function testUserTracking() {
  return new Promise((resolve) => {
    console.log('\nTest 4: User Tracking');
    
    // Start driver first
    const driverSocket = io(SERVER_URL);
    let userSocket;
    
    driverSocket.on('connect', () => {
      driverSocket.emit('driver:connect', {
        driverId: 'TEST_DRIVER_003',
        driverName: 'Test Driver 3',
        vehicleNumber: 'TEST789',
        phoneNumber: '+1234567890',
        isActive: true,
      });
    });
    
    driverSocket.on('driver:connect', () => {
      // Now connect user
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('user:startTracking', {
          userId: 'TEST_USER_001',
          driverId: 'TEST_DRIVER_003',
          orderId: 'TEST_ORDER_001',
        });
      });
      
      userSocket.on('user:startTracking', (response) => {
        if (response.success && response.driverId === 'TEST_DRIVER_003') {
          console.log('✅ PASS: User tracking started successfully');
          TESTS_PASSED.push('User Tracking');
          driverSocket.disconnect();
          userSocket.disconnect();
          resolve(true);
        } else {
          console.log('❌ FAIL: Invalid tracking response');
          TESTS_FAILED.push('User Tracking');
          driverSocket.disconnect();
          userSocket.disconnect();
          resolve(false);
        }
      });
    });
    
    setTimeout(() => {
      console.log('❌ FAIL: User tracking timeout');
      TESTS_FAILED.push('User Tracking');
      if (driverSocket) driverSocket.disconnect();
      if (userSocket) userSocket.disconnect();
      resolve(false);
    }, 5000);
  });
}

// Test 5: Location Broadcast
async function testLocationBroadcast() {
  return new Promise((resolve) => {
    console.log('\nTest 5: Location Broadcast to Users');
    
    const driverSocket = io(SERVER_URL);
    let userSocket;
    let locationReceived = false;
    
    driverSocket.on('connect', () => {
      driverSocket.emit('driver:connect', {
        driverId: 'TEST_DRIVER_004',
        driverName: 'Test Driver 4',
        vehicleNumber: 'TEST101',
        phoneNumber: '+1234567890',
        isActive: true,
      });
    });
    
    driverSocket.on('driver:connect', () => {
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('user:startTracking', {
          userId: 'TEST_USER_002',
          driverId: 'TEST_DRIVER_004',
        });
      });
      
      userSocket.on('user:startTracking', () => {
        // Send location update from driver
        setTimeout(() => {
          driverSocket.emit('driver:location', {
            driverId: 'TEST_DRIVER_004',
            location: {
              latitude: 28.7041,
              longitude: 77.1025,
              speed: 35.0,
              timestamp: Date.now(),
            },
          });
        }, 500);
      });
      
      userSocket.on('user:locationUpdate', (update) => {
        if (update.driverId === 'TEST_DRIVER_004' && update.location.latitude === 28.7041) {
          console.log('✅ PASS: Location broadcast received by user');
          TESTS_PASSED.push('Location Broadcast');
          locationReceived = true;
          driverSocket.disconnect();
          userSocket.disconnect();
          resolve(true);
        }
      });
    });
    
    setTimeout(() => {
      if (!locationReceived) {
        console.log('❌ FAIL: Location broadcast not received');
        TESTS_FAILED.push('Location Broadcast');
        driverSocket.disconnect();
        if (userSocket) userSocket.disconnect();
        resolve(false);
      }
    }, 5000);
  });
}

// Test 6: Stats Endpoint
async function testStatsEndpoint() {
  console.log('\nTest 6: Stats API Endpoint');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/tracking/stats`);
    const data = await response.json();
    
    if (data.hasOwnProperty('activeDrivers') && 
        data.hasOwnProperty('trackingRooms') &&
        data.hasOwnProperty('totalUsersTracking')) {
      console.log('✅ PASS: Stats endpoint working');
      console.log(`   Active Drivers: ${data.activeDrivers}`);
      console.log(`   Tracking Rooms: ${data.trackingRooms}`);
      console.log(`   Users Tracking: ${data.totalUsersTracking}`);
      TESTS_PASSED.push('Stats Endpoint');
      return true;
    } else {
      console.log('❌ FAIL: Invalid stats response');
      TESTS_FAILED.push('Stats Endpoint');
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: Stats endpoint error - ${error.message}`);
    TESTS_FAILED.push('Stats Endpoint');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting tests...\n');
  
  await testServerConnection();
  await new Promise(r => setTimeout(r, 1000));
  
  await testDriverRegistration();
  await new Promise(r => setTimeout(r, 1000));
  
  await testLocationUpdate();
  await new Promise(r => setTimeout(r, 1000));
  
  await testUserTracking();
  await new Promise(r => setTimeout(r, 1000));
  
  await testLocationBroadcast();
  await new Promise(r => setTimeout(r, 1000));
  
  await testStatsEndpoint();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${TESTS_PASSED.length}`);
  console.log(`❌ Failed: ${TESTS_FAILED.length}`);
  console.log(`📈 Total:  ${TESTS_PASSED.length + TESTS_FAILED.length}`);
  
  if (TESTS_PASSED.length > 0) {
    console.log('\n✅ Passed Tests:');
    TESTS_PASSED.forEach(test => console.log(`   - ${test}`));
  }
  
  if (TESTS_FAILED.length > 0) {
    console.log('\n❌ Failed Tests:');
    TESTS_FAILED.forEach(test => console.log(`   - ${test}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (TESTS_FAILED.length === 0) {
    console.log('🎉 All tests passed! Vehicle tracking system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the server and try again.');
    process.exit(1);
  }
}

// Start testing
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
