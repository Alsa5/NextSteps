import type { SessionAiAnalysis } from '../types/analytics.js';

const TRANSCRIPT_ANALYSIS_PROMPT = `You are an expert training analyst for Hexaware's NextSteps platform.
Analyse the provided session transcript and return a JSON object with:
{
  "summary": ["bullet 1", "bullet 2"],
  "keyTerms": ["term1", "term2"],
  "confusionPoints": ["topic that caused confusion"],
  "clarityScore": 85,
  "paceRating": "Good",
  "recommendations": ["suggestion for next session"],
  "trainerInsights": "2-3 sentence narrative for the trainer"
}
Return ONLY valid JSON. No markdown fences.`;

export const analyzeTranscriptWithGpt = async (
  rawText: string,
  sessionTitle: string,
): Promise<SessionAiAnalysis> => {
  const endpoint = process.env.AzureOpenAIEndpoint;
  const apiKey = process.env.AzureOpenAIKey;
  const deployment = process.env.AzureOpenAIDeployment ?? 'gpt-5';
  const apiVersion = process.env.AzureOpenAIApiVersion ?? '2025-01-01-preview';

  if (!endpoint || !apiKey) {
    return buildHeuristicAnalysis(rawText, sessionTitle);
  }

  const isGpt5 = deployment.startsWith('gpt-5');
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const messages = [
    {
      role: isGpt5 ? 'developer' : 'system',
      content: TRANSCRIPT_ANALYSIS_PROMPT,
    },
    {
      role: 'user',
      content: `Session title: ${sessionTitle}\n\nTranscript:\n${rawText.slice(0, 12000)}`,
    },
  ];

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        messages,
        stream: false,
        ...(isGpt5
          ? { max_completion_tokens: 1200 }
          : { temperature: 0.3, max_tokens: 1200 }),
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      console.warn('[transcript-analysis] Azure error:', errText);
      return buildHeuristicAnalysis(rawText, sessionTitle);
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = parseAnalysisJson(content);
    if (parsed) {
      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
        model: deployment,
      };
    }
  } catch (err) {
    console.warn('[transcript-analysis] failed:', err);
  }

  return buildHeuristicAnalysis(rawText, sessionTitle);
};

const parseAnalysisJson = (content: string): Omit<SessionAiAnalysis, 'generatedAt' | 'model'> | null => {
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      summary: Array.isArray(data.summary) ? data.summary.map(String) : [],
      keyTerms: Array.isArray(data.keyTerms) ? data.keyTerms.map(String) : [],
      confusionPoints: Array.isArray(data.confusionPoints) ? data.confusionPoints.map(String) : [],
      clarityScore: typeof data.clarityScore === 'number' ? data.clarityScore : null,
      paceRating: typeof data.paceRating === 'string' ? data.paceRating : null,
      recommendations: Array.isArray(data.recommendations) ? data.recommendations.map(String) : [],
      trainerInsights: typeof data.trainerInsights === 'string' ? data.trainerInsights : '',
    };
  } catch {
    return null;
  }
};

const buildHeuristicAnalysis = (
  rawText: string,
  sessionTitle: string,
): SessionAiAnalysis => {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  const confusionLines = lines.filter((l) =>
    /confus|unclear|\?/i.test(l),
  );

  return {
    summary: lines.slice(0, 5).map((l) => l.replace(/^[^:]+:\s*/, '').slice(0, 120)),
    keyTerms: extractCapitalizedTerms(rawText),
    confusionPoints: confusionLines.slice(0, 3).map((l) => l.slice(0, 100)),
    clarityScore: confusionLines.length > 2 ? 72 : 88,
    paceRating: 'Good',
    recommendations: [
      'Review topics that triggered questions in the next recap session.',
      'Share pre-read materials before the next live session.',
    ],
    trainerInsights: `Session "${sessionTitle}" covered ${lines.length} speaking turns. ${confusionLines.length > 0 ? 'Some clarification moments were detected — consider a follow-up Q&A.' : 'Flow appeared clear based on transcript signals.'}`,
    generatedAt: new Date().toISOString(),
    model: 'heuristic-fallback',
  };
};

const extractCapitalizedTerms = (text: string): string[] => {
  const terms = new Set<string>();
  const matches = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}\b/g) ?? [];
  for (const m of matches) {
    if (m.length > 2) terms.add(m);
  }
  return [...terms].slice(0, 8);
};
