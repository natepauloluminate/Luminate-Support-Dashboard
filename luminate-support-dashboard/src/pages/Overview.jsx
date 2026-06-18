import { useState } from 'react';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { useStatsCache } from '../hooks/useStatsCache.js';
import { C } from '../tokens.js';
import { exportCSV, exportPDF } from '../utils/export.js';

const ALL_TIME_COLORS = ['#7C3AED', '#06B6D4', '#FBBF24', '#F87171'];

const SECTION_LABELS = {
  '163173': 'Information Technology',
  '168963': 'Human Resources',
  '167008': 'Accounting / Finance',
  '167041': 'Branch & Loan Operations',
  '167039': 'Bank Operations',
  '167044': 'Other',
};

function TotalCard({ label, value, color, total, suffix }) {
  const [hovered, setHovered] = useState(false);
  const pct = total > 0 && value !== total ? Math.round((value / total) * 1000) / 10 : null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderLeft: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderTop: `2px solid ${color}`,
        borderRadius: '8px',
        padding: '14px 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 150ms ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontSize: '10px', fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 500, color: 'var(--text-primary)',
        lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8,
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 4 }}>
        {pct !== null ? `${pct}% of total` : suffix ?? 'all sections, all time'}
      </div>
    </div>
  );
}

function AllTimeTotalsChart({ total, closed, inProcess, section, loading }) {
  const [expanded, setExpanded] = useState(false);

  const openCount = Math.max(0, total - closed - inProcess);
  const closedPct = total > 0 ? Math.round((closed / total) * 1000) / 10 : 0;

  const subtitle = section
    ? `${SECTION_LABELS[section] ?? 'Selected section'} — this year's counts`
    : 'System-wide ticket counts — all sections, all time';

  const cards = [
    { label: 'Total Tickets', value: total,     color: ALL_TIME_COLORS[0], suffix: subtitle },
    { label: 'Closed',        value: closed,    color: ALL_TIME_COLORS[1] },
    { label: 'In Progress',   value: inProcess, color: ALL_TIME_COLORS[2] },
    { label: 'Open / New',    value: openCount, color: ALL_TIME_COLORS[3] },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderTop: '2px solid var(--purple)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Clickable header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: '10.5px', fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
          }}>
            All-Time Ticket Totals
          </span>
          {loading
            ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
            : total > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {total.toLocaleString()} total &middot; {closedPct}% resolved
                </span>
              )
          }
        </div>
        <span style={{
          color: 'var(--text-muted)', fontSize: 11,
          transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 150ms ease',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, height: 120,
            }}>
              <div style={{
                width: 18, height: 18,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--purple)',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading section data…</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
              paddingTop: 14,
            }}>
              {cards.map(card => (
                <TotalCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  color={card.color}
                  total={total}
                  suffix={card.suffix}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      {/* Signature gradient — matches the header rule */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, var(--purple) 35%, var(--cyan) 65%, transparent 100%)',
      }} />

      {/* Brand lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
        <img
          src="/luminate-logo.webp"
          alt="Luminate"
          style={{ width: 24, height: 24, flexShrink: 0, display: 'block', objectFit: 'contain' }}
        />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Luminate Support Center
        </span>
      </div>

      {/* Spinner */}
      <div style={{
        width: 36, height: 36,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--purple)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        marginBottom: 22,
      }} />

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
        Loading real-time helpdesk data
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.02em' }}>
        Connecting to JitBit API
      </div>
    </div>
  );
}

function SLACard({ label, target, pct, met, total }) {
  const [hovered, setHovered] = useState(false);
  const color = pct === null ? 'var(--text-muted)'
    : pct >= 90 ? 'var(--positive)'
    : pct >= 70 ? 'var(--amber)'
    : 'var(--negative)';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderLeft: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderTop: '2px solid var(--border)',
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
      <div style={{ fontSize: '10.5px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
        {label}&nbsp;<span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-secondary)' }}>({target})</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {pct !== null ? `${pct}%` : '—'}
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 6 }}>
        {pct !== null ? `${met.toLocaleString()} / ${total.toLocaleString()} met` : 'No data'}
      </div>
    </div>
  );
}

