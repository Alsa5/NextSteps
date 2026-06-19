import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import { azureChatWithFallback, BUDDY_SYSTEM } from '../../services/azureOpenAI'
import mockData from '../../data/mockData.json'

const SUGGESTIONS = [
  'Explain polymorphism in Java with an example',
  'How do SQL JOINs work? Show a sample query',
  'What should I revise before the assessment?',
  'Summarise what OOP is in 5 bullet points',
  'Explain REST API methods with examples',
  'What is the difference between abstract class and interface?',
]

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      className={`ai-bubble ai-bubble--${isUser ? 'user' : 'ai'}`}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="ai-bubble__avatar" aria-hidden>
          <Bot size={14} />
        </div>
      )}
      <div className="ai-bubble__content">
        {msg.message.split('\n').map((line, i) => {
          if (!line.trim()) return <br key={i} />
          if (line.startsWith('```')) return null
          const parts = line.split(/(\*\*[^*]+\*\*)/g)
          return (
            <p key={i} className="ai-bubble__line">
              {parts.map((p, j) =>
                p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p,
              )}
            </p>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function AIBuddy() {
  const [messages, setMessages] = useState(
    (mockData.aiLearningBuddyHistory ?? []).map((m) => ({ ...m, id: m.id ?? String(Math.random()) })),
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', message: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].slice(-10)
      const apiMessages = [
        { role: 'system', content: BUDDY_SYSTEM },
        ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.message })),
      ]
      const reply = await azureChatWithFallback(apiMessages)
      if (!reply?.trim()) throw new Error('Empty response')
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', message: reply }])
    } catch (err) {
      toast.error(err.message || 'AI Buddy is offline — check your Azure OpenAI connection')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleClear = () => { setMessages([]); toast('Chat cleared', { icon: '🗑️' }) }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ai-buddy-page"
    >
      <MetaversePageHero
        role="maverick"
        variant="pulse"
        title="AI Learning Buddy"
        subtitle="Powered by Azure OpenAI — ask anything about your current phase, get instant explanations."
        noCanvas
      />

      {/* Suggestion chips */}
      <div className="ai-chips">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="ai-chip"
            onClick={() => sendMessage(s)}
            disabled={loading}
          >
            <Sparkles size={11} />
            {s}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="ai-chat-window">
        <div className="ai-chat-header">
          <div className="ai-chat-status">
            <span className="ai-chat-dot" />
            <span>AI Buddy — Azure OpenAI (gpt-5)</span>
          </div>
          <button type="button" className="ai-chat-clear" onClick={handleClear} aria-label="Clear chat">
            <RefreshCw size={13} /> Clear
          </button>
        </div>

        <div className="ai-chat-messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="ai-chat-empty">
              <Bot size={40} className="ai-chat-empty__icon" />
              <p>Ask me anything about your Maverick journey</p>
            </div>
          )}
          {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          {loading && (
            <motion.div
              className="ai-bubble ai-bubble--ai ai-bubble--typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="ai-bubble__avatar"><Bot size={14} /></div>
              <div className="ai-typing-dots">
                {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />)}
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="ai-chat-input-row">
          <textarea
            className="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={loading}
            aria-label="Message to AI Buddy"
          />
          <button
            type="button"
            className="ai-chat-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
