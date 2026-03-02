import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const VOLCENGINE_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

function getSupabaseClient(token: string) {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  (req as any).user = user;
  (req as any).supabase = supabase;
  next();
}

// Generate images
app.post('/api/generate', authMiddleware, async (req, res) => {
  const apiKey = process.env.SEEDREAM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SEEDREAM_API_KEY not configured' });

  try {
    const { prompt, image, numImages } = req.body;
    const payload: any = {
      model: 'doubao-seedream-4-5-251128',
      prompt,
      image,
      response_format: 'url',
      size: '2K',
      watermark: true,
      stream: false,
    };

    if (numImages > 1) {
      payload.sequential_image_generation = 'auto';
      payload.sequential_image_generation_options = { max_images: numImages };
    } else {
      payload.sequential_image_generation = 'disabled';
    }

    const response = await fetch(VOLCENGINE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// History CRUD — uses user's own Supabase client (RLS enforced)
app.get('/api/history', authMiddleware, async (req, res) => {
  const supabase = (req as any).supabase;
  const { data, error } = await supabase
    .from('generation_history')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/history', authMiddleware, async (req, res) => {
  const supabase = (req as any).supabase;
  const user = (req as any).user;
  const { image_urls, prompt, options } = req.body;
  const { data, error } = await supabase
    .from('generation_history')
    .insert({ user_id: user.id, image_urls, prompt, options })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/history', authMiddleware, async (req, res) => {
  const supabase = (req as any).supabase;
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase
    .from('generation_history')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
