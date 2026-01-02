# Quick Start Guide - Vehicle Tracking System

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Server

```bash
cd server
npm run dev
```

Expected output:
```
🚀 Server running in development mode on port 5000
📡 API available at http://0.0.0.0:5000
🔌 WebSocket server ready for vehicle tracking
🚗 Vehicle tracking service initialized
```

### Step 2: Install Test Dependencies

```bash
cd server
npm install socket.io-client
```

### Step 3: Test with Driver Client

Open a new terminal:
```bash
cd server/examples
node driver-client-example.js DRIVER001
```

You should see:
```
🚗 Driver Client Starting...
✅ Connected to server
⏱️ Update interval: 5000ms
📍 Sent location: 28.613900, 77.209000 | Speed: 32.4 km/h
📍 Sent location: 28.613950, 77.209100 | Speed: 41.2 km/h
```

### Step 4: Test with User Client

Open another terminal:
```bash
cd server/examples
node user-client-example.js USER001 DRIVER001
```

You should see real-time location updates:
```
👤 User Client Starting...
✅ Connected to server
✅ Tracking started

📍 New location update received:
   Lat: 28.613950
   Lng: 77.209100
   Speed: 41.2 km/h
   Time: 3:45:23 PM
```

### Step 5: Check Server Stats

In a new terminal:
```bash
curl http://localhost:5000/api/tracking/stats
```

Response:
```json
{
  "activeDrivers": 1,
  "trackingRooms": 1,
  "totalUsersTracking": 1
}
```

## 🎯 Testing Multiple Drivers

### Terminal 1: Server
```bash
cd server && npm run dev
```

### Terminal 2: Driver 1
```bash
cd server/examples
node driver-client-example.js DRIVER001 "John Doe" "DL01AB1234"
```

### Terminal 3: Driver 2
```bash
cd server/examples
node driver-client-example.js DRIVER002 "Jane Smith" "DL02CD5678"
```

### Terminal 4: User tracking Driver 1
```bash
cd server/examples
node user-client-example.js USER001 DRIVER001 ORD123
```

### Terminal 5: User tracking Driver 2
```bash
cd server/examples
node user-client-example.js USER002 DRIVER002 ORD456
```

## 🔍 What's Happening?

1. **Every 5 seconds**: Drivers send GPS location (lat, lng, speed)
2. **Instantly**: Users tracking that driver receive the update
3. **Automatically**: Server manages rooms and broadcasts efficiently
4. **Smart cleanup**: Inactive drivers removed after 30 seconds

## ✅ Success Indicators

- ✅ Driver sees "Connected to server"
- ✅ User sees "Tracking started"
- ✅ Location updates appear every 5 seconds
- ✅ Stats endpoint returns active counts

## ❌ Troubleshooting

### "Connection refused"
- Make sure server is running on port 5000
- Check `http://localhost:5000` in browser

### "No location updates"
- Ensure driver client is running
- Check driver ID matches in both clients
- Verify console shows "Sent location"

### "ECONNRESET"
- Restart server
- Check firewall settings
- Try `127.0.0.1` instead of `localhost`

## 📱 Next: Frontend Integration

The backend is ready! Next chunk will create:
- React components for live map
- useDriverTracking hook
- Real-time delivery status UI

---

**Backend Complete!** ✅ Socket.io server handles GPS bursts efficiently.
