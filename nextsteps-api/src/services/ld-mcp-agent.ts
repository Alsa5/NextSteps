import type { ChatMessage } from './azure-chat-tools.js';
import { chatCompletionWithTools } from './azure-chat-tools.js';
import {
  callMcpTool,
  connectLdMcpClient,
  listMcpToolsForLlm,
} from '../mcp/ld-mcp-client.js';
import type { LdDataContext } from './ld-data-context.js';

const AGENT_SYSTEM = `You are the NextSteps L&D AI Helper — an operations assistant for Learning & Development staff.

You MUST use the provided MCP data tools to answer questions about trainees, recruitment queue, batches, and at-risk mavericks.
Never invent roster data. Never teach Java, OOP, or programming unless explicitly asked about curriculum.

Workflow:
1. Decide which MCP tool(s) to call based on the user's question.
2. After receiving tool JSON results, synthesize a clear, polished answer for L&D staff.
3. Use **bold** for names, counts, and batch IDs. Keep responses concise (under 200 words unless listing a table).
4. If no data is found, say so and suggest a refined query.`;

export type AgentStep = {
  type: 'tool_call' | 'tool_result' | 'assistant';
  tool?: string;
  args?: Record<string, unknown>;
  preview?: string;
};

export type AgentChatResult = {
  reply: string;
  toolsUsed: string[];
  steps: AgentStep[];
  table: { headers: string[]; rows: (string | number)[][] } | null;
  source: 'mcp-agent';
};

const extractTableFromToolJson = (parsed: unknown): AgentChatResult['table'] => {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;

  if (Array.isArray(p.matches) && p.matches.length > 0) {
    const m = p.matches as Record<string, unknown>[];
    return {
      headers: ['Name', 'Batch', 'Track', 'Status', 'Email', 'In Queue'],
      rows: m.map((row) => [
        String(row.name ?? ''),
        String(row.batch ?? 'Queue'),
        String(row.track ?? '—'),
        String(row.status ?? '—'),
        String(row.personalEmail ?? row.email ?? ''),
        row.inQueue ? 'Yes' : 'No',
      ]),
    };
  }

  if (Array.isArray(p.mavericks) && p.mavericks.length > 0) {
    const m = p.mavericks as Record<string, unknown>[];
    return {
      headers: ['Name', 'Batch', 'Readiness', 'Sentiment'],
      rows: m.map((row) => [
        String(row.name ?? ''),
        String(row.batch ?? '—'),
        String(row.readinessScore ?? '—'),
        String(row.sentiment ?? '—'),
      ]),
    };
  }

  if (Array.isArray(p.batches) && p.batches.length > 0) {
    const b = p.batches as Record<string, unknown>[];
    return {
      headers: ['Batch', 'Health', 'Feedback %', 'Readiness', 'Track'],
      rows: b.map((row) => [
        String(row.id ?? row.name ?? ''),
        String(row.health ?? '—'),
        String(row.feedbackCompletion ?? '—'),
        String(row.avgReadiness ?? '—'),
        String(row.track ?? '—'),
      ]),
    };
  }

  if (Array.isArray(p.trainees) && p.trainees.length > 0) {
    const t = p.trainees as Record<string, unknown>[];
    return {
      headers: ['Name', 'Batch', 'Track', 'Status', 'Email'],
      rows: t.map((row) => [
        String(row.name ?? ''),
        String(row.batch ?? 'Queue'),
        String(row.track ?? '—'),
        String(row.status ?? '—'),
        String(row.email ?? row.personalEmail ?? ''),
      ]),
    };
  }

  if (Array.isArray(p.byTrack)) {
    const t = p.byTrack as { track: string; count: number }[];
    return {
      headers: ['Track', 'Count'],
      rows: t.map((row) => [row.track, row.count]),
    };
  }

  if (typeof p.total === 'number') {
    return {
      headers: ['Metric', 'Value'],
      rows: Object.entries(p)
        .filter(([k]) => !['tool', 'byTrack'].includes(k))
        .map(([k, v]) => [k, String(v)]),
    };
  }

  return null;
};

const MAX_TOOL_ROUNDS = 4;

/**
 * LLM agent loop:
 * user message → LLM picks MCP tool(s) → MCP returns JSON → LLM polishes final reply
 */
