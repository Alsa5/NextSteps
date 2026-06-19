/** Maverick Nebula — story-driven metaverse theme (60-30-10 color rule) */

export const NEBULA_STORY = {
  title: 'The Maverick Nebula',
  tagline: 'Where every journey leaves a luminous trail',
  chapters: {
    login: 'Explore the Nebula — drag to orbit, scroll to watch it expand as you sign in.',
    maverick: 'Your Skill Grove grows with every session, badge, and pulse of feedback.',
    trainer: 'From the Pulse Observatory you guide batches through the training skyline.',
    ld: 'The Constellation Archive holds every batch, skill strand, and curriculum star.',
    manager: 'The Deployment Horizon shows Mavericks ready for the real-world orbit.',
  },
}

/** 60% neutrals · 30% violet/blue · 10% amber accent */
export const NEBULA_COLORS = {
  base60: '#0a0818',
  base60Card: 'rgba(12, 10, 28, 0.72)',
  secondary30: '#4361ee',
  secondary30Violet: '#7b5cf5',
  accent10: '#f7c948',
  fog: '#120f24',
  glow: '#7b5cf5',
  biolum: ['#ff6bcb', '#00e5ff', '#a78bfa', '#f7c948', '#4361ee'],
}

export const ROLES = [
  { id: 'maverick', icon: '🧑‍🚀', name: 'Maverick', desc: 'GET / PGET Trainee · Gmail Magic Link' },
  { id: 'trainer', icon: '🛰️', name: 'Trainer', desc: 'Session Delivery · SSO' },
  { id: 'ld', icon: '✨', name: 'L&D Executive', desc: 'Curriculum & Batch Intelligence · SSO' },
  { id: 'manager', icon: '🌌', name: 'Manager', desc: 'Post-Deployment · SSO' },
]

export const ROLE_SCENE = {
  maverick: 'grove',
  trainer: 'city',
  ld: 'city',
  manager: 'horizon',
  login: 'grove',
  ai: 'pulse',
  skill: 'growth',
}

export const getRoleLabel = (roleId) => ROLES.find((r) => r.id === roleId)?.name ?? roleId

export const WELCOME_ROLES = ['maverick', 'trainer', 'ld', 'manager']

/** Role tint for splash overlay (30% layer per spec §4.2) */
export const ROLE_SPLASH_TINT = {
  maverick: 'rgba(123, 92, 245, 0.18)',
  trainer: 'rgba(67, 97, 238, 0.18)',
  ld: 'rgba(123, 92, 245, 0.12)',
  manager: 'rgba(67, 97, 238, 0.14)',
}

const DASHBOARD_CODENAMES = {
  maverick: 'Mission HQ',
  trainer: 'Session Deck',
  ld: 'Ops Command Centre',
  manager: 'Deployment Horizon',
}

const WELCOME_COACH = {
  maverick: {
    coachTitle: 'Welcome to Mission HQ',
    coachBody:
      'Your Passport is your Nebula credential. Complete today\'s pulse to grow your Skill Grove.',
    spotlightSelector: 'a.sidebar-link[href="/passport"]',
  },
  trainer: {
    coachTitle: 'Welcome to Session Deck',
    coachBody:
      'Log your next session from the Logger — batch pulse updates in real time.',
    spotlightSelector: 'a.sidebar-link[href="/session-logger"]',
  },
  ld: {
    coachTitle: 'Welcome to Ops Command',
    coachBody:
      'Batch health and segregation queues live here. Start with the dashboard table.',
    spotlightSelector: '[data-welcome-spotlight="batch-table"]',
  },
  manager: {
    coachTitle: 'Welcome to Deployment Horizon',
    coachBody:
      'Your assigned Mavericks appear below. Open a passport preview before submitting a review.',
    spotlightSelector: '[data-welcome-spotlight="maverick-card"]',
  },
}

