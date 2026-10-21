import express from 'express';
import dotenv from 'dotenv';
import {
  generate3DModel,
  chatWithLabMentor,
  generateKeyTakeaways,
  explainSimulationChange,
  scanDiagram,
  interpretPromptChange,
  getSafeDiagnostics,
} from './geminiService';

dotenv.config();

const app = express();
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health and diagnostics (safe, zero key exposure)
app.all(
  ['/api/ai/health', '/ai/health', '/api/ai/models/status', '/ai/models/status', '/api/ai/test', '/ai/test'],
  async (req, res) => {
    try {
      const diag = await getSafeDiagnostics();
      return res.status(200).json(diag);
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  }
);

// Generate 3D Model
app.post(['/api/ai/generate-model', '/ai/generate-model'], async (req, res) => {
  const { prompt, forceFresh, requestId } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  try {
    const result = await generate3DModel(prompt, { forceFresh: Boolean(forceFresh), requestId });
    const status = result.success ? 200 : (result.code === 'AUTH_MISSING' ? 401 : 503);
    return res.status(status).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Chatbot / Lab Mentor (also supports action: 'key_takeaways')
app.post(['/api/ai/chat', '/ai/chat'], async (req, res) => {
  const body = req.body || {};
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
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Key Takeaways / Important Points Extraction
app.post(['/api/ai/key-takeaways', '/ai/key-takeaways'], async (req, res) => {
  const body = req.body || {};
  const answerText = body.answer || body.text || body.response || '';
  const questionText = body.question || body.message || '';
  const { modelTitle, subject, context } = body;
  if (!answerText || typeof answerText !== 'string') {
    return res.status(400).json({ error: 'Answer text is required' });
  }
  try {
    const resolvedTitle = modelTitle || context?.title || 'Scientific Simulation';
    const resolvedSubject = subject || context?.subject || 'Science';
    const result = await generateKeyTakeaways(questionText, answerText, resolvedTitle, resolvedSubject, context);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Explain simulation change (both /explain and /explain-change)
app.post(['/api/ai/explain', '/ai/explain', '/api/ai/explain-change', '/ai/explain-change'], async (req, res) => {
  try {
    const result = await explainSimulationChange(req.body || {});
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Diagram scanner (both /scan-diagram and /analyze-diagram)
app.post(
  ['/api/ai/scan-diagram', '/ai/scan-diagram', '/api/ai/analyze-diagram', '/ai/analyze-diagram'],
  async (req, res) => {
    const { imageBase64, mimeType, fileName } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }
    try {
      const result = await scanDiagram(imageBase64, mimeType, fileName);
      return res.status(result.success ? 200 : 503).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Parameter interpretation
app.post(
  ['/api/ai/interpret-change', '/ai/interpret-change', '/api/ai/interpret-prompt', '/ai/interpret-prompt'],
  async (req, res) => {
    const prompt = req.body?.prompt || req.body?.userPrompt;
    const { currentParams, allowedParameters } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
      const result = await interpretPromptChange(prompt, currentParams, allowedParameters);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default app;
