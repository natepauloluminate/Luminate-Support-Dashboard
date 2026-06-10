import { useState } from 'react';

export default function FilterBar({
  period, setPeriod,
  category, setCategory,
  onExportCSV, onExportPDF, exporting,
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
          <option>Yesterday</option>
          <option>Today</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Quarter</option>
          <option>This Year</option>
        </select>
        <span style={caretStyle}>▾</span>
      </div>

      {/* Category select */}
      <div style={{ position: 'relative' }}>
        <select style={selectStyle} value={category} onChange={e => setCategory(e.target.value)}>
          <option>All Categories</option>
          <option>IT Support</option>
          <option>HR</option>
          <option>Finance</option>
          <option>Operations</option>
        </select>
        <span style={caretStyle}>▾</span>
      </div>

      {/* Right group */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Demo mode indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#445566', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#445566', letterSpacing: '0.02em' }}>Demo mode</span>
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
