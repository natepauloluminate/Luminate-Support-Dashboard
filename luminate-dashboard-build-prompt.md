# Luminate Support Center Dashboard
## One-Shot Build Specification for Claude Code

---

## Your Role

You are the design lead and sole engineer on this project. Approach it as a senior product designer who also writes the code — every visual decision is intentional, every value is justified, nothing is generic. The client has seen templated dashboards and rejected them. This must feel like it was built specifically for Luminate Bank's support team, not assembled from a component library.

**Before writing a single line of code:** internalize the design brief, the attached reference screenshot, and the complete spec below. Then build every file in the order listed, fully completing each before moving to the next. No placeholders. No TODOs. Every file production-ready.

The attached screenshot is your primary layout reference for the Overview page. Use it for card grid proportions, information density, typography hierarchy, and the exact delta indicator style. The written spec below overrides the screenshot only on colors and brand tokens.

---

## Design Brief

**Product:** Luminate Support Center Dashboard
**Audience:** IT leadership and executives at Luminate Bank who need to understand help desk health in under 5 seconds
**Single job:** Surface the current state of the support queue — volume, speed, and team coverage — at a glance

**Aesthetic direction:** Deep command center. The background reads like a dark navy operations screen, not a generic dark mode. The purple-to-cyan dual-accent system is Luminate's visual DNA: every element that uses color earns it by encoding meaning. Purple = live activity (what's happening right now). Cyan = performance over time (how fast, how many). The design's one signature element is a thin gradient rule beneath the header that flows from purple to cyan — this motif then echoes quietly in the card top-accent system throughout the page.

**What this is NOT:** near-black with a single acid-green accent, a standard Bootstrap dark theme, anything with gradients filling card backgrounds.

**Typography:** Inter. Two weights only — 400 for descriptions and secondary text, 500 for values and labels. Restraint is intentional. The data is the emphasis, not the chrome.

**Motion:** one micro-interaction only — card border brightens on hover (150ms ease). No page transitions, no animated counters, no scroll reveals. This is a live instrument; it should feel precise, not kinetic.

**5-second story structure on Overview:**
- Row 1 (purple accents): How busy are we today?
- Row 2 (cyan accents): How fast are we resolving?
- Row 3 (no accent): Who is on the floor right now?

An executive reads top-left to bottom-right and has the full picture in one pass.

---

## Tech Stack

- React 18 + Vite
- React Router DOM v6
- Recharts v2
- jsPDF + html2canvas (PDF export)
- No UI component library — all styles are inline style objects using design tokens

---

## Bootstrap Commands

```bash
npm create vite@latest luminate-support-dashboard -- --template react
cd luminate-support-dashboard
npm install react-router-dom recharts jspdf html2canvas
```

---

## Complete File Manifest

Build every file listed, in this exact order, fully complete:

```
index.html
src/index.css
src/main.jsx
src/tokens.js
src/App.jsx
src/data/mockData.js
src/utils/export.js
src/components/Header.jsx
src/components/FilterBar.jsx
src/components/MetricCard.jsx
src/components/ChartCard.jsx
src/pages/Overview.jsx
src/pages/Analytics.jsx
```

---

## FILE 1 — `src/tokens.js`

```js
export const C = {
  pageBg:      '#0B1220',
  headerBg:    '#070D17',
  filterBg:    '#0D1825',
  cardBg:      '#111B2A',
  surfaceUp:   '#162030',
  border:      '#1B2C40',
  borderHover: '#2A3F58',

  purple:      '#7C3AED',
  purpleSoft:  'rgba(124,58,237,0.12)',
  cyan:        '#06B6D4',
  cyanSoft:    'rgba(6,182,212,0.12)',
  amber:       '#FBBF24',

  positive:    '#34D399',
  negative:    '#F87171',

  textPrimary:   '#F0F4F8',
  textSecondary: '#8899AA',
  textMuted:     '#445566',

  // Card top-border accent by row — encodes meaning, not decoration
  accentPurple:  '#7C3AED',   // Row 1: live activity
  accentCyan:    '#06B6D4',   // Row 2: performance metrics
  accentNeutral: '#1B2C40',   // Row 3: same as border — invisible
};
```

---

## FILE 2 — `index.html`

Standard Vite HTML. Add to `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
<title>Luminate Support Center</title>
```

---

## FILE 3 — `src/index.css`

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #0B1220;
  color: #F0F4F8;
  -webkit-font-smoothing: antialiased;
}

