import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Users, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import AppMagicCard from '../../components/AppMagicCard'
import { AuthContext } from '../../context/AuthContext'

export default function AssessmentResults() {
  const { user: currentUser } = useContext(AuthContext) // Get actual logged-in user
  const [currentView, setCurrentView] = useState('overview') // 'overview' | 'quiz' | 'submission'
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [batchResults, setBatchResults] = useState(null)
  const [quizDetails, setQuizDetails] = useState(null)
  const [submissionDetail, setSubmissionDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const isManager = currentUser.role === 'ld' // Only L&D gets manager view
  const trainerBatch = currentUser.role === 'trainer' ? 'B-2025-13' : null

  // Load initial data
  useEffect(() => {
    if (currentView === 'overview') {
      loadOverviewData()
    }
  }, [currentView])

  const loadBatchDetailForLD = async (batchId) => {
    // L&D clicks a batch - load the SAME detailed view that trainers get
    try {
      const response = await fetch(`/api/v1/quiz-results/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load batch details')
      }

      const data = await response.json()
      setBatchResults(data) // This will switch the view to show quiz list (same as trainer)
      console.log('L&D loaded batch detail:', data)
    } catch (error) {
      console.error('Failed to load batch details:', error)
      toast.error('Failed to load batch details')
    }
  }

  const loadOverviewData = async () => {
    setLoading(true)
    try {
      // **FIX: Choose endpoint based on actual user role**
      let endpoint;
      if (currentUser.role === 'trainer') {
        // Trainers get their specific batch data
        endpoint = `/api/v1/quiz-results/batch/${trainerBatch}`
      } else if (currentUser.role === 'ld') {
        // L&D gets cross-batch overview  
        endpoint = '/api/v1/quiz-results/manager-overview'
      } else {
        throw new Error(`Unauthorized role: ${currentUser.role}`)
      }

      console.log('=== RESULTS LOAD DEBUG ===')
      console.log('User role:', currentUser.role)
      console.log('Endpoint:', endpoint)
      console.log('Trainer batch:', trainerBatch)

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        }
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        let errorDetails;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json()
        } else {
          errorDetails = await response.text()
        }
        
        console.error('Response error:', errorDetails)
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorDetails)}`)
      }

      const data = await response.json()
      console.log('=== PARSED RESPONSE DATA ===')
      console.log('Full response:', data)
      console.log('Data type:', typeof data)
      console.log('Is array:', Array.isArray(data))
      console.log('Keys:', Object.keys(data))
      
      if (currentUser.role === 'trainer') {
        console.log('Trainer data - batch:', data.batch)
        console.log('Trainer data - quizzes:', data.quizzes)
        console.log('Quizzes length:', data.quizzes?.length)
      } else if (currentUser.role === 'ld') {
        console.log('L&D data - batches:', data.batches)
        console.log('Batches length:', data.batches?.length)
      }
      
      setBatchResults(data)
      console.log('State updated with data')
    } catch (error) {
      console.error('Load failed:', error)
      toast.error(`Failed to load results: ${error.message}`)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const loadQuizDetails = async (quizId, quizTitle) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/quiz-results/quiz/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load quiz details')
      }

      const data = await response.json()
      setQuizDetails(data)
      setSelectedQuiz({ quizId, title: quizTitle })
      setCurrentView('quiz')
    } catch (error) {
      console.error('Failed to load quiz details:', error)
      toast.error('Failed to load quiz details')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissionDetail = async (submissionId, maverickName) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/quiz-results/submission/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load submission')
      }

      const data = await response.json()
      setSubmissionDetail(data)
      setSelectedSubmission({ submissionId, maverickName })
      setCurrentView('submission')
    } catch (error) {
      console.error('Failed to load submission:', error)
      toast.error('Failed to load submission details')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (currentView === 'submission') {
      setCurrentView('quiz')
      setSelectedSubmission(null)
    } else if (currentView === 'quiz') {
      setCurrentView('overview')
      setSelectedQuiz(null)
    }
  }

  const getBreadcrumb = () => {
    const parts = ['Results']
    if (selectedQuiz) {
      parts.push(selectedQuiz.title)
    }
    if (selectedSubmission) {
      parts.push(selectedSubmission.maverickName)
    }
    return parts.join(' > ')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-emerald)'
    if (score >= 60) return 'var(--accent-amber)'
    return 'var(--accent-coral)'
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex items-center justify-center"
        style={{ minHeight: 400 }}
      >
        <div className="flex items-center gap-12">
          <div className="spinner"></div>
          <span>Loading results...</span>
        </div>
      </motion.div>
    )
  }

  // Overview View (L&D or Trainer batch list)
  if (currentView === 'overview') {
    console.log('=== OVERVIEW RENDER DEBUG ===')
    console.log('Current view:', currentView)
    console.log('User role:', currentUser.role)
    console.log('Is manager (L&D):', isManager)
    console.log('Batch results:', batchResults)
    console.log('Loading:', loading)
    
    if (isManager && batchResults?.batches) {
      // L&D Overview - All Batches
      console.log('Rendering L&D overview with', batchResults.batches.length, 'batches')
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header">
            <h1>📊 Assessment Results - L&D Overview</h1>
            <p>Quiz performance across all batches and trainers</p>
          </div>

          <div className="grid" style={{ gap: 20 }}>
            {batchResults.batches.map(batch => (
              <AppMagicCard key={batch.batch} className="card">
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                      Batch {batch.batch}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      Trainer: {batch.trainerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-16">
                    <div className="text-center">
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-violet)' }}>
                        {batch.quizCount}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quizzes</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(batch.averageScore) }}>
                        {batch.averageScore}%
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Avg Score</div>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => loadBatchDetailForLD(batch.batch)}
                >
                  View Batch Details
                </button>
              </AppMagicCard>
            ))}
            
            {batchResults.batches.length === 0 && (
              <AppMagicCard className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Target size={48} style={{ color: 'var(--text-secondary)', marginBottom: 16 }} />
                <h3>No assessment data yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Quiz results will appear here once trainers publish assessments and mavericks submit them.
                </p>
              </AppMagicCard>
            )}
          </div>
        </motion.div>
      )
    }

    // Trainer Overview - Own Batch Quizzes
    const quizzes = batchResults?.quizzes || []
    console.log('Rendering trainer view with', quizzes.length, 'quizzes')
    
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <h1>📊 Assessment Results</h1>
          <p>Quiz performance for your batch ({trainerBatch})</p>
        </div>

        <div className="grid" style={{ gap: 16 }}>
          {quizzes.map(quiz => (
            <AppMagicCard key={quiz.quizId} className="card">
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-12 mb-8">
                    <h3 style={{ fontWeight: 700, margin: 0 }}>{quiz.title}</h3>
                    {quiz.weekNumber && (
                      <span className="tag" style={{ background: 'var(--accent-violet)', color: 'white' }}>
                        Week {quiz.weekNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-20">
                    <div className="flex items-center gap-8">
                      <Users size={16} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: 14 }}>{quiz.submissionRate} submitted</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <Target size={16} style={{ color: getScoreColor(quiz.averageScore) }} />
                      <span style={{ fontSize: 14, color: getScoreColor(quiz.averageScore), fontWeight: 600 }}>
                        {quiz.averageScore}% avg
                      </span>
                    </div>
                    {quiz.lowestScore < 60 && (
                      <div className="flex items-center gap-8">
                        <TrendingDown size={16} style={{ color: 'var(--accent-coral)' }} />
                        <span style={{ fontSize: 14, color: 'var(--accent-coral)' }}>
                          {quiz.lowestScore}% lowest
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => loadQuizDetails(quiz.quizId, quiz.title)}
                  disabled={quiz.submissionCount === 0}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </AppMagicCard>
          ))}
          
          {quizzes.length === 0 && (
            <AppMagicCard className="card" style={{ textAlign: 'center', padding: 40 }}>
              <Target size={48} style={{ color: 'var(--text-secondary)', marginBottom: 16 }} />
              <h3>No submissions yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Results will appear here after mavericks submit published quizzes.
              </p>
            </AppMagicCard>
          )}
        </div>
      </motion.div>
    )
  }

  // Quiz Detail View
  if (currentView === 'quiz' && quizDetails) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <button className="btn btn-secondary" onClick={goBack} style={{ marginRight: 16 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>{getBreadcrumb()}</h1>
            <p>{quizDetails.submissions.length} submissions • Sorted by lowest score first</p>
          </div>
        </div>

        {/* Question Issues Alert */}
        {quizDetails.questionBreakdown.length > 0 && (
          <AppMagicCard className="card" style={{ marginBottom: 20, border: '2px solid var(--accent-coral)' }}>
            <div className="flex items-start gap-12">
              <AlertTriangle size={20} style={{ color: 'var(--accent-coral)', marginTop: 2 }} />
              <div>
                <h4 style={{ color: 'var(--accent-coral)', marginBottom: 8 }}>Teaching Gaps Identified</h4>
                {quizDetails.questionBreakdown.map(q => (
                  <div key={q.questionNumber} style={{ marginBottom: 4, fontSize: 14 }}>
                    <strong>Q{q.questionNumber}:</strong> {q.wrongRate}% answered incorrectly
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      "{q.questionText.substring(0, 80)}..."
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AppMagicCard>
        )}

        {/* Submissions List */}
        <div className="grid" style={{ gap: 12 }}>
          {quizDetails.submissions.map(submission => (
            <AppMagicCard key={submission.submissionId} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-16">
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: getScoreColor(submission.scorePercent),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16
                  }}>
                    {submission.scorePercent}%
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: 4 }}>
                      {submission.maverickName}
                    </h4>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {submission.score}/{submission.totalQuestions} correct • {formatDate(submission.submittedAt)}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadSubmissionDetail(submission.submissionId, submission.maverickName)}
                >
                  View Answers
                </button>
              </div>
            </AppMagicCard>
          ))}
        </div>
      </motion.div>
    )
  }

  // Submission Detail View
  if (currentView === 'submission' && submissionDetail) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <button className="btn btn-secondary" onClick={goBack} style={{ marginRight: 16 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>{getBreadcrumb()}</h1>
            <p>{submissionDetail.scorePercent}% score • {submissionDetail.score}/{submissionDetail.totalQuestions} correct</p>
          </div>
        </div>

        <div className="grid" style={{ gap: 16 }}>
          {submissionDetail.answers.map((answer, index) => (
            <AppMagicCard 
              key={index} 
              className="card" 
              style={{
                border: `2px solid ${answer.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-coral)'}`
              }}
            >
              <div className="flex items-start gap-12 mb-12">
                {answer.isCorrect ? (
                  <CheckCircle size={20} style={{ color: 'var(--accent-emerald)', marginTop: 2 }} />
                ) : (
                  <XCircle size={20} style={{ color: 'var(--accent-coral)', marginTop: 2 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, marginBottom: 8 }}>
                    Q{index + 1}. {answer.questionText}
                  </h4>
                  
                  <div className="grid" style={{ gap: 8 }}>
                    <div className="flex items-center gap-8">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Selected:
                      </span>
                      <span style={{ 
                        fontSize: 14, 
                        color: answer.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-coral)',
                        fontWeight: 500
                      }}>
                        {answer.selectedOptionText || answer.allOptions?.[answer.selectedOption] || `Option ${String.fromCharCode(65 + answer.selectedOption)}`}
                      </span>
                    </div>
                    
                    {!answer.isCorrect && (
                      <div className="flex items-center gap-8">
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Correct:
                        </span>
                        <span style={{ fontSize: 14, color: 'var(--accent-emerald)', fontWeight: 500 }}>
                          {answer.correctOptionText || answer.allOptions?.[answer.correctOption] || `Option ${String.fromCharCode(65 + answer.correctOption)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AppMagicCard>
          ))}
        </div>
      </motion.div>
    )
  }

  return null
}