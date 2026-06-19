import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, TrendingUp, Star, AlertTriangle, CheckCircle2, Users, ChevronRight, X, ChevronDown, FileText, FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import PersonAvatar from '../../components/PersonAvatar'
import { loadBatches } from '../../data/ldTraineeStore'
import { getFeedbackTrendByMonth, getFeedbackByBatch } from '../../services/ldAnalytics'
import { exportCSV, exportPDFTable, exportTableExcel } from '../../utils/exportUtils'
import mockData from '../../data/mockData.json'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { animatedBarProps, animatedLineProps, chartAxisStroke, chartTooltipStyle } from '../../components/charts/chartTheme'

const TRAINERS = ['Arunesh Kumar', 'Rajesh Menon', 'Sunita Bhat', 'Vikram Das', 'Preethi Nair']
const MAVERICKS_LIST = mockData.mavericks.slice(0, 10).map((m) => m.name)
const BATCHES = loadBatches().map((b) => b.id)

const generateFeedback = () => {
  const records = []
  let seed = 42
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let i = 0; i < 30; i++) {
    const type = i % 3 === 0 ? 'deep' : 'pulse'
    const trainerScore = Math.round(3 + rand() * 2)
    records.push({
      id: `fb-${i + 1}`,
      type,
      source: 'maverick',
      submittedBy: MAVERICKS_LIST[i % MAVERICKS_LIST.length],
      submittedById: mockData.mavericks[i % mockData.mavericks.length]?.id || `mav-${String(i + 1).padStart(3, '0')}`,
      aboutTrainer: TRAINERS[i % TRAINERS.length],
      batch: BATCHES[i % BATCHES.length] || 'B-2025-13',
      date: `2026-0${Math.min(6, 1 + Math.floor(i / 5))}-${String(1 + (i % 28)).padStart(2, '0')}`,
      ratings: {
        clarity: Math.round(2 + rand() * 3),
        pace: Math.round(2 + rand() * 3),
        engagement: Math.round(2 + rand() * 3),
        trainerEffectiveness: trainerScore,
        overall: trainerScore,
      },
      openText: ['More examples would help', 'Pace was too fast in the SQL section', 'Great session!', 'Could explain inheritance better', 'Very engaging', 'Please provide practice exercises'][i % 6],
      flag: trainerScore <= 2 ? 'low-rating' : null,
    })
  }

  for (let i = 0; i < 20; i++) {
    const mavScore = Math.round(3 + rand() * 2)
    records.push({
      id: `fb-m-${i + 1}`,
      type: 'performance',
      source: 'manager',
      submittedBy: ['Kiran Menon (Manager)', 'Suma Rao (Manager)', 'Deepa Krishnan (Manager)'][i % 3],
      submittedById: `mgr-${String(i + 1).padStart(3, '0')}`,
      aboutMaverick: MAVERICKS_LIST[i % MAVERICKS_LIST.length],
      aboutMaverickId: mockData.mavericks[i % mockData.mavericks.length]?.id,
      trainer: TRAINERS[i % TRAINERS.length],
      batch: BATCHES[i % BATCHES.length] || 'B-2025-13',
      date: `2026-0${Math.min(6, 1 + Math.floor(i / 4))}-${String(1 + (i % 28)).padStart(2, '0')}`,
      ratings: {
        technicalSkill: Math.round(2 + rand() * 3),
        communication: Math.round(2 + rand() * 3),
        problemSolving: Math.round(2 + rand() * 3),
        overall: mavScore,
      },
      openText: ['Shows great initiative', 'Needs improvement in communication', 'Technically strong', 'Excellent performance', 'Inconsistent attendance'][i % 5],
      flag: mavScore <= 2 ? 'needs-attention' : mavScore === 5 ? 'star-performer' : null,
    })
  }
  return records
}

const ALL_FEEDBACK = generateFeedback()
const chartTooltip = chartTooltipStyle

