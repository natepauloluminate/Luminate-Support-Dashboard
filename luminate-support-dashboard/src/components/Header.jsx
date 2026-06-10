import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [overviewHover, setOverviewHover] = useState(false);
  const [analyticsHover, setAnalyticsHover] = useState(false);

  const isOverview  = location.pathname === '/';
  const isAnalytics = location.pathname === '/analytics';

  const activeTab = {
    background: '#7C3AED',
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
    color: hovered ? '#F0F4F8' : '#8899AA',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 18px',
    fontSize: '13px',
    fontWeight: 400,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'color 150ms ease',
  });

  return (
    <div>
      {/* Main bar */}
      <div style={{
        height: '56px',
        background: '#070D17',
        borderBottom: '1px solid #1B2C40',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#7C3AED',
            flexShrink: 0,
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#F0F4F8',
            letterSpacing: '-0.01em',
          }}>
            Luminate Support Center
          </span>
        </div>

        {/* Tab nav */}
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
        </div>
      </div>

      {/* Signature gradient rule */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #7C3AED 35%, #06B6D4 65%, transparent 100%)',
      }} />
    </div>
  );
}
