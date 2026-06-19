import { Router } from 'express';
import { z } from 'zod';
import { requireRoles } from '../middleware/auth.js';
import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';
import { ldDataContextSchema } from '../services/ld-data-context.js';
import { runLdMcpAgent, runLdMcpAgentOffline } from '../services/ld-mcp-agent.js';

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  context: ldDataContextSchema.optional(),
});

export interface LdAiHelperRouterDeps {
  traineeRegistry: TraineeRegistryRepository;
}

export const createLdAiHelperRouter = (_deps: LdAiHelperRouterDeps): Router => {
  const router = Router();

  router.get('/ld/ai-helper/tools', requireRoles('ld'), async (_req, res) => {
    res.json({
      protocol: 'mcp',
      sdk: '@modelcontextprotocol/sdk',
      description: 'Tools are registered on an in-process MCP server per chat request.',
    });
  });

  /**
   * POST /ld/ai-helper/chat
   * Full agent loop: user message → LLM tool selection → MCP call → LLM polished reply
   */
  router.post('/ld/ai-helper/chat', requireRoles('ld'), async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid chat request', details: parsed.error.flatten() });
      return;
    }

    const { message, history, context } = parsed.data;
    const ctx = context ?? { trainees: [], batches: [], atRiskMavericks: [] };

    try {
      const result = await runLdMcpAgent(
        message,
        ctx,
        history.map((h) => ({ role: h.role, content: h.content })),
      );

      res.json({
        reply: result.reply,
        toolsUsed: result.toolsUsed,
        steps: result.steps,
        table: result.table,
        source: result.source,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[ld/ai-helper/chat] LLM agent failed, MCP offline fallback:', errMsg);

      try {
        const fallback = await runLdMcpAgentOffline(message, ctx);
        res.json({
          ...fallback,
          warning: 'Azure OpenAI unavailable — used MCP tools with template reply',
        });
      } catch (fallbackErr) {
        const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        res.status(500).json({ error: fbMsg });
      }
    }
  });

  return router;
};
