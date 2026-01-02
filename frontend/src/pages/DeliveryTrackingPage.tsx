import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { LiveDeliveryMap } from '../components/LiveDeliveryMap';
import { GPSCoordinate } from '../lib/gpsUtils';

interface OrderDetails {
  orderId: string;
  customerName: string;
  deliveryLocation: GPSCoordinate;
  pickupLocation: GPSCoordinate;
}

export const DeliveryTrackingPage: React.FC = () => {
  const { orderId, driverId, userId } = useParams<{
    orderId: string;
    driverId: string;
    userId: string;
  }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);

  const tracking = useVehicleTracking({
    userId: userId || 'user789',
    driverId: driverId || 'DRV-TEST-001',
    orderId: orderId,
    serverUrl: 'http://localhost:5001',
    animationDuration: 5000,
  });

  useEffect(() => {
    setOrder({
      orderId: orderId || 'order123',
      customerName: 'John Doe',
      deliveryLocation: { latitude: 28.6328, longitude: 77.2197 },
      pickupLocation: { latitude: 28.6295, longitude: 77.1707 },
    });
  }, [orderId]);

  if (!order) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <LiveDeliveryMap
          position={tracking.position}
          heading={tracking.heading}
          speed={tracking.speed}
          isMoving={tracking.isMoving}
          confidence={tracking.confidence}
          isConnected={tracking.isConnected}
          isTracking={tracking.isTracking}
          error={tracking.error}
          destination={order.deliveryLocation}
        />
      </div>
      
      {/* Debug Panel */}
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        color: '#0f0',
        padding: '10px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '250px',
        borderRadius: '4px',
        zIndex: 999
      }}>
        <div>Connected: {tracking.isConnected ? '✓' : '✗'}</div>
        <div>Tracking: {tracking.isTracking ? '✓' : '✗'}</div>
        <div>Position: {tracking.position ? '✓' : '✗'}</div>
        <div>Lat: {tracking.position?.latitude.toFixed(4) || 'N/A'}</div>
        <div>Lng: {tracking.position?.longitude.toFixed(4) || 'N/A'}</div>
        <div>Speed: {tracking.speed.toFixed(1)} km/h</div>
        <div>Confidence: {(tracking.confidence * 100).toFixed(0)}%</div>
        {tracking.error && <div style={{ color: '#f00' }}>Error: {tracking.error}</div>}
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;