export default function Overview() {
  const [period,    setPeriod]   = useState('today');
  const [section,   setSection]  = useState('');
  const [exporting, setExporting] = useState(false);
  const [showPct,   setShowPct]  = useState(false);


  const { getStats, loading, error, lastSync } = useStatsCache(section);

  // Switching period is a synchronous cache lookup — no network call, no flicker
  const data     = getStats(period);
  const yearData = getStats('thisyear');


  // All-Time chart: section filter only — period has no effect
  // yearData is null until thisyear finishes loading (last in the fetch queue)
  const chartLoading    = section !== '' && yearData === null;
  const chartTotal      = section ? (yearData?.openedCount ?? 0) : (data?.totalTickets ?? 0);
  const chartClosed     = section ? (yearData?.closedCount ?? 0) : (data?.closed      ?? 0);
  const chartInProcess  = data?.inProcess ?? 0;

  async function handlePDF() {
    setExporting(true);
    await exportPDF('dashboard-root');
    setExporting(false);
  }

  // Show full-screen loader on first visit only (no cached today data yet)
  if (loading && !data) return <LoadingScreen />;

  const v = (key) => data ? (data[key] ?? '—') : '—';
  const d = (key) => data?.deltas?.[key] ?? undefined;

  const responseSLA   = data?.responseSLA   ?? null;
  const resolutionSLA = data?.resolutionSLA ?? null;

  const PERIOD_LABEL = {
    today:       'Today',
    yesterday:   'Yesterday',
    last7days:   'Last 7 Days',
    last30days:  'Last 30 Days',
    thisquarter: 'This Quarter',
    thisyear:    'This Year',
  };
  const pl = PERIOD_LABEL[period] ?? period;

  return (
    <div id="dashboard-root">
      <Header
        lastSync={lastSync}
        error={error}
        loading={loading}
        onExportCSV={exportCSV}
        onExportPDF={handlePDF}
        exporting={exporting}
      />
      <FilterBar
        period={period}    setPeriod={setPeriod}
        section={section}  setSection={setSection}
        showPct={showPct}  onTogglePct={() => setShowPct(p => !p)}
      />

      {error && (
        <div style={{
          margin: '10px 14px 0',
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid var(--negative)',
          borderRadius: '6px',
          fontSize: '13px',
          color: 'var(--negative)',
        }}>
          Unable to reach the data proxy — {error}. Retrying in 30 s.
        </div>
      )}

      <main style={{
        padding: '14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: '10px',
      }}>

        <MetricCard
          label={`Tickets Opened — ${pl}`}
          value={v('openedCount')}
          delta={d('opened')}
          invertDelta={true}
          accent={C.accentPurple}
          description={`Tickets opened during ${pl}`}
          showPct={showPct}
        />
        <MetricCard
          label={`Tickets Closed — ${pl}`}
          value={v('closedCount')}
          delta={d('closed')}
          invertDelta={false}
          accent={C.accentPurple}
          description={`Tickets closed during ${pl}`}
          showPct={showPct}
        />
        <MetricCard
          label={`Tickets Per Hour — ${pl}`}
          value={v('ticketsPerHour')}
          delta={d('perHour')}
          invertDelta={true}
          accent={C.accentPurple}
          description={`Avg tickets created per hour during ${pl}`}
          showPct={showPct}
        />
        <MetricCard
          label={`Unique Submitters — ${pl}`}
          value={v('uniqueSubmitters')}
          delta={d('uniqueSubmitters')}
          accent={C.accentNeutral}
          description={`Distinct users who submitted tickets during ${pl}`}
          showPct={showPct}
        />
        <MetricCard
          label="Response Time"
          value={v('responseTime')}
          accent={C.accentCyan}
          description={`Avg time to first response for tickets during ${pl}`}
        />
        <MetricCard
          label="Resolution Time"
          value={v('resolutionTime')}
          accent={C.accentCyan}
          description={`Avg time to resolution for tickets closed during ${pl}`}
        />
        <SLACard
          label="Response SLA"
          target={responseSLA?.target ?? '04:00'}
          pct={responseSLA?.pct ?? null}
          met={responseSLA?.met ?? 0}
          total={responseSLA?.total ?? 0}
        />
        <SLACard
          label="Resolution SLA"
          target={resolutionSLA?.target ?? '72:00'}
          pct={resolutionSLA?.pct ?? null}
          met={resolutionSLA?.met ?? 0}
          total={resolutionSLA?.total ?? 0}
        />

      </main>

      <section style={{ padding: '0 14px 14px' }}>
        <AllTimeTotalsChart
          total={chartTotal}
          closed={chartClosed}
          inProcess={chartInProcess}
          section={section}
          loading={chartLoading}
        />
      </section>
    </div>
  );
}
