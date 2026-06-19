import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Upload, Brain, CheckCircle } from 'lucide-react'
import AppMagicCard from '../AppMagicCard'

const mockParsedResumes = [
  { name: 'Aditya Rao', skills: ['Java', 'Python', 'SQL'], certifications: ['AWS Cloud Practitioner'], cgpa: 8.5, streamFit: { 'Product Engineering': 82, Analytics: 65, Automation: 70 } },
  { name: 'Neha Sharma', skills: ['Python', 'R', 'Tableau', 'SQL'], certifications: ['Google Data Analytics'], cgpa: 9.1, streamFit: { Analytics: 91, 'Data Assurance': 75, Digital: 55 } },
  { name: 'Karthik M', skills: ['JavaScript', 'React', 'Node.js'], certifications: ['Meta Frontend Developer'], cgpa: 7.8, streamFit: { Digital: 88, 'Product Engineering': 72, Innovation: 65 } },
  { name: 'Divya Patel', skills: ['Java', 'Selenium', 'Jenkins'], certifications: ['ISTQB Foundation'], cgpa: 8.2, streamFit: { Automation: 85, 'Data Assurance': 78, 'Product Engineering': 60 } },
  { name: 'Rohit Kumar', skills: ['C++', 'Java', 'AWS'], certifications: [], cgpa: 7.5, streamFit: { 'Product Engineering': 68, Banking: 55, HI: 45 } },
  { name: 'Priyanka S', skills: ['Python', 'TensorFlow', 'SQL'], certifications: ['Coursera ML Specialization'], cgpa: 9.3, streamFit: { Analytics: 95, Innovation: 80, Digital: 60 } },
]

const suggestedGroups = [
  { name: 'Group A — Strong Java/Backend', mavericks: ['Aditya Rao', 'Rohit Kumar'], trainer: 'Rajesh Menon', rationale: 'Both have strong Java foundations. Rohit needs SQL support — pair with Aditya who excels.' },
  { name: 'Group B — Analytics Track', mavericks: ['Neha Sharma', 'Priyanka S'], trainer: 'Sunita Iyer', rationale: 'Both show strong analytics aptitude with Python + SQL. Fast-track candidates for Analytics stream.' },
  { name: 'Group C — Frontend/Digital', mavericks: ['Karthik M'], trainer: 'Amit Kulkarni', rationale: 'Strong frontend skills. Needs soft skills development before Digital stream placement.' },
  { name: 'Group D — Automation/QA', mavericks: ['Divya Patel'], trainer: 'Rajesh Menon', rationale: 'Testing background with Selenium. Natural fit for Automation stream.' },
]

