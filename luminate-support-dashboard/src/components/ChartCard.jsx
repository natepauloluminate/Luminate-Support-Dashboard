export default function ChartCard({ title, subtitle, children }) {
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
      {children}
    </div>
  );
}