select option { background: #111B2A; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #0B1220; }
::-webkit-scrollbar-thumb { background: #1B2C40; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2A3F58; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
```

---

## FILE 4 — `src/main.jsx`

Standard Vite entry. Render `<App />` into `#root`. No StrictMode.

---

## FILE 5 — `src/App.jsx`

React Router v6. Routes: `/` → Overview, `/analytics` → Analytics, `*` → redirect to `/`.

---

## FILE 6 — `src/data/mockData.js`

```js
export const metrics = {
  ticketsOpenedToday: { value: 40,       delta: -31.03, invertDelta: true  },
  ticketsClosedToday: { value: 58,       delta:  13.73, invertDelta: false },
  ticketsPerHour:     { value: '2.56',   delta: -31.00, invertDelta: true  },
  ticketsPerDay:      { value: 40,       delta: -31.03, invertDelta: true  },
  responseTime:       { value: '0h 41m'                                    },
  resolutionTime:     { value: '36h 47m'                                   },
  totalTickets:       { value: 2647                                         },
  totalNew:           { value: 12                                           },
  totalClosed:        { value: 2569                                         },
  totalInProgress:    { value: 66                                           },
  techsOnline:        ['david.heerse@luminate.bank'],
  techsOOO:           [],
};

export const trendData = [
  { date: 'Jun 1',  opened: 52, closed: 48 },
  { date: 'Jun 2',  opened: 47, closed: 55 },
  { date: 'Jun 3',  opened: 38, closed: 42 },
  { date: 'Jun 4',  opened: 61, closed: 50 },
  { date: 'Jun 5',  opened: 44, closed: 60 },
  { date: 'Jun 6',  opened: 39, closed: 45 },
  { date: 'Jun 7',  opened: 33, closed: 38 },
  { date: 'Jun 8',  opened: 55, closed: 49 },
  { date: 'Jun 9',  opened: 40, closed: 58 },
  { date: 'Jun 10', opened: 48, closed: 52 },
  { date: 'Jun 11', opened: 36, closed: 41 },
  { date: 'Jun 12', opened: 42, closed: 47 },
  { date: 'Jun 13', opened: 50, closed: 44 },
  { date: 'Jun 14', opened: 40, closed: 58 },
];

export const statusData = [
  { name: 'New',         value: 12,   color: '#FBBF24' },
  { name: 'In Progress', value: 66,   color: '#7C3AED' },
  { name: 'Closed',      value: 2569, color: '#06B6D4' },
];

export const timeData = [
  { day: 'Mon', response: 0.6,  resolution: 32   },
  { day: 'Tue', response: 0.8,  resolution: 40   },
  { day: 'Wed', response: 0.5,  resolution: 28   },
  { day: 'Thu', response: 1.1,  resolution: 45   },
  { day: 'Fri', response: 0.7,  resolution: 36   },
  { day: 'Sat', response: 0.4,  resolution: 22   },
  { day: 'Sun', response: 0.65, resolution: 36.8 },
];

export const categoryData = [
  { name: 'IT Support',  count: 890 },
  { name: 'Finance',     count: 430 },
  { name: 'HR',          count: 375 },
  { name: 'Operations',  count: 290 },
  { name: 'Other',       count: 662 },
];
```

---

## FILE 7 — `src/utils/export.js`

```js
import { metrics } from '../data/mockData';

export function exportCSV() {
  const rows = [
    ['Metric', 'Value'],
    ['Tickets Opened Today',  metrics.ticketsOpenedToday.value],
    ['Tickets Closed Today',  metrics.ticketsClosedToday.value],
    ['Tickets Per Hour',      metrics.ticketsPerHour.value],
    ['Tickets Per Day',       metrics.ticketsPerDay.value],
    ['Response Time',         metrics.responseTime.value],
    ['Resolution Time',       metrics.resolutionTime.value],
    ['Total Tickets',         metrics.totalTickets.value],
    ['Total New',             metrics.totalNew.value],
    ['Total Closed',          metrics.totalClosed.value],
    ['Total In-Progress',     metrics.totalInProgress.value],
    ['Techs Online',          metrics.techsOnline.join('; ') || 'none'],
    ['Techs Out of Office',   metrics.techsOOO.join('; ')    || 'none'],
  ];
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'luminate-support.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(elementId = 'dashboard-root') {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF }       = await import('jspdf');
  const el     = document.getElementById(elementId);
  const canvas = await html2canvas(el, { backgroundColor: '#0B1220', scale: 1.5, useCORS: true });
  const img    = canvas.toDataURL('image/png');
  const pdf    = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width / 1.5, canvas.height / 1.5],
  });
  pdf.addImage(img, 'PNG', 0, 0, canvas.width / 1.5, canvas.height / 1.5);
  pdf.save('Luminate-Support-Dashboard.pdf');
}
```

---

## FILE 8 — `src/components/Header.jsx`

Uses `useLocation` + `useNavigate` from react-router-dom.

**Structure (rendered top to bottom):**

**1. Main bar** — `height: 56px`, `background: #070D17`, `border-bottom: 1px solid #1B2C40`, `padding: 0 20px`, flex row, align-items center.

Left side — brand lockup (flex, align-items center, gap 10px):
- Circle: `width: 10px; height: 10px; border-radius: 50%; background: #7C3AED; flex-shrink: 0`
- Text: `"Luminate Support Center"` — `font-size: 14px; font-weight: 500; color: #F0F4F8; letter-spacing: -0.01em`

Right side — tab nav (`margin-left: auto`, flex, gap 4px):

Two `<button>` elements. Navigate on click: "Overview" → `/`, "Analytics" → `/analytics`.

Active tab (when `location.pathname` matches):
```js
{
  background: '#7C3AED', color: '#ffffff', border: 'none',
  borderRadius: '20px', padding: '6px 18px',
  fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
}
```

Inactive tab:
```js
{
  background: 'transparent', color: '#8899AA', border: 'none',
  borderRadius: '20px', padding: '6px 18px',
  fontSize: '13px', fontWeight: 400, fontFamily: 'inherit', cursor: 'pointer',
  transition: 'color 150ms ease',
}
// onMouseEnter → color #F0F4F8 | onMouseLeave → color #8899AA
```

**2. Signature gradient rule** — immediately below the main bar, full width:
```js
{ height: '2px', background: 'linear-gradient(90deg, transparent 0%, #7C3AED 35%, #06B6D4 65%, transparent 100%)' }
```

This is the design's signature — do not omit or alter it.

---

## FILE 9 — `src/components/FilterBar.jsx`

Props: `period`, `setPeriod`, `category`, `setCategory`, `onExportCSV`, `onExportPDF`, `exporting`

Container: `height: 50px`, `background: #0D1825`, `border-bottom: 1px solid #1B2C40`, `padding: 0 20px`, flex, align-items center, gap 10px.

**Period select** options: Yesterday · Today · Last 7 Days · Last 30 Days · This Quarter · This Year

**Category select** options: All Categories · IT Support · HR · Finance · Operations

Both selects share this style:
```js
{
  background: '#111B2A', border: '1px solid #1B2C40', borderRadius: '6px',
  color: '#B0BEC5', padding: '6px 30px 6px 11px',
  fontSize: '13px', fontFamily: 'inherit',
  appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none',
  minWidth: '130px',
}
```

Wrap each select in `position: relative` div. Add a `▾` character as `position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #445566; pointer-events: none; font-size: 10px`.

**Right group** (`margin-left: auto`, flex, align-items center, gap 12px):

Status indicator:
```jsx
<div style={{ display:'flex', alignItems:'center', gap:6 }}>
  <span style={{ width:7, height:7, borderRadius:'50%', background:'#445566', display:'inline-block' }}/>
  <span style={{ fontSize:11, color:'#445566', letterSpacing:'0.02em' }}>Demo mode</span>
</div>
```

Export button pair (gap 8px between them). Shared button style:
```js
{
  background: 'transparent', border: '1px solid #1B2C40', borderRadius: '5px',
  color: '#8899AA', padding: '5px 12px', fontSize: '12px',
  fontFamily: 'inherit', cursor: 'pointer',
  transition: 'border-color 150ms ease, color 150ms ease',
}
// hover: borderColor '#2A3F58', color '#F0F4F8'
```

- CSV button: label `↓ CSV` — calls `onExportCSV`
- PDF button: label `↓ PDF` (shows `Generating…` when `exporting === true`) — calls `onExportPDF`

---

## FILE 10 — `src/components/MetricCard.jsx`

```
Props:
  label        string   — displayed uppercase
  value        string | number | null   — null triggers children-only mode
  delta        number | undefined
  invertDelta  bool     — if true, negative delta = green (fewer new tickets = good)
  description  string
  accent       string   — hex for 2px top border
  children     JSX | undefined
```

**Container:**
```js
{
  background: '#111B2A',
  border: '1px solid #1B2C40',
  borderTop: `2px solid ${accent}`,
  borderRadius: '8px',
  padding: '16px 18px 14px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '110px',
  transition: 'border-color 150ms ease',
  cursor: 'default',
}
```
On hover: set `border` to `1px solid #2A3F58`. The `borderTop` accent color must not change on hover — manage this by setting `borderTop` separately and only toggling the base `border`.

**Label:** `font-size: 10.5px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #445566; margin-bottom: 10px`

**Value + delta row** (only renders when `value !== null`):
```jsx
<div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
  <span style={{ fontSize:28, fontWeight:500, color:'#F0F4F8', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
    {typeof value === 'number' ? value.toLocaleString() : value}
  </span>
  {delta !== undefined && <DeltaBadge value={delta} invert={invertDelta} />}
</div>
```

**DeltaBadge** (unexported helper inside this file):
```jsx
function DeltaBadge({ value, invert }) {
  const isGood = invert ? value < 0 : value > 0;
  return (
    <span style={{ fontSize:12, fontWeight:500, color: isGood ? '#34D399' : '#F87171', letterSpacing:'0.01em' }}>
      {value > 0 ? '↑' : '↓'}{Math.abs(value).toFixed(2)}%
    </span>
  );
}
```

**Children:** renders after value row, before description.

**Description:** `font-size: 11.5px; color: #445566; line-height: 1.5; margin-top: auto; padding-top: 6px`

---

## FILE 11 — `src/components/ChartCard.jsx`

Props: `title`, `subtitle`, `children`

```js
{
  background: '#111B2A',
  border: '1px solid #1B2C40',
  borderTop: '2px solid #7C3AED',
  borderRadius: '8px',
  padding: '18px 20px 16px',
}
```

Title: `10.5px, weight 500, uppercase, letter-spacing 0.08em, color #445566`
Subtitle: `12px, color #445566, margin: 3px 0 16px`

---

## FILE 12 — `src/pages/Overview.jsx`

Wrap entire page in `<div id="dashboard-root">`.

State: `period` (default `'Today'`), `category` (default `'All Categories'`), `exporting` (bool, default false).

`handlePDF`: set `exporting = true` → await `exportPDF('dashboard-root')` → set `exporting = false`.

**Define TechBadge inline (not exported):**
```jsx
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
    }}>{text}</span>
  );
}
```

**Full page structure:**
```jsx
<div id="dashboard-root">
  <Header />
  <FilterBar
    period={period} setPeriod={setPeriod}
    category={category} setCategory={setCategory}
    onExportCSV={exportCSV}
    onExportPDF={handlePDF}
    exporting={exporting}
  />
  <main style={{ padding:'14px', display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:'10px' }}>
    {/* 12 MetricCards — see table below */}
  </main>
</div>
```

**Card definitions — render in this exact order:**

| # | label | value | delta | invertDelta | accent | description |
|---|---|---|---|---|---|---|
| 1 | Tickets Opened Today | metrics.ticketsOpenedToday.value | metrics.ticketsOpenedToday.delta | true | accentPurple | "Tickets opened during the selected period" |
| 2 | Tickets Closed Today | metrics.ticketsClosedToday.value | metrics.ticketsClosedToday.delta | false | accentPurple | "Tickets closed during the selected period" |
| 3 | Tickets Per Hour | metrics.ticketsPerHour.value | metrics.ticketsPerHour.delta | true | accentPurple | "The average number of tickets created per hour" |
| 4 | Tickets Per Day | metrics.ticketsPerDay.value | metrics.ticketsPerDay.delta | true | accentPurple | "The average number of tickets created per day" |
| 5 | Response Time | metrics.responseTime.value | — | — | accentCyan | "The response time for tickets created during the selected period" |
| 6 | Resolution Time | metrics.resolutionTime.value | — | — | accentCyan | "The resolution time for tickets closed during the selected period" |
| 7 | Total Tickets | metrics.totalTickets.value | — | — | accentCyan | "Total number of tickets" |
| 8 | Total New | metrics.totalNew.value | — | — | accentCyan | "Total number of new tickets" |
| 9 | Total Closed | metrics.totalClosed.value | — | — | accentNeutral | "Total number of closed tickets" |
| 10 | Total In-Progress | metrics.totalInProgress.value | — | — | accentNeutral | "Total number of \"in progress\" tickets" |
| 11 | Techs Online | **null** | — | — | accentNeutral | "Technicians active during the last 10 minutes" |
| 12 | Techs "Out of Office" | **null** | — | — | accentNeutral | "Technicians who marked themselves as \"out of office\"" |

Cards 11 and 12 use `value={null}` and pass badge content via `children`:

```jsx
// Card 11 children:
<div style={{ display:'flex', flexWrap:'wrap', gap:6, margin:'2px 0 4px' }}>
  {metrics.techsOnline.length
    ? metrics.techsOnline.map(t => <TechBadge key={t} text={t} />)
    : <TechBadge text="none" muted />}
</div>

// Card 12 children:
<div style={{ display:'flex', flexWrap:'wrap', gap:6, margin:'2px 0 4px' }}>
  {metrics.techsOOO.length
    ? metrics.techsOOO.map(t => <TechBadge key={t} text={t} />)
    : <TechBadge text="none" muted />}
</div>
```

---

## FILE 13 — `src/pages/Analytics.jsx`

Same Header/FilterBar pattern as Overview (same state, same handlePDF).

Define all four chart functions inside this file — no separate chart files needed.

**Shared Recharts config objects** (define once, spread into every chart):

```js
const tooltipStyle = {
  contentStyle: {
    background: '#0B1220', border: '1px solid #7C3AED',
    borderRadius: '6px', fontSize: 12,
    color: '#F0F4F8', fontFamily: 'Inter, sans-serif',
  },
  labelStyle: { color: '#8899AA', marginBottom: 4 },
  itemStyle:  { color: '#F0F4F8' },
  cursor:     { fill: 'rgba(124,58,237,0.06)' },
};

const axisTick = { fill: '#445566', fontSize: 11, fontFamily: 'Inter, sans-serif' };
```

**Page layout:**
```jsx
<main style={{ padding:'14px', display:'flex', flexDirection:'column', gap:12 }}>

  {/* Row 1 — full width */}
  <ChartCard title="Ticket Volume Trend" subtitle="Opened vs. closed — selected period">
    <TrendArea />
  </ChartCard>

  {/* Row 2 — three equal columns */}
  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:12 }}>
    <ChartCard title="Queue Status" subtitle="Current ticket breakdown">
      <StatusDonut />
    </ChartCard>
    <ChartCard title="Time Metrics" subtitle="Avg response & resolution by day (hrs)">
      <TimeBar />
    </ChartCard>
    <ChartCard title="By Category" subtitle="Total tickets per department">
      <CategoryBar />
    </ChartCard>
  </div>

</main>
```

---

### Chart 1 — `TrendArea`

```jsx
function TrendArea() {
  return (
    <>
      <div style={{ display:'flex', gap:20, marginBottom:12, fontSize:12, color:'#8899AA' }}>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:10, height:10, background:'#7C3AED', borderRadius:2, display:'inline-block' }}/>Opened
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:10, height:10, background:'#06B6D4', borderRadius:2, display:'inline-block' }}/>Closed
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trendData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
          <defs>
            <linearGradient id="gOpened" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" vertical={false}/>
          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false}/>
          <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
          <Tooltip {...tooltipStyle}/>
          <Area type="monotone" dataKey="opened" name="Opened" stroke="#7C3AED" strokeWidth={2}
                fill="url(#gOpened)" dot={false} activeDot={{ r:4, fill:'#7C3AED' }}/>
          <Area type="monotone" dataKey="closed"  name="Closed"  stroke="#06B6D4" strokeWidth={2}
                fill="url(#gClosed)" dot={false} activeDot={{ r:4, fill:'#06B6D4' }}/>
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
```

---

### Chart 2 — `StatusDonut`

```jsx
function StatusDonut() {
  const total = statusData.reduce((s, d) => s + d.value, 0).toLocaleString();
  return (
    <>
      <div style={{ position:'relative', height:190 }}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={statusData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={58} outerRadius={82}
              paddingAngle={2} strokeWidth={0}
            >
              {statusData.map(entry => <Cell key={entry.name} fill={entry.color}/>)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={v => v.toLocaleString()}/>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label — positioned over the donut hole */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          textAlign:'center', pointerEvents:'none',
        }}>
          <div style={{ fontSize:20, fontWeight:500, color:'#F0F4F8', fontVariantNumeric:'tabular-nums' }}>{total}</div>
          <div style={{ fontSize:11, color:'#445566', marginTop:2 }}>Total</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', gap:14, marginTop:12, flexWrap:'wrap' }}>
        {statusData.map(s => (
          <span key={s.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#8899AA' }}>
            <span style={{ width:10, height:10, background:s.color, borderRadius:2, display:'inline-block' }}/>
            {s.name}
            <strong style={{ color:'#F0F4F8', marginLeft:3, fontWeight:500 }}>
              {s.value.toLocaleString()}
            </strong>
          </span>
        ))}
      </div>
    </>
  );
}
```

---

### Chart 3 — `TimeBar`

```jsx
function TimeBar() {
  return (
    <>
      <div style={{ display:'flex', gap:20, marginBottom:12, fontSize:12, color:'#8899AA' }}>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:10, height:10, background:'#7C3AED', borderRadius:2, display:'inline-block' }}/>Resolution
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:10, height:10, background:'#06B6D4', borderRadius:2, display:'inline-block' }}/>Response
        </span>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={timeData} margin={{ top:5, right:5, left:-25, bottom:0 }}
                  barGap={2} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" vertical={false}/>
          <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false}/>
          <YAxis tick={axisTick} axisLine={false} tickLine={false}/>
          <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}h`, n]}/>
          <Bar dataKey="resolution" name="Resolution" fill="#7C3AED" radius={[3,3,0,0]} maxBarSize={12}/>
          <Bar dataKey="response"   name="Response"   fill="#06B6D4" radius={[3,3,0,0]} maxBarSize={12}/>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
