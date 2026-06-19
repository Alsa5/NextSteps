import { Router, type Request, type Response } from 'express';

const router = Router();

/**
 * POST /api/v1/ai/chat
 * Proxies chat completion requests to Azure OpenAI.
 * Bypasses CORS — browser cannot call Azure OpenAI directly.
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages, temperature = 0.7, max_tokens = 800 } = req.body as {
    messages?: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required and must be non-empty' });
    return;
  }

  const endpoint   = process.env.AzureOpenAIEndpoint;
  const apiKey     = process.env.AzureOpenAIKey;
  const deployment = process.env.AzureOpenAIDeployment ?? 'gpt-5';
  const apiVersion = process.env.AzureOpenAIApiVersion ?? '2025-01-01-preview';

  if (!endpoint || !apiKey) {
    res.status(503).json({ error: 'Azure OpenAI is not configured on this server' });
    return;
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  // GPT-5 uses 'developer' instead of 'system' and 'max_completion_tokens' instead of 'max_tokens'
  const isGpt5 = deployment.startsWith('gpt-5');
  const normalizedMessages = messages.map((m) => ({
    ...m,
    role: isGpt5 && m.role === 'system' ? 'developer' : m.role,
  }));

  // GPT-5 only supports default temperature (1) and uses max_completion_tokens
  const requestBody: Record<string, unknown> = {
    messages: normalizedMessages,
    stream: false,
    ...(isGpt5
      ? { max_completion_tokens: max_tokens }
      : { temperature, max_tokens }),
  };

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      res.status(upstream.status).json({ error: `Azure OpenAI error: ${errText}` });
      return;
    }

    const data = await upstream.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai/chat] upstream error:', message);
    res.status(500).json({ error: message });
  }
});

export const createAiRouter = () => router;