/** Multi-step Nebula Tour Guide script, one story arc per role */
export const NEBULA_TOUR = {
  maverick: [
    {
      title: '🚀 Mission HW — Briefing',
      body: 'Welcome, Maverick. You\'ve just landed at Hexaware headquarters. This is Mission HQ — your personal command centre for the next few months of training.',
      selector: null,
    },
    {
      title: '🛂 Your Passport',
      body: 'Every Maverick carries a Passport — your XP, level, badge wall, and skill radar all in one view. Employers and managers see this snapshot.',
      selector: 'a.sidebar-link[href="/passport"]',
    },
    {
      title: '🌳 Skill Grove',
      body: 'This is the living 3-D tree of your learning journey. Each branch is a module. Complete a level and watch the branch bloom. Achievements grow fruit.',
      selector: 'a.sidebar-link[href="/skill-tree"]',
    },
    {
      title: '⚡ Pulse Feedback',
      body: 'Every session ends with a 30-second Pulse. Rate clarity and pace, and your trainer gets real-time signal. You earn +30 XP each time.',
      selector: 'a.sidebar-link[href="/pulse-feedback"]',
    },
    {
      title: '🤖 AI Buddy',
      body: 'Stuck on a concept? Your AI Buddy explains, quizzes, and adapts to your skill level. Available 24 / 7 — no queue, no wait.',
      selector: 'a.sidebar-link[href="/ai-buddy"]',
    },
    {
      title: '🏆 You\'re all set!',
      body: 'Your orbit starts now. Complete your first Pulse and earn your first XP. Mission HQ is yours — go explore.',
      selector: null,
    },
  ],
  trainer: [
    {
      title: '🛰️ Pulse Observatory — Briefing',
      body: 'Trainer, welcome to your observatory. From here you guide Mavericks through the constellation of modules that make up the programme.',
      selector: null,
    },
    {
      title: '📋 Session Logger',
      body: 'Log every session here. Record content, attendance, and notes. Each log feeds the analytics and transcript analysis engine.',
      selector: 'a.sidebar-link[href="/session-logger"]',
    },
    {
      title: '📡 Batch Pulse Board',
      body: 'See live feedback from your batch in real time. Confusion spikes, pace issues, and mood trends appear here as soon as Mavericks submit.',
      selector: 'a.sidebar-link[href="/batch-pulse"]',
    },
    {
      title: '📊 Session Analytics',
      body: 'AI-powered session analysis turns transcripts into clarity scores, readiness predictions, and topic heatmaps.',
      selector: 'a.sidebar-link[href="/session-analytics"]',
    },
    {
      title: '✅ Ready to go!',
      body: 'Start by logging today\'s session. Your batch\'s first Pulse is waiting.',
      selector: null,
    },
  ],
  ld: [
    {
      title: '✨ Constellation Archive — Briefing',
      body: 'L&D Executive, welcome to Ops Command. You hold the map of every batch, trainer, and Maverick in the programme.',
      selector: null,
    },
    {
      title: '📋 Trainee Roster',
      body: 'All 50 trainees — pre-onboarding and post-onboarding — in one view. Filter, search, and click any pre-onboarding trainee to send their welcome email and auto-generate a Hexaware domain account.',
      selector: 'a.sidebar-link[href="/trainee-roster"]',
    },
    {
      title: '🤝 Batch Composer',
      body: 'AI segregates trainees into optimally balanced batches based on skills, college, and stream preference. One click to approve.',
      selector: 'a.sidebar-link[href="/batch-composer"]',
    },
    {
      title: '📈 Effectiveness Loop',
      body: 'Curriculum health, trainer scores, and readiness deltas — close the feedback loop between what was taught and how Mavericks are performing.',
      selector: 'a.sidebar-link[href="/effectiveness"]',
    },
    {
      title: '🌌 All clear!',
      body: 'Start with the Trainee Roster — send those onboarding emails and get your first batch launched.',
      selector: null,
    },
  ],
  manager: [
    {
      title: '🌌 Deployment Horizon — Briefing',
      body: 'Manager, your Mavericks have graduated from training and entered the real orbit. Deployment Horizon lets you track, review, and flag performance.',
      selector: null,
    },
    {
      title: '👥 My Mavericks',
      body: 'Every Maverick assigned to you appears here. Click their card to open a read-only Passport view — full XP history, skills, and feedback summary.',
      selector: '[data-welcome-spotlight="maverick-card"]',
    },
    {
      title: '🚨 Early Alerts',
      body: 'AI flags Mavericks showing performance dips before they escalate. Review the alert details and submit your feedback directly to L&D.',
      selector: 'a.sidebar-link[href="/early-flags"]',
    },
    {
      title: '✅ You\'re in orbit!',
      body: 'Scan the Deployment Horizon now. Your Mavericks are counting on your timely reviews to keep their trajectory on course.',
      selector: null,
    },
  ],
}

/**
 * Role-aware welcome copy for splash (WELCOME-02) and first-run coach (WELCOME-04).
 * @param {string} role
 */
export const getWelcomeCopy = (role) => {
  const resolved = WELCOME_ROLES.includes(role) ? role : 'maverick'
  const roleMeta = ROLES.find((r) => r.id === resolved)
  const coach = WELCOME_COACH[resolved]

  return {
    role: resolved,
    roleLabel: roleMeta?.name ?? getRoleLabel(resolved),
    roleIcon: roleMeta?.icon ?? '🧑‍🚀',
    chapterLine: NEBULA_STORY.chapters[resolved],
    dashboardCodename: DASHBOARD_CODENAMES[resolved],
    splashTint: ROLE_SPLASH_TINT[resolved],
    coachTitle: coach.coachTitle,
    coachBody: coach.coachBody,
    spotlightSelector: coach.spotlightSelector,
  }
}
