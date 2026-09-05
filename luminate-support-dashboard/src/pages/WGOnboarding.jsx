import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { C } from '../tokens.js';
import { exportCSV, exportPDF } from '../utils/export.js';

const BASE_URL = import.meta.env.VITE_PROXY_URL || '';

const PERIOD_LABEL = {
  today:       'Today',
  yesterday:   'Yesterday',
  last7days:   'Last 7 Days',
  last30days:  'Last 30 Days',
  thisquarter: 'This Quarter',
  thisyear:    'This Year',
};

async function fetchWGStats(period) {
  const params = new URLSearchParams({ period });
  const res = await fetch(`${BASE_URL}/api/jitbit/wg-onboarding?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Copied from Overview.jsx's SLACard (module-private there, not exported) —
// same red/amber/green threshold logic, plus an optional footnote line for
// showing the responseSLA.excluded count.
function SLACard({ label, target, pct, met, total, loading = false, footnote }) {
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
          <div style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
            {pct !== null ? `${pct}%` : '—'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 6 }}>
            {pct !== null ? `${met.toLocaleString()} / ${total.toLocaleString()} met` : 'No data'}
            {footnote && <><br />{footnote}</>}
          </div>
        </>
      )}
    </div>
  );
}

export default function WGOnboarding() {
  const [period,    setPeriod]    = useState('today');
  const [exporting, setExporting] = useState(false);

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchWGStats(period)
      .then(json => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
        setLastSync(new Date());
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setLoading(false);
        setError(err.message);
      });

    // Only "today" auto-refreshes — the program is ongoing and tickets keep
    // arriving — matching the 30 s / document.hidden pattern used elsewhere.
    let intervalId;
    if (period === 'today') {
      intervalId = setInterval(() => {
        if (document.hidden) return;
        fetchWGStats(period)
          .then(json => {
            if (cancelled) return;
            setData(json);
            setLastSync(new Date());
            setError(null);
          })
          .catch(() => { /* silent, matches Overview's refresh-today behavior */ });
      }, 30000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [period]);

  async function handlePDF() {
    setExporting(true);
    await exportPDF('wg-onboarding-root');
    setExporting(false);
  }

  const pl = PERIOD_LABEL[period] ?? period;
  const cardLoading = loading && data === null;

  const responseSLA   = data?.responseSLA   ?? null;
  const resolutionSLA = data?.resolutionSLA ?? null;

  const excludedFootnote = responseSLA
    ? `${responseSLA.excluded.toLocaleString()} excluded — no first response recorded`
    : undefined;

  return (
    <div id="wg-onboarding-root">
      <Header
        lastSync={lastSync}
        error={error}
        loading={loading}
        onExportCSV={exportCSV}
        onExportPDF={handlePDF}
        exporting={exporting}
      />
      <FilterBar
        period={period} setPeriod={setPeriod}
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
          value={data && !loading ? (data.openedCount ?? '—') : '—'}
          accent={C.accentPurple}
          description={`WG Onboarding tickets opened during ${pl}`}
          loading={cardLoading}
        />
        <MetricCard
          label={`Tickets Closed — ${pl}`}
          value={data && !loading ? (data.closedCount ?? '—') : '—'}
          accent={C.accentPurple}
          description={`WG Onboarding tickets closed during ${pl}`}
          loading={cardLoading}
        />
        <SLACard
          label="Response SLA"
          target={responseSLA?.target ?? '02:00'}
          pct={responseSLA?.pct ?? null}
          met={responseSLA?.met ?? 0}
          total={responseSLA?.total ?? 0}
          loading={cardLoading}
          footnote={!cardLoading ? excludedFootnote : undefined}
        />
        <SLACard
          label="Resolution SLA"
          target={resolutionSLA?.target ?? '24:00'}
          pct={resolutionSLA?.pct ?? null}
          met={resolutionSLA?.met ?? 0}
          total={resolutionSLA?.total ?? 0}
          loading={cardLoading}
        />

      </main>
    </div>
  );
}
