import { useState } from "react";
import { Phone, MapPin, Clock, AlertCircle, LocateFixed, Map, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const AmbulanceFinder = () => {
  const { t } = useLanguage();
  const defaultCoords = { lat: 19.1197, lng: 72.8468 }; // preset area
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(defaultCoords);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState("Share your live location to help crews reach faster. A preset area is used if blocked.");

  const emergencyNumbers = [
    {
      name: "National Ambulance Service",
      number: "108",
      description: "Free emergency ambulance service across India",
      availability: "24/7",
      type: "emergency"
    },
    {
      name: "Medical Emergency",
      number: "102",
      description: "State-run ambulance service",
      availability: "24/7",
      type: "emergency"
    },
    {
      name: "Police Emergency",
      number: "100",
      description: "For immediate police assistance",
      availability: "24/7",
      type: "police"
    },
    {
      name: "Fire Emergency",
      number: "101",
      description: "Fire brigade services",
      availability: "24/7",
      type: "fire"
    }
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setNote("Location not supported on this device. Using preset coordinates.");
      setCoords(defaultCoords);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNote(`Live location locked at ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}.`);
      },
      () => {
        setLocating(false);
        setNote("Could not fetch GPS. Using preset coordinates.");
        setCoords(defaultCoords);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const mapPoint = coords ?? defaultCoords;
  const bboxSize = 0.02;
  const bbox = [
    mapPoint.lng - bboxSize,
    mapPoint.lat - bboxSize,
    mapPoint.lng + bboxSize,
    mapPoint.lat + bboxSize,
  ].join("%2C");
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapPoint.lat}%2C${mapPoint.lng}`;
  const mapsNavUrl = `https://www.google.com/maps/search/?api=1&query=ambulance+near+${mapPoint.lat},${mapPoint.lng}`;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-800">
          <p className="font-semibold">Emergency Numbers</p>
          <p className="text-xs mt-1">For immediate medical emergencies, call these numbers directly</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-2" onClick={locate} disabled={locating}>
          {locating ? <Navigation className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          Share live location
        </Button>
        <p className="text-xs text-gray-700">{note}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-red-100 shadow-sm h-40">
        <iframe
          title="Ambulance map"
          src={mapUrl}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" className="gap-2" onClick={() => window.open(mapsNavUrl, "_blank") }>
          <Map className="w-4 h-4" />
          Open live navigation
        </Button>
        <p className="text-xs text-gray-500">Defaulting to Andheri if GPS is unavailable.</p>
      </div>

      <div className="space-y-3">
        {emergencyNumbers.map((service, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.availability}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-2xl font-bold text-primary">{service.number}</div>
                  <Button
                    size="sm"
                    onClick={() => handleCall(service.number)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 Quick Tips:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>Stay calm and speak clearly when calling</li>
          <li>Provide your exact location</li>
          <li>Describe the emergency briefly</li>
          <li>Follow the operator's instructions</li>
        </ul>
      </div>
    </div>
  );
};

export default AmbulanceFinder;
