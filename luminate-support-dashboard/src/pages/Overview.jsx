import { useState } from 'react';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { useStatsCache } from '../hooks/useStatsCache.js';
import { C } from '../tokens.js';
import { exportCSV, exportPDF } from '../utils/export.js';

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0B1220',
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
        background: 'linear-gradient(90deg, transparent 0%, #7C3AED 35%, #06B6D4 65%, transparent 100%)',
      }} />

      {/* Brand lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#7C3AED', flexShrink: 0, display: 'inline-block',
        }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: '#F0F4F8', letterSpacing: '-0.01em' }}>
          Luminate Support Center
        </span>
      </div>

      {/* Spinner */}
      <div style={{
        width: 36, height: 36,
        border: '2px solid #1B2C40',
        borderTopColor: '#7C3AED',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        marginBottom: 22,
      }} />

      <div style={{ fontSize: 13, color: '#8899AA', letterSpacing: '0.01em' }}>
        Loading real-time helpdesk data
      </div>
      <div style={{ fontSize: 11, color: '#445566', marginTop: 8, letterSpacing: '0.02em' }}>
        Connecting to JitBit API
      </div>
    </div>
  );
}

function TechBadge({ text, muted }) {
  return (
    <span style={{
      background: muted ? 'transparent' : '#162030',
      border: '1px solid #1B2C40',
      borderRadius: '4px',
      padding: '3px 9px',
      fontSize: '12px',
      color: muted ? '#445566' : '#8899AA',
      fontFamily: 'inherit',
    }}>
      {text}
    </span>
  );
}

export default function Overview() {
  const [period,    setPeriod]   = useState('today');
  const [section,   setSection]  = useState('');
  const [exporting, setExporting] = useState(false);

  const { getStats, loading, error, lastSync } = useStatsCache(section);

  // Switching period is a synchronous cache lookup — no network call, no flicker
  const data = getStats(period);

  async function handlePDF() {
    setExporting(true);
    await exportPDF('dashboard-root');
    setExporting(false);
  }

  // Show full-screen loader on first visit only (no cached today data yet)
  if (loading && !data) return <LoadingScreen />;

  const v = (key) => data ? (data[key] ?? '—') : '—';
  const d = (key) => data?.deltas?.[key] ?? undefined;

  const techsOnline    = data?.techsOnline    ?? [];
  const techsOOO      = data?.techsOOO      ?? [];
  const techsAccessible = data?.techsAccessible ?? null;

  return (
    <div id="dashboard-root">
      <Header />
      <FilterBar
        period={period}    setPeriod={setPeriod}
        section={section}  setSection={setSection}
        onExportCSV={exportCSV}
        onExportPDF={handlePDF}
        exporting={exporting}
        lastSync={lastSync}
        error={error}
        loading={loading}
      />

      {error && (
        <div style={{
          margin: '10px 14px 0',
          padding: '10px 14px',
          background: '#1A0A0A',
          border: '1px solid #F87171',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#F87171',
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

        {/* Row 1 — live activity (purple) */}
        <MetricCard
          label="Tickets Opened Today"
          value={v('openedCount')}
          delta={d('opened')}
          invertDelta={true}
          accent={C.accentPurple}
          description="Tickets opened during the selected period"
        />
        <MetricCard
          label="Tickets Closed Today"
          value={v('closedCount')}
          delta={d('closed')}
          invertDelta={false}
          accent={C.accentPurple}
          description="Tickets closed during the selected period"
        />
        <MetricCard
          label="Tickets Per Hour"
          value={v('ticketsPerHour')}
          delta={d('perHour')}
          invertDelta={true}
          accent={C.accentPurple}
          description="Average tickets created per hour in the selected period"
        />
        <MetricCard
          label="Tickets Per Day"
          value={v('ticketsPerDay')}
          delta={d('perDay')}
          invertDelta={true}
          accent={C.accentPurple}
          description="Average tickets created per day in the selected period"
        />

        {/* Row 2 — performance metrics (cyan) */}
        <MetricCard
          label="Response Time"
          value={v('responseTime')}
          accent={C.accentCyan}
          description="Avg time to first response for tickets in the selected period"
        />
        <MetricCard
          label="Resolution Time"
          value={v('resolutionTime')}
          accent={C.accentCyan}
          description="Avg time to resolution for tickets closed in the selected period"
        />
        <MetricCard
          label="Total Tickets"
          value={v('totalTickets')}
          accent={C.accentCyan}
          description="All-time total tickets in the system"
        />
        <MetricCard
          label="Total New"
          value={v('newTickets')}
          accent={C.accentCyan}
          description="Tickets currently in New status"
        />

        {/* Row 3 — floor coverage (neutral) */}
        <MetricCard
          label="Total Closed"
          value={v('closed')}
          accent={C.accentNeutral}
          description="All-time total closed tickets"
        />
        <MetricCard
          label="Total In-Progress"
          value={v('inProcess')}
          accent={C.accentNeutral}
          description={`Total tickets currently "in progress"`}
        />
        <MetricCard
          label="Techs Online"
          value={null}
          accent={C.accentNeutral}
          description="Technicians active in the last 10 minutes"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '2px 0 4px' }}>
            {techsAccessible === false
              ? <TechBadge text="needs admin access" muted />
              : techsOnline.length
              ? techsOnline.map(t => <TechBadge key={t} text={t} />)
              : techsAccessible === true
              ? <TechBadge text="none" muted />
              : <TechBadge text="—" muted />}
          </div>
        </MetricCard>
        <MetricCard
          label={`Techs "Out of Office"`}
          value={null}
          accent={C.accentNeutral}
          description={`Technicians who marked themselves as "out of office"`}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '2px 0 4px' }}>
            {techsAccessible === false
              ? <TechBadge text="needs admin access" muted />
              : techsOOO.length
              ? techsOOO.map(t => <TechBadge key={t} text={t} />)
              : techsAccessible === true
              ? <TechBadge text="none" muted />
              : <TechBadge text="—" muted />}
          </div>
        </MetricCard>

      </main>
    </div>
  );
}
