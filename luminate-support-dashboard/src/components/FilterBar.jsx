import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PERIOD_OPTIONS = [
  { value: 'today',       label: 'Today' },
  { value: 'yesterday',   label: 'Yesterday' },
  { value: 'last7days',   label: 'Last 7 Days' },
  { value: 'last30days',  label: 'Last 30 Days' },
  { value: 'thisquarter', label: 'This Quarter' },
  { value: 'thisyear',    label: 'This Year' },
];

const SECTION_OPTIONS = [
  { value: '',       label: 'All Sections' },
  { value: '163173', label: 'Information Technology' },
  { value: '168963', label: 'Human Resources' },
  { value: '167008', label: 'Accounting / Finance' },
  { value: '167041', label: 'Branch & Loan Operations' },
  { value: '167039', label: 'Bank Operations' },
  { value: '167044', label: 'Other' },
];

export default function FilterBar({
  period, setPeriod,
  section, setSection,
  showPct, onTogglePct,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [overviewHover,  setOverviewHover]  = useState(false);
  const [analyticsHover, setAnalyticsHover] = useState(false);
  const [slaHover,       setSlaHover]       = useState(false);

  const isOverview  = location.pathname === '/';
  const isAnalytics = location.pathname === '/analytics';
  const isSLA       = location.pathname === '/sla';
  const showFilters = !isSLA;

  const activeTab = {
    background: 'var(--purple)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 18px',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  const inactiveTab = (hovered) => ({
    background: 'transparent',
    color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 18px',
    fontSize: '13px',
    fontWeight: 400,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'color 150ms ease',
  });

  const selectStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    padding: '6px 30px 6px 11px',
    fontSize: '13px',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '130px',
  };

  const caretStyle = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    fontSize: 10,
  };

  return (
    <div style={{
      height: '50px',
      background: 'var(--bg-filter)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>

      {/* Period select */}
      {showFilters && (
        <div style={{ position: 'relative' }}>
          <select style={selectStyle} value={period} onChange={e => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={caretStyle}>▾</span>
        </div>
      )}

      {/* Section select */}
      {showFilters && (
        <div style={{ position: 'relative' }}>
          <select style={selectStyle} value={section} onChange={e => setSection(e.target.value)}>
            {SECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={caretStyle}>▾</span>
        </div>
      )}

      {/* Percentage toggle */}
      {isOverview && (
        <button
          id="pct-toggle-anchor"
          onClick={onTogglePct}
          style={{
            background: showPct ? 'var(--purple)' : 'transparent',
            border: `1px solid ${showPct ? 'var(--purple)' : 'var(--border)'}`,
            borderRadius: '5px',
            color: showPct ? '#ffffff' : 'var(--text-muted)',
            padding: '5px 10px',
            fontSize: '12px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
            letterSpacing: '0.02em',
          }}
        >
          %
        </button>
      )}

      {/* Page nav tabs — far right */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        <button
          style={isOverview ? activeTab : inactiveTab(overviewHover)}
          onClick={() => navigate('/')}
          onMouseEnter={() => setOverviewHover(true)}
          onMouseLeave={() => setOverviewHover(false)}
        >
          Overview
        </button>
        <button
          style={isAnalytics ? activeTab : inactiveTab(analyticsHover)}
          onClick={() => navigate('/analytics')}
          onMouseEnter={() => setAnalyticsHover(true)}
          onMouseLeave={() => setAnalyticsHover(false)}
        >
          Analytics
        </button>
        <button
          style={isSLA ? activeTab : inactiveTab(slaHover)}
          onClick={() => navigate('/sla')}
          onMouseEnter={() => setSlaHover(true)}
          onMouseLeave={() => setSlaHover(false)}
        >
          SLA
        </button>
      </div>

    </div>
  );
}
