import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid,
  XAxis, YAxis,
  Tooltip,
} from 'recharts';
import Header from '../components/Header.jsx';
import FilterBar from '../components/FilterBar.jsx';
import ChartCard from '../components/ChartCard.jsx';
import { useStatsCache, fetchStat } from '../hooks/useStatsCache.js';
import { exportCSV, exportPDF } from '../utils/export.js';

const DEPT_COLORS = [
  '#7C3AED', // violet  — primary brand
  '#06B6D4', // cyan    — secondary brand
  '#34D399', // emerald — positive
  '#FBBF24', // amber   — warning
  '#818CF8', // indigo  — soft complement to violet
  '#F87171', // coral   — negative
];

const SECTION_META = [
  { id: '163173', name: 'IT' },
  { id: '168963', name: 'HR' },
  { id: '167008', name: 'Accounting' },
  { id: '167041', name: 'Branch & Loan' },
  { id: '167039', name: 'Bank Ops' },
  { id: '167044', name: 'Other' },
];

const tooltipStyle = {
  contentStyle: {
    background: '#0B1220',
    border: '1px solid #7C3AED',
    borderRadius: '6px',
    fontSize: 12,
    color: '#F0F4F8',
    fontFamily: 'Inter, sans-serif',
  },
  labelStyle:  { color: '#8899AA', marginBottom: 4 },
  itemStyle:   { color: '#F0F4F8' },
  cursor:      { fill: 'rgba(124,58,237,0.06)' },
};

const axisTick = { fill: '#445566', fontSize: 11, fontFamily: 'Inter, sans-serif' };

function TrendArea({ trendData }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12, color: '#8899AA' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#7C3AED', borderRadius: 2, display: 'inline-block' }} />
          Opened
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#06B6D4', borderRadius: 2, display: 'inline-block' }} />
          Closed
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gOpened" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" vertical={false} />
          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="opened" name="Opened"
            stroke="#7C3AED" strokeWidth={2} fill="url(#gOpened)" dot={false}
            activeDot={{ r: 4, fill: '#7C3AED' }}
          />
          <Area type="monotone" dataKey="closed" name="Closed"
            stroke="#06B6D4" strokeWidth={2} fill="url(#gClosed)" dot={false}
            activeDot={{ r: 4, fill: '#06B6D4' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function StatusDonut({ statusData }) {
  const total = statusData.reduce((s, d) => s + d.value, 0).toLocaleString();
  return (
    <>
      <div style={{ position: 'relative', height: 190 }}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={statusData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={58} outerRadius={82}
              paddingAngle={2} strokeWidth={0}
            >
              {statusData.map(entry => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={v => v.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#F0F4F8', fontVariantNumeric: 'tabular-nums' }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: '#445566', marginTop: 2 }}>Total</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {statusData.map(s => (
          <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8899AA' }}>
            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }} />
            {s.name}
            <strong style={{ color: '#F0F4F8', marginLeft: 3, fontWeight: 500 }}>
              {s.value.toLocaleString()}
            </strong>
          </span>
        ))}
      </div>
    </>
  );
}

function TimeBar({ timeData }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12, color: '#8899AA' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#7C3AED', borderRadius: 2, display: 'inline-block' }} />
          Resolution
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#06B6D4', borderRadius: 2, display: 'inline-block' }} />
          Response
        </span>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={timeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={2} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" vertical={false} />
          <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, n) => [`${v}h`, n]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? _}
          />
          <Bar dataKey="resolution" name="Resolution" fill="#7C3AED" radius={[3,3,0,0]} maxBarSize={12} />
          <Bar dataKey="response"   name="Response"   fill="#06B6D4" radius={[3,3,0,0]} maxBarSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

function CategoryBar({ categoryData }) {
  const sorted = [...categoryData].sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 10, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" horizontal={false} />
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category" dataKey="name" width={76}
          tick={{ fill: '#8899AA', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
          axisLine={false} tickLine={false}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" name="Tickets" radius={[0,3,3,0]} maxBarSize={12}>
          {sorted.map((entry, i) => (
            <Cell key={entry.name} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Analytics() {
  const [period,    setPeriod]   = useState('last7days');
  const [section,   setSection]  = useState('');
  const [exporting, setExporting] = useState(false);
  const [categoryData, setCategoryData] = useState([]);

  const { getStats, error, lastSync, loading } = useStatsCache(section);
  const data = getStats(period);

  // Fetch per-section ticket counts to power the CategoryBar
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      SECTION_META.map(s =>
        fetchStat(period, s.id).then(d => ({ name: s.name, count: d.openedCount ?? 0 }))
      )
    ).then(results => {
      if (cancelled) return;
      setCategoryData(results.filter(r => r.status === 'fulfilled').map(r => r.value));
    });
    return () => { cancelled = true; };
  }, [period]);

  async function handlePDF() {
    setExporting(true);
    await exportPDF('analytics-root');
    setExporting(false);
  }

  // Use period + section filtered counts so the donut reflects active filters
  const statusData = [
    { name: 'Opened', value: data?.openedCount ?? 0, color: '#7C3AED' },
    { name: 'Closed', value: data?.closedCount ?? 0, color: '#06B6D4' },
  ];

  const trendData = data?.trendData ?? [];
  const timeData  = data?.timeData  ?? [];

  return (
    <div id="analytics-root">
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

      <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <ChartCard title="Ticket Volume Trend" subtitle="Opened vs. closed — selected period">
          <TrendArea trendData={trendData} />
        </ChartCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
          <ChartCard title="Queue Status" subtitle="Opened vs. closed — selected period &amp; section">
            <StatusDonut statusData={statusData} />
          </ChartCard>
          <ChartCard title="Time Metrics" subtitle="Avg response & resolution by day (hrs)">
            <TimeBar timeData={timeData} />
          </ChartCard>
          <ChartCard title="By Category" subtitle="Tickets opened per department — selected period">
            <CategoryBar categoryData={categoryData} />
          </ChartCard>
        </div>

      </main>
    </div>
  );
}