const avg = (arr) => (arr.length === 0 ? 0 : (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

function computeAnalytics(records) {
  const trainerMap = {}
  const maverickMap = {}
  records.forEach((r) => {
    if (r.source === 'maverick' && r.aboutTrainer) {
      if (!trainerMap[r.aboutTrainer]) trainerMap[r.aboutTrainer] = []
      trainerMap[r.aboutTrainer].push(r.ratings.trainerEffectiveness)
    }
    if (r.source === 'manager' && r.aboutMaverick) {
      if (!maverickMap[r.aboutMaverick]) maverickMap[r.aboutMaverick] = []
      maverickMap[r.aboutMaverick].push(r.ratings.overall)
    }
  })
  const trainerScores = Object.entries(trainerMap).map(([name, scores]) => ({
    name, avg: parseFloat(avg(scores)), count: scores.length,
    flag: parseFloat(avg(scores)) < 3 ? 'low' : parseFloat(avg(scores)) >= 4.5 ? 'high' : null,
  })).sort((a, b) => b.avg - a.avg)
  const maverickScores = Object.entries(maverickMap).map(([name, scores]) => ({
    name, avg: parseFloat(avg(scores)), count: scores.length,
    flag: parseFloat(avg(scores)) < 3 ? 'low' : parseFloat(avg(scores)) >= 4.5 ? 'high' : null,
  })).sort((a, b) => b.avg - a.avg)
  return { trainerScores, maverickScores }
}

function FeedbackPanel({ record, onClose }) {
  if (!record) return null
  const isTrainer = record.source === 'maverick'
  return (
    <AnimatePresence>
      <motion.aside
        className="fb-panel"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <div className="fb-panel__head">
          <h3>{isTrainer ? 'Trainer Feedback' : 'Maverick Performance Review'}</h3>
          <button type="button" onClick={onClose} className="fb-panel__close" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="fb-panel__meta">
          <p className="fb-panel__date">{record.date} · {record.batch}</p>
          <p className="fb-panel__by">Submitted by: <strong>{record.submittedBy}</strong></p>
          <p className="fb-panel__about">
            {isTrainer ? 'About trainer: ' : 'About Maverick: '}
            <strong>{record.aboutTrainer || record.aboutMaverick}</strong>
          </p>
        </div>
        {record.flag && (
          <div className={`fb-panel__flag fb-panel__flag--${record.flag}`}>
            {record.flag === 'low-rating' && <><AlertTriangle size={14} /> Low rating — review recommended</>}
            {record.flag === 'needs-attention' && <><AlertTriangle size={14} /> Maverick needs attention</>}
            {record.flag === 'star-performer' && <><Star size={14} /> Star performer</>}
          </div>
        )}
        <dl className="fb-panel__ratings">
          {Object.entries(record.ratings).map(([k, v]) => (
            <div key={k} className="fb-panel__rating-row">
              <dt>{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
              <dd>
                <span className="fb-stars" style={{ color: v >= 4 ? '#22c55e' : v >= 3 ? '#f7c948' : '#ef7351' }}>{stars(v)}</span>
                <span className="fb-val">{v}/5</span>
              </dd>
            </div>
          ))}
        </dl>
        {record.openText && (
          <div className="fb-panel__comment">
            <p className="fb-panel__comment-label">Comment</p>
            <p>{record.openText}</p>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  )
}

export default function FeedbackAnalytics() {
  const [filter, setFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('records')
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = useMemo(() => ALL_FEEDBACK.filter((r) => {
    if (filter !== 'all' && r.source !== filter) return false
    if (batchFilter !== 'all' && r.batch !== batchFilter) return false
    return true
  }), [filter, batchFilter])

  const analytics = useMemo(() => computeAnalytics(filtered), [filtered])
  const trendData = useMemo(() => getFeedbackTrendByMonth(filtered), [filtered])
  const batchChartData = useMemo(() => getFeedbackByBatch(filtered), [filtered])
  const flagCount = filtered.filter((r) => r.flag).length

  const exportHeaders = ['ID', 'Type', 'Source', 'By', 'About', 'Batch', 'Date', 'Overall', 'Flag', 'Comment']
  const exportRows = filtered.map((r) => [
    r.id, r.type, r.source, r.submittedBy,
    r.aboutTrainer || r.aboutMaverick || '', r.batch, r.date,
    r.ratings.overall || r.ratings.trainerEffectiveness || '', r.flag || '', r.openText || '',
  ])

  const handleExportCSV = () => {
    exportCSV(exportHeaders, exportRows, 'feedback-analytics.csv')
    toast.success('CSV exported')
    setExportOpen(false)
  }

  const handleExportExcel = () => {
    exportTableExcel(exportHeaders, exportRows, 'feedback-analytics.xlsx', 'Feedback')
    toast.success('Excel exported')
    setExportOpen(false)
  }

  const handleExportPDF = () => {
    exportPDFTable({
      title: 'Feedback Analytics Report',
      subtitle: `Filtered: ${filter} · Batch: ${batchFilter} · ${filtered.length} records`,
      headers: exportHeaders,
      rows: exportRows,
      filename: 'feedback-analytics.pdf',
      orientation: 'landscape',
    })
    toast.success('PDF exported')
    setExportOpen(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fb-analytics-page">
      <MetaversePageHero
        role="ld"
        title="Feedback Analytics"
        subtitle="Unified view of all Maverick→Trainer and Manager→Maverick feedback, with flags and trend analytics."
      />

      <div className="fb-kpi-row">
        <div className="fb-kpi"><span className="fb-kpi__val">{ALL_FEEDBACK.length}</span><span className="fb-kpi__label">Total submissions</span></div>
        <div className="fb-kpi"><span className="fb-kpi__val">{ALL_FEEDBACK.filter((r) => r.source === 'maverick').length}</span><span className="fb-kpi__label">Trainer reviews</span></div>
        <div className="fb-kpi"><span className="fb-kpi__val">{ALL_FEEDBACK.filter((r) => r.source === 'manager').length}</span><span className="fb-kpi__label">Maverick reviews</span></div>
        <div className="fb-kpi fb-kpi--flag"><span className="fb-kpi__val">{flagCount}</span><span className="fb-kpi__label">Flagged items</span></div>
      </div>

      <div className="fb-toolbar">
        <div className="fb-filter-group">
          {[['all', 'All'], ['maverick', 'Maverick → Trainer'], ['manager', 'Manager → Maverick']].map(([v, l]) => (
            <button key={v} type="button" className={`fb-chip${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <div className="fb-filter-group">
          <button type="button" className={`fb-chip fb-chip--sm${batchFilter === 'all' ? ' active' : ''}`} onClick={() => setBatchFilter('all')}>All batches</button>
          {BATCHES.map((b) => (
            <button key={b} type="button" className={`fb-chip fb-chip--sm${batchFilter === b ? ' active' : ''}`} onClick={() => setBatchFilter(b)}>{b}</button>
          ))}
        </div>
        <div className="fb-toolbar-right">
          <button type="button" className={`fb-tab-btn${tab === 'records' ? ' active' : ''}`} onClick={() => setTab('records')}>Records</button>
          <button type="button" className={`fb-tab-btn${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
          <div className="fb-export-dropdown" ref={exportRef}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setExportOpen((v) => !v)}>
              <Download size={13} /> Export <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div className="fb-export-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                  <button type="button" onClick={handleExportCSV}><Download size={14} /> CSV</button>
                  <button type="button" onClick={handleExportExcel}><FileSpreadsheet size={14} /> Excel</button>
                  <button type="button" onClick={handleExportPDF}><FileText size={14} /> PDF</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {tab === 'analytics' && (
        <div className="fb-charts-row">
          <div className="fb-chart-card">
            <h4>Rating trend over time</h4>
            <LiveChartContainer height={200} ariaLabel="Rating trend over time">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" fontSize={10} stroke={chartAxisStroke} />
                <YAxis domain={[0, 5]} fontSize={10} stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltip} />
                <Line type="monotone" dataKey="avgRating" stroke="#7b5cf5" strokeWidth={2} dot={{ r: 4 }} name="Avg rating" {...animatedLineProps} />
              </LineChart>
            </LiveChartContainer>
          </div>
          <div className="fb-chart-card">
            <h4>Submissions & flags by batch</h4>
            <LiveChartContainer height={200} ariaLabel="Submissions and flags by batch">
              <BarChart data={batchChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="batch" fontSize={10} stroke={chartAxisStroke} />
                <YAxis fontSize={10} stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltip} />
                <Legend />
                <Bar dataKey="count" fill="#4361ee" radius={[4, 4, 0, 0]} name="Submissions" {...animatedBarProps} />
                <Bar dataKey="flags" fill="#ef7351" radius={[4, 4, 0, 0]} name="Flags" {...animatedBarProps} />
              </BarChart>
            </LiveChartContainer>
          </div>
        </div>
      )}

      <div className="fb-content-layout">
        <div className={`fb-main${selected ? ' fb-main--split' : ''}`}>
          {tab === 'records' && (
            <div className="fb-table-wrap">
              <table className="fb-table">
                <thead>
                  <tr><th>From</th><th>About</th><th>Type</th><th>Batch</th><th>Date</th><th>Rating</th><th>Flag</th><th /></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className={`fb-row${r.flag ? ' fb-row--flagged' : ''}${selected?.id === r.id ? ' fb-row--active' : ''}`}
                      onClick={() => setSelected(r)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(r)}
                      role="button"
                    >
                      <td>
                        <div className="fb-cell-person">
                          <PersonAvatar userId={r.submittedById} size={28} title={r.submittedBy} />
                          <span>{r.submittedBy}</span>
                        </div>
                      </td>
                      <td className="fb-about">{r.aboutTrainer || r.aboutMaverick}</td>
                      <td><span className={`fb-type-pill fb-type-pill--${r.type}`}>{r.type}</span></td>
                      <td className="fb-dim">{r.batch}</td>
                      <td className="fb-dim">{r.date}</td>
                      <td>
                        <span className="fb-rating" style={{ color: (r.ratings.overall ?? r.ratings.trainerEffectiveness) >= 4 ? '#22c55e' : (r.ratings.overall ?? r.ratings.trainerEffectiveness) >= 3 ? '#f7c948' : '#ef7351' }}>
                          {stars(r.ratings.overall ?? r.ratings.trainerEffectiveness)}
                        </span>
                      </td>
                      <td>
                        {r.flag && (
                          <span className={`fb-flag-pill fb-flag-pill--${r.flag}`}>
                            {r.flag === 'low-rating' || r.flag === 'needs-attention' ? <AlertTriangle size={10} /> : <Star size={10} />}
                            {r.flag.replace(/-/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td><ChevronRight size={14} className="fb-chevron" /></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="fb-empty">No feedback records match the filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="fb-analytics-grid">
              <div className="fb-analytics-section">
                <h3 className="fb-analytics-title"><Users size={15} /> Trainer Ability Rankings</h3>
                {analytics.trainerScores.map((t) => (
                  <div key={t.name} className="fb-score-row">
                    <span className="fb-score-name">{t.name}</span>
                    <div className="fb-score-bar-wrap">
                      <div className="fb-score-bar" style={{ width: `${(t.avg / 5) * 100}%`, background: t.avg >= 4 ? '#22c55e' : t.avg >= 3 ? '#f7c948' : '#ef7351' }} />
                    </div>
                    <span className="fb-score-val" style={{ color: t.avg >= 4 ? '#22c55e' : t.avg >= 3 ? '#f7c948' : '#ef7351' }}>{t.avg} / 5</span>
                    {t.flag === 'low' && <AlertTriangle size={13} className="fb-score-flag" style={{ color: '#ef7351' }} />}
                    {t.flag === 'high' && <TrendingUp size={13} className="fb-score-flag" style={{ color: '#22c55e' }} />}
                    <span className="fb-score-count">({t.count})</span>
                  </div>
                ))}
              </div>
              <div className="fb-analytics-section">
                <h3 className="fb-analytics-title"><Star size={15} /> Maverick Performance Rankings</h3>
                {analytics.maverickScores.map((m) => (
                  <div key={m.name} className="fb-score-row">
                    <span className="fb-score-name">{m.name}</span>
                    <div className="fb-score-bar-wrap">
                      <div className="fb-score-bar" style={{ width: `${(m.avg / 5) * 100}%`, background: m.avg >= 4 ? '#22c55e' : m.avg >= 3 ? '#f7c948' : '#ef7351' }} />
                    </div>
                    <span className="fb-score-val" style={{ color: m.avg >= 4 ? '#22c55e' : m.avg >= 3 ? '#f7c948' : '#ef7351' }}>{m.avg} / 5</span>
                    {m.flag === 'low' && <AlertTriangle size={13} className="fb-score-flag" style={{ color: '#ef7351' }} />}
                    {m.flag === 'high' && <CheckCircle2 size={13} className="fb-score-flag" style={{ color: '#22c55e' }} />}
                    <span className="fb-score-count">({m.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <AnimatePresence>
          {selected && <FeedbackPanel key={selected.id} record={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
