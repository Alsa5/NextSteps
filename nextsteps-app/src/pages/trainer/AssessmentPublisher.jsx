import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Trash2, Send } from 'lucide-react'
import mockData from '../../data/mockData.json'
import AppMagicCard from '../../components/AppMagicCard'
import { publishAssessment } from '../../data/assessmentStore'

export default function AssessmentPublisher() {
  const [questions, setQuestions] = useState([
    { id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correct: 0 }
  ])
  const [title, setTitle] = useState('')
  const [batch, setBatch] = useState('B-2025-13')

  const addQuestion = (type) => {
    setQuestions(prev => [...prev, {
      id: Date.now(), type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : [],
      correct: 0
    }])
  }

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const updateQuestion = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const updateOption = (qId, optIdx, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q
      const opts = [...q.options]
      opts[optIdx] = value
      return { ...q, options: opts }
    }))
  }

  const publish = () => {
    if (!title) { toast.error('Please enter a quiz title'); return }
    if (questions.some((q) => !q.question.trim())) {
      toast.error('Fill in all question prompts')
      return
    }
    publishAssessment({
      title,
      batch,
      questions: questions.map((q, i) => ({ ...q, id: q.id ?? `q-${i}` })),
      trainerName: mockData.trainers[0]?.name || 'Trainer',
    })
    toast.success('Quiz published — Mavericks notified on their dashboard!')
    setTitle('')
    setQuestions([{ id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correct: 0 }])
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>✅ Assessment Publisher</h1>
        <p>Create quizzes, publish to batch, auto-grade results</p>
      </div>

      <div className="grid-2">
        {/* Quiz Builder */}
        <div>
          <AppMagicCard className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Quiz Title</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Java OOP Quiz" />
            </div>
            <div className="form-group">
              <label className="form-label">Batch</label>
              <select className="form-input" value={batch} onChange={e => setBatch(e.target.value)}>
                <option value="B-2025-13">Batch 13</option>
                <option value="B-2025-14">Batch 14</option>
              </select>
            </div>
          </AppMagicCard>

          {questions.map((q, qi) => (
            <motion.div key={q.id} style={{ marginBottom: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <AppMagicCard className="card">
              <div className="flex items-center justify-between mb-16">
                <span style={{ fontWeight: 700, fontSize: 14 }}>Q{qi + 1} · {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'code' ? 'Code Snippet' : 'Short Answer'}</span>
                <button onClick={() => removeQuestion(q.id)} style={{ background: 'none', color: 'var(--accent-coral)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-group">
                <textarea className="form-textarea" value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)} placeholder="Enter your question..." style={{ minHeight: 60 }} />
              </div>
              {q.type === 'mcq' && (
                <div className="flex flex-col gap-8">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-8">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct === oi}
                        onChange={() => updateQuestion(q.id, 'correct', oi)}
                        style={{ accentColor: 'var(--accent-violet)' }}
                      />
                      <input className="form-input" value={opt} onChange={e => updateOption(q.id, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </AppMagicCard>
            </motion.div>
          ))}

          <div className="flex gap-8 mb-24">
            <button className="btn btn-secondary" onClick={() => addQuestion('mcq')}><Plus size={16} /> MCQ</button>
            <button className="btn btn-secondary" onClick={() => addQuestion('code')}><Plus size={16} /> Code</button>
            <button className="btn btn-secondary" onClick={() => addQuestion('short')}><Plus size={16} /> Short Answer</button>
          </div>

          <motion.button className="btn btn-primary btn-lg w-full" onClick={publish} whileHover={{ scale: 1.02 }} style={{ width: '100%', justifyContent: 'center' }}>
            <Send size={18} /> Publish Quiz to Batch
          </motion.button>
        </div>

        {/* Past Quizzes */}
        <div>
          <AppMagicCard className="card">
            <div className="card-header">
              <div className="card-title">📋 Published Quizzes</div>
            </div>
            {mockData.quizzes.map(quiz => (
              <div key={quiz.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--base-surface)', marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-8">
                  <span style={{ fontWeight: 700 }}>{quiz.title}</span>
                  <span className="tag tag-green">{quiz.submissions} submissions</span>
                </div>
                <div className="flex gap-12">
                  <span className="text-sm text-secondary">{quiz.questions} questions</span>
                  <span className="text-sm text-secondary">Avg: {quiz.avgScore}%</span>
                  <span className="text-sm text-secondary">Top: {quiz.topScore}%</span>
                </div>
                <div className="progress-bar mt-8" style={{ height: 6 }}>
                  <div className={`progress-fill ${quiz.avgScore >= 70 ? 'emerald' : 'coral'}`} style={{ width: `${quiz.avgScore}%` }} />
                </div>
              </div>
            ))}
          </AppMagicCard>
        </div>
      </div>
    </motion.div>
  )
}
