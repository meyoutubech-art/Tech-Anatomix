import { scanDiagram } from '../../src/server/geminiService';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { imageBase64, mimeType, fileName } = body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 data is required' });
  }

  try {
    const result = await scanDiagram(imageBase64, mimeType, fileName);
    return res.status(result.success ? 200 : 503).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal AI server error',
    });
  }
}
