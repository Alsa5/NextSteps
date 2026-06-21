import { useContext, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
  Home, CreditCard, Zap, FileText, GitBranch, Compass, Bot, Trophy, Clock,
  ClipboardList, Radio, BarChart3, BookCheck, Users, LayoutDashboard, Video,
  Brain, TrendingUp, GitCompare, FileBarChart, LogOut, QrCode, UserCheck,
  Layers, ScrollText, AlertTriangle, Sparkles, MessageSquareHeart,
} from 'lucide-react'
import PersonAvatar from './PersonAvatar'
import { formatDisplayName } from '../utils/userDisplay'
// MetaverseBackdrop removed — backdrop 3D scene removed from all portal pages
import { MagicSpotlight, useMagicMobile } from './magic-bento/MagicBento'
import { getRoleLabel } from '../theme/maverickNebula'
import RoleSwitcher from './RoleSwitcher'
import LdTraineeRegistrySync from './ld/LdTraineeRegistrySync'
import NotificationBell from './NotificationBell'
import '../components/metaverse/metaverse.css'

const navConfig = {
  maverick: {
    title: 'Maverick',
    sections: [
      {
        title: 'Nebula Hub',
        links: [
          { to: '/', icon: Home, label: 'Dashboard' },
          { to: '/passport', icon: CreditCard, label: 'Maverick Passport' },
          { to: '/skill-tree', icon: GitBranch, label: 'Training Universe' },
          { to: '/assessments', icon: BookCheck, label: 'Assessments' },
          { to: '/phase-timeline', icon: Clock, label: 'Journey Timeline' },
        ],
      },
      {
        title: 'Feedback & Sessions',
        links: [
          { to: '/pulse-feedback', icon: Zap, label: 'Pulse Feedback' },
          { to: '/deep-feedback', icon: FileText, label: 'Deep Feedback' },
          { to: '/peer-feedback', icon: UserCheck, label: 'Peer Feedback' },
          { to: '/qr-attendance', icon: QrCode, label: 'QR Attendance' },
          { to: '/session-transcript', icon: ScrollText, label: 'Session Transcripts' },
        ],
      },
      {
        title: 'Explore',
        links: [
          { to: '/stream-recommender', icon: Compass, label: 'Stream Recommender' },
          { to: '/ai-buddy', icon: Bot, label: 'AI Learning Buddy' },
          { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
          { to: '/welcome-journey', icon: Sparkles, label: 'Welcome Journey' },
        ],
      },
    ],
  },
  trainer: {
    title: 'Trainer',
    sections: [
      {
        title: 'Pulse Observatory',
        links: [
          { to: '/', icon: Home, label: 'Dashboard' },
          { to: '/batch-pulse', icon: Radio, label: 'Batch Pulse Board' },
        ],
      },
      {
        title: 'Analytics',
        links: [
          { to: '/session-analytics', icon: BarChart3, label: 'Session Analytics' },
          { to: '/assessments', icon: BookCheck, label: 'Assessments' },
          { to: '/assessment-results', icon: FileBarChart, label: 'Results' },
          { to: '/attendance', icon: Users, label: 'Attendance Tracker' },
        ],
      },
    ],
  },
  ld: {
    title: 'L&D Executive',
    sections: [
      {
        title: 'Constellation Archive',
        links: [
          { to: '/', icon: LayoutDashboard, label: 'Ops Dashboard' },
          { to: '/batch-lifecycle', icon: Layers, label: 'Batch Lifecycle' },
          { to: '/recruitment-queue', icon: ClipboardList, label: 'Recruitment Queue' },
          { to: '/trainee-roster', icon: Users, label: 'Trainee Roster' },
          { to: '/pre-onboarding-sessions', icon: Video, label: 'Pre-Onboarding Meets' },
          { to: '/feedback-analytics', icon: MessageSquareHeart, label: 'Feedback Analytics' },
          { to: '/batch-composer', icon: Sparkles, label: 'Batch Composer' },
          { to: '/ai-helper', icon: Bot, label: 'AI Helper' },
        ],
      },
      {
        title: 'Intelligence',
        links: [
          { to: '/curriculum-copilot', icon: Brain, label: 'Curriculum Copilot' },
          { to: '/effectiveness', icon: TrendingUp, label: 'Effectiveness Loop' },
          { to: '/batch-comparison', icon: GitCompare, label: 'Batch Comparison' },
          { to: '/reports', icon: FileBarChart, label: 'Report Generator' },
          { to: '/assessment-results', icon: BarChart3, label: 'Assessment Results' },
        ],
      },
    ],
  },
  manager: {
    title: 'Manager',
    sections: [
      {
        title: 'Deployment Horizon',
        links: [
          { to: '/', icon: Home, label: 'My Mavericks' },
          { to: '/early-flags', icon: AlertTriangle, label: 'Early Performance Alert' },
        ],
      },
    ],
  },
}

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const nav = navConfig[user.role]
  const mainRef = useRef(null)
  const isMobile = useMagicMobile()
  const displayName = formatDisplayName(user.name)
  const isTrainingUniverse = location.pathname === '/skill-tree'

  return (
    <div className="app-layout metaverse-shell">
      <aside className="sidebar sidebar-nebula">
        <div className="sidebar-logo">
          <div>
            <h1>NextSteps</h1>
            <span>Maverick Nebula</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.sections.map((section, si) => (
            <div key={si}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <RoleSwitcher />

        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              <PersonAvatar
                userId={user.id}
                size={40}
                title={displayName}
                photoUrl={user.graphPhotoUrl}
                email={user.email}
              />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <button type="button" onClick={logout} className="sidebar-sign-out" aria-label="Sign out">
            <LogOut size={18} aria-hidden />
            Sign Out
          </button>
        </div>
      </aside>

      <main ref={mainRef} className="main-content main-content-nebula magic-bento-zone bento-section">
        <div className="main-content-topbar">
          <NotificationBell />
        </div>
        <MagicSpotlight gridRef={mainRef} disableAnimations={isMobile} enabled={!isTrainingUniverse} />
        {user.role === 'ld' && <LdTraineeRegistrySync />}
        {children}
      </main>
    </div>
  )
}
