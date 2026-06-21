import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { BookCheck, CheckCircle } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import mockData from '../../data/mockData.json'
import { getAssessmentsForBatch, completeAssessment } from '../../data/assessmentStore'
import { awardXp } from '../../data/maverickProgress'

export default function MaverickAssessments() {
  const batchId = mockData.currentUser.batch
  const [quizzes, setQuizzes] = useState(() => getAssessmentsForBatch(batchId))
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return
    
    console.log('=== QUIZ SUBMISSION DEBUG ===')
    console.log('Active Quiz:', activeQuiz)
    console.log('Current Answers:', answers)
    
    const total = activeQuiz.questions.length
    const answersArray = activeQuiz.questions.map((q, i) => ({
      questionId: q.id ?? i,
      questionText: q.question || 'Untitled question',
      selectedOption: answers[q.id ?? i] ?? 0,
      correctOption: q.correct ?? 0,
      isCorrect: (answers[q.id ?? i] ?? 0) === (q.correct ?? 0),
      // Add actual option text for proper display in results
      selectedOptionText: q.options?.[answers[q.id ?? i] ?? 0] || `Option ${String.fromCharCode(65 + (answers[q.id ?? i] ?? 0))}`,
      correctOptionText: q.options?.[q.correct ?? 0] || `Option ${String.fromCharCode(65 + (q.correct ?? 0))}`,
      allOptions: q.options || [] // Include all options for reference
    }));
    
    console.log('Processed Answers:', answersArray)
    
    const correct = answersArray.filter(a => a.isCorrect).length
    const score = Math.round((correct / total) * 100)
    
    console.log(`Score: ${correct}/${total} = ${score}%`)
    
    // Save to localStorage (existing functionality)
    completeAssessment(activeQuiz.id, score)
    awardXp(Math.round(score / 5), `Assessment: ${activeQuiz.title}`)
    
    // Also save to backend for reporting
    try {
      // Validate trainer email is present - should always exist for properly published quizzes
      if (!activeQuiz.trainerEmail) {
        console.warn('WARNING: Quiz missing trainerEmail - this indicates a data integrity issue with quiz:', activeQuiz.id)
      }

      const submissionPayload = {
        quizId: activeQuiz.id,
        weekNumber: activeQuiz.weekNumber, // May be undefined for manual quizzes
        batch: activeQuiz.batch,
        trainerEmail: activeQuiz.trainerEmail, // No fallback - should always be present
        answers: answersArray,
        quizTitle: activeQuiz.title
      }
      
      console.log('Sending to backend:', submissionPayload)
      console.log('Token:', sessionStorage.getItem('nextsteps_token') ? 'Present' : 'Missing')
      
      const response = await fetch('/api/v1/quiz-results/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        },
        body: JSON.stringify(submissionPayload)
      })
      
      console.log('Backend response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend submission failed:', errorText)
        toast.error('Quiz saved locally, but reporting may be affected')
      } else {
        const result = await response.json()
        console.log('Backend submission success:', result)
        toast.success(`Quiz submitted — ${score}% · +${Math.round(score / 5)} XP · Results saved`)
      }
    } catch (error) {
      console.error('Backend submission error:', error)
      toast.error('Quiz saved locally, but could not sync to reporting system')
    }
    
    setQuizzes(getAssessmentsForBatch(batchId))
    setActiveQuiz(null)
    setAnswers({})
  }

  if (activeQuiz) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <h1>{activeQuiz.title}</h1>
          <p>Batch {activeQuiz.batch} · {activeQuiz.questions.length} questions</p>
        </div>
        <AppMagicCard className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
          {activeQuiz.questions.map((q, qi) => (
            <div key={q.id ?? qi} style={{ marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>Q{qi + 1}. {q.question || 'Untitled question'}</p>
              {q.type === 'mcq' && q.options?.map((opt, oi) => (
                <label key={oi} style={{ display: 'flex', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[q.id ?? qi] === oi}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id ?? qi]: oi }))}
                  />
                  {opt || `Option ${oi + 1}`}
                </label>
              ))}
            </div>
          ))}
          <button type="button" className="btn btn-primary" onClick={handleSubmitQuiz}>Submit quiz</button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setActiveQuiz(null)}>Back</button>
        </AppMagicCard>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <MetaversePageHero
        role="maverick"
        title="Assessments & Quizzes"
        subtitle="Trainer-published quizzes for your batch — complete them to boost readiness and XP"
      />
      {quizzes.length === 0 ? (
        <AppMagicCard className="card" style={{ padding: 40, textAlign: 'center' }}>
          <BookCheck size={40} style={{ color: 'var(--brand-violet)', marginBottom: 12 }} />
          <p>No assessments yet. Your trainer will publish quizzes here — check back after the next session.</p>
        </AppMagicCard>
      ) : (
        <div className="flex flex-col gap-12">
          {quizzes.map((quiz) => (
            <AppMagicCard key={quiz.id} className="card">
              <div className="flex items-center justify-between gap-16 flex-wrap">
                <div>
                  <h3 style={{ marginBottom: 4 }}>{quiz.title}</h3>
                  <p className="text-sm text-secondary">
                    Published {new Date(quiz.publishedAt).toLocaleDateString()} · {quiz.questions.length} questions
                  </p>
                </div>
                {quiz.completedAt ? (
                  <span className="tag tag-green"><CheckCircle size={12} /> {quiz.score}%</span>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveQuiz(quiz)}>
                    Start quiz
                  </button>
                )}
              </div>
            </AppMagicCard>
          ))}
        </div>
      )}
    </motion.div>
  )
}
