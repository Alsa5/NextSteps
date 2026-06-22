import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import EmailAuthCallback from './pages/EmailAuthCallback'
import MaverickDashboard from './pages/maverick/MaverickDashboard'
import MaverickPassport from './pages/maverick/MaverickPassport'
import PulseFeedback from './pages/maverick/PulseFeedback'
import DeepFeedback from './pages/maverick/DeepFeedback'
import SkillTree from './pages/maverick/SkillTree'
import MaverickAssessments from './pages/maverick/MaverickAssessments'
import StreamRecommender from './pages/maverick/StreamRecommender'
import AIBuddy from './pages/maverick/AIBuddy'
import Leaderboard from './pages/maverick/Leaderboard'
import PhaseTimeline from './pages/maverick/PhaseTimeline'
import TrainerDashboard from './pages/trainer/TrainerDashboard'
import BatchPulseBoard from './pages/trainer/BatchPulseBoard'
import SessionAnalytics from './pages/trainer/SessionAnalytics'
import AssessmentPublisher from './pages/trainer/AssessmentPublisher'
import AssessmentResults from './pages/trainer/AssessmentResults'
import AttendanceTracker from './pages/trainer/AttendanceTracker'
import LDDashboard from './pages/ld/LDDashboard'
import CurriculumCopilot from './pages/ld/CurriculumCopilot'
import EffectivenessLoop from './pages/ld/EffectivenessLoop'
import BatchComparison from './pages/ld/BatchComparison'
import ReportGenerator from './pages/ld/ReportGenerator'
import WelcomeJourney from './pages/maverick/WelcomeJourney'
import QRAttendance from './pages/maverick/QRAttendance'
import PeerFeedback from './pages/maverick/PeerFeedback'
import SessionTranscript from './pages/maverick/SessionTranscript'
import BatchComposer from './pages/ld/BatchComposer'
import BatchLifecycleManager from './pages/ld/BatchLifecycleManager'
import TraineeRoster from './pages/ld/TraineeRoster'
import BatchAssignmentQueue from './pages/ld/BatchAssignmentQueue'
import FeedbackAnalytics from './pages/ld/FeedbackAnalytics'
import PreOnboardingSessions from './pages/ld/PreOnboardingSessions'
import LDAIHelper from './pages/ld/LDAIHelper'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import PerformanceReview from './pages/manager/PerformanceReview'
import EarlyPerformanceAlert from './pages/manager/EarlyPerformanceAlert'
import MaverickPassportView from './pages/manager/MaverickPassportView'
import Layout from './components/Layout'
import SignInSplash from './components/SignInSplash'
import WelcomeCoach from './components/WelcomeCoach'
import { AuthContext } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { AzureAuthProvider, useAzureAuth } from './auth/AzureAuthProvider'
import { clearAppToken, switchAppRole, setAppToken } from './config/api-client'
import { cacheProfilePhoto, resolveProfilePhotoUrl } from './utils/userDisplay'

