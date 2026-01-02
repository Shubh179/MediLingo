# Real-Time Vehicle Tracking System

A Socket.io-based real-time GPS tracking system for medicine delivery drivers. Handles location updates every 5 seconds and broadcasts to users tracking their deliveries.

## 🏗️ Architecture

### Backend Components

1. **TrackingService** (`server/src/services/trackingService.ts`)
   - Manages WebSocket connections for drivers and users
   - Handles GPS updates every 5 seconds
   - Broadcasts locations to tracking rooms
   - Monitors stale connections (30-second timeout)

2. **Type Definitions** (`server/src/types/tracking.ts`)
   - `LocationData`: GPS coordinates, speed, timestamp
   - `DriverInfo`: Driver details and status
   - `TrackingEvents`: Socket.io event names

3. **Configuration** (`server/src/config/tracking.ts`)
   - Update intervals and thresholds
   - GPS validation rules
   - Room management settings

## 🚀 Features

- ✅ **5-Second GPS Updates**: Efficient handling of burst location data
- ✅ **Room-Based Broadcasting**: Users only receive updates for tracked drivers
- ✅ **Automatic Cleanup**: Removes stale connections after 30 seconds
- ✅ **Manual Driver Selection**: Users can choose which driver to track
- ✅ **Connection Resilience**: Auto-reconnection and error handling
- ✅ **Real-time Status**: Driver online/offline notifications

## 📡 Socket.io Events

### Driver Events

#### `driver:connect`
**Emit from driver client:**
```typescript
socket.emit('driver:connect', {
  driverId: string,
  driverName: string,
  vehicleNumber: string,
  phoneNumber: string,
  isActive: boolean
});
```

**Server response:**
```typescript
{
  success: boolean,
  message: string,
  updateInterval: number // 5000ms
}
```

#### `driver:location`
**Emit every 5 seconds from driver:**
```typescript
socket.emit('driver:location', {
  driverId: string,
  location: {
    latitude: number,
    longitude: number,
    speed: number,      // km/h
    timestamp: number,  // Unix ms
    accuracy?: number,  // meters
    heading?: number    // degrees (0-360)
  },
  orderId?: string
});
```

### User Events

#### `user:startTracking`
**Emit from user client:**
```typescript
socket.emit('user:startTracking', {
  userId: string,
  driverId: string,    // Which driver to track
  orderId?: string
});
```

**Server response:**
```typescript
{
  success: boolean,
  driverId: string,
  isDriverActive: boolean,
  currentLocation: LocationData | null,
  message: string
}
```

#### `user:stopTracking`
**Emit from user client:**
```typescript
socket.emit('user:stopTracking', driverId: string);
```

#### `user:locationUpdate`
**Received by user (broadcast every 5s):**
```typescript
{
  driverId: string,
  location: LocationData,
  orderId?: string,
  timestamp: number
}
```

#### `driver:statusChange`
**Received when driver goes online/offline:**
```typescript
{
  driverId: string,
  isActive: boolean,
  timestamp: number,
  reason?: string
}
```

## 🧪 Testing

### Prerequisites
```bash
cd server
npm install socket.io-client
```

### Test Driver Client

Simulates a delivery driver sending GPS updates:

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start driver client
cd server/examples
node driver-client-example.js DRIVER001 "John Doe" "DL01AB1234"
```

Output:
```
🚗 Driver Client Starting...
📍 Driver ID: DRIVER001
✅ Connected to server
⏱️ Update interval: 5000ms
📍 Sent location: 28.614123, 77.209456 | Speed: 45.2 km/h
```

### Test User Client

Simulates a user tracking a delivery:

```bash
# Terminal 3 - Start user client
cd server/examples
node user-client-example.js USER001 DRIVER001 ORD123456
```

Output:
```
👤 User Client Starting...
🎯 Tracking Driver: DRIVER001
✅ Tracking started
📍 New location update received:
   Lat: 28.614123
   Lng: 77.209456
   Speed: 45.2 km/h
```

### Using Different Drivers

Test multiple drivers simultaneously:
```bash
# Terminal 2
node driver-client-example.js DRIVER001

# Terminal 3
node driver-client-example.js DRIVER002

# Terminal 4 - User tracking DRIVER001
node user-client-example.js USER001 DRIVER001

# Terminal 5 - User tracking DRIVER002
node user-client-example.js USER002 DRIVER002
```

## 🔧 Server Configuration

Default settings in `server/src/config/tracking.ts`:

```typescript
{
  LOCATION_UPDATE_INTERVAL: 5000,      // 5 seconds
  STALE_CONNECTION_THRESHOLD: 30000,   // 30 seconds
  PING_TIMEOUT: 60000,
  MAX_LATITUDE: 90,
  MIN_LATITUDE: -90,
  MAX_SPEED: 200                       // km/h
}
```

## 📊 Monitoring

### Get Tracking Statistics

```bash
curl http://localhost:5000/api/tracking/stats
```

Response:
```json
{
  "activeDrivers": 3,
  "trackingRooms": 2,
  "totalUsersTracking": 5
}
```

## 🔐 Security Considerations

1. **Authentication**: Add JWT verification before allowing tracking
2. **Driver Verification**: Validate driver credentials on connection
3. **Rate Limiting**: Prevent spam location updates
4. **Data Privacy**: Encrypt location data in transit
5. **Access Control**: Verify users can only track their assigned drivers

### Example Authentication Middleware

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  // Verify JWT
  verifyToken(token, (err, decoded) => {
    if (err) return next(new Error('Invalid token'));
    socket.data.userId = decoded.userId;
    next();
  });
});
```

## 🚀 Production Deployment

### Environment Variables

```env
# .env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Performance Optimization

1. **Redis Adapter** (for horizontal scaling):
```bash
npm install @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

2. **Compression**:
```typescript
io.on('connection', (socket) => {
  socket.compress(true).emit('event', data);
});
```

## 🐛 Troubleshooting

### Driver Not Receiving Acknowledgement

Check:
- Server is running on correct port
- CORS settings allow frontend URL
- Driver emitted `driver:connect` event

### Users Not Receiving Location Updates

Check:
- Driver is actively sending updates
- User successfully joined tracking room
- Driver ID matches exactly

### Stale Connections

- Connections timeout after 30 seconds of inactivity
- Driver must send location updates every 5 seconds
- Check network connectivity

## 📱 Frontend Integration

Example React hook (to be implemented in next chunk):

```typescript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useDriverTracking(driverId: string) {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.emit('user:startTracking', {
      userId: 'currentUser',
      driverId
    });
    
    socket.on('user:locationUpdate', (update) => {
      setLocation(update.location);
    });
    
    socket.on('driver:statusChange', (status) => {
      setIsOnline(status.isActive);
    });
    
    return () => {
      socket.emit('user:stopTracking', driverId);
      socket.disconnect();
    };
  }, [driverId]);
  
  return { location, isOnline };
}
```

## 🎯 Next Steps

- [ ] Add authentication and authorization
- [ ] Implement location history storage
- [ ] Add geofencing capabilities
- [ ] Create route optimization
- [ ] Build React frontend components
- [ ] Add delivery status updates
- [ ] Implement push notifications
- [ ] Create driver mobile app

## 📝 API Endpoints

### REST Endpoints

- `GET /api/tracking/stats` - Get tracking statistics
- `GET /api/tracking/drivers` - List active drivers (to be implemented)
- `GET /api/tracking/driver/:id` - Get driver location (to be implemented)

## 📄 License

Part of the MediLingo medicine delivery platform.
