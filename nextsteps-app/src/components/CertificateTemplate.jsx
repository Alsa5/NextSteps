import { forwardRef } from 'react'

const TIER_CONFIG = {
  platinum: { color: '#7b5cf5', accent: '#c4b5fd', label: 'Platinum', dark: '#4c1d95' },
  gold:     { color: '#d97706', accent: '#fbbf24', label: 'Gold',     dark: '#92400e' },
  silver:   { color: '#475569', accent: '#94a3b8', label: 'Silver',   dark: '#1e293b' },
  bronze:   { color: '#b45309', accent: '#d97706', label: 'Bronze',   dark: '#78350f' },
}

const CertificateTemplate = forwardRef(({ trainer, cert }, ref) => {
  const tier = cert?.tier || trainer?.tier || 'gold'
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.gold
  const trainerName = trainer?.trainerName || 'Trainer'
  const issuedDate = cert?.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const issuedBy = cert?.issuedBy || 'NextSteps L&D'
  const certId = 'NS-' + tier.slice(0,2).toUpperCase() + '-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000)

  return (
    <div
      ref={ref}
      data-cert="true"
      style={{
        width: 900,
        height: 636,
        position: 'relative',
        background: '#ffffff',
        fontFamily: 'Georgia, "Times New Roman", serif',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top accent band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'linear-gradient(90deg, ' + cfg.dark + ', ' + cfg.color + ', ' + cfg.accent + ', ' + cfg.color + ', ' + cfg.dark + ')' }} />
      {/* Bottom accent band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, background: 'linear-gradient(90deg, ' + cfg.dark + ', ' + cfg.color + ', ' + cfg.accent + ', ' + cfg.color + ', ' + cfg.dark + ')' }} />

      {/* Outer border */}
      <div style={{ position: 'absolute', inset: '18px', border: '1.5px solid ' + cfg.color + '55', pointerEvents: 'none' }} />
      {/* Inner border */}
      <div style={{ position: 'absolute', inset: '24px', border: '0.5px solid ' + cfg.color + '33', pointerEvents: 'none' }} />

      {/* Corner flourishes */}
      {[[28,28,'rotate(0deg)'],[872,28,'rotate(90deg)'],[28,608,'rotate(270deg)'],[872,608,'rotate(180deg)']].map(([x,y,r],i) => (
        <div key={i} style={{ position: 'absolute', left: x-14, top: y-14, width: 28, height: 28, transform: r, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 2, background: cfg.color }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 14, background: cfg.color }} />
          <div style={{ position: 'absolute', top: 4, left: 4, width: 6, height: 6, border: '1.5px solid ' + cfg.accent, borderRadius: '50%' }} />
        </div>
      ))}

      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 180, fontWeight: 900, color: cfg.color + '06', letterSpacing: -4, whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none' }}>
        HEXAWARE
      </div>

      {/* Top row */}
      <div style={{ position: 'absolute', top: 32, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, ' + cfg.dark + ', ' + cfg.color + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px ' + cfg.color + '44' }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.9)', borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cfg.dark, letterSpacing: 2, fontFamily: '"Segoe UI", Arial, sans-serif' }}>HEXAWARE</div>
            <div style={{ fontSize: 10, color: '#999', letterSpacing: 1, fontFamily: '"Segoe UI", Arial, sans-serif' }}>Technologies</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: '"Segoe UI", Arial, sans-serif' }}>
          <div style={{ fontSize: 9, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase' }}>Certificate No.</div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginTop: 2 }}>{certId}</div>
          <div style={{ fontSize: 9, color: '#bbb', marginTop: 3 }}>Awarded on {issuedDate}</div>
        </div>
      </div>

      {/* Tier ribbon */}
      <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, ' + cfg.color + ')' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: 4, fontFamily: '"Segoe UI", Arial, sans-serif', textTransform: 'uppercase' }}>
          {cfg.label} Tier Achievement
        </div>
        <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, ' + cfg.color + ', transparent)' }} />
      </div>

      {/* Main content */}
      <div style={{ position: 'absolute', inset: '110px 60px 60px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>

        <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 3, marginBottom: 10, fontFamily: '"Segoe UI", Arial, sans-serif', textTransform: 'uppercase' }}>
          Certificate of Achievement
        </div>

        <div style={{ width: 120, height: 1.5, background: 'linear-gradient(90deg, transparent, ' + cfg.color + ', transparent)', marginBottom: 18 }} />

        <div style={{ fontSize: 12, color: '#888', marginBottom: 14, fontStyle: 'italic' }}>
          This is to proudly certify that
        </div>

        <div style={{ fontSize: 52, fontWeight: 700, color: '#1a1a2e', fontStyle: 'italic', marginBottom: 6, lineHeight: 1.1, textShadow: '1px 1px 0px ' + cfg.color + '22' }}>
          {trainerName}
        </div>

        <div style={{ width: 360, height: 1, background: 'linear-gradient(90deg, transparent, #ccc, transparent)', marginBottom: 18, marginTop: 8 }} />

        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.9, maxWidth: 500, fontFamily: '"Segoe UI", Arial, sans-serif' }}>
          has demonstrated exceptional commitment and dedication in training excellence,<br />
          achieving the distinguished{' '}
          <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label} Tier</span>
          {' '}recognition in the{' '}
          <span style={{ color: cfg.dark, fontWeight: 600 }}>NextSteps L&D Platform</span>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', gap: 80, alignItems: 'flex-end', marginTop: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontStyle: 'italic', color: cfg.dark, fontFamily: 'Georgia, serif', marginBottom: 4, letterSpacing: 1 }}>{issuedBy}</div>
            <div style={{ width: 150, height: 1, background: '#bbb', marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: '#888', fontFamily: '"Segoe UI", Arial, sans-serif', letterSpacing: 1 }}>AUTHORIZED SIGNATORY</div>
          </div>

          {/* Seal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid ' + cfg.color + '88', background: 'radial-gradient(circle, ' + cfg.color + '15, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px ' + cfg.color + '33' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid ' + cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16 }}>✦</div>
              </div>
            </div>
            <div style={{ fontSize: 8, color: cfg.color + 'aa', letterSpacing: 2, fontFamily: '"Segoe UI", Arial, sans-serif' }}>VERIFIED</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontStyle: 'italic', color: cfg.dark, fontFamily: 'Georgia, serif', marginBottom: 4, letterSpacing: 1 }}>L&D Team</div>
            <div style={{ width: 150, height: 1, background: '#bbb', marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: '#888', fontFamily: '"Segoe UI", Arial, sans-serif', letterSpacing: 1 }}>NEXTSTEPS PLATFORM</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#ccc', letterSpacing: 3, whiteSpace: 'nowrap', fontFamily: '"Segoe UI", Arial, sans-serif' }}>
        NEXTSTEPS L&D · {cfg.label.toUpperCase()} TIER · {issuedDate}
      </div>
    </div>
  )
})

CertificateTemplate.displayName = 'CertificateTemplate'
export default CertificateTemplate
