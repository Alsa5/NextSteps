export default function ChartEmptyState({ message = 'No session data yet — complete a session to see trends.' }) {
  return (
    <div
      className="chart-empty-state"
      style={{
        height: '100%',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--base-text-secondary)',
      }}
    >
      {message}
    </div>
  )
}
