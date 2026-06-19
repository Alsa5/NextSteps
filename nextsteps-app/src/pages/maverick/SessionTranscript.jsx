import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Sparkles, ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import { analyseTranscript } from '../../services/azureOpenAI'
import { fetchMaverickSessions, fetchTranscriptSummary } from '../../services/sessionApi'
import mockData from '../../data/mockData.json'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const MOCK_TRANSCRIPTS = [
  {
    sessionId: 'ses-001',
    title: 'Java OOP Fundamentals',
    date: '2025-04-28',
    trainer: 'Rajesh Menon',
    duration: '2 hours',
    summary: [
      'OOP is built on four pillars: Encapsulation, Abstraction, Inheritance, Polymorphism.',
      'A class is a blueprint; an object is an instance of that class with real-world state.',
      'Inheritance enables code reuse — child classes extend parent classes and override methods.',
      '`super()` calls the parent constructor; `@Override` annotation signals intent clearly.',
      'Interfaces define contracts; abstract classes provide partial implementations.',
    ],
    keyTerms: ['Polymorphism', 'Encapsulation', 'Inheritance'],
    content: [
      { time: '00:02', speaker: 'Trainer', text: "Good morning everyone. Today we're covering the four pillars of Object-Oriented Programming in Java." },
      { time: '00:05', speaker: 'Trainer', text: "Let's start with Encapsulation — the practice of bundling data and the methods that operate on that data within one unit." },
      { time: '00:12', speaker: 'Trainer', text: "When we declare private fields and provide public getters/setters, that's Encapsulation in action." },
      { time: '00:22', speaker: 'Trainer', text: "Now Inheritance. Think of it as an IS-A relationship. A Dog IS-A Animal. The Dog class can inherit from Animal and get all its behaviour for free." },
      { time: '00:35', speaker: 'Trainer', text: "Polymorphism literally means many forms. One interface, multiple implementations. An Animal reference can hold a Dog, Cat, or Bird object." },
      { time: '00:48', speaker: 'Trainer', text: "Abstraction hides complexity. Abstract classes and interfaces allow us to define what must exist without specifying how." },
      { time: '01:05', speaker: 'Trainer', text: "Let's write a quick example with a Vehicle abstract class and Car and Bike subclasses." },
      { time: '01:45', speaker: 'Trainer', text: "Great session today. Any questions before we wrap? Remember, OOP is the foundation for everything we build in Phase 2." },
    ],
  },
  {
    sessionId: 'ses-002',
    title: 'SQL Joins & Subqueries',
    date: '2025-04-29',
    trainer: 'Rajesh Menon',
    duration: '2 hours',
    summary: [
      'SQL JOIN combines rows from two or more tables based on a related column.',
      'INNER JOIN returns records with matching values in both tables.',
      'LEFT JOIN returns all left-table rows even without a right-table match.',
      'Subqueries can appear in SELECT, FROM, or WHERE clauses.',
      'Correlated subqueries reference the outer query — run once per outer row.',
    ],
    keyTerms: ['INNER JOIN', 'LEFT JOIN', 'Subquery'],
    content: [
      { time: '00:03', speaker: 'Trainer', text: "Today we're tackling the most important SQL concepts for back-end developers — joins and subqueries." },
      { time: '00:10', speaker: 'Trainer', text: "An INNER JOIN returns only the rows where there's a match in both tables. If there's no match, that row is excluded entirely." },
      { time: '00:25', speaker: 'Trainer', text: "LEFT JOIN — also called LEFT OUTER JOIN — returns all rows from the left table, and matched rows from the right. No match? You get NULL." },
      { time: '00:40', speaker: 'Trainer', text: "Subqueries are just queries inside queries. Use them when you need to filter based on an aggregate or a derived value." },
      { time: '01:10', speaker: 'Trainer', text: "Correlated subqueries are trickier — they reference a column from the outer query. They're powerful but expensive. Index your join columns." },
      { time: '01:45', speaker: 'Trainer', text: "For performance: prefer JOINs over subqueries when possible. Use EXPLAIN to check your query plan." },
    ],
  },
]

