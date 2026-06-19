import mockData from '../data/mockData.json'
import {
  loadTrainees,
  loadBatches,
  getUnassignedTrainees,
} from '../data/ldTraineeStore'
import { getOpsDashboardMetrics, getEffectivenessData } from './ldAnalytics'

/** MCP-style tool definitions exposed to the agent router */
export const TOOL_DEFINITIONS = [
  { name: 'roster_count', description: 'Count trainees in roster vs recruitment queue' },
  { name: 'queue_count', description: 'Recruitment queue size by track' },
  { name: 'lookup_trainee', description: 'Find trainee/maverick by name or email fragment', params: ['query'] },
  { name: 'list_trainees', description: 'List trainees matching a name filter', params: ['query', 'limit'] },
  { name: 'at_risk_mavericks', description: 'List at-risk mavericks', params: ['limit'] },
  { name: 'batches_at_risk', description: 'Batches flagged amber/red or low feedback' },
  { name: 'batch_summary', description: 'Active batch ops snapshot' },
  { name: 'effectiveness', description: 'Training effectiveness by batch' },
  { name: 'top_performers', description: 'Top performers by readiness', params: ['limit'] },
]

const formatList = (items, fields) =>
  items.map((item, i) =>
    `${i + 1}. ${fields.map((f) => `${f.label}: ${item[f.key] ?? '—'}`).join(' · ')}`,
  ).join('\n')

const normalize = (s) => String(s ?? '').trim().toLowerCase()

const allPeople = () => {
  const trainees = loadTrainees()
  const maverickById = new Map(mockData.mavericks.map((m) => [m.id, m]))
  return trainees.map((t) => {
    const mav = maverickById.get(t.id)
    return {
      ...t,
      readinessScore: t.readinessScore || mav?.readinessScore || 0,
      riskFlag: mav?.riskFlag ?? false,
      sentiment: mav?.sentiment,
      attendance: mav?.attendance,
      xp: mav?.xp,
      quizAvg: mav?.quizAvg,
      source: 'trainee',
    }
  })
}

const searchPeople = (query, limit = 10) => {
  const q = normalize(query)
  if (!q) return []
  return allPeople().filter((p) =>
    normalize(p.name).includes(q)
    || normalize(p.personalEmail).includes(q)
    || normalize(p.hexEmail).includes(q)
    || normalize(p.id).includes(q),
  ).slice(0, limit)
}

const formatTraineeDetail = (t) => {
  const queue = !t.batch || t.recruitmentStatus === 'recruited'
  return {
    type: 'table',
    text: `**${t.name}** (${t.id})\n`
      + `- **Status:** ${t.status}${queue ? ' · in recruitment queue' : ''}\n`
      + `- **Batch:** ${t.batch || 'Unassigned'}\n`
      + `- **Track:** ${t.track || '—'}\n`
      + `- **Email:** ${t.personalEmail}${t.hexEmail ? ` · ${t.hexEmail}` : ''}\n`
      + `- **College:** ${t.college || '—'}\n`
      + `- **Readiness:** ${t.readinessScore ?? 0}${t.riskFlag ? ' · **at-risk**' : ''}\n`
      + (t.sentiment ? `- **Sentiment:** ${t.sentiment}\n` : '')
      + (t.employeeId ? `- **Employee ID:** ${t.employeeId}\n` : ''),
    table: {
      headers: ['Field', 'Value'],
      rows: [
        ['Name', t.name],
        ['ID', t.id],
        ['Status', t.status],
        ['Batch', t.batch || 'Unassigned'],
        ['Track', t.track || '—'],
        ['Personal email', t.personalEmail],
        ['Hex email', t.hexEmail || '—'],
        ['College', t.college || '—'],
        ['Readiness', t.readinessScore ?? 0],
        ['Assessment', t.assessmentScore ?? '—'],
        ['At risk', t.riskFlag ? 'Yes' : 'No'],
        ['In queue', queue ? 'Yes' : 'No'],
      ],
    },
  }
}

