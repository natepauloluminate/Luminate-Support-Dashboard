import { useState } from 'react';

function DeltaBadge({ value, invert }) {
  const isGood = invert ? value < 0 : value > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: isGood ? 'var(--positive)' : 'var(--negative)', letterSpacing: '0.01em' }}>
      {value > 0 ? '↑' : '↓'}{Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function MetricCard({ label, value, delta, invertDelta, description, accent, children, showPct = false, loading = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderLeft: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
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
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        {label}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', height: 34, marginBottom: 8 }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--purple)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : (
        <>
          {/* Value + delta row */}
          {value !== null && value !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 28,
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {delta !== undefined && showPct && <DeltaBadge value={delta} invert={invertDelta} />}
            </div>
          )}

          {/* Children (badges, lists, etc.) */}
          {children}
        </>
      )}

      {/* Description — always visible so the card height stays stable */}
      <div style={{
        fontSize: '11.5px',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
        marginTop: 'auto',
        paddingTop: 6,
      }}>
        {description}
      </div>
    </div>
  );
}
