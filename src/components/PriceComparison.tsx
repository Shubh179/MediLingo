import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PriceComparison = () => {
  const [drug, setDrug] = useState('Metformin');
  const [dosage, setDosage] = useState('500mg');
  const [results, setResults] = useState<{ name: string; price: number; link: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:4000/api/price-compare?drug=${encodeURIComponent(drug)}&dosage=${encodeURIComponent(dosage)}`;
      const r = await fetch(url);
      const data = await r.json();
      setResults(data.providers || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Cheapest Pharmacy (Beta)</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="Drug name" />
        <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage" />
      </div>
      <Button className="mt-2" onClick={compare} disabled={loading}>{loading ? 'Comparing…' : 'Compare Prices'}</Button>
      <div className="mt-3 space-y-2">
        {results.map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
            <div>
              <p className="font-medium text-secondary">{p.name}</p>
              <p className="text-xs text-muted-foreground">₹{p.price.toFixed(2)}</p>
            </div>
            <a href={p.link} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Order</a>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No results yet. Enter a drug and compare.</p>
        )}
      </div>
    </div>
  );
};

export default PriceComparison;
