import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Trash2, Send, Wand2, Edit3, Loader2, RotateCcw, Check, X, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppMagicCard from '../../components/AppMagicCard'
import { publishAssessment } from '../../data/assessmentStore'
import { AuthContext } from '../../context/AuthContext'

export default function AssessmentPublisher() {
  const navigate = useNavigate()
  const { user: currentUser } = useContext(AuthContext) // Get real logged-in trainer
  
  // Component styles for enhanced UI
  const buttonStyles = {
    btnXs: {
      padding: '4px 8px',
      fontSize: '11px',
      minHeight: '24px'
    },
    btnSm: {
      padding: '6px 12px', 
      fontSize: '12px',
      minHeight: '28px'
    },
    btnDanger: {
      background: 'var(--accent-coral)',
      color: 'white',
      border: '1px solid var(--accent-coral)'
    }
  }

  // CSS color fallbacks
  const cssVars = {
    '--base-hover': 'rgba(255, 255, 255, 0.05)',
    '--accent-emerald-muted': 'rgba(16, 185, 129, 0.1)'
  }

  // Reset content source data when switching
  const handleContentSourceChange = (newSource) => {
    if (newSource === contentSource) return
    
    // Clear existing data
    setSyllabus(null)
    setWeeks([])
    setGeneratedQuizzes({})
    setEditingQuestion(null)
    setRegenerateKeywords({})
    
    // Reset prompt fields
    setPromptTopic('')
    setPromptContext('')
    setPromptWeekNumber(1)
    
    setContentSource(newSource)
  }

  // Mode states
  const [mode, setMode] = useState('manual') // 'manual' or 'ai'
  
  // Manual quiz state
  const [questions, setQuestions] = useState([
    { id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correct: 0 }
  ])
  const [title, setTitle] = useState('')
  const [batch, setBatch] = useState('B-2025-13')

  // AI quiz state
  const [contentSource, setContentSource] = useState('syllabus') // 'syllabus' or 'prompt'
  const [syllabus, setSyllabus] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [questionsCount, setQuestionsCount] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [generatedQuizzes, setGeneratedQuizzes] = useState({})
  const [loadingStates, setLoadingStates] = useState({})
  const [focusKeywords, setFocusKeywords] = useState('')
  
  // Prompt-based generation state
  const [promptWeekNumber, setPromptWeekNumber] = useState(1)
  const [promptTopic, setPromptTopic] = useState('')
  const [promptContext, setPromptContext] = useState('')
  
  // Edit states
  const [editingQuestion, setEditingQuestion] = useState(null) // { weekNumber, questionIndex }
  const [regenerateKeywords, setRegenerateKeywords] = useState({}) // { weekNumber: 'keywords' }
  
  // Recently published quizzes (for the session) - REMOVED
  // const [recentlyPublished, setRecentlyPublished] = useState([])

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
    const publishedQuiz = publishAssessment({
      title,
      batch,
      questions: questions.map((q, i) => ({ ...q, id: q.id ?? `q-${i}` })),
      trainerName: currentUser?.name || currentUser?.fullName || 'Unknown Trainer',
      trainerEmail: currentUser?.email,
    })
    
    // Track this quiz in recently published - REMOVED since sidebar was removed
    // setRecentlyPublished(prev => [{
    //   id: publishedQuiz.id,
    //   title: publishedQuiz.title,
    //   batch: publishedQuiz.batch,
    //   weekNumber: null, // Manual quizzes don't have week numbers
    //   publishedAt: publishedQuiz.publishedAt,
    //   questionsCount: publishedQuiz.questions.length
    // }, ...prev.slice(0, 4)]) // Keep last 5
    
    toast.success('Quiz published — Mavericks notified on their dashboard!')
    setTitle('')
    setQuestions([{ id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correct: 0 }])
  }

  // AI quiz functions
  const handleFileUpload = async (event) => {
    console.log('=== FILE UPLOAD DEBUG ===') // Debug log
    const file = event.target.files[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    }) // Debug log

    const allowedTypes = ['.xlsx', '.xls', '.docx', '.pdf', '.csv'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.some(type => type.includes(fileExtension))) {
      console.log('Invalid file type:', fileExtension)
      toast.error('Please upload .xlsx, .xls, .docx, .pdf, or .csv files only')
      return
    }

    setLoadingStates(prev => ({ ...prev, upload: true }))

    try {
      // Create FormData for proper file upload
      const formData = new FormData()
      formData.append('syllabusFile', file)
      
      console.log('FormData created:', {
        hasFile: formData.has('syllabusFile'),
        fileFromFormData: formData.get('syllabusFile')?.name
      }) // Debug log

      console.log('Making request to /api/v1/ai-quiz/upload-syllabus') // Debug log

      const response = await fetch('/api/v1/ai-quiz/upload-syllabus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
          // DO NOT set Content-Type - let browser set multipart boundary
        },
        body: formData
      })

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }) // Debug log

      let responseData;
      try {
        responseData = await response.json()
        console.log('Response JSON:', responseData) // Debug log
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError)
        const responseText = await response.text()
        console.error('Raw response:', responseText)
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        console.error('Upload failed with error:', responseData)
        throw new Error(responseData.error || 'Failed to parse file')
      }
      
      console.log('Upload successful:', responseData)
      setWeeks(responseData.weeks)
      setSyllabus({ 
        name: responseData.fileName, 
        totalWeeks: responseData.totalWeeks,
        fileType: responseData.fileType 
      })
      toast.success(`Parsed ${responseData.totalWeeks} weeks from ${responseData.fileName}`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to process file')
    } finally {
      setLoadingStates(prev => ({ ...prev, upload: false }))
    }
  }

  const generateQuizForWeek = async (week) => {
    console.log('=== AI GENERATOR CLICKED ===') // Debug log
    console.log('Generate quiz for week:', {
      weekNumber: week.weekNumber,
      title: week.title,
      contentLength: week.content?.length
    }) // Debug log

    if (!week || !week.content) {
      console.log('ERROR: Invalid week data:', week)
      toast.error('Invalid week data. Please re-upload your file.')
      return
    }

    const loadingKey = `generate-${week.weekNumber}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const requestBody = {
        weekContent: week.content,
        weekNumber: week.weekNumber,
        weekTitle: week.title,
        questionsCount,
        difficulty,
        focusKeywords: focusKeywords || undefined
      }

      console.log('Sending quiz generation request:', requestBody) // Debug log

      const response = await fetch('/api/v1/ai-quiz/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Quiz generation response:', {
        status: response.status,
        statusText: response.statusText
      }) // Debug log

      let responseData;
      try {
        responseData = await response.json()
        console.log('Quiz response JSON:', responseData) // Debug log
      } catch (jsonError) {
        console.error('Failed to parse quiz response:', jsonError)
        const responseText = await response.text()
        console.error('Raw quiz response:', responseText)
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        console.error('Quiz generation error:', responseData)
        throw new Error(responseData.error || 'Failed to generate quiz')
      }

      console.log('Quiz generation successful:', responseData)
      setGeneratedQuizzes(prev => ({ ...prev, [week.weekNumber]: responseData }))
      toast.success(`Generated ${responseData.questions.length} questions for Week ${week.weekNumber}`)
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate quiz')
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const publishGeneratedQuiz = (weekNumber) => {
    const quiz = generatedQuizzes[weekNumber]
    if (!quiz || !quiz.questions.length) {
      toast.error('No questions to publish')
      return
    }

    const publishedQuiz = publishAssessment({
      title: `${quiz.weekTitle} - Week ${weekNumber}`,
      batch,
      questions: quiz.questions.map((q, i) => ({ ...q, id: q.id ?? `q-${i}` })),
      trainerName: currentUser?.name || currentUser?.fullName || 'Unknown Trainer',
      trainerEmail: currentUser?.email,
      weekNumber: weekNumber,
    })
    
    // Track this quiz in recently published - REMOVED since sidebar was removed
    // setRecentlyPublished(prev => [{
    //   id: publishedQuiz.id,
    //   title: publishedQuiz.title,
    //   batch: publishedQuiz.batch,
    //   weekNumber: weekNumber,
    //   publishedAt: publishedQuiz.publishedAt,
    //   questionsCount: publishedQuiz.questions.length
    // }, ...prev.slice(0, 4)]) // Keep last 5
    
    toast.success(`Week ${weekNumber} quiz published!`)
  }

  // Question editing functions
  const updateQuestionText = (weekNumber, questionIndex, newText) => {
    setGeneratedQuizzes(prev => ({
      ...prev,
      [weekNumber]: {
        ...prev[weekNumber],
        questions: prev[weekNumber].questions.map((q, i) => 
          i === questionIndex ? { ...q, question: newText } : q
        )
      }
    }))
  }

  const updateQuestionOption = (weekNumber, questionIndex, optionIndex, newOption) => {
    setGeneratedQuizzes(prev => ({
      ...prev,
      [weekNumber]: {
        ...prev[weekNumber],
        questions: prev[weekNumber].questions.map((q, i) => 
          i === questionIndex ? { 
            ...q, 
            options: q.options.map((opt, oi) => oi === optionIndex ? newOption : opt)
          } : q
        )
      }
    }))
  }

  const updateCorrectAnswer = (weekNumber, questionIndex, newCorrect) => {
    setGeneratedQuizzes(prev => ({
      ...prev,
      [weekNumber]: {
        ...prev[weekNumber],
        questions: prev[weekNumber].questions.map((q, i) => 
          i === questionIndex ? { ...q, correct: newCorrect } : q
        )
      }
    }))
  }

  const deleteQuestion = (weekNumber, questionIndex) => {
    setGeneratedQuizzes(prev => ({
      ...prev,
      [weekNumber]: {
        ...prev[weekNumber],
        questions: prev[weekNumber].questions.filter((_, i) => i !== questionIndex)
      }
    }))
    toast.success('Question deleted')
  }

  const addBlankQuestion = (weekNumber) => {
    const newQuestion = {
      id: Date.now(),
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: ''
    }
    
    setGeneratedQuizzes(prev => ({
      ...prev,
      [weekNumber]: {
        ...prev[weekNumber],
        questions: [...(prev[weekNumber]?.questions || []), newQuestion]
      }
    }))
    
    // Auto-focus the new question for editing
    setEditingQuestion({ weekNumber, questionIndex: (prev[weekNumber]?.questions?.length || 0) })
    toast.success('New question added')
  }

  const regenerateQuestion = async (weekNumber, questionIndex) => {
    const quiz = generatedQuizzes[weekNumber]
    const question = quiz.questions[questionIndex]
    const week = weeks.find(w => w.weekNumber === weekNumber)
    
    if (!question || !week) {
      toast.error('Question or week data not found')
      return
    }

    const loadingKey = `regenerate-${weekNumber}-${questionIndex}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const response = await fetch('/api/v1/ai-quiz/regenerate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        },
        body: JSON.stringify({
          questionText: question.question,
          options: question.options,
          correctAnswer: question.correct,
          focusKeywords: regenerateKeywords[weekNumber] || '',
          difficulty
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate question')
      }

      const newQuestion = await response.json()
      
      // Update the specific question
      setGeneratedQuizzes(prev => ({
        ...prev,
        [weekNumber]: {
          ...prev[weekNumber],
          questions: prev[weekNumber].questions.map((q, i) => 
            i === questionIndex ? { ...q, ...newQuestion } : q
          )
        }
      }))
      
      toast.success('Question regenerated!')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error(error.message || 'Failed to regenerate question')
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const generateFromPrompt = async () => {
    console.log('=== GENERATE FROM PROMPT ===')
    
    if (!promptTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    const loadingKey = `generate-prompt-${promptWeekNumber}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      // Build week content from topic and context
      let weekContent = `Topic: ${promptTopic.trim()}.`
      
      if (promptContext.trim()) {
        weekContent += ` ${promptContext.trim()}`
      } else {
        // Fallback content for better AI generation
        weekContent += ` Generate questions covering core concepts, common patterns, and practical use cases for this topic.`
      }

      const requestBody = {
        weekContent,
        weekNumber: promptWeekNumber,
        weekTitle: promptTopic.trim(),
        questionsCount,
        difficulty,
        focusKeywords: focusKeywords || undefined
      }

      console.log('Prompt-based generation request:', requestBody)

      const response = await fetch('/api/v1/ai-quiz/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Prompt generation response:', {
        status: response.status,
        statusText: response.statusText
      })

      let responseData;
      try {
        responseData = await response.json()
        console.log('Prompt quiz response:', responseData)
      } catch (jsonError) {
        console.error('Failed to parse prompt response:', jsonError)
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        console.error('Prompt generation error:', responseData)
        throw new Error(responseData.error || 'Failed to generate quiz')
      }

      // Add to weeks array and generated quizzes (simulate syllabus structure)
      const newWeek = {
        weekNumber: promptWeekNumber,
        title: promptTopic.trim(),
        content: weekContent
      }

      // Update weeks array if not already present
      setWeeks(prev => {
        const exists = prev.find(w => w.weekNumber === promptWeekNumber)
        if (exists) {
          return prev.map(w => w.weekNumber === promptWeekNumber ? newWeek : w)
        } else {
          return [...prev, newWeek].sort((a, b) => a.weekNumber - b.weekNumber)
        }
      })

      setGeneratedQuizzes(prev => ({ ...prev, [promptWeekNumber]: responseData }))
      toast.success(`Generated ${responseData.questions.length} questions for "${promptTopic}"`)
    } catch (error) {
      console.error('Prompt generation error:', error)
      toast.error(error.message || 'Failed to generate quiz')
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // viewQuizResults function REMOVED - was only used in removed sidebar

  const regenerateEntireQuiz = async (weekNumber) => {
    const week = weeks.find(w => w.weekNumber === weekNumber)
    if (!week) {
      toast.error('Week data not found')
      return
    }

    const confirmed = window.confirm(`This will replace all ${generatedQuizzes[weekNumber]?.questions?.length || 0} questions for Week ${weekNumber}. Are you sure?`)
    if (!confirmed) return

    await generateQuizForWeek(week)
  }

  return (
    <>
      <style>{Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join(' ')}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>🤖 AI Assessment Publisher</h1>
        <p>Upload syllabus Excel → AI generates quizzes → Edit & publish</p>
      </div>

      {/* Mode Selector */}
      <AppMagicCard className="card" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Creation Mode</label>
          <div className="flex gap-8">
            <button 
              className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('manual')}
            >
              <Edit3 size={16} /> Manual Builder
            </button>
            <button 
              className={`btn ${mode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('ai')}
            >
              <Wand2 size={16} /> AI Generator
            </button>
          </div>
        </div>
      </AppMagicCard>

      {/* Main Content - Full Width (Published Quizzes sidebar removed) */}
      <div>
        <div>
          {mode === 'ai' && (
            <>
              <AppMagicCard className="card" style={{ marginBottom: 20 }}>
                {/* Content Source Sub-Toggle */}
                <div className="form-group" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>Content Source</label>
                  <div className="flex gap-4">
                    <button 
                      className={`btn ${contentSource === 'syllabus' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '13px',
                        borderRadius: '20px',
                        minHeight: '32px'
                      }}
                      onClick={() => handleContentSourceChange('syllabus')}
                    >
                      📄 From Syllabus
                    </button>
                    <button 
                      className={`btn ${contentSource === 'prompt' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '13px',
                        borderRadius: '20px',
                        minHeight: '32px'
                      }}
                      onClick={() => handleContentSourceChange('prompt')}
                    >
                      ✏️ From Prompt
                    </button>
                  </div>
                </div>

                {/* Content Input Section */}
                {contentSource === 'syllabus' ? (
                  <div className="form-group">
                    <label className="form-label">Upload Syllabus (Excel, Word, PDF, or CSV)</label>
                    <div className="flex gap-8">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.docx,.pdf,.csv"
                        onChange={handleFileUpload}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      {loadingStates.upload && <Loader2 size={20} className="animate-spin" />}
                    </div>
                    {syllabus && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        ✓ {syllabus.name} - {syllabus.totalWeeks} weeks parsed
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid-2" style={{ gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Week Number</label>
                      <select 
                        className="form-input" 
                        value={promptWeekNumber} 
                        onChange={e => setPromptWeekNumber(Number(e.target.value))}
                      >
                        {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Week {num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Topic <span style={{ color: 'var(--accent-coral)' }}>*</span></label>
                      <input 
                        className="form-input" 
                        value={promptTopic} 
                        onChange={e => setPromptTopic(e.target.value)} 
                        placeholder="e.g., React Hooks, JavaScript Promises"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Context / Notes (optional)</label>
                      <textarea 
                        className="form-textarea" 
                        value={promptContext} 
                        onChange={e => setPromptContext(e.target.value)} 
                        placeholder="Additional context, specific concepts to focus on, or learning objectives..."
                        style={{ minHeight: 80, resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {/* Shared Generation Settings */}
                {(weeks.length > 0 || (contentSource === 'prompt' && promptTopic.trim())) && (
                  <>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginTop: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
                        Generation Settings
                      </h4>
                      <div className="grid-3" style={{ gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Questions per Quiz</label>
                          <select className="form-input" value={questionsCount} onChange={e => setQuestionsCount(Number(e.target.value))}>
                            <option value={3}>3 questions</option>
                            <option value={5}>5 questions</option>
                            <option value={8}>8 questions</option>
                            <option value={10}>10 questions</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Difficulty Level</label>
                          <select className="form-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Focus Keywords (optional)</label>
                          <input 
                            className="form-input" 
                            value={focusKeywords} 
                            onChange={e => setFocusKeywords(e.target.value)} 
                            placeholder="e.g., best practices, debugging"
                          />
                        </div>
                      </div>
                      
                      {/* Generate Button for Prompt Mode */}
                      {contentSource === 'prompt' && (
                        <div style={{ marginTop: 16 }}>
                          <button
                            className="btn btn-primary"
                            onClick={generateFromPrompt}
                            disabled={!promptTopic.trim() || loadingStates[`generate-prompt-${promptWeekNumber}`]}
                            style={{ minWidth: 140 }}
                          >
                            {loadingStates[`generate-prompt-${promptWeekNumber}`] ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Wand2 size={16} />
                            )}
                            Generate Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </AppMagicCard>

              {/* Generated/Available Weeks */}
              {weeks.length > 0 && (
                <AnimatePresence>
                  {weeks.map(week => (
                    <motion.div
                      key={week.weekNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      style={{ marginBottom: 20 }}
                    >
                      <AppMagicCard className="card">
                        <div className="flex items-center justify-between mb-16">
                          <div style={{ flex: 1 }}>
                            <div className="flex items-center gap-12 mb-8">
                              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                                Week {week.weekNumber}: {week.title}
                              </h3>
                              {contentSource === 'prompt' && (
                                <span className="tag" style={{ 
                                  background: 'var(--accent-violet)', 
                                  color: 'white', 
                                  fontSize: 11 
                                }}>
                                  Custom Topic
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                              {week.content.substring(0, 120)}
                              {week.content.length > 120 && '...'}
                            </p>
                          </div>
                          
                          <div className="flex gap-8">
                            {!generatedQuizzes[week.weekNumber] ? (
                              <button
                                className="btn btn-primary"
                                onClick={() => generateQuizForWeek(week)}
                                disabled={loadingStates[`generate-${week.weekNumber}`]}
                              >
                                {loadingStates[`generate-${week.weekNumber}`] ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Wand2 size={16} />
                                )}
                                Generate Quiz
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary"
                                onClick={() => publishGeneratedQuiz(week.weekNumber)}
                              >
                                <Send size={18} /> Publish Week {week.weekNumber}
                              </button>
                            )}
                          </div>
                        </div>

                        {generatedQuizzes[week.weekNumber] && (
                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 16 }}>
                            <div className="flex items-center justify-between mb-16">
                              <div className="flex items-center gap-12">
                                <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                                  Generated Questions ({generatedQuizzes[week.weekNumber].questions.length})
                                </h4>
                                <button
                                  className="btn btn-secondary"
                                  style={buttonStyles.btnSm}
                                  onClick={() => addBlankQuestion(week.weekNumber)}
                                >
                                  <Plus size={14} /> Add Question
                                </button>
                              </div>
                              
                              {/* Per-quiz controls */}
                              <div className="flex items-center gap-8">
                                <input
                                  type="text"
                                  placeholder="Focus keywords..."
                                  className="form-input"
                                  style={{ width: 120, fontSize: 12 }}
                                  value={regenerateKeywords[week.weekNumber] || ''}
                                  onChange={(e) => setRegenerateKeywords(prev => ({ 
                                    ...prev, 
                                    [week.weekNumber]: e.target.value 
                                  }))}
                                />
                                <button
                                  className="btn btn-secondary"
                                  style={buttonStyles.btnSm}
                                  onClick={() => regenerateEntireQuiz(week.weekNumber)}
                                  disabled={loadingStates[`generate-${week.weekNumber}`]}
                                >
                                  {loadingStates[`generate-${week.weekNumber}`] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <RotateCcw size={14} />
                                  )}
                                  Regenerate Quiz
                                </button>
                              </div>
                            </div>

                            {generatedQuizzes[week.weekNumber].questions.map((question, qi) => {
                              const isEditing = editingQuestion?.weekNumber === week.weekNumber && editingQuestion?.questionIndex === qi
                              const regenerateLoadingKey = `regenerate-${week.weekNumber}-${qi}`
                              
                              return (
                                <div key={qi} style={{ 
                                  marginBottom: 16, 
                                  padding: 16, 
                                  background: 'var(--base-surface)', 
                                  borderRadius: 8,
                                  border: isEditing ? '2px solid var(--accent-violet)' : '1px solid var(--border-subtle)'
                                }}>
                                  <div className="flex items-center justify-between mb-12">
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                      Q{qi + 1}
                                    </div>
                                    
                                    {/* Per-question controls */}
                                    <div className="flex items-center gap-8">
                                      <input
                                        type="text"
                                        placeholder="Keywords for regenerate..."
                                        className="form-input"
                                        style={{ width: 140, fontSize: 11 }}
                                        value={regenerateKeywords[`${week.weekNumber}-${qi}`] || ''}
                                        onChange={(e) => setRegenerateKeywords(prev => ({ 
                                          ...prev, 
                                          [`${week.weekNumber}-${qi}`]: e.target.value 
                                        }))}
                                      />
                                      
                                      <button
                                        className="btn btn-secondary"
                                        style={buttonStyles.btnXs}
                                        onClick={() => regenerateQuestion(week.weekNumber, qi)}
                                        disabled={loadingStates[regenerateLoadingKey]}
                                        title="Regenerate this question"
                                      >
                                        {loadingStates[regenerateLoadingKey] ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          <RotateCcw size={12} />
                                        )}
                                      </button>
                                      
                                      <button
                                        className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
                                        style={buttonStyles.btnXs}
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingQuestion(null)
                                          } else {
                                            setEditingQuestion({ weekNumber: week.weekNumber, questionIndex: qi })
                                          }
                                        }}
                                        title={isEditing ? "Save changes" : "Edit question"}
                                      >
                                        {isEditing ? <Check size={12} /> : <Edit3 size={12} />}
                                      </button>
                                      
                                      <button
                                        className="btn"
                                        style={{...buttonStyles.btnXs, ...buttonStyles.btnDanger}}
                                        onClick={() => {
                                          if (window.confirm('Delete this question?')) {
                                            deleteQuestion(week.weekNumber, qi)
                                          }
                                        }}
                                        title="Delete question"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Question text */}
                                  {isEditing ? (
                                    <textarea
                                      className="form-textarea"
                                      style={{ marginBottom: 12, minHeight: 60, fontSize: 14 }}
                                      value={question.question}
                                      onChange={(e) => updateQuestionText(week.weekNumber, qi, e.target.value)}
                                      placeholder="Enter your question..."
                                    />
                                  ) : (
                                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, lineHeight: 1.4 }}>
                                      {question.question || <em style={{ color: 'var(--text-secondary)' }}>No question text</em>}
                                    </div>
                                  )}
                                  
                                  {/* Options */}
                                  <div className="grid" style={{ gap: 8 }}>
                                    {question.options.map((option, oi) => (
                                      <div key={oi} className="flex items-center gap-12">
                                        {isEditing ? (
                                          <>
                                            <input
                                              type="radio"
                                              name={`correct-${week.weekNumber}-${qi}`}
                                              checked={question.correct === oi}
                                              onChange={() => updateCorrectAnswer(week.weekNumber, qi, oi)}
                                              style={{ accentColor: 'var(--accent-emerald)' }}
                                            />
                                            <input
                                              type="text"
                                              className="form-input"
                                              style={{ fontSize: 13 }}
                                              value={option}
                                              onChange={(e) => updateQuestionOption(week.weekNumber, qi, oi, e.target.value)}
                                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <span style={{ 
                                              minWidth: 20, 
                                              height: 20, 
                                              borderRadius: '50%', 
                                              background: question.correct === oi ? 'var(--accent-emerald)' : 'var(--base-border)',
                                              fontSize: 11,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: 'white',
                                              fontWeight: 600
                                            }}>
                                              {String.fromCharCode(65 + oi)}
                                            </span>
                                            <span style={{ fontSize: 13, flex: 1 }}>
                                              {option || <em style={{ color: 'var(--text-secondary)' }}>Empty option</em>}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Explanation (if exists) */}
                                  {question.explanation && (
                                    <div style={{ 
                                      marginTop: 12, 
                                      padding: 8, 
                                      background: 'var(--base-muted)', 
                                      borderRadius: 4,
                                      fontSize: 12,
                                      fontStyle: 'italic',
                                      color: 'var(--text-secondary)'
                                    }}>
                                      💡 {question.explanation}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            
                            {/* Add question button at bottom */}
                            <button
                              className="btn btn-secondary w-full"
                              style={buttonStyles.btnSm}
                              onClick={() => addBlankQuestion(week.weekNumber)}
                            >
                              <Plus size={14} /> Add Another Question
                            </button>
                          </div>
                        )}
                      </AppMagicCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </>
          )}

          {mode === 'manual' && (
            <>
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
            </>
          )}
        </div>
      </div>
    </motion.div>
    </>
  )
}