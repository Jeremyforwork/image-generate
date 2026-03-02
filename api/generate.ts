import type { VercelRequest, VercelResponse } from '@vercel/node';

const VOLCENGINE_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth token from Supabase
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.SEEDREAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SEEDREAM_API_KEY not configured on server' });
  }

  try {
    const { prompt, image, numImages, aspectRatio } = req.body;

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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Volcengine API Error: ${errorText}` });
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
