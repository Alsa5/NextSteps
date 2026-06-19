import React from 'react'

export function HeroRocket({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="url(#rocketGrad)" opacity="0.1"/>
      <path d="M60 20C60 20 45 40 45 65C45 80 52 90 60 95C68 90 75 80 75 65C75 40 60 20 60 20Z" fill="url(#rocketBody)" stroke="#8B5CF6" strokeWidth="2"/>
      <circle cx="60" cy="55" r="8" fill="#E8DEFF" stroke="#8B5CF6" strokeWidth="1.5"/>
      <circle cx="60" cy="55" r="4" fill="#8B5CF6"/>
      <path d="M45 70C40 72 35 68 38 75L45 80" fill="#FFB347" opacity="0.8"/>
      <path d="M75 70C80 72 85 68 82 75L75 80" fill="#FFB347" opacity="0.8"/>
      <path d="M55 95L60 110L65 95" fill="url(#flameGrad)"/>
      <path d="M52 95L60 105L68 95" fill="#FF6B6B" opacity="0.6"/>
      <defs>
        <linearGradient id="rocketGrad" x1="5" y1="5" x2="115" y2="115">
          <stop stopColor="#8B5CF6"/>
          <stop offset="1" stopColor="#EC4899"/>
        </linearGradient>
        <linearGradient id="rocketBody" x1="45" y1="20" x2="75" y2="95">
          <stop stopColor="#FEFCF9"/>
          <stop offset="1" stopColor="#E8DEFF"/>
        </linearGradient>
        <linearGradient id="flameGrad" x1="55" y1="95" x2="65" y2="110">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FFB347"/>
          <stop offset="1" stopColor="#F59E0B"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function FloatingShapes() {
  return (
    <div className="login-bg-shapes">
      <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="100" cy="150" r="80" fill="#E8DEFF" opacity="0.4">
          <animate attributeName="cy" values="150;130;150" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="1300" cy="200" r="60" fill="#D4F5E9" opacity="0.4">
          <animate attributeName="cy" values="200;220;200" dur="5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="200" cy="700" r="100" fill="#FFE4EC" opacity="0.3">
          <animate attributeName="cx" values="200;220;200" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="1200" cy="650" r="70" fill="#D6EEFF" opacity="0.3">
          <animate attributeName="cy" values="650;630;650" dur="4.5s" repeatCount="indefinite"/>
        </circle>
        <rect x="700" y="100" width="40" height="40" rx="8" fill="#FFE8D6" opacity="0.4" transform="rotate(45 720 120)">
          <animateTransform attributeName="transform" type="rotate" values="45 720 120;90 720 120;45 720 120" dur="8s" repeatCount="indefinite"/>
        </rect>
        <polygon points="400,300 420,260 440,300" fill="#E8DEFF" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite"/>
        </polygon>
        <circle cx="900" cy="400" r="5" fill="#8B5CF6" opacity="0.3">
          <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="500" cy="500" r="4" fill="#FF6B6B" opacity="0.3">
          <animate attributeName="r" values="4;7;4" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="1100" cy="450" r="6" fill="#34D399" opacity="0.3">
          <animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  )
}

export function SkillTreeSVG({ nodes, onNodeClick }) {
  const getNodeColor = (status) => {
    switch (status) {
      case 'completed': return { fill: 'var(--accent-blue)', stroke: 'var(--brand-blue)', text: '#fff' }
      case 'in-progress': return { fill: 'var(--accent-amber)', stroke: 'var(--brand-amber)', text: '#fff' }
      case 'locked': return { fill: 'var(--base-surface)', stroke: 'var(--base-border)', text: 'var(--base-text-secondary)' }
      default: return { fill: 'var(--base-surface)', stroke: 'var(--base-border)', text: 'var(--base-text-secondary)' }
    }
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none">
      {nodes.map((node, i) => {
        const colors = getNodeColor(node.status)
        const x = node.x || 100 + (i % 4) * 180
        const y = node.y || 80 + Math.floor(i / 4) * 150
        return (
          <g key={node.id} onClick={() => onNodeClick?.(node)} style={{ cursor: 'pointer' }}>
            {i > 0 && (
              <line
                x1={nodes[i - 1].x || 100 + ((i - 1) % 4) * 180}
                y1={(nodes[i - 1].y || 80 + Math.floor((i - 1) / 4) * 150) + 30}
                x2={x}
                y2={y - 30}
                stroke={colors.stroke}
                strokeWidth="2"
                strokeDasharray={node.status === 'locked' ? '5,5' : '0'}
                opacity="0.4"
              />
            )}
            <circle cx={x} cy={y} r="30" fill={colors.fill} stroke={colors.stroke} strokeWidth="2.5">
              {node.status === 'in-progress' && (
                <animate attributeName="r" values="30;33;30" dur="2s" repeatCount="indefinite"/>
              )}
            </circle>
            <text x={x} y={y + 4} textAnchor="middle" fill={colors.text} fontSize="11" fontWeight="600">
              {node.score > 0 ? `${node.score}%` : '🔒'}
            </text>
            <text x={x} y={y + 50} textAnchor="middle" fill="var(--base-text)" fontSize="12" fontWeight="500">
              {node.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function EmptyState({ title, subtitle, icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <svg className="empty-state-illustration" width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: '0 auto 20px' }}>
        <circle cx="60" cy="60" r="55" fill="var(--secondary-lavender)" opacity="0.5"/>
        <circle cx="60" cy="60" r="35" fill="var(--secondary-lavender)" opacity="0.7"/>
        <text x="60" y="68" textAnchor="middle" fontSize="36">{icon || '📭'}</text>
      </svg>
      <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--base-text)' }}>{title}</h3>
      <p style={{ color: 'var(--base-text-secondary)', fontSize: 14 }}>{subtitle}</p>
    </div>
  )
}

export function WaveDivider({ color = '#E8DEFF' }) {
  return (
    <svg width="100%" height="40" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d="M0 20C240 0 480 40 720 20C960 0 1200 40 1440 20V40H0V20Z" fill={color} opacity="0.3"/>
    </svg>
  )
}
