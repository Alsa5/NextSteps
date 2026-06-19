import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { LdDataContext } from '../services/ld-data-context.js';
import { createLdDataMcpServer } from './ld-data-server.js';

export type McpToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

/** Connect an MCP client to a fresh in-process LD data server for this request. */
export const connectLdMcpClient = async (ctx: LdDataContext) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLdDataMcpServer(ctx);
  const client = new Client({ name: 'nextsteps-ld-agent', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server, close: async () => {
    await client.close();
    await server.close();
  } };
};

export const listMcpToolsForLlm = async (client: Client): Promise<McpToolDefinition[]> => {
  const { tools } = await client.listTools();
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Record<string, unknown> | undefined,
  }));
};

export const callMcpTool = async (
  client: Client,
  name: string,
  args: Record<string, unknown>,
) => {
  const result = await client.callTool({ name, arguments: args });
  const content = Array.isArray(result.content) ? result.content : [];
  const textPart = content.find((c: { type?: string; text?: string }) => c.type === 'text');
  const text = textPart?.text ? String(textPart.text) : JSON.stringify(content);
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }
  return { raw: text, parsed, isError: Boolean(result.isError) };
};
