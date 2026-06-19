/**
 * L&D AI Helper — MCP agent client.
 * User message → API LLM agent → MCP tool calls → polished reply.
 */
import { apiRequest } from '../config/api-client'
import { buildToolContextPayload } from './ldQueryEngine'

/**
 * @param {string} message
 * @param {Array<{role: string, content: string}>} history
 * @returns {Promise<{ reply: string, toolsUsed: string[], steps: object[], table: object|null, source: string, warning?: string }>}
 */
export const runLdMcpChatAgent = async (message, history = []) => {
  const response = await apiRequest('POST', '/api/v1/ld/ai-helper/chat', {
    message,
    history: history.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.message || m.content || '',
    })),
    context: buildToolContextPayload(),
  })

  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Agent request failed (${response.status})`)
  })

  if (!response.ok) {
    throw new Error(data.error || `Agent request failed (${response.status})`)
  }

  return {
    reply: data.reply,
    toolsUsed: data.toolsUsed ?? [],
    steps: data.steps ?? [],
    table: data.table ?? null,
    source: data.source ?? 'mcp-agent',
    warning: data.warning,
  }
}
