export default function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#111B2A',
      border: '1px solid #1B2C40',
      borderTop: '2px solid #7C3AED',
      borderRadius: '8px',
      padding: '18px 20px 16px',
    }}>
      <div style={{
        fontSize: '10.5px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#445566',
      }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#445566', margin: '3px 0 16px' }}>
        {subtitle}
      </div>
      {children}
    </div>
  );
}
