import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LdDataContext } from '../services/ld-data-context.js';
import { getQueueByTrack, searchTrainees } from '../services/ld-data-context.js';

const jsonResult = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

/**
 * Creates an in-process MCP server scoped to one L&D request context (browser roster snapshot).
 */
export const createLdDataMcpServer = (ctx: LdDataContext): McpServer => {
  const server = new McpServer({
    name: 'nextsteps-ld-data',
    version: '1.0.0',
  });

  server.registerTool(
    'lookup_trainee',
    {
      description:
        'Find a trainee or maverick by name fragment, email, or ID. Returns full profile fields.',
      inputSchema: {
        query: z.string().min(1).describe('Name, email, or ID fragment to search'),
      },
    },
    async ({ query }) => {
      const matches = searchTrainees(ctx.trainees, query, 5);
      return jsonResult({
        tool: 'lookup_trainee',
        query,
        matchCount: matches.length,
        matches: matches.map((t) => ({
          id: t.id,
          name: t.name,
          personalEmail: t.personalEmail,
          batch: t.batch ?? null,
          track: t.track,
          status: t.status,
          college: t.college,
          inQueue: !t.batch,
          readinessScore: t.readinessScore ?? 0,
          riskFlag: t.riskFlag ?? false,
        })),
      });
    },
  );

  server.registerTool(
    'roster_count',
    {
      description: 'Count total trainees, assigned to batches, and in recruitment queue.',
      inputSchema: z.object({}),
    },
    async () => {
      const assigned = ctx.trainees.filter((t) => t.batch);
      const queue = ctx.trainees.filter((t) => !t.batch);
      return jsonResult({
        tool: 'roster_count',
        total: ctx.trainees.length,
        assigned: assigned.length,
        inQueue: queue.length,
      });
    },
  );

  server.registerTool(
    'queue_count',
    {
      description: 'Recruitment queue size overall and broken down by track (GET, PGET, STEP, LEAP).',
      inputSchema: z.object({}),
    },
    async () => {
      const queue = ctx.trainees.filter((t) => !t.batch);
      return jsonResult({
        tool: 'queue_count',
        total: queue.length,
        byTrack: getQueueByTrack(ctx.trainees),
      });
    },
  );

  server.registerTool(
    'at_risk_mavericks',
    {
      description: 'List mavericks flagged as at-risk with readiness and sentiment.',
      inputSchema: {
        limit: z.number().int().min(1).max(20).default(5).describe('Max rows to return'),
      },
    },
    async ({ limit }) => {
      const fromContext = ctx.atRiskMavericks.slice(0, limit);
      const fromTrainees = ctx.trainees
        .filter((t) => t.riskFlag)
        .slice(0, limit)
        .map((t) => ({
          name: t.name,
          batch: t.batch ?? 'Queue',
          readinessScore: t.readinessScore ?? 0,
          sentiment: t.sentiment ?? 'unknown',
        }));
      const rows = fromContext.length > 0 ? fromContext : fromTrainees;
      return jsonResult({ tool: 'at_risk_mavericks', count: rows.length, mavericks: rows });
    },
  );

  server.registerTool(
    'batches_at_risk',
    {
      description: 'List batches with amber/red health or feedback completion below 70%.',
      inputSchema: z.object({}),
    },
    async () => {
      const atRisk = ctx.batches.filter(
        (b) =>
          b.health === 'red' ||
          b.health === 'amber' ||
          (b.feedbackCompletion ?? 100) < 70,
      );
      return jsonResult({ tool: 'batches_at_risk', count: atRisk.length, batches: atRisk });
    },
  );

  server.registerTool(
    'batch_summary',
    {
      description: 'Summary of all batches with maverick counts, readiness, feedback, and health.',
      inputSchema: z.object({}),
    },
    async () => {
      return jsonResult({
        tool: 'batch_summary',
        batchCount: ctx.batches.length,
        batches: ctx.batches,
      });
    },
  );

  server.registerTool(
    'list_trainees',
    {
      description: 'List trainees optionally filtered by name/email fragment.',
      inputSchema: {
        query: z.string().optional().describe('Optional name or email filter'),
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async ({ query, limit }) => {
      const rows = query ? searchTrainees(ctx.trainees, query, limit) : ctx.trainees.slice(0, limit);
      return jsonResult({
        tool: 'list_trainees',
        count: rows.length,
        trainees: rows.map((t) => ({
          name: t.name,
          batch: t.batch ?? 'Queue',
          track: t.track,
          status: t.status,
          email: t.personalEmail,
        })),
      });
    },
  );

  return server;
};
