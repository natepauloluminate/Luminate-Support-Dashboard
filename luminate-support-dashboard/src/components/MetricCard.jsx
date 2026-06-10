import { useState } from 'react';

function DeltaBadge({ value, invert }) {
  const isGood = invert ? value < 0 : value > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: isGood ? '#34D399' : '#F87171', letterSpacing: '0.01em' }}>
      {value > 0 ? '↑' : '↓'}{Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function MetricCard({ label, value, delta, invertDelta, description, accent, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: '#111B2A',
        border: `1px solid ${hovered ? '#2A3F58' : '#1B2C40'}`,
        borderTop: `2px solid ${accent}`,
        borderRadius: '8px',
        padding: '16px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '110px',
        transition: 'border-color 150ms ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label */}
      <div style={{
        fontSize: '10.5px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#445566',
        marginBottom: 10,
      }}>
        {label}
      </div>

      {/* Value + delta row */}
      {value !== null && value !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 28,
            fontWeight: 500,
            color: '#F0F4F8',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {delta !== undefined && <DeltaBadge value={delta} invert={invertDelta} />}
        </div>
      )}

      {/* Children (badges, lists, etc.) */}
      {children}

      {/* Description */}
      <div style={{
        fontSize: '11.5px',
        color: '#445566',
        lineHeight: 1.5,
        marginTop: 'auto',
        paddingTop: 6,
      }}>
        {description}
      </div>
    </div>
  );
}