```

---

### Chart 4 — `CategoryBar`

Sort descending by count. Top item (#1 by volume) fills purple; all others fill `#1B2C40` — this makes the leading category readable as the headline without needing a label.

```jsx
function CategoryBar() {
  const sorted = [...categoryData].sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} layout="vertical" margin={{ top:5, right:10, left:8, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1B2C40" horizontal={false}/>
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false}/>
        <YAxis type="category" dataKey="name" width={76}
               tick={{ fill:'#8899AA', fontSize:11, fontFamily:'Inter, sans-serif' }}
               axisLine={false} tickLine={false}/>
        <Tooltip {...tooltipStyle}/>
        <Bar dataKey="count" name="Tickets" radius={[0,3,3,0]} maxBarSize={12}>
          {sorted.map((entry, i) => (
            <Cell key={entry.name} fill={i === 0 ? '#7C3AED' : '#1B2C40'}/>
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## Final Verification Checklist

Do not mark the build complete until every item passes.

**Structure**
- [ ] Both routes load without errors or console warnings
- [ ] Active tab pill (`#7C3AED` background) highlights correctly for each route
- [ ] Gradient rule renders beneath the header — purple fading to cyan, full width
- [ ] `body` background is `#0B1220` — zero white flash on load

**Overview page**
- [ ] Exactly 12 cards in a 4-column grid matching the reference screenshot layout
- [ ] Row 1 cards: `border-top: 2px solid #7C3AED`
- [ ] Row 2 cards: `border-top: 2px solid #06B6D4`
- [ ] Row 3 cards: top border matches card border (invisible)
- [ ] Delta: ↓ green for opened/per-hour/per-day; ↑ green for closed today
- [ ] All numeric values use `toLocaleString()` — no raw floats displayed
- [ ] `font-variant-numeric: tabular-nums` on all metric value spans
- [ ] "david.heerse@luminate.bank" badge renders in card 11
- [ ] "none" renders as a muted badge in card 12
- [ ] Card hover: border brightens to `#2A3F58`, top accent color unchanged

**Analytics page**
- [ ] Full-width trend area chart on top; three equal charts below
- [ ] All Recharts tooltips dark-themed (`#0B1220` bg, `#7C3AED` border)
- [ ] Donut center shows total `2,647` + label "Total" — never clipped
- [ ] Category chart: top item purple, rest border-tone
- [ ] Custom HTML legends on trend and time charts — no Recharts default legend

**Exports**
- [ ] CSV download produces a valid file with 12 data rows
- [ ] PDF export captures full dashboard with dark background (not white)
- [ ] PDF button shows "Generating…" during export and reverts after

**Polish**
- [ ] Inter font active — no system fallback visible at any weight
- [ ] No horizontal scrollbar at 1280px+ viewport
- [ ] Dark scrollbar renders on overflow content
- [ ] `prefers-reduced-motion` media query disables all transitions
