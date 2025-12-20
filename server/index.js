import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;

// Mongo setup
let dbReady = false;
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      dbReady = true;
      console.log('MongoDB connected');
    })
    .catch((e) => console.warn('MongoDB connection failed:', e.message));
}

const PrescriptionSchema = new mongoose.Schema({
  userId: String,
  imageUrl: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

// In-memory fallback
const memoryStore = [];

app.post('/api/history', async (req, res) => {
  const { userId, imageUrl, text } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const item = { userId, imageUrl, text, createdAt: new Date() };
  try {
    if (dbReady) {
      const doc = await Prescription.create(item);
      return res.json({ ok: true, id: doc._id });
    }
    memoryStore.push(item);
    return res.json({ ok: true, id: memoryStore.length });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/api/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    if (dbReady) {
      const docs = await Prescription.find({ userId }).sort({ createdAt: -1 }).limit(50);
      return res.json({ ok: true, items: docs });
    }
    const items = memoryStore.filter((x) => x.userId === userId).sort((a,b) => b.createdAt - a.createdAt);
    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list' });
  }
});

app.post('/api/caregiver-alert', async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.log('[WhatsApp stub] Would send to', phone, 'msg:', message);
    return res.json({ ok: true, stub: true });
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });
    const data = await r.json();
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to send alert' });
  }
});

app.get('/api/price-compare', async (req, res) => {
  const { drug, dosage } = req.query;
  if (!drug) return res.status(400).json({ error: 'drug required' });
  // Stubbed providers
  const providers = [
    { name: 'LocalMart', price: Math.random() * 100 + 50, link: 'https://example.com/localmart' },
    { name: 'QuickMed', price: Math.random() * 100 + 40, link: 'https://example.com/quickmed' },
    { name: 'PharmaX', price: Math.random() * 100 + 60, link: 'https://example.com/pharmax' },
  ];
  providers.sort((a,b) => a.price - b.price);
  res.json({ ok: true, drug, dosage, providers });
});

app.post('/api/scan', async (req, res) => {
  const { image, name, type } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image required (base64 data URL)' });

  // If an external OCR endpoint is provided, forward the request
  if (process.env.OCR_ENDPOINT) {
    try {
      const forwardHeaders = {
        'Content-Type': 'application/json',
      };
      if (process.env.OCR_API_KEY) {
        forwardHeaders['Authorization'] = `Bearer ${process.env.OCR_API_KEY}`;
      }
      const r = await fetch(process.env.OCR_ENDPOINT, {
        method: 'POST',
        headers: forwardHeaders,
        body: JSON.stringify({ image, name, type }),
      });
      const data = await r.json();
      return res.json({ ok: true, text: data.text || 'No text returned from OCR endpoint.' });
    } catch (e) {
      console.warn('OCR forward failed', e.message);
    }
  }

  // Fallback: mock a high-quality decipher result
  const fallback = 'Medication: Metformin 500mg (1x morning with food), Lisinopril 10mg (1x daily), Atorvastatin 20mg (night). Drink water and avoid heavy meals before bedtime.';
  return res.json({ ok: true, text: fallback });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
