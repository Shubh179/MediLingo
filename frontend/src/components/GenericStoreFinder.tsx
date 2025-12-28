import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const GenericStoreFinder = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setError("Location access blocked. You can still search manually.");
        console.warn("Geolocation error", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const openDirections = () => {
    const query = "generic+medicine+store";
    if (coords) {
      const url = `https://www.google.com/maps/search/${query}/@${coords.lat},${coords.lng},15z`;
      window.open(url, "_blank");
    } else {
      const url = `https://www.google.com/maps/search/${query}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Find nearby generic medicine stores using your location and open directions in Google Maps.
      </p>
      {error && (
        <p className="text-xs text-amber-600">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={openDirections} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <MapPin className="w-4 h-4 mr-2" /> Open Directions
        </Button>
        <Button variant="outline" onClick={() => setCoords(null)}>Reset Location</Button>
      </div>
      <p className="text-xs text-gray-500">
        Tip: If you prefer a specific chain, search terms like "Apollo generic" or "Medkart".
      </p>
    </div>
  );
};

export default GenericStoreFinder;
