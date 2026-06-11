import { useState } from 'react';

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
  onExportCSV, onExportPDF, exporting,
  lastSync, error, loading,
}) {
  const [csvHover, setCsvHover] = useState(false);
  const [pdfHover, setPdfHover] = useState(false);

  const selectStyle = {
    background: '#111B2A',
    border: '1px solid #1B2C40',
    borderRadius: '6px',
    color: '#B0BEC5',
    padding: '6px 30px 6px 11px',
    fontSize: '13px',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '130px',
  };

  const exportBtn = (hovered) => ({
    background: 'transparent',
    border: `1px solid ${hovered ? '#2A3F58' : '#1B2C40'}`,
    borderRadius: '5px',
    color: hovered ? '#F0F4F8' : '#8899AA',
    padding: '5px 12px',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, color 150ms ease',
  });

  const caretStyle = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#445566',
    pointerEvents: 'none',
    fontSize: 10,
  };

  const dotColor    = error ? '#F87171' : lastSync ? '#34D399' : '#445566';
  const statusLabel = error
    ? 'Error — retrying'
    : loading
    ? 'Loading…'
    : lastSync
    ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Connecting…';

  return (
    <div style={{
      height: '50px',
      background: '#0D1825',
      borderBottom: '1px solid #1B2C40',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Period select */}
      <div style={{ position: 'relative' }}>
        <select style={selectStyle} value={period} onChange={e => setPeriod(e.target.value)}>
          {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={caretStyle}>▾</span>
      </div>

      {/* Section select */}
      <div style={{ position: 'relative' }}>
        <select style={selectStyle} value={section} onChange={e => setSection(e.target.value)}>
          {SECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={caretStyle}>▾</span>
      </div>

      {/* Right group */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Live sync indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: dotColor, display: 'inline-block',
          }} />
          <span style={{
            fontSize: 11,
            color: lastSync && !error ? '#8899AA' : '#445566',
            letterSpacing: '0.02em',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={exportBtn(csvHover)}
            onClick={onExportCSV}
            onMouseEnter={() => setCsvHover(true)}
            onMouseLeave={() => setCsvHover(false)}
          >
            ↓ CSV
          </button>
          <button
            style={exportBtn(pdfHover)}
            onClick={onExportPDF}
            onMouseEnter={() => setPdfHover(true)}
            onMouseLeave={() => setPdfHover(false)}
            disabled={exporting}
          >
            {exporting ? 'Generating…' : '↓ PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
