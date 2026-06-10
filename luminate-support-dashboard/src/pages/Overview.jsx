import { useState } from 'react';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { metrics } from '../data/mockData.js';
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
  const [period,    setPeriod]   = useState('Today');
  const [category,  setCategory] = useState('All Categories');
  const [exporting, setExporting] = useState(false);

  async function handlePDF() {
    setExporting(true);
    await exportPDF('dashboard-root');
    setExporting(false);
  }

  return (
    <div id="dashboard-root">
      <Header />
      <FilterBar
        period={period}      setPeriod={setPeriod}
        category={category}  setCategory={setCategory}
        onExportCSV={exportCSV}
        onExportPDF={handlePDF}
        exporting={exporting}
      />

      <main style={{
        padding: '14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: '10px',
      }}>

        {/* Row 1 — live activity (purple) */}
        <MetricCard
          label="Tickets Opened Today"
          value={metrics.ticketsOpenedToday.value}
          delta={metrics.ticketsOpenedToday.delta}
          invertDelta={true}
          accent={C.accentPurple}
          description="Tickets opened during the selected period"
        />
        <MetricCard
          label="Tickets Closed Today"
          value={metrics.ticketsClosedToday.value}
          delta={metrics.ticketsClosedToday.delta}
          invertDelta={false}
          accent={C.accentPurple}
          description="Tickets closed during the selected period"
        />
        <MetricCard
          label="Tickets Per Hour"
          value={metrics.ticketsPerHour.value}
          delta={metrics.ticketsPerHour.delta}
          invertDelta={true}
          accent={C.accentPurple}
          description="The average number of tickets created per hour"
        />
        <MetricCard
          label="Tickets Per Day"
          value={metrics.ticketsPerDay.value}
          delta={metrics.ticketsPerDay.delta}
          invertDelta={true}
          accent={C.accentPurple}
          description="The average number of tickets created per day"
        />

        {/* Row 2 — performance metrics (cyan) */}
        <MetricCard
          label="Response Time"
          value={metrics.responseTime.value}
          accent={C.accentCyan}
          description="The response time for tickets created during the selected period"
        />
        <MetricCard
          label="Resolution Time"
          value={metrics.resolutionTime.value}
          accent={C.accentCyan}
          description="The resolution time for tickets closed during the selected period"
        />
        <MetricCard
          label="Total Tickets"
          value={metrics.totalTickets.value}
          accent={C.accentCyan}
          description="Total number of tickets"
        />
        <MetricCard
          label="Total New"
          value={metrics.totalNew.value}
          accent={C.accentCyan}
          description="Total number of new tickets"
        />

        {/* Row 3 — floor coverage (neutral) */}
        <MetricCard
          label="Total Closed"
          value={metrics.totalClosed.value}
          accent={C.accentNeutral}
          description="Total number of closed tickets"
        />
        <MetricCard
          label="Total In-Progress"
          value={metrics.totalInProgress.value}
          accent={C.accentNeutral}
          description={`Total number of "in progress" tickets`}
        />
        <MetricCard
          label="Techs Online"
          value={null}
          accent={C.accentNeutral}
          description="Technicians active during the last 10 minutes"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '2px 0 4px' }}>
            {metrics.techsOnline.length
              ? metrics.techsOnline.map(t => <TechBadge key={t} text={t} />)
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
            {metrics.techsOOO.length
              ? metrics.techsOOO.map(t => <TechBadge key={t} text={t} />)
              : <TechBadge text="none" muted />}
          </div>
        </MetricCard>

      </main>
    </div>
  );
}