function AuthenticatedShell({ user, setUser, theme }) {
  const { logout: azureLogout } = useAzureAuth()
  const navigate = useNavigate()
  const [splashDone, setSplashDone] = useState(false)

  const logout = async () => {
    clearAppToken()
    setUser(null)
    setSplashDone(false)
    await azureLogout()
  }

  const switchRole = async (role) => {
    const { user: nextUser, token } = await switchAppRole(role)
    setAppToken(token)

    const nextState = {
      id: nextUser.id,
      name: nextUser.name,
      role: nextUser.role,
      email: nextUser.email ?? user.email,
      jobTitle: nextUser.jobTitle,
      hexId: nextUser.hexId,
      isAppAdmin: nextUser.isAppAdmin,
      employeeId: user.employeeId || nextUser.employeeId || nextUser.hexId || null,
      graphPhotoUrl: user.graphPhotoUrl || nextUser.graphPhotoUrl || null,
    }

    flushSync(() => {
      setUser(nextState)
    })

    navigate('/', { replace: true })
    return nextState
  }

  if (!splashDone) {
    return (
      <>
        <Toaster position="top-right" />
        <SignInSplash
          key={user.role}
          userId={user.id}
          userName={user.name}
          email={user.email}
          employeeId={user.employeeId || user.hexId}
          graphPhotoUrl={user.graphPhotoUrl}
          role={user.role}
          theme={theme}
          onDone={() => setSplashDone(true)}
        />
      </>
    )
  }

  return (
    <AuthContext.Provider value={{ user, logout, switchRole }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', background: '#1e1b3a', color: '#fff', fontSize: '14px' },
        }}
      />
      <WelcomeCoach userId={user.id} role={user.role} />
      <Layout key={user.role}>
        <Routes key={user.role}>
                    {user.role === 'maverick' && (
                      <>
                        <Route path="/" element={<MaverickDashboard />} />
                        <Route path="/passport" element={<MaverickPassport />} />
                        <Route path="/pulse-feedback" element={<PulseFeedback />} />
                        <Route path="/deep-feedback" element={<DeepFeedback />} />
                        <Route path="/skill-tree" element={<SkillTree />} />
                        <Route path="/assessments" element={<MaverickAssessments />} />
                        <Route path="/stream-recommender" element={<StreamRecommender />} />
                        <Route path="/ai-buddy" element={<AIBuddy />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/phase-timeline" element={<PhaseTimeline />} />
                        <Route path="/welcome-journey" element={<WelcomeJourney />} />
                        <Route path="/qr-attendance" element={<QRAttendance />} />
                        <Route path="/peer-feedback" element={<PeerFeedback />} />
                        <Route path="/session-transcript" element={<SessionTranscript />} />
                      </>
                    )}

                    {user.role === 'trainer' && (
                      <>
                        <Route path="/" element={<TrainerDashboard />} />
                        <Route path="/batch-pulse" element={<BatchPulseBoard />} />
                        <Route path="/session-analytics" element={<SessionAnalytics />} />
                        <Route path="/assessments" element={<AssessmentPublisher />} />
                        <Route path="/assessment-results" element={<AssessmentResults />} />
                        <Route path="/attendance" element={<AttendanceTracker />} />
                      </>
                    )}

                    {user.role === 'ld' && (
                      <>
                        <Route path="/" element={<LDDashboard />} />
                        <Route path="/batch-segregation" element={<Navigate to="/batch-composer" replace />} />
                        <Route path="/ai-helper" element={<LDAIHelper />} />
                        <Route path="/curriculum-copilot" element={<CurriculumCopilot />} />
                        <Route path="/effectiveness" element={<EffectivenessLoop />} />
                        <Route path="/batch-comparison" element={<BatchComparison />} />
                        <Route path="/reports" element={<ReportGenerator />} />
                        <Route path="/assessment-results" element={<AssessmentResults />} />
                        <Route path="/batch-composer" element={<BatchComposer />} />
                        <Route path="/batch-lifecycle" element={<BatchLifecycleManager />} />
                        <Route path="/trainee-roster" element={<TraineeRoster />} />
                        <Route path="/pre-onboarding-sessions" element={<PreOnboardingSessions />} />
                        <Route path="/recruitment-queue" element={<BatchAssignmentQueue />} />
                        <Route path="/feedback-analytics" element={<FeedbackAnalytics />} />
                      </>
                    )}

                    {user.role === 'manager' && (
                      <>
                        <Route path="/" element={<ManagerDashboard />} />
                        <Route path="/review/:maverickId" element={<PerformanceReview />} />
                        <Route path="/early-flags" element={<EarlyPerformanceAlert />} />
                        <Route path="/passport/:maverickId" element={<MaverickPassportView />} />
                        <Route path="/assessment-results" element={<AssessmentResults />} />
                      </>
                    )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthContext.Provider>
  )
}

function AppRoutes() {
  const [user, setUser] = useState(null)
  const { theme } = useTheme()

  const handleAuthenticated = useCallback((nextUser) => {
    console.log('SSO RESPONSE nextUser:', nextUser) // Debug log
    if (!nextUser) {
      setUser(null)
      return
    }
    setUser({
      id: nextUser.id,
      name: nextUser.name,
      role: nextUser.role,
      email: nextUser.email,
      jobTitle: nextUser.jobTitle,
      hexId: nextUser.hexId,
      isAppAdmin: nextUser.isAppAdmin,
      employeeId: nextUser.employeeId || null,
      graphPhotoUrl: nextUser.graphPhotoUrl || null,
    })
    console.log('Set user state with isAppAdmin:', nextUser.isAppAdmin) // Debug log
    cacheProfilePhoto(
      resolveProfilePhotoUrl({
        graphPhotoUrl: nextUser.graphPhotoUrl,
        email: nextUser.email,
      }),
    )
  }, [])

  return (
    <AzureAuthProvider onAuthenticated={handleAuthenticated}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/auth/email"
          element={<EmailAuthCallback onAuthenticated={handleAuthenticated} />}
        />
        <Route
          path="*"
          element={
            !user ? (
              <>
                <Toaster
                  position="bottom-center"
                  containerStyle={{ bottom: 28 }}
                  toastOptions={{ duration: 3500 }}
                />
                <LoginPage onAuthenticated={handleAuthenticated} />
              </>
            ) : (
              <AuthenticatedShell key={`${user.id}-${user.role}`} user={user} setUser={setUser} theme={theme} />
            )
          }
        />
      </Routes>
    </AzureAuthProvider>
  )
}

function App() {
  return <AppRoutes />
}

export default App