export default function BatchSegregationPanel({ onApproved }) {
  const [step, setStep] = useState('upload')
  const [uploadedFiles, setUploadedFiles] = useState([])

  const simulateUpload = () => {
    setUploadedFiles(['resume_aditya.pdf', 'resume_neha.pdf', 'resume_karthik.pdf', 'resume_divya.pdf', 'resume_rohit.pdf', 'resume_priyanka.pdf'])
    toast.success('6 resumes uploaded!')
    setStep('parsing')
    setTimeout(() => {
      setStep('results')
      toast.success('AI parsing complete! Skill profiles generated.')
    }, 2000)
  }

  const approveGroups = () => {
    toast.success('Batch grouping approved! Proceed to Approve & Publish tab.')
    setStep('approved')
    onApproved?.()
  }

  return (
    <div>
      <div className="flex items-center gap-8 mb-24" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {['Upload', 'AI Parsing', 'Skill Profiles', 'Batch Groups'].map((s, i) => {
          const stepMap = ['upload', 'parsing', 'results', 'groups']
          const isActive = stepMap.indexOf(step) >= i || step === 'approved'
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-8">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isActive ? 'var(--gradient-primary)' : 'var(--base-surface)',
                  color: isActive ? 'white' : 'var(--base-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {isActive && stepMap.indexOf(step) > i ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--base-text)' : 'var(--base-text-secondary)' }}>{s}</span>
              </div>
              {i < 3 && <div style={{ width: 40, height: 2, background: isActive ? 'var(--accent-violet)' : 'var(--base-border)' }} />}
            </React.Fragment>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AppMagicCard className="card" style={{ textAlign: 'center', padding: 60 }}>
              <Upload size={48} color="var(--accent-violet)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: 8 }}>Upload Maverick Resumes & Certificates</h3>
              <p className="text-sm text-secondary mb-24">PDF format. AI extracts skills, certifications, and domain affinities.</p>
              <motion.button type="button" className="btn btn-primary btn-lg" onClick={simulateUpload} whileHover={{ scale: 1.02 }}>
                <Upload size={18} /> Upload 6 Sample Resumes (Demo)
              </motion.button>
            </AppMagicCard>
          </motion.div>
        )}

        {step === 'parsing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AppMagicCard className="card" style={{ textAlign: 'center', padding: 60 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Brain size={48} color="var(--accent-violet)" />
              </motion.div>
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>AI is parsing resumes…</h3>
              <p className="text-sm text-secondary">Azure AI Document Intelligence extracting skills</p>
              <div className="progress-bar mt-16" style={{ maxWidth: 300, margin: '16px auto 0' }}>
                <motion.div className="progress-fill violet" animate={{ width: ['0%', '100%'] }} transition={{ duration: 2 }} />
              </div>
            </AppMagicCard>
          </motion.div>
        )}

        {(step === 'results' || step === 'groups' || step === 'approved') && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AppMagicCard className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <div className="card-title">AI-Parsed Skill Profiles</div>
                <span className="tag tag-green">{mockParsedResumes.length} profiles</span>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                {mockParsedResumes.map((resume, i) => (
                  <motion.div
                    key={resume.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--base-surface)' }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <span style={{ fontWeight: 700 }}>{resume.name}</span>
                      <span className="tag tag-blue">CGPA: {resume.cgpa}</span>
                    </div>
                    <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
                      {resume.skills.map((s) => <span key={s} className="tag tag-violet">{s}</span>)}
                    </div>
                    {resume.certifications.length > 0 && (
                      <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
                        {resume.certifications.map((c) => <span key={c} className="tag tag-green">{c}</span>)}
                      </div>
                    )}
                    <div className="text-xs text-secondary">
                      Top fit: {Object.entries(resume.streamFit).sort((a, b) => b[1] - a[1])[0][0]} ({Object.entries(resume.streamFit).sort((a, b) => b[1] - a[1])[0][1]}%)
                    </div>
                  </motion.div>
                ))}
              </div>
            </AppMagicCard>

            <AppMagicCard className="card">
              <div className="card-header">
                <div className="card-title">AI-Recommended Batch Groups</div>
                {step !== 'approved' ? (
                  <motion.button type="button" className="btn btn-primary" onClick={approveGroups} whileHover={{ scale: 1.02 }}>
                    <CheckCircle size={16} /> Approve Grouping
                  </motion.button>
                ) : (
                  <span className="tag tag-green">Approved</span>
                )}
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                {suggestedGroups.map((group) => (
                  <div
                    key={group.name}
                    style={{
                      padding: 20,
                      borderRadius: 'var(--radius-md)',
                      background: step === 'approved' ? 'var(--secondary-mint)' : 'var(--base-surface)',
                      border: step === 'approved' ? '1.5px solid var(--accent-emerald)' : '1px solid var(--base-border)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{group.name}</div>
                    <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
                      {group.mavericks.map((m) => <span key={m} className="tag tag-violet">{m}</span>)}
                    </div>
                    <div className="text-sm text-secondary mb-8">Trainer: {group.trainer}</div>
                    <p style={{ fontSize: 12, color: 'var(--base-text-secondary)', fontStyle: 'italic' }}>{group.rationale}</p>
                  </div>
                ))}
              </div>
            </AppMagicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
