import { getSafeDiagnostics } from '../../src/server/geminiService';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const diagnostics = await getSafeDiagnostics();
    return res.status(200).json(diagnostics);
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Failed to retrieve diagnostics',
    });
  }
}
