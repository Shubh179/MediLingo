import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlan } from '@/contexts/PlanContext';

type Item = { text?: string };

const tokenize = (s: string) => s.toLowerCase().match(/[a-zA-Z]+/g) || [];

const AdvancedChatbot = () => {
  const { plan } = usePlan();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  useEffect(() => {
    if (plan !== 'premium') return;
    const uid = localStorage.getItem('medilingo_user_id');
    if (!uid) return;
    fetch(`http://localhost:4000/api/history?userId=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((data) => setItems((data.items || []).map((x: any) => ({ text: x.text || '' }))));
  }, [plan]);

  const index = useMemo(() => {
    return items.map((it) => ({ tokens: tokenize(it.text || '') }));
  }, [items]);

  const ask = () => {
    if (plan !== 'premium') {
      setA('Premium required for personalized advice.');
      return;
    }
    const qt = tokenize(q);
    let bestScore = 0;
    let bestText = '';
    index.forEach((doc, i) => {
      const overlap = qt.filter((t) => doc.tokens.includes(t)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestText = items[i].text || '';
      }
    });
    if (bestScore === 0) {
      setA('Based on your history, keep consistent scheduling and follow dosages. Consult your doctor for changes.');
    } else {
      setA(`From your history: ${bestText}. Recommendation: maintain the same timing and do not adjust dosage without medical guidance.`);
    }
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Advanced Chatbot (Personalized)</span>
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask based on your history…" />
        <Button onClick={ask}>Ask</Button>
      </div>
      {a && <p className="text-sm text-muted-foreground mt-3">{a}</p>}
      <p className="text-xs text-muted-foreground mt-2">Personalized suggestions based on your saved prescriptions (RAG stub).</p>
    </div>
  );
};

export default AdvancedChatbot;