export const runLdMcpAgent = async (
  userMessage: string,
  ctx: LdDataContext,
  history: ChatMessage[] = [],
): Promise<AgentChatResult> => {
  const { client, close } = await connectLdMcpClient(ctx);
  const steps: AgentStep[] = [];
  const toolsUsed: string[] = [];
  let lastTable: AgentChatResult['table'] = null;

  try {
    const mcpTools = await listMcpToolsForLlm(client);

    const messages: ChatMessage[] = [
      { role: 'system', content: AGENT_SYSTEM },
      ...history.filter((m) => m.role === 'user' || m.role === 'assistant'),
      { role: 'user', content: userMessage },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const { message, finishReason } = await chatCompletionWithTools(messages, mcpTools, {
        maxTokens: 1200,
        temperature: 0.2,
      });

      if (message.tool_calls?.length) {
        messages.push({
          role: 'assistant',
          content: message.content ?? null,
          tool_calls: message.tool_calls,
        });

        for (const tc of message.tool_calls) {
          const toolName = tc.function.name;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
          } catch {
            args = {};
          }

          steps.push({ type: 'tool_call', tool: toolName, args });
          toolsUsed.push(toolName);

          const { raw, parsed, isError } = await callMcpTool(client, toolName, args);
          steps.push({
            type: 'tool_result',
            tool: toolName,
            preview: raw.slice(0, 200),
          });

          if (!isError) {
            const table = extractTableFromToolJson(parsed);
            if (table) lastTable = table;
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: raw,
          });
        }

        continue;
      }

      const reply =
        message.content?.trim() ||
        'I queried the roster but could not formulate a response. Please try rephrasing.';

      steps.push({ type: 'assistant', preview: reply.slice(0, 120) });

      return {
        reply,
        toolsUsed: [...new Set(toolsUsed)],
        steps,
        table: lastTable,
        source: 'mcp-agent',
      };
    }

    return {
      reply: 'I reached the maximum number of tool calls. Please simplify your question.',
      toolsUsed: [...new Set(toolsUsed)],
      steps,
      table: lastTable,
      source: 'mcp-agent',
    };
  } finally {
    await close();
  }
};

/** Offline fallback when Azure OpenAI is unavailable — still uses MCP tools via keyword routing */
export const runLdMcpAgentOffline = async (
  userMessage: string,
  ctx: LdDataContext,
): Promise<AgentChatResult> => {
  const { client, close } = await connectLdMcpClient(ctx);
  const steps: AgentStep[] = [];
  const msg = userMessage.toLowerCase();

  const pickTool = (): { name: string; args: Record<string, unknown> } => {
    const who = userMessage.match(
      /(?:who is|who's|named|called|about)\s+["']?([a-z\s.'-]{2,40})/i,
    );
    if (who?.[1]) return { name: 'lookup_trainee', args: { query: who[1].trim() } };
    if (/queue|recruitment/i.test(msg)) return { name: 'queue_count', args: {} };
    if (/at.?risk|attention/i.test(msg)) return { name: 'at_risk_mavericks', args: { limit: 5 } };
    if (/batch.*risk/i.test(msg)) return { name: 'batches_at_risk', args: {} };
    if (/roster|how many/i.test(msg)) return { name: 'roster_count', args: {} };
    return { name: 'lookup_trainee', args: { query: userMessage.trim() } };
  };

  try {
    const { name, args } = pickTool();
    steps.push({ type: 'tool_call', tool: name, args });
    const { raw, parsed } = await callMcpTool(client, name, args);
    steps.push({ type: 'tool_result', tool: name, preview: raw.slice(0, 200) });
    const table = extractTableFromToolJson(parsed);

    let reply = `Here are the results from **${name}**:\n\n`;
    if (parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>;
      if (Array.isArray(p.matches) && p.matches.length === 1) {
        const m = p.matches[0] as Record<string, unknown>;
        reply = `**${m.name}** is ${m.inQueue ? 'in the recruitment queue' : `assigned to batch ${m.batch}`}. Track: ${m.track ?? '—'}. Email: ${m.personalEmail ?? '—'}.`;
      } else if (typeof p.total === 'number') {
        reply = `**Roster:** ${p.total} total · ${p.assigned ?? '—'} assigned · ${p.inQueue ?? '—'} in queue.`;
      } else {
        reply += 'See the table below for details.';
      }
    }

    return {
      reply,
      toolsUsed: [name],
      steps,
      table,
      source: 'mcp-agent',
    };
  } finally {
    await close();
  }
};
