import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Pharmacy = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm?: number;
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const PharmacyFinder = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearby = async () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const radius = 3000; // meters
      const query = `
        [out:json];
        (
          node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
          way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
          relation["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
        );
        out center;
      `;
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: new URLSearchParams({ data: query }),
        });
        const data = await res.json();
        const items: Pharmacy[] = (data.elements || [])
          .map((el: any) => {
            const lat = el.lat ?? el.center?.lat;
            const lon = el.lon ?? el.center?.lon;
            return {
              id: String(el.id),
              name: el.tags?.name || 'Pharmacy',
              lat,
              lon,
              distanceKm: haversine(latitude, longitude, lat, lon),
            } as Pharmacy;
          })
          .filter((x: Pharmacy) => x.lat && x.lon)
          .sort((a: Pharmacy, b: Pharmacy) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
          .slice(0, 5);
        setPharmacies(items);
      } catch (e) {
        setError('Failed to fetch nearby pharmacies');
      } finally {
        setLoading(false);
      }
    }, () => {
      setError('Location access denied');
      setLoading(false);
    });
  };

  useEffect(() => {
    // lazily fetch when user expands
  }, []);

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Nearby Pharmacies</span>
        </div>
        <Button size="sm" onClick={findNearby} disabled={loading}>
          {loading ? 'Finding…' : 'Find 5 nearest'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <div className="space-y-2">
        {pharmacies.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No results yet. Click Find to search.</p>
        )}
        {pharmacies.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
            <div>
              <p className="font-medium text-secondary">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.distanceKm?.toFixed(2)} km away</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              View on Maps
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PharmacyFinder;
