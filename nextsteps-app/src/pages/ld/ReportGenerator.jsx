import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FileText, Download, Loader } from 'lucide-react'
import AppMagicCard from '../../components/AppMagicCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import { getReportData } from '../../services/ldAnalytics'
import { exportCSV, exportPDFTable, exportTableExcel } from '../../utils/exportUtils'

export default function ReportGenerator() {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const reportData = useMemo(() => getReportData(), [generated])

  const reportSections = useMemo(() => {
    const d = reportData
    return [
      {
        title: 'Batch Summary',
        content: `${d.summary.activeBatches} active batches · ${d.summary.totalMavericks} mavericks · ${d.summary.avgFeedback}% avg feedback completion.`,
        status: 'green',
      },
      {
        title: 'Curriculum Health',
        content: d.curriculumHealth.map((c) => `${c.module}: ${c.recommendation}`).join(' '),
        status: 'amber',
      },
      {
        title: 'Effectiveness Correlation',
        content: d.effectiveness.length
          ? `Strong positive correlation across ${d.effectiveness.length} deployed batches. Best: ${d.effectiveness.sort((a, b) => b.projectSuccess - a.projectSuccess)[0]?.batch}.`
          : 'Pending deployment data.',
        status: 'green',
      },
      {
        title: 'Top Performers',
        content: d.topPerformers.slice(0, 3).map((m) => `${m.name} (${m.readiness} readiness)`).join(', ') || 'None identified yet.',
        status: 'green',
      },
      {
        title: 'Risk Flags',
        content: d.atRisk.length
          ? d.atRisk.map((m) => `${m.name} (${m.batch}, ${m.sentiment})`).join('; ')
          : 'No at-risk mavericks flagged.',
        status: d.atRisk.length ? 'red' : 'green',
      },
      {
        title: 'AI Narrative Summary',
        content: `The ${d.quarter} Mavericks cohort shows ${d.summary.avgFeedback >= 75 ? 'strong' : 'mixed'} overall performance. ${d.summary.queueCount} recruits remain in the recruitment queue. Key actions: activate reminders for amber batches, review at-risk mavericks (${d.summary.atRiskCount}), and fast-track top performers.`,
        status: 'green',
      },
    ]
  }, [reportData])

  const generateReport = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      toast.success('Executive report generated!')
    }, 1500)
  }

  const batchHeaders = ['Batch', 'Mavericks', 'Avg Readiness', 'Feedback %', 'Health', 'Track']
  const batchRows = reportData.batches.map((b) => [
    b.id, b.mavericks, b.avgReadiness, b.feedbackCompletion, b.health, b.track,
  ])

  const handleExportPDF = () => {
    exportPDFTable({
      title: 'Next Steps Quarterly Training Report',
      subtitle: `${reportData.quarter} · Hexaware Mavericks Program · Generated ${new Date().toLocaleDateString()}`,
      headers: batchHeaders,
      rows: batchRows,
      filename: `ld-executive-report-${Date.now()}.pdf`,
    })
    toast.success('PDF downloaded')
  }

  const handleExportExcel = () => {
    exportTableExcel(
      batchHeaders,
      batchRows,
      `ld-executive-report-${Date.now()}.xlsx`,
      'Batch Summary',
    )
    toast.success('Excel downloaded')
  }

  const handleExportCSV = () => {
    exportCSV(batchHeaders, batchRows, `ld-executive-report-${Date.now()}.csv`)
    toast.success('CSV downloaded')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <MetaversePageHero
        role="ld"
        title="Executive Report Generator"
        subtitle="One-click PDF/Excel report for quarterly L&D reviews with AI narrative"
      />

      <AppMagicCard className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 24 }}>
        <FileText size={48} color="var(--accent-violet)" style={{ margin: '0 auto 16px' }} />
        <h3 className="font-display" style={{ marginBottom: 8 }}>Generate {reportData.quarter} Executive Report</h3>
        <p className="text-sm text-secondary mb-24">
          Includes: Batch summary, curriculum health, effectiveness correlation, top performers, risk flags, and AI narrative
        </p>
        <div className="flex gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={generateReport}
            whileHover={{ scale: 1.02 }}
            disabled={generating}
          >
            {generating ? <><Loader size={18} className="animate-spin" /> Generating…</> : <>Generate Report</>}
          </motion.button>
          {generated && (
            <>
              <button type="button" className="btn btn-outline btn-lg" onClick={handleExportPDF}>
                Export PDF
              </button>
              <button type="button" className="btn btn-outline btn-lg" onClick={handleExportExcel}>
                Export Excel
              </button>
            </>
          )}
        </div>
      </AppMagicCard>

      {generated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AppMagicCard className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title">Report Preview</div>
              <div className="flex gap-8">
                <span className="tag tag-violet">AI-Generated</span>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleExportCSV}>
                  <Download size={14} /> Export CSV
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleExportPDF}>
                  <FileText size={14} /> PDF
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleExportExcel}>
                  Export Excel
                </button>
              </div>
            </div>

            <div style={{
              padding: 24, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2D2A32, #1a1720)',
              color: 'white', marginBottom: 24, textAlign: 'center',
            }}>
              <h2 className="font-display" style={{ fontSize: 24, marginBottom: 4 }}>Next Steps Quarterly Training Report</h2>
              <p style={{ opacity: 0.6, fontSize: 14 }}>{reportData.quarter} · Hexaware Mavericks Program · HexaVarsity L&D</p>
            </div>

            <div className="flex flex-col gap-16">
              {reportSections.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: 20, borderRadius: 'var(--radius-md)',
                    background: 'var(--base-surface)',
                    borderLeft: `4px solid ${section.status === 'green' ? 'var(--accent-emerald)' : section.status === 'amber' ? 'var(--accent-amber)' : 'var(--accent-coral)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <h4 style={{ fontSize: 15, fontWeight: 700 }}>{section.title}</h4>
                    <div className={`rag-dot ${section.status}`} />
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--base-text-secondary)', lineHeight: 1.6 }}>{section.content}</p>
                </motion.div>
              ))}
            </div>
          </AppMagicCard>
        </motion.div>
      )}
    </motion.div>
  )
}
