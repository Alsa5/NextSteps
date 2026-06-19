import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, Sparkles, Copy, Download, FileSpreadsheet, FileText, ChevronDown, Wrench,
} from 'lucide-react'
import toast from 'react-hot-toast'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import { QUERY_TOOLS } from '../../services/ldQueryEngine'
import { runLdMcpChatAgent } from '../../services/ldAiAgent'
import { copyToClipboard, exportChatPDF, exportTableExcel } from '../../utils/exportUtils'

const SUGGESTIONS = [
  'Who is Madhav?',
  'How many people are in the trainee roster?',
  'Recruitment queue count by track',
  'Five people who are at risk',
  'Which batches are at risk?',
  'Fetch details about trainee named Madhav',
]

function ToolBadge({ tool, source }) {
  if (!tool) return null
  const label = Array.isArray(tool) ? tool.join(', ') : tool
  return (
    <span className="ld-helper-tool-badge" title={`MCP · ${source}`}>
      <Wrench size={10} /> {label}
    </span>
  )
}

function MessageBubble({ msg, onExportTable }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      className={`ai-bubble ai-bubble--${isUser ? 'user' : 'ai'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isUser && (
        <div className="ai-bubble__avatar" aria-hidden>
          <Bot size={14} />
        </div>
      )}
      <div className="ai-bubble__content">
        {!isUser && msg.tool && (
          <ToolBadge tool={msg.tool} source={msg.source} />
        )}
        {msg.message.split('\n').map((line, i) => {
          if (!line.trim()) return <br key={i} />
          const parts = line.split(/(\*\*[^*]+\*\*)/g)
          return (
            <p key={i} className="ai-bubble__line">
              {parts.map((p, j) =>
                p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p,
              )}
            </p>
          )
        })}
        {msg.table && (
          <div className="ld-helper-table-wrap">
            <table className="ld-helper-table">
              <thead>
                <tr>{msg.table.headers.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {msg.table.rows.map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn btn-sm btn-ghost ld-helper-export-row"
              onClick={() => onExportTable(msg.table)}
            >
              <FileSpreadsheet size={13} /> Export table
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function LDAIHelper() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      tool: 'help',
      source: 'local-roster',
      message: '**L&D AI Helper** uses an **LLM agent** with **MCP tools** — your question goes to the model, it picks the right data tool, queries the live roster, then polishes the answer.\n\nTry: "Who is Madhav?", "How many in recruitment queue?", "Batches at risk".',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTool, setActiveTool] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const chatEndRef = useRef(null)
  const exportRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const handleClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleExportTable = (table) => {
    exportTableExcel(table.headers, table.rows, `ld-query-${Date.now()}.xlsx`, 'Query Result')
    toast.success('Excel exported')
  }

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', message: trimmed }
    const priorHistory = messages.filter((m) => m.id !== 'welcome')
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActiveTool('llm routing…')

    try {
      const agentResult = await runLdMcpChatAgent(trimmed, priorHistory)
      const toolsLabel = agentResult.toolsUsed?.length
        ? agentResult.toolsUsed.join(', ')
        : 'mcp-agent'

      setActiveTool(toolsLabel)
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          message: agentResult.warning
            ? `${agentResult.reply}\n\n_${agentResult.warning}_`
            : agentResult.reply,
          table: agentResult.table ?? null,
          tool: agentResult.toolsUsed?.length ? agentResult.toolsUsed : 'mcp-agent',
          source: agentResult.source,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          tool: 'error',
          source: 'none',
          message: `Agent error: ${err.message}. Ensure you are signed in as L&D and the API is running on port 3003.`,
        },
      ])
    } finally {
      setLoading(false)
      setActiveTool(null)
    }
  }, [loading, messages])

  const handleCopyChat = async () => {
    const text = messages.map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.message}`).join('\n\n')
    await copyToClipboard(text)
    toast.success('Chat copied')
  }

  const handleExportPdf = () => {
    exportChatPDF({ title: 'L&D AI Helper Chat', messages, filename: `ld-ai-helper-${Date.now()}.pdf` })
    toast.success('PDF exported')
    setExportOpen(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ld-ai-helper-page">
      <MetaversePageHero
        role="ld"
        title="AI Helper"
        subtitle="LLM agent with MCP tools — model selects tools, queries roster JSON, then polishes your answer."
      />

      <div className="ld-helper-layout">
        <aside className="ld-helper-sidebar">
          <h3 className="font-display">Quick queries</h3>
          <div className="ld-helper-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="ld-helper-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="ld-helper-tools">
            <h4>Data tools (MCP-style)</h4>
            {Object.entries(QUERY_TOOLS).map(([id, tool]) => (
              <button
                key={id}
                type="button"
                className="ld-helper-tool-btn"
                onClick={() => sendMessage(tool.label)}
              >
                <Sparkles size={12} /> {tool.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="ld-helper-chat">
          <div className="ld-helper-chat__toolbar">
            <span className="ld-helper-chat__status">
              <Bot size={14} /> Tool agent · local roster + API registry
            </span>
            <div className="ld-helper-export" ref={exportRef}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setExportOpen((v) => !v)}>
                <Download size={14} /> Export <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    className="ld-helper-export-menu"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    <button type="button" onClick={handleCopyChat}><Copy size={14} /> Copy chat</button>
                    <button type="button" onClick={handleExportPdf}><FileText size={14} /> Export chat PDF</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="ld-helper-messages">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onExportTable={handleExportTable} />
            ))}
            {loading && (
              <div className="ai-bubble ai-bubble--ai">
                <div className="ai-bubble__avatar"><Bot size={14} /></div>
                <div className="ai-bubble__content">
                  <span className="ld-helper-tool-badge ld-helper-tool-badge--loading">
                    <Wrench size={10} /> {activeTool || 'LLM selecting MCP tool…'}
                  </span>
                  <p className="ai-bubble__line">Agent running — LLM → MCP tool → polish…</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            className="ld-helper-input-row"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Try: "Who is Madhav?" or "recruitment queue count"'
              className="ld-helper-input"
              aria-label="Ask L&D AI Helper"
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
