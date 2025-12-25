import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Droplets, Locate, Loader2, Map, Navigation, LocateFixed } from "lucide-react";

interface BloodBank {
  name: string;
  number: string;
  address: string;
  availability: string;
}

const bloodBanks: BloodBank[] = [
  {
    name: "Red Cross Blood Bank",
    number: "+91-1800-11-2444",
    address: "Nationwide helpline",
    availability: "24/7",
  },
  {
    name: "State Blood Bank",
    number: "+91-104",
    address: "Nearest government blood bank",
    availability: "24/7",
  },
  {
    name: "Sanjeevani Blood Center",
    number: "+91-99999-00000",
    address: "Local registered center",
    availability: "7 AM - 11 PM",
  },
];

const BloodBankFinder = () => {
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("Use your location to suggest the nearest blood bank.");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({ lat: 19.1197, lng: 72.8468 }); // Andheri default

  const defaultCoords = { lat: 19.1197, lng: 72.8468 }; // Andheri East fallback

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("Location not supported on this device. Showing default area.");
      setCoords(defaultCoords);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationNote(`Nearest options around (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Call to confirm availability.`);
      },
      () => {
        setLocating(false);
        setCoords(defaultCoords);
        setLocationNote("Couldn't fetch location. Showing default area. Please call the numbers below directly.");
      },
      { timeout: 8000 }
    );
  };

  const mapPoint = coords ?? defaultCoords;
  const bboxSize = 0.02; // ~2km box
  const bbox = [
    mapPoint.lng - bboxSize,
    mapPoint.lat - bboxSize,
    mapPoint.lng + bboxSize,
    mapPoint.lat + bboxSize,
  ].join("%2C");
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapPoint.lat}%2C${mapPoint.lng}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=blood+bank+nearby`;

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800">
        <Droplets className="w-4 h-4 mt-0.5" />
        <div>
          <p className="font-semibold">Need blood urgently?</p>
          <p className="text-xs">Call the helplines below. Always confirm stock before arriving.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-2" onClick={handleUseLocation} disabled={locating}>
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Use current location
        </Button>
        <p className="text-xs text-gray-600">{locationNote}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-rose-100 shadow-sm h-40">
        <iframe
          title="Blood bank map"
          src={mapUrl}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" className="gap-2" onClick={() => window.open(mapsSearchUrl, "_blank") }>
          <Map className="w-4 h-4" />
          Open in Google Maps
        </Button>
        <p className="text-xs text-gray-500">Defaults to a preset area if GPS is blocked.</p>
      </div>

      <div className="space-y-2">
        {bloodBanks.map((bank) => (
          <Card key={bank.number} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{bank.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {bank.address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Availability: {bank.availability}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold text-rose-600">{bank.number}</span>
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => handleCall(bank.number)}>
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BloodBankFinder;
