import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadMedicines, findByNameRanked, findAlternatives, computeSavings, MedicineRecord, loadGenerics, findGenericAlternatives, computeGenericSavings, GenericRecord } from "@/lib/medicineDataService";
import { resolveGenericWithGemini } from "@/lib/genericResolver";

const MedicineComparator = () => {
  const [all, setAll] = useState<MedicineRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MedicineRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generics, setGenerics] = useState<GenericRecord[] | null>(null);
  const [geminiSuggestion, setGeminiSuggestion] = useState<{
    brand: string;
    generic: string;
    strength: string;
    ingredients: string[];
    notes: string;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [rows, genRows] = await Promise.all([
          loadMedicines(),
          loadGenerics().catch(() => []) as Promise<GenericRecord[]>
        ]);
        setAll(rows);
        setGenerics(genRows);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load medicine data. Ensure CSV exists at /data/indian_medicine_data.csv.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const matches = useMemo(() => {
    if (!all || !query.trim()) return [];
    return findByNameRanked(all, query).slice(0, 20);
  }, [all, query]);

  const alternatives = useMemo(() => {
    if (!all || !selected) return [];
    return findAlternatives(all, selected).sort((a, b) => a.price - b.price);
  }, [all, selected]);

  const genericAlts = useMemo(() => {
    if (!generics || !selected) return [] as GenericRecord[];
    return findGenericAlternatives(generics, selected).sort((a, b) => a.mrp - b.mrp);
  }, [generics, selected]);

  const totalAlternatives = alternatives.length;

  const topCombined = useMemo(() => {
    if (!selected) return [] as Array<{
      kind: 'branded' | 'generic';
      name: string;
      brandName?: string;
      genericName: string;
      manufacturerOrGroup: string;
      packOrUnit: string;
      price: number;
      savingsText: string;
    }>; 

    const branded = alternatives.map((a) => {
      const { diff, pct } = computeSavings(selected, a);
      const generic = [a.short_composition1, a.short_composition2].filter(Boolean).join(' + ');
      return {
        kind: 'branded' as const,
        name: a.name,
        brandName: a.name,
        genericName: generic,
        manufacturerOrGroup: a.manufacturer_name,
        packOrUnit: a.pack_size_label,
        price: a.price,
        savingsText: `₹${diff.toFixed(2)} (${pct.toFixed(1)}%)`,
      };
    });

    const generic = genericAlts.map((g) => {
      const { diff, pct } = computeGenericSavings(selected!, g);
      return {
        kind: 'generic' as const,
        name: g.genericName,
        genericName: g.genericName,
        manufacturerOrGroup: g.groupName,
        packOrUnit: g.unitSize,
        price: g.mrp,
        savingsText: `₹${diff.toFixed(2)} (${pct.toFixed(1)}%)`,
      };
    });

    const brandedSorted = branded.sort((a, b) => a.price - b.price);
    const genericSorted = generic.sort((a, b) => a.price - b.price);

    const limit = 10;
    const preferredGeneric = Math.min(6, limit); // prefer up to 6 generic first
    const takeGeneric = genericSorted.slice(0, preferredGeneric);
    const remaining = limit - takeGeneric.length;
    const takeBranded = brandedSorted.slice(0, Math.max(0, remaining));

    // If not enough results overall, fill from whichever list has more left
    let combined = [...takeGeneric, ...takeBranded];
    if (combined.length < limit) {
      const moreGeneric = genericSorted.slice(takeGeneric.length, takeGeneric.length + (limit - combined.length));
      combined = [...combined, ...moreGeneric];
    }
    if (combined.length < limit) {
      const moreBranded = brandedSorted.slice(takeBranded.length, takeBranded.length + (limit - combined.length));
      combined = [...combined, ...moreBranded];
    }

    return combined;
  }, [alternatives, genericAlts, selected]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Enter medicine name</label>
        <div className="flex gap-2 mt-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Augmentin 625 Duo Tablet"
          />
          <Button
            onClick={() => {
              if (matches.length > 0) setSelected(matches[0]);
            }}
            disabled={loading || !matches.length}
          >Compare</Button>
        </div>
        {loading && <p className="text-xs text-gray-500 mt-1">Loading data…</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      {matches.length > 0 && !selected && (
        <div className="border rounded-md p-2">
          <p className="text-xs text-gray-600 mb-2">Select a medicine to compare:</p>
          <div className="max-h-48 overflow-auto space-y-1">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="w-full text-left text-sm px-2 py-1 rounded hover:bg-primary/10"
              >
                {m.name} — ₹{m.price.toFixed(2)} — {m.pack_size_label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          <div className="border rounded-md p-3">
            <p className="text-sm font-semibold">Selected Medicine</p>
            <p className="text-sm">{selected.name}</p>
            <p className="text-xs text-gray-600">Composition: {selected.short_composition1} {selected.short_composition2}</p>
            <p className="text-xs text-gray-600">Manufacturer: {selected.manufacturer_name}</p>
            <p className="text-xs text-gray-600">Pack: {selected.pack_size_label}</p>
            <p className="text-sm mt-1">Price: ₹{selected.price.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Top 10 composition matches</p>
            {topCombined.length === 0 ? (
              <p className="text-xs text-gray-600">No composition matches found in datasets.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-2 px-2 font-semibold">Brand Name</th>
                      <th className="py-2 px-2 font-semibold">Generic Name</th>
                      <th className="py-2 px-2 font-semibold">Source</th>
                      <th className="py-2 px-2 font-semibold">Pack/Unit</th>
                      <th className="py-2 px-2 font-semibold text-right">Price (₹)</th>
                      <th className="py-2 px-2 font-semibold text-right">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCombined.map((row) => (
                      <tr key={`${row.kind}-${row.name}-${row.packOrUnit}`} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{row.kind === 'branded' ? row.brandName : '—'}</td>
                        <td className="py-2 px-2 text-gray-700">{row.genericName}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${row.kind === 'generic' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.kind === 'branded' ? 'Branded' : 'Generic'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-600">{row.packOrUnit}</td>
                        <td className="py-2 px-2 text-right font-medium">₹{row.price.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-emerald-600 font-medium">{row.savingsText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {topCombined.length === 0 && (
            <div className="border rounded-md p-3 bg-emerald-50">
              <p className="text-sm font-medium mb-2">AI suggestion</p>
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await resolveGenericWithGemini(selected.name);
                  setGeminiSuggestion(result || null);
                }}
              >Use Gemini to suggest a generic</Button>
              {geminiSuggestion && (
                <div className="mt-2 text-sm">
                  <p><strong>Brand:</strong> {geminiSuggestion.brand}</p>
                  <p><strong>Generic:</strong> {geminiSuggestion.generic}</p>
                  <p><strong>Strength:</strong> {geminiSuggestion.strength}</p>
                  <p><strong>Ingredients:</strong> {geminiSuggestion.ingredients.join(', ')}</p>
                  <p className="text-xs text-gray-600">{geminiSuggestion.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>Choose another</Button>
            <Button
              onClick={() => {
                const url = `https://www.google.com/maps/search/generic+medicine+store`;
                window.open(url, "_blank");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >Find Generic Stores</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineComparator;
