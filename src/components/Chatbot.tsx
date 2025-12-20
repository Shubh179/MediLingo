import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const rules = [
  {
    match: /how (many|much) (tablets|capsules|ml)/i,
    answer: 'Follow the prescription label. Common dosages are 1 tablet or 10ml, but confirm with your doctor.',
  },
  {
    match: /(when|what time) should i take/i,
    answer: 'Take at consistent times daily. Morning with breakfast, afternoon with lunch, and night before bed are typical schedules.',
  },
  {
    match: /miss(ed)? dose|forgot to take/i,
    answer: 'If you miss a dose, take it as soon as you remember, unless it is close to the next dose. Do not double dose. Consult a pharmacist for specifics.',
  },
  {
    match: /with food|empty stomach/i,
    answer: 'Some medicines require food for better absorption. When in doubt, take with a light meal and water, or check the label.',
  },
];

const Chatbot = () => {
  const [q, setQ] = useState('');
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const ask = () => {
    const found = rules.find((r) => r.match.test(q));
    const a = found?.answer || 'General advice: Follow the prescription label and consult your doctor for personalized guidance.';
    setHistory((h) => [{ q, a }, ...h].slice(0, 10));
    setQ('');
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Dosage & Schedule Q&A</span>
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question…" />
        <Button onClick={ask} disabled={!q.trim()}>Ask</Button>
      </div>
      <div className="mt-3 space-y-2">
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">Examples: "How many tablets?", "When should I take?", "I missed a dose"</p>
        )}
        {history.map((item, idx) => (
          <div key={idx} className="bg-muted/40 rounded-xl p-3">
            <p className="text-secondary font-medium">Q: {item.q}</p>
            <p className="text-sm text-muted-foreground mt-1">A: {item.a}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Disclaimer: This is general information, not medical advice.</p>
    </div>
  );
};

export default Chatbot;
