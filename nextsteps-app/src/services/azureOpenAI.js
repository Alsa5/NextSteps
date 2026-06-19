/**
 * Azure OpenAI client — proxied through nextsteps-api (/api/v1/ai/chat)
 * to avoid CORS issues with direct browser calls to Azure OpenAI.
 */

const PROXY_URL = '/api/v1/ai/chat'

/**
 * Send a chat completion request via the nextsteps-api proxy.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} opts
 * @returns {Promise<string>} - assistant reply text
 */
export const azureChat = async (messages, opts = {}) => {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 800,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`AI proxy error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const reply = (data.reply ?? '').trim()
  if (!reply) {
    throw new Error('AI returned an empty response')
  }
  return reply
}

const DEMO_REPLIES = [
  (q) => `Great question! Here's a concise take on **${q.slice(0, 40)}…**

In Java OOP, think of polymorphism as one interface, many implementations — a List can be ArrayList or LinkedList, but your code talks to the List interface.

**Key idea:** compile-time vs runtime binding.

Want a code example or a quiz-style recap?`,
]

export const azureChatWithFallback = async (messages, opts = {}) => {
  try {
    return await azureChat(messages, opts)
  } catch (err) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user' || m.role === 'developer')
    const text = lastUser?.content || 'your topic'
    console.warn('[AI Buddy] proxy failed, using demo fallback:', err.message)
    return DEMO_REPLIES[0](text)
  }
}

/** System prompt for the NextSteps AI Learning Buddy */
export const BUDDY_SYSTEM = `You are the NextSteps AI Learning Buddy — a friendly, 
encouraging study companion for Hexaware Maverick trainees. 
You help with Java, SQL, REST APIs, OOP, Angular, React, cloud basics, and soft skills.
You explain concepts clearly with examples, give concise answers, and celebrate progress.
Keep answers under 250 words unless the user asks for more detail.
Format key points with **bold** and use code blocks for code samples.`

/** System prompt for session transcript analysis */
export const TRANSCRIPT_SYSTEM = `You are an expert training analyst for Hexaware's NextSteps platform.
Analyse the provided session transcript and return a JSON object with:
{
  "summary": ["bullet 1", "bullet 2", ...],          // 4-6 key takeaways
  "keyTerms": ["term1", "term2", ...],                // 5-8 technical terms covered
  "confusionPoints": ["topic that caused confusion"], // spots where trainees struggled
  "clarityScore": 85,                                 // 0-100 estimated clarity score
  "paceRating": "Good",                               // Too Slow / Good / Too Fast
  "recommendations": ["suggestion for next session"]  // 2-3 actionable items for the trainer
}
Return ONLY valid JSON. No markdown fences.`

/**
 * Analyse a session transcript with Azure OpenAI.
 * @param {string} transcriptText - raw transcript text or array of lines joined
 * @returns {Promise<object>} - parsed analysis JSON
 */
export const analyseTranscript = async (transcriptText) => {
  const content = await azureChat([
    { role: 'system', content: TRANSCRIPT_SYSTEM },
    { role: 'user', content: `Analyse this session transcript:\n\n${transcriptText}` },
  ], { temperature: 0.3, maxTokens: 600 })

  try {
    return JSON.parse(content)
  } catch {
    return { summary: [content], keyTerms: [], confusionPoints: [], clarityScore: null, paceRating: null, recommendations: [] }
  }
}

/**
 * Stream readiness prediction for a Maverick's skill profile.
 * @param {object} skills - { java: 65, sql: 45, ... }
 * @returns {Promise<string>} - recommendation text
 */
export const predictStreamReadiness = async (skills) => {
  const skillSummary = Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}%`)
    .join(', ')

  return azureChat([
    {
      role: 'system',
      content: `You are a career stream advisor for Hexaware's Maverick programme. 
                Given a trainee's skill scores, recommend the best stream and give a short rationale.
                Streams: Product Engineering, Cloud & DevOps, Data Analytics, QA Automation, Full Stack, ERP.
                Keep it under 100 words.`,
    },
    { role: 'user', content: `Trainee skill profile: ${skillSummary}` },
  ], { temperature: 0.5, maxTokens: 150 })
}
