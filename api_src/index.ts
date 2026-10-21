import { getSafeDiagnostics } from '../src/server/geminiService';

export default async function handler(req: any, res: any) {
  try {
    const diagnostics = await getSafeDiagnostics();
    return res.status(200).json({
      service: 'VIZLAB AI API',
      ...diagnostics,
    });
  } catch (error: any) {
    return res.status(500).json({
      service: 'VIZLAB AI API',
      status: 'error',
      error: error.message,
    });
  }
}
