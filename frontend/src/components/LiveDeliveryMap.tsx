import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSCoordinate } from '../lib/gpsUtils';

interface LiveMapProps {
  position: GPSCoordinate | null;
  heading: number;
  speed: number;
  isMoving: boolean;
  confidence: number;
  isConnected: boolean;
  isTracking: boolean;
  error?: string | null;
  destination?: GPSCoordinate;
  zoom?: number;
}

export const LiveDeliveryMap: React.FC<LiveMapProps> = ({
  position,
  heading,
  speed,
  isMoving,
  confidence,
  isConnected,
  isTracking,
  error,
  destination,
  zoom = 15,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default to Mumbai Kandivali West coordinates
    const defaultLat = 19.1890;
    const defaultLng = 72.8398;

    // Create map
    mapInstanceRef.current = L.map(mapRef.current).setView([defaultLat, defaultLng], zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Create driver marker
    markerRef.current = L.circleMarker([defaultLat, defaultLng], {
      radius: 15,
      fillColor: '#FF6B35',
      color: 'white',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(mapInstanceRef.current);

    // Create destination marker if available
    if (destination) {
      destMarkerRef.current = L.marker([destination.latitude, destination.longitude])
        .bindPopup('Delivery Location')
        .addTo(mapInstanceRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination, zoom]);

  // Update marker position when GPS data arrives
  useEffect(() => {
    if (position && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([position.latitude, position.longitude]);
      mapInstanceRef.current.setView([position.latitude, position.longitude], zoom);
      
      // Update marker popup
      markerRef.current.bindPopup(`
        <div style="font-size: 12px;">
          <strong>Driver Location</strong><br/>
          Lat: ${position.latitude.toFixed(4)}<br/>
          Lng: ${position.longitude.toFixed(4)}<br/>
          Speed: ${speed.toFixed(1)} km/h<br/>
          Heading: ${heading.toFixed(0)}°
        </div>
      `);
    }
  }, [position, speed, heading, zoom]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Status Panel - Top Left */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          minWidth: '220px',
          zIndex: 1000,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600' }}>
          Real-Time Tracking
        </h3>

        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#00AA00' : '#FF0000',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ color: '#666' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {position && (
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
            <div style={{ fontWeight: '500', marginBottom: '2px' }}>Position</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>
              {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
            </div>
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          <strong>Speed:</strong> {speed.toFixed(1)} km/h
        </div>

        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          <strong>Heading:</strong> {heading.toFixed(0)}°
        </div>

        <div style={{ fontSize: '11px', color: '#666' }}>
          <strong>Confidence:</strong> {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: '#FFF3CD',
            border: '1px solid #FFE69C',
            borderRadius: '4px',
            padding: '10px',
            color: '#856404',
            fontSize: '12px',
            maxWidth: '300px',
            zIndex: 1000,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .leaflet-container {
          background: #f0f0f0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .leaflet-control-container {
          z-index: 500;
        }
      `}</style>
    </div>
  );
};

export default LiveDeliveryMap;
