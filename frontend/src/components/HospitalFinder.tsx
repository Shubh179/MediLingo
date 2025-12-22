import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MapPin, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Hospital {
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

export function HospitalFinder() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const findNearby = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const radius = 1500; // 1.5 km
        
        const query = `
          [out:json];
          (
            node(around:${radius},${latitude},${longitude})[amenity=hospital];
            way(around:${radius},${latitude},${longitude})[amenity=hospital];
            node(around:${radius},${latitude},${longitude})[amenity=clinic];
            way(around:${radius},${latitude},${longitude})[amenity=clinic];
          );
          out center 20;
        `;

        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
          });
          
          const data = await response.json();
          
          const hospitalList: Hospital[] = data.elements.map((el: any) => {
            const lat = el.lat || el.center?.lat || 0;
            const lon = el.lon || el.center?.lon || 0;
            const distance = calculateDistance(latitude, longitude, lat, lon);
            
            return {
              name: el.tags?.name || 'Unnamed Hospital',
              lat,
              lon,
              distance,
            };
          }).filter((h: Hospital) => h.distance && h.distance <= radius)
            .sort((a: Hospital, b: Hospital) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 5);

          setHospitals(hospitalList);
          if (hospitalList.length === 0) {
            setError('No hospitals found within 1.5km');
          }
        } catch (err) {
          console.error(err);
          setError('Failed to fetch hospitals');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Location access denied');
        setLoading(false);
      }
    );
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">
              Nearby Hospitals
            </h3>
          </div>
          <Button size="sm" onClick={findNearby} disabled={loading}>
            {loading ? 'Finding…' : 'Find nearby (1.5km)'}
          </Button>
        </div>
        
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        
        {hospitals.length > 0 ? (
          <div className="space-y-2">
            {hospitals.map((hospital, i) => (
              <div key={i} className="flex items-start gap-2 text-sm p-2 bg-white rounded-lg border border-emerald-100">
                <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{hospital.name}</p>
                  <p className="text-gray-600 text-xs">
                    {hospital.distance ? `${(hospital.distance / 1000).toFixed(2)} km away` : ''}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-xs"
                  >
                    Get directions →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && !loading && (
            <p className="text-gray-500 text-sm text-center py-4">
              Click above to find nearby hospitals
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
