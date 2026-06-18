import { useState, useEffect } from 'react';

export default function Header({
  lastSync, error, loading,
  onExportCSV, onExportPDF, exporting,
}) {
  const [csvHover,   setCsvHover]   = useState(false);
  const [pdfHover,   setPdfHover]   = useState(false);
  const [themeHover, setThemeHover] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') ?? 'dark'
  );

  // Ensure data-theme attribute is always set; default to dark on fresh page load
  useEffect(() => {
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  }

  const exportBtn = (hovered) => ({
    background: 'transparent',
    border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
    borderRadius: '5px',
    color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
    padding: '5px 12px',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, color 150ms ease',
  });

  const dotColor    = error ? 'var(--negative)' : lastSync ? 'var(--positive)' : 'var(--text-muted)';
  const statusLabel = error
    ? 'Error — retrying'
    : loading
    ? 'Loading…'
    : lastSync
    ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Connecting…';

  return (
    <div>
      {/* Main bar */}
      <div style={{
        height: '56px',
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/luminate-logo.webp"
            alt="Luminate"
            style={{ width: 30, height: 30, flexShrink: 0, display: 'block', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Luminate Support Center
          </span>
        </div>

        {/* Right group: sync indicator + export buttons + theme toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Live sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: dotColor, display: 'inline-block',
            }} />
            <span style={{
              fontSize: 11,
              color: lastSync && !error ? 'var(--text-secondary)' : 'var(--text-muted)',
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

          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            onMouseEnter={() => setThemeHover(true)}
            onMouseLeave={() => setThemeHover(false)}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'transparent',
              border: `1px solid ${themeHover ? 'var(--border-hover)' : 'var(--border)'}`,
              borderRadius: '5px',
              color: themeHover ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '5px 8px',
              fontSize: '14px',
              lineHeight: 1,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

        </div>
      </div>

      {/* Signature gradient rule */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, var(--purple) 35%, var(--cyan) 65%, transparent 100%)',
      }} />
    </div>
  );
}
