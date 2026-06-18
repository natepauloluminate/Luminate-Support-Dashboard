export default function ChartCard({ title, subtitle, children, loading }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderTop: '2px solid var(--purple)',
      borderRadius: '8px',
      padding: '18px 20px 16px',
    }}>
      <div style={{
        fontSize: '10.5px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
      }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 16px' }}>
        {subtitle}
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--purple)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : children}
    </div>
  );
}