export const QUERY_TOOLS = {
  roster_count: {
    label: 'Trainee roster count',
    run: () => {
      const trainees = loadTrainees()
      const assigned = trainees.filter((t) => t.batch)
      const unassigned = getUnassignedTrainees(trainees)
      return {
        type: 'stat',
        tool: 'roster_count',
        text: `**Trainee Roster**\n- Total trainees: **${trainees.length}**\n- Assigned to batches: **${assigned.length}**\n- In recruitment queue: **${unassigned.length}**`,
        table: {
          headers: ['Category', 'Count'],
          rows: [
            ['Total trainees', trainees.length],
            ['Assigned', assigned.length],
            ['Recruitment queue', unassigned.length],
          ],
        },
      }
    },
  },
  queue_count: {
    label: 'Recruitment queue',
    run: () => {
      const queue = getUnassignedTrainees()
      const byTrack = ['GET', 'PGET', 'STEP', 'LEAP'].map((track) => ({
        track,
        count: queue.filter((t) => t.track === track).length,
      }))
      return {
        type: 'stat',
        tool: 'queue_count',
        text: `**Recruitment Queue**: **${queue.length}** candidates awaiting batch assignment.\n\nBy track:\n${byTrack.map((tr) => `- ${tr.track}: ${tr.count}`).join('\n')}`,
        table: {
          headers: ['Track', 'Count'],
          rows: byTrack.map((tr) => [tr.track, tr.count]),
        },
      }
    },
  },
  lookup_trainee: {
    label: 'Lookup trainee',
    run: (query) => {
      const matches = searchPeople(query, 5)
      if (matches.length === 0) {
        return {
          type: 'not_found',
          tool: 'lookup_trainee',
          text: `No trainee or maverick found matching **"${query}"** in the live roster.`,
          table: null,
        }
      }
      if (matches.length === 1) {
        return { ...formatTraineeDetail(matches[0]), tool: 'lookup_trainee' }
      }
      return {
        type: 'table',
        tool: 'lookup_trainee',
        text: `**${matches.length} people** match **"${query}"**:`,
        table: {
          headers: ['Name', 'Batch', 'Track', 'Status', 'Email'],
          rows: matches.map((t) => [
            t.name,
            t.batch || 'Queue',
            t.track || '—',
            t.status,
            t.personalEmail,
          ]),
        },
      }
    },
  },
  list_trainees: {
    label: 'List trainees',
    run: (query = '', limit = 10) => {
      const people = query ? searchPeople(query, limit) : allPeople().slice(0, limit)
      return {
        type: 'table',
        tool: 'list_trainees',
        text: query
          ? `**${people.length} trainee(s)** matching "${query}":`
          : `**First ${people.length} trainees** in roster:`,
        table: {
          headers: ['Name', 'Batch', 'Track', 'Status', 'Readiness'],
          rows: people.map((t) => [
            t.name,
            t.batch || 'Queue',
            t.track || '—',
            t.status,
            t.readinessScore ?? 0,
          ]),
        },
      }
    },
  },
  at_risk_mavericks: {
    label: 'At-risk mavericks',
    run: (limit = 5) => {
      const atRisk = mockData.mavericks.filter((m) => m.riskFlag).slice(0, limit)
      return {
        type: 'table',
        tool: 'at_risk_mavericks',
        text: `**${atRisk.length} at-risk maverick(s)** (showing up to ${limit}):`,
        table: {
          headers: ['Name', 'Batch', 'Readiness', 'Sentiment', 'Attendance'],
          rows: atRisk.map((m) => [m.name, m.batch, m.readinessScore, m.sentiment || '—', `${m.attendance ?? '—'}%`]),
        },
      }
    },
  },
  batches_at_risk: {
    label: 'Batches at risk',
    run: () => {
      const batches = loadBatches().filter(
        (b) => b.health === 'red' || b.health === 'amber' || (b.feedbackCompletion ?? 100) < 70,
      )
      return {
        type: 'table',
        tool: 'batches_at_risk',
        text: batches.length
          ? `**${batches.length} batch(es) at risk:**`
          : 'No batches currently flagged at risk.',
        table: {
          headers: ['Batch', 'Health', 'Feedback %', 'Readiness', 'Track'],
          rows: batches.map((b) => [b.id, b.health, b.feedbackCompletion ?? 0, b.avgReadiness ?? '—', b.track]),
        },
      }
    },
  },
  batch_summary: {
    label: 'Active batch summary',
    run: () => {
      const metrics = getOpsDashboardMetrics()
      return {
        type: 'table',
        tool: 'batch_summary',
        text: `**Ops snapshot:** ${metrics.activeBatchCount} active batches · ${metrics.avgFeedback}% avg feedback · ${metrics.atRiskCount} at-risk mavericks`,
        table: {
          headers: ['Batch', 'Mavericks', 'Readiness', 'Feedback %', 'Health'],
          rows: metrics.batchChartData.map((b) => [b.id, b.mavericks, b.readiness, b.feedback, b.health]),
        },
      }
    },
  },
  effectiveness: {
    label: 'Effectiveness correlation',
    run: () => {
      const data = getEffectivenessData().filter((d) => d.projectSuccess != null)
      return {
        type: 'table',
        tool: 'effectiveness',
        text: `**Training effectiveness** across ${data.length} deployed batches:`,
        table: {
          headers: ['Batch', 'Readiness', 'Manager Rating', 'Project Success %'],
          rows: data.map((d) => [d.batch, d.readinessScore, d.managerRating, d.projectSuccess]),
        },
      }
    },
  },
  top_performers: {
    label: 'Top performers',
    run: (limit = 5) => {
      const top = getOpsDashboardMetrics().topPerformers.slice(0, limit)
      return {
        type: 'table',
        tool: 'top_performers',
        text: `**Top ${top.length} performers** by readiness score:`,
        table: {
          headers: ['Name', 'Batch', 'Readiness', 'XP', 'Quiz Avg'],
          rows: top.map((m) => [m.name, m.batch, m.readinessScore, m.xp, `${m.quizAvg}%`]),
        },
      }
    },
  },
}

