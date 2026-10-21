import { chatWithLabMentor, generateKeyTakeaways } from '../../src/server/geminiService';

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

  if (body.action === 'key_takeaways' || body.mode === 'key_takeaways') {
    const answerText = body.answer || body.text || body.response || '';
    const questionText = body.question || body.message || '';
    const { modelTitle, subject, context } = body;
    if (!answerText || typeof answerText !== 'string') {
      return res.status(400).json({ error: 'Answer text is required for key takeaways' });
    }
    try {
      const resolvedTitle = modelTitle || context?.title || 'Scientific Simulation';
      const resolvedSubject = subject || context?.subject || 'Science';
      const result = await generateKeyTakeaways(questionText, answerText, resolvedTitle, resolvedSubject, context);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || 'Internal AI server error',
      });
    }
  }

  const rawQuestion = body.question || body.message || body.prompt;
  const { modelTitle, subject, context } = body;
  if (!rawQuestion || typeof rawQuestion !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const resolvedTitle = modelTitle || context?.title || 'Scientific Simulation';
    const resolvedSubject = subject || context?.subject || 'Science';
    const result = await chatWithLabMentor(rawQuestion, resolvedTitle, resolvedSubject, context);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Internal AI server error',
    });
  }
}