function TranscriptEntry({ entry, highlight }) {
  const matchesHighlight = highlight && entry.text.toLowerCase().includes(highlight.toLowerCase())
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: matchesHighlight ? 'rgba(247,201,72,0.06)' : 'transparent',
      borderRadius: matchesHighlight ? 6 : 0,
      paddingLeft: matchesHighlight ? 8 : 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 36, fontFamily: 'monospace' }}>
          {entry.time}
        </span>
        <span style={{ fontSize: 11, color: 'var(--brand-violet)', fontWeight: 600, minWidth: 60 }}>
          {entry.speaker}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, flex: 1 }}>
          {highlight ? highlightText(entry.text, highlight) : entry.text}
        </span>
      </div>
    </div>
  )
}

function highlightText(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(247,201,72,0.3)', color: '#fff', borderRadius: 3, padding: '0 2px' }}>{part}</mark>
      : part
  )
}

export default function SessionTranscript() {
  const [apiSessions, setApiSessions] = useState([])
  const [selectedId, setSelectedId] = useState('ses-001')
  const [search, setSearch] = useState('')
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [analysing, setAnalysing] = useState(false)
  const [apiTranscript, setApiTranscript] = useState(null)

  useEffect(() => {
    fetchMaverickSessions()
      .then(({ sessions }) => {
        if (sessions?.length) {
          setApiSessions(sessions)
          setSelectedId(sessions[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const loadApiTranscript = useCallback(async (sessionId) => {
    try {
      const data = await fetchTranscriptSummary(sessionId)
      setApiTranscript(data)
      if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis)
    } catch {
      setApiTranscript(null)
    }
  }, [])

  useEffect(() => {
    if (apiSessions.some((s) => s.id === selectedId)) {
      loadApiTranscript(selectedId)
    }
  }, [selectedId, apiSessions, loadApiTranscript])

  const handleAiAnalyse = async (transcript) => {
    setAnalysing(true)
    setAiAnalysis(null)
    try {
      const raw = apiTranscript?.rawText
        ?? transcript.content.map((e) => `[${e.time}] ${e.speaker}: ${e.text}`).join('\n')
      const result = await analyseTranscript(raw)
      setAiAnalysis(result)
      toast.success('GPT analysis complete!')
    } catch (err) {
      toast.error('AI analysis failed — check Azure OpenAI configuration')
      console.error(err)
    } finally {
      setAnalysing(false)
    }
  }

  const sessionList = [
    ...apiSessions.map((s) => ({
      sessionId: s.id,
      title: s.title,
      date: new Date(s.scheduledAt).toLocaleDateString(),
      trainer: s.trainerName ?? 'Trainer',
      duration: 'Live session',
      fromApi: true,
    })),
    ...MOCK_TRANSCRIPTS.filter((m) => !apiSessions.some((a) => a.id === m.sessionId)),
  ]

  const transcript = MOCK_TRANSCRIPTS.find((t) => t.sessionId === selectedId)
  const apiSession = apiSessions.find((s) => s.id === selectedId)

  const displaySummary = apiTranscript?.summary ?? transcript?.summary ?? []
  const displayKeyTerms = apiTranscript?.keyTerms ?? transcript?.keyTerms ?? []
  const content = apiTranscript?.segments?.map((s) => ({
    time: s.startTime,
    speaker: s.speaker,
    text: s.text,
  })) ?? transcript?.content ?? []

  const filteredContent = search
    ? content.filter((e) => e.text.toLowerCase().includes(search.toLowerCase()))
    : content

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="maverick"
          title="Session Transcripts"
          subtitle="Searchable transcripts with AI summaries — your personal study archive"
        />
      </motion.div>

      {/* Session selector */}
      <motion.div variants={item} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {sessionList.map((t) => (
          <button
            key={t.sessionId}
            type="button"
            onClick={() => { setSelectedId(t.sessionId); setSearch(''); setAiAnalysis(null) }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: `1px solid ${selectedId === t.sessionId ? 'var(--brand-violet)' : 'rgba(255,255,255,0.1)'}`,
              background: selectedId === t.sessionId ? 'rgba(123,92,245,0.2)' : 'rgba(255,255,255,0.03)',
              color: selectedId === t.sessionId ? '#e8e4ff' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer', fontSize: 13, fontWeight: selectedId === t.sessionId ? 600 : 400,
            }}
          >
            {t.title}
          </button>
        ))}
      </motion.div>

      {(transcript || apiSession) && (
        <>
          {/* Session info */}
          <motion.div variants={item}>
            <AppMagicCard className="card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{apiSession?.title ?? transcript?.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                  {apiSession?.trainerName ?? transcript?.trainer} · {apiSession ? new Date(apiSession.scheduledAt).toLocaleDateString() : transcript?.date}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                <Clock size={14} /> {transcript?.duration ?? 'Live session'}
              </div>
            </AppMagicCard>
          </motion.div>

          {/* AI Summary */}
          <motion.div variants={item}>
            <AppMagicCard className="card card-accent-soft" style={{ marginBottom: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setSummaryExpanded(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', flex: 1 }}
                >
                  <Sparkles size={16} style={{ color: 'var(--brand-amber)' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>AI Summary</span>
                  {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAnalyse(transcript ?? { content })}
                  disabled={analysing}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  {analysing ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                  {analysing ? 'Analysing…' : 'Re-analyse with AI'}
                </button>
              </div>
              {summaryExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 4 }}>
                  {/* Live AI analysis if available */}
                  {aiAnalysis && (
                    <div style={{ marginBottom: 16, padding: 12, background: 'rgba(123,92,245,0.08)', borderRadius: 10, border: '1px solid rgba(123,92,245,0.2)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand-amber)', marginBottom: 8 }}>
                        ✦ Azure OpenAI Analysis
                      </p>
                      {aiAnalysis.summary?.map((pt, i) => (
                        <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 6, lineHeight: 1.55 }}>• {pt}</p>
                      ))}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', fontSize: 12 }}>
                        {aiAnalysis.clarityScore != null && (
                          <span style={{ color: '#22c55e' }}>Clarity: {aiAnalysis.clarityScore}%</span>
                        )}
                        {aiAnalysis.paceRating && (
                          <span style={{ color: '#f7c948' }}>Pace: {aiAnalysis.paceRating}</span>
                        )}
                      </div>
                      {aiAnalysis.confusionPoints?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, color: '#ef7351', fontWeight: 600 }}>Confusion points: </span>
                          {aiAnalysis.confusionPoints.map((c, i) => <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginLeft: 4 }}>{c}</span>)}
                        </div>
                      )}
                    </div>
                  )}
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {displaySummary.map((point, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8, lineHeight: 1.6 }}>{point}</li>
                    ))}
                  </ol>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginRight: 4 }}>Key terms:</span>
                    {(aiAnalysis?.keyTerms ?? displayKeyTerms).map((term) => (
                      <span key={term} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, background: 'rgba(67,97,238,0.2)', border: '1px solid rgba(67,97,238,0.35)', color: '#a5b4fc' }}>{term}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AppMagicCard>
          </motion.div>

          {/* Search */}
          <motion.div variants={item} style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transcript…"
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                border: '1px solid rgba(123,92,245,0.3)', background: 'rgba(0,0,0,0.25)',
                color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {filteredContent.length} results
              </span>
            )}
          </motion.div>

          {/* Transcript */}
          <motion.div variants={item}>
            <AppMagicCard className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BookOpen size={16} style={{ color: 'var(--brand-violet)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Full Transcript</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
                  {filteredContent.length} entries
                </span>
              </div>
              {filteredContent.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  No entries matching "{search}"
                </p>
              ) : (
                filteredContent.map((entry, i) => (
                  <TranscriptEntry key={i} entry={entry} highlight={search} />
                ))
              )}
            </AppMagicCard>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
