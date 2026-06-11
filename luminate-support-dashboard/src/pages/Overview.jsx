import { useState } from 'react';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { useLiveStats } from '../hooks/useLiveStats.js';
import { C } from '../tokens.js';
import { exportCSV, exportPDF } from '../utils/export.js';

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

  const { data, loading, error, lastSync } = useLiveStats(period, section);

  async function handlePDF() {
    setExporting(true);
    await exportPDF('dashboard-root');
    setExporting(false);
  }

  // Returns live value or '—' while loading
  const v = (key) => loading ? '—' : (data?.[key] ?? '—');

  // null delta → undefined so MetricCard skips the badge
  const d = (key) => data?.deltas?.[key] ?? undefined;

  const techsOnline = data?.techsOnline ?? [];
  const techsOOO    = data?.techsOOO    ?? [];

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
            {techsOnline.length
              ? techsOnline.map(t => <TechBadge key={t} text={t} />)
              : <TechBadge text="none" muted />}
          </div>
        </MetricCard>
        <MetricCard
          label={`Techs "Out of Office"`}
          value={null}
          accent={C.accentNeutral}
          description={`Technicians who marked themselves as "out of office"`}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '2px 0 4px' }}>
            {techsOOO.length
              ? techsOOO.map(t => <TechBadge key={t} text={t} />)
              : <TechBadge text="none" muted />}
          </div>
        </MetricCard>

      </main>
    </div>
  );
}
