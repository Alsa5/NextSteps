import type { McpToolDefinition } from '../mcp/ld-mcp-client.js';

export type ChatMessage = {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

const mcpSchemaToOpenAiParameters = (inputSchema?: Record<string, unknown>) => {
  if (!inputSchema || typeof inputSchema !== 'object') {
    return { type: 'object', properties: {} };
  }
  const props = (inputSchema as { properties?: Record<string, unknown> }).properties;
  const required = (inputSchema as { required?: string[] }).required ?? [];
  if (props) {
    return { type: 'object', properties: props, required };
  }
  return inputSchema;
};

export const mcpToolsToOpenAi = (tools: McpToolDefinition[]) =>
  tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description ?? `MCP tool ${t.name}`,
      parameters: mcpSchemaToOpenAiParameters(t.inputSchema),
    },
  }));

export const chatCompletionWithTools = async (
  messages: ChatMessage[],
  tools: McpToolDefinition[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{
  message: ChatMessage;
  finishReason: string | null;
}> => {
  const endpoint = process.env.AzureOpenAIEndpoint;
  const apiKey = process.env.AzureOpenAIKey;
  const deployment = process.env.AzureOpenAIDeployment ?? 'gpt-5';
  const apiVersion = process.env.AzureOpenAIApiVersion ?? '2025-01-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI is not configured on this server');
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const isGpt5 = deployment.startsWith('gpt-5');

  const normalizedMessages = messages.map((m) => ({
    ...m,
    role: isGpt5 && m.role === 'system' ? 'developer' : m.role,
  }));

  const openAiTools = mcpToolsToOpenAi(tools);

  const requestBody: Record<string, unknown> = {
    messages: normalizedMessages,
    tools: openAiTools,
    tool_choice: 'auto',
    stream: false,
    ...(isGpt5
      ? { max_completion_tokens: opts.maxTokens ?? 1200 }
      : { temperature: opts.temperature ?? 0.2, max_tokens: opts.maxTokens ?? 1200 }),
  };

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(requestBody),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => upstream.statusText);
    throw new Error(`Azure OpenAI error: ${errText}`);
  }

  const data = (await upstream.json()) as {
    choices?: Array<{
      finish_reason?: string;
      message?: ChatMessage;
    }>;
  };

  const choice = data.choices?.[0];
  return {
    message: choice?.message ?? { role: 'assistant', content: '' },
    finishReason: choice?.finish_reason ?? null,
  };
};
