import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';

const SLA_ROWS = [
  {
    priority: 'P1',
    label: 'Critical',
    color: 'var(--negative)',
    colorRaw: '#F87171',
    impact: 'Complete service outage or widespread issue with no reasonable workaround. Business operations are blocked.',
    firstResponse: '1 business hour',
    expectedResolution: '4 business hours',
    escalation: ['Support Center', 'Team Lead', 'Incident Lead'],
  },
  {
    priority: 'P2',
    label: 'High',
    color: 'var(--amber)',
    colorRaw: '#FBBF24',
    impact: 'Major function impaired affecting multiple users. A workaround may exist, but productivity is significantly impacted.',
    firstResponse: '2 business hours',
    expectedResolution: '8 business hours',
    escalation: ['Support Center', 'Team Lead', 'Senior Support'],
  },
  {
    priority: 'P3',
    label: 'Medium',
    color: 'var(--cyan)',
    colorRaw: '#06B6D4',
    impact: 'Limited impact to a single user or small group. Core business operations continue.',
    firstResponse: '4 business hours',
    expectedResolution: '3 business days',
    escalation: ['Support Center', 'Team Lead (as needed)'],
  },
  {
    priority: 'P4',
    label: 'Low',
    color: 'var(--positive)',
    colorRaw: '#34D399',
    impact: 'General request, how to question, or cosmetic issue with minimal business impact.',
    firstResponse: '1 business day',
    expectedResolution: '5 business days',
    escalation: ['Support Center'],
  },
];

const COL_HEADERS = ['Priority', 'Example Impact', 'First Response', 'Expected Resolution', 'Escalation Path'];

export default function SLA() {
  return (
    <div>
      <Header lastSync={null} error={null} loading={false} />
      <FilterBar />

      <main style={{ padding: '20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 150px 175px 230px',
            background: 'var(--bg-header)',
            borderBottom: '2px solid var(--border)',
          }}>
            {COL_HEADERS.map(h => (
              <div key={h} style={{
                padding: '12px 16px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {SLA_ROWS.map((row, i) => (
            <div
              key={row.priority}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 150px 175px 230px',
                borderBottom: i < SLA_ROWS.length - 1 ? '1px solid var(--border)' : 'none',
                borderLeft: `3px solid ${row.colorRaw}`,
              }}
            >
              {/* Priority */}
              <div style={{
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: row.color,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {row.priority}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: row.color,
                  opacity: 0.85,
                }}>
                  {row.label}
                </span>
              </div>

              {/* Impact */}
              <div style={{
                padding: '18px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                display: 'flex',
                alignItems: 'center',
              }}>
                {row.impact}
              </div>

              {/* First Response */}
              <div style={{
                padding: '18px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {row.firstResponse}
              </div>

              {/* Expected Resolution */}
              <div style={{
                padding: '18px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {row.expectedResolution}
              </div>

              {/* Escalation Path */}
              <div style={{
                padding: '18px 16px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {row.escalation.map((step, j) => (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {j > 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1 }}>↓</span>
                      )}
                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        lineHeight: 1,
                      }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          marginTop: 14,
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}>
          Response and resolution targets are measured in business hours (8 AM–5 PM), excluding holidays.
        </p>
      </main>
    </div>
  );
}
