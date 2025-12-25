import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill, MapPin, Navigation, Loader2, Sparkles, Info, Map } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenericDrug {
  brand: string;
  generic: string;
  strength: string;
  notes: string;
  ingredients: string[];
}

interface Store {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const genericCatalog: GenericDrug[] = [
  { brand: "Augmentin", generic: "Amoxicillin + Clavulanic Acid", strength: "625 mg", notes: "₹ Affordable generic available at Jan Aushadhi.", ingredients: ["Amoxicillin", "Clavulanic Acid"] },
  { brand: "Crocin", generic: "Paracetamol", strength: "500 mg", notes: "Pain & fever relief.", ingredients: ["Paracetamol"] },
  { brand: "Pantocid", generic: "Pantoprazole", strength: "40 mg", notes: "Take before meals.", ingredients: ["Pantoprazole"] },
  { brand: "Montek LC", generic: "Montelukast + Levocetirizine", strength: "5/10 mg", notes: "Allergy relief.", ingredients: ["Montelukast", "Levocetirizine"] },
  { brand: "Atorva", generic: "Atorvastatin", strength: "10 mg", notes: "Cholesterol control.", ingredients: ["Atorvastatin"] },
];

// Prioritize Andheri + nearby locations as default anchors
const defaultCoords = { lat: 19.1197, lng: 72.8468 }; // Andheri East

const stores: Store[] = [
  { name: "Jan Aushadhi Kendra - Andheri East", address: "Near Western Express Hwy, Andheri East, Mumbai", lat: 19.1197, lng: 72.8468 },
  { name: "Jan Aushadhi Kendra - Andheri West", address: "Juhu Galli, Andheri West, Mumbai", lat: 19.1284, lng: 72.8397 },
  { name: "Jan Aushadhi Kendra - Vile Parle", address: "Hanuman Rd, Vile Parle East", lat: 19.1016, lng: 72.8449 },
  { name: "Jan Aushadhi Kendra - Jogeshwari", address: "SV Rd, Jogeshwari West", lat: 19.1352, lng: 72.8420 },
];

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const distanceKm = (a: Store, lat: number, lng: number) => {
  const R = 6371;
  const dLat = toRadians(a.lat - lat);
  const dLng = toRadians(a.lng - lng);
  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat)) * Math.cos(toRadians(a.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return Math.round(R * c * 10) / 10;
};

const JanAushadhiFinder = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GenericDrug | null>(null);
  const [locNote, setLocNote] = useState("Use your location to sort nearby Jan Aushadhi stores. A preset area is used if blocked.");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(defaultCoords);
  const [locating, setLocating] = useState(false);
  const [infoText, setInfoText] = useState<string>("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string>("");

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const result = useMemo(() => {
    if (!query.trim()) return null;
    const lower = query.trim().toLowerCase();
    return (
      genericCatalog.find((g) => g.brand.toLowerCase() === lower) ||
      genericCatalog.find((g) => lower.includes(g.brand.toLowerCase())) ||
      genericCatalog.find((g) => g.brand.toLowerCase().includes(lower)) ||
      genericCatalog.find((g) => g.generic.toLowerCase().includes(lower)) ||
      null
    );
  }, [query]);

  const sortedStores = useMemo(() => {
    if (!coords) return stores;
    return [...stores].map((s) => ({ ...s, dist: distanceKm(s, coords.lat, coords.lng) }))
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
  }, [coords]);

  const handleSearch = () => {
    setSelected(result);
    setInfoText("");
    setInfoError("");
  };

  const fetchGeminiInfo = async () => {
    if (!selected) return;
    if (!geminiKey) {
      setInfoError("Gemini API key is not configured (VITE_GEMINI_API_KEY).");
      return;
    }
    try {
      setInfoLoading(true);
      setInfoError("");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Provide a concise 2-3 line description of the generic medicine ${selected.generic} (ingredients: ${selected.ingredients.join(", ")}, strength: ${selected.strength}). Mention it is a low-cost generic alternative; avoid giving medical advice.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setInfoText(text.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch info";
      setInfoError(msg);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocNote("Location not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const baseNote = `Nearest stores around (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}).`;
        setLocNote(`${baseNote} Distances are approximate.`);

        if (mapsKey) {
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${mapsKey}`)
            .then((res) => res.json())
            .then((data) => {
              const locality = data?.results?.[0]?.address_components?.find((c: any) => c.types?.includes("locality"))?.long_name;
              if (locality) {
                setLocNote(`Nearest stores around ${locality}. Distances are approximate.`);
              }
            })
            .catch(() => {
              /* swallow geocode errors */
            });
        }
      },
      () => {
        setLocating(false);
        setLocNote("Couldn't fetch location. Showing default list.");
      },
      { timeout: 8000 }
    );
  };

  const mapPoint = coords ?? defaultCoords;
  const bboxSize = 0.02; // about ~2km box around point
  const bbox = [
    mapPoint.lng - bboxSize,
    mapPoint.lat - bboxSize,
    mapPoint.lng + bboxSize,
    mapPoint.lat + bboxSize,
  ].join("%2C");
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapPoint.lat}%2C${mapPoint.lng}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=Jan+Aushadhi+nearby`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Enter brand name</label>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Augmentin"
          />
          <Button onClick={handleSearch} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Find Generic
          </Button>
        </div>
        <p className="text-xs text-gray-500">Shows Jan Aushadhi generic equivalents and nearby stores.</p>
      </div>

      {selected ? (
        <Card className="border-green-200">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <Pill className="w-4 h-4" /> Generic Found
            </div>
            <p className="text-base font-semibold text-gray-900">{selected.generic}</p>
            <p className="text-sm text-gray-700">Strength: {selected.strength}</p>
            <p className="text-sm text-gray-600">{selected.notes}</p>
            <p className="text-sm text-gray-700">Ingredients: {selected.ingredients.join(", ")}</p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={fetchGeminiInfo} disabled={infoLoading}>
                {infoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                Get details (Gemini)
              </Button>
              {infoError && <span className="text-xs text-red-600">{infoError}</span>}
            </div>
            {infoText && (
              <p className="text-sm text-gray-700 pt-1">{infoText}</p>
            )}
          </CardContent>
        </Card>
      ) : query ? (
        <Card>
          <CardContent className="p-4 text-sm text-gray-600">No direct match found. Please check spelling or try another brand.</CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUseLocation} className="gap-2" disabled={locating}>
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Use my location
          </Button>
          <p className="text-xs text-gray-600">{locNote}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-emerald-100 shadow-sm h-48">
          <iframe
            title="Jan Aushadhi map"
            src={mapUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(mapsSearchUrl, "_blank") }>
            <Map className="w-4 h-4" />
            Open in Google Maps
          </Button>
          <p className="text-xs text-gray-500">Defaults to a preset area if live location is unavailable.</p>
        </div>
        <div className="space-y-2">
          {sortedStores.map((store) => (
            <Card key={store.name} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{store.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" /> {store.address}
                  </p>
                </div>
                {"dist" in store ? (
                  <p className="text-xs text-gray-500">~{(store as any).dist} km away</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JanAushadhiFinder;