/** Extract a person name/email fragment from natural language */
export const extractPersonQuery = (message) => {
  const trimmed = message.trim()
  const patterns = [
    /(?:who is|who's|tell me about|details?(?:\s+about)?|fetch details?(?:\s+about)?|find|lookup|look up|search(?:\s+for)?|info(?:rmation)?(?:\s+on|\s+about)?)\s+(?:the\s+)?(?:trainee|maverick|recruit|person|candidate)?\s*(?:named|called)?\s*["']?([^"'?]+?)["']?\s*$/i,
    /(?:trainee|maverick|recruit)\s+(?:named|called)\s+["']?([^"'?]+?)["']?\s*$/i,
    /^["']?([a-z][a-z\s.'-]{1,40})["']?\s*(?:profile|details?|info)?\s*$/i,
  ]
  for (const re of patterns) {
    const m = trimmed.match(re)
    if (m?.[1]) {
      const q = m[1].trim().replace(/\?+$/, '')
      if (q.length >= 2 && !/^(the|a|an|in|on|at)$/i.test(q)) return q
    }
  }
  return null
}

const PATTERNS = [
  { re: /how many.*(roster|trainee|foster)/i, tool: 'roster_count' },
  { re: /recruitment queue|in the queue|awaiting batch/i, tool: 'queue_count' },
  { re: /at.?risk|need(s)? attention|risk flag/i, tool: 'at_risk_mavericks' },
  { re: /batch.*at.?risk|batches.*risk|underperform/i, tool: 'batches_at_risk' },
  { re: /active batch|batch summary|ops dashboard/i, tool: 'batch_summary' },
  { re: /effectiveness|project success|correlation/i, tool: 'effectiveness' },
  { re: /top performer|best maverick|highest readiness/i, tool: 'top_performers' },
  { re: /five people|5 people|show me \d+/i, tool: 'at_risk_mavericks' },
  { re: /who is|who's|tell me about|fetch details|lookup|look up|find trainee|search for|details about|information about/i, tool: 'lookup_trainee', useExtract: true },
  { re: /list trainees|show trainees|trainee list/i, tool: 'list_trainees' },
]

export const routeQueryToTool = (message) => {
  const trimmed = message.trim()
  if (!trimmed) return null

  const limitMatch = trimmed.match(/(\d+)\s*(people|maverick|candidate|person|trainee)/i)
  const limit = limitMatch ? Math.min(20, parseInt(limitMatch[1], 10)) : 5

  const personQuery = extractPersonQuery(trimmed)

  for (const { re, tool, useExtract } of PATTERNS) {
    if (re.test(trimmed)) {
      if (useExtract || tool === 'lookup_trainee') {
        const q = personQuery || trimmed.replace(re, '').trim() || trimmed.split(/\s+/).pop()
        if (q && q.length >= 2) return { tool, params: [q] }
      }
      return { tool, params: tool === 'at_risk_mavericks' || tool === 'top_performers' ? [limit] : [] }
    }
  }

  if (personQuery) return { tool: 'lookup_trainee', params: [personQuery] }

  if (/help|what can you|tools|mcp/i.test(trimmed)) {
    return { tool: '__help__', params: [] }
  }

  return null
}

export const parseAndRunQuery = (message) => {
  const route = routeQueryToTool(message)
  if (!route) {
    return { type: 'unknown', tool: null, text: null, table: null }
  }

  if (route.tool === '__help__') {
    return {
      type: 'help',
      tool: 'help',
      text: `**L&D data tools** (query roster directly — no generic chat):\n${TOOL_DEFINITIONS.map((t) => `- **${t.name}**: ${t.description}`).join('\n')}\n\nTry: "Who is Madhav?", "Recruitment queue count", "Five people at risk"`,
      table: null,
    }
  }

  const fn = QUERY_TOOLS[route.tool]
  if (!fn) return { type: 'unknown', tool: null, text: null, table: null }
  return fn.run(...route.params)
}

export const runQueryTool = (toolId, ...params) => {
  const tool = QUERY_TOOLS[toolId]
  if (!tool) return null
  return tool.run(...params)
}

export const buildToolContextPayload = () => {
  const trainees = loadTrainees()
  const maverickById = new Map(mockData.mavericks.map((m) => [m.id, m]))
  return {
    trainees: trainees.map((t) => {
      const mav = maverickById.get(t.id)
      return {
        id: t.id,
        name: t.name,
        personalEmail: t.personalEmail,
        batch: t.batch,
        track: t.track,
        status: t.status,
        college: t.college,
        readinessScore: t.readinessScore || mav?.readinessScore || 0,
        assessmentScore: t.assessmentScore,
        riskFlag: mav?.riskFlag ?? false,
        sentiment: mav?.sentiment,
      }
    }),
    batches: loadBatches().map((b) => ({
      id: b.id,
      name: b.name,
      health: b.health,
      feedbackCompletion: b.feedbackCompletion,
      avgReadiness: b.avgReadiness,
      track: b.track,
      maverickCount: b.maverickCount,
    })),
    atRiskMavericks: mockData.mavericks
      .filter((m) => m.riskFlag)
      .map((m) => ({
        name: m.name,
        batch: m.batch,
        readinessScore: m.readinessScore,
        sentiment: m.sentiment,
        attendance: m.attendance,
      })),
  }
}
