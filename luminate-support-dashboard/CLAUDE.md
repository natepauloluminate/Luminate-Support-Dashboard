# Project: Luminate Support Center Dashboard

## What this is
A real-time executive IT support dashboard for Luminate Bank pulling live data from the JitBit helpdesk API. Built in React/Vite, deployed to Vercel. Gives IT leadership a 5-second read on support queue health — volume, response times, resolution rates, and team coverage.

## Local repo path
`/home/natepaulo/ai-workspace/projects/jitbit-dashboard/luminate-support-dashboard/CLAUDE.md`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router DOM v6 |
| Charts | Recharts v2 |
| Export | jsPDF + html2canvas |
| Proxy | Vercel serverless functions (api/ folder, same repo) |
| Hosting | Vercel |
| Auth | JitBit Bearer token |
| Dev | VS Code, WSL bash |

**No UI component libraries.** All styles inline from `src/tokens.js`.

---

## File structure

```
luminate-support-dashboard/
├── vercel.json
├── CLAUDE.md
├── luminate-dashboard-build-prompt.md
├── api/
│   └── jitbit/
│       └── stats.js          ← GET /api/jitbit/stats (proxy)
├── index.html
├── src/
│   ├── main.jsx
│   ├── index.css
│   ├── App.jsx
│   ├── tokens.js
│   ├── data/mockData.js
│   ├── utils/export.js
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── FilterBar.jsx
│   │   ├── MetricCard.jsx
│   │   └── ChartCard.jsx
│   └── pages/
│       ├── Overview.jsx
│       └── Analytics.jsx
```

---

## Design system

### Colors (tokens.js)
```js
pageBg:       '#0B1220'
headerBg:     '#070D17'
filterBg:     '#0D1825'
cardBg:       '#111B2A'
border:       '#1B2C40'
borderHover:  '#2A3F58'
purple:       '#7C3AED'
cyan:         '#06B6D4'
positive:     '#34D399'
negative:     '#F87171'
textPrimary:  '#F0F4F8'
textSecondary:'#8899AA'
textMuted:    '#445566'
```

### Card accent system
- Row 1 (volume/rate): `border-top: 2px solid #7C3AED`
- Row 2 (time/totals): `border-top: 2px solid #06B6D4`
- Row 3 (team status): `border-top: 2px solid #1B2C40` (invisible)

### Signature element — never alter
```css
background: linear-gradient(90deg, transparent 0%, #7C3AED 35%, #06B6D4 65%, transparent 100%)
```

### Rules
- No white backgrounds anywhere
- No UI component libraries
- No hardcoded colors outside tokens.js
- Card hover brightens border to #2A3F58, top accent unchanged
- All Recharts tooltips: #0B1220 bg, #7C3AED border
- Custom HTML legends on all charts

---

## Dashboard metrics

### Overview — 12 cards

| Card | Source | Delta |
|---|---|---|
| Tickets Opened Today | `/api/Tickets?dateFrom=TODAY&dateTo=TODAY` count | ↓ green |
| Tickets Closed Today | `/api/Tickets?statusId=3&updatedFrom=TODAY&updatedTo=TODAY` count | ↑ green |
| Tickets Per Hour | Opened Today ÷ current hour | ↓ green |
| Tickets Per Day | Same as Opened Today | ↓ green |
| Response Time | avg(StartDate − IssueDate) where StartDate not null, "Xh Ym" | none |
| Resolution Time | avg(ResolvedDate − IssueDate) where ResolvedDate not null, "Xh Ym" | none |
| Total Tickets | `Stats.TotalTickets` | none |
| Total New | `Stats.NewTickets` | none |
| Total Closed | `Stats.Closed` | none |
| Total In-Progress | `Stats.InProcess` | none |
| Techs Online | Users?listMode=techs, LastSeen < 10min ⚠️ needs admin | none |
| Techs Out of Office | Users?listMode=techs, OutOfOffice=true ⚠️ needs admin | none |

---

## JitBit API — fully verified

**Base URL:** `https://luminatebank.jitbit.com/helpdesk/api/`
**Auth:** `Authorization: Bearer [TOKEN]`
**Token page:** `https://luminatebank.jitbit.com/helpdesk/User/Token?json=true`
**Rate limit:** 90 req/min
**Max tickets per request:** 300

### Endpoints used

```
GET /api/Stats
  → TotalTickets, Closed, InProcess, NewTickets ✅ confirmed working

GET /api/Tickets?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&count=300&offset=N
  → tickets opened in range, paginate with offset

GET /api/Tickets?statusId=3&updatedFrom=YYYY-MM-DD&updatedTo=YYYY-MM-DD&count=300
  → closed tickets updated on date

GET /api/Tickets?sectionId=N&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&count=300
  → tickets filtered by section (use sectionId NOT categoryId for section filtering)

GET /api/Users?listMode=techs&count=500
  → ⚠️ REQUIRES ADMIN PERMISSIONS — Nate's account is IsTech not IsAdmin
```

### Confirmed field names
```
Tickets:    IssueDate, StartDate, ResolvedDate, StatusID, CategoryID
Users:      LastSeen (ISO datetime), OutOfOffice (boolean), IsTech, IsAdmin
Stats:      TotalTickets, Closed, InProcess, NewTickets
```

### StatusID values
- `1` = New
- `2` = In Progress
- `3` = Closed

### Do NOT use
- `ClosedDate` → use `ResolvedDate`
- `LastSeenDate` → use `LastSeen`
- `/api/technicians` → does not exist, use `/api/Users?listMode=techs`
- `categoryId` for section filtering → use `sectionId`
- `Status` string → use `StatusID` numbers

---

## Real sections and IDs (verified from live API)

Use these in the FilterBar dropdown and sectionId parameter:

| Display Name | SectionID |
|---|---|
| All Categories | (no param) |
| Information Technology | 163173 |
| Human Resources | 168963 |
| Accounting / Finance | 167008 |
| Branch & Loan Operations | 167041 |
| Bank Operations | 167039 |
| Other | 167044 |

Replace the old assumed dropdown options (IT Support, HR, Finance, Operations) with these real values everywhere in the codebase.

### Key categories
- Ticket Intake: CategoryID 634412 (no section — general intake)
- IT sub-categories: Access Change Requests (651788), Email (647245), Hardware (647241), Network (647243), Passwords (647244), Software (647242), General Assistance (647347)

---

## Live Stats snapshot (verified June 10 2026)
```json
{
  "TotalTickets": 2701,
  "Closed": 2624,
  "InProcess": 65,
  "NewTickets": 12,
  "Unanswered": 36,
  "Unassigned": 9,
  "Unclosed": 77
}
```

---

## ADO tickets

| Ticket | Title | Priority | Status |
|---|---|---|---|
| T01 | Build and Deploy Frontend Dashboard | High | ✅ Complete |
| T02 | Build Backend Proxy and JitBit API Integration | High | Ready to start |
| T03 | Connect Frontend to Live Data and Enable Auto-Refresh | High | Not started |

---

## Blockers

⚠️ **Admin access needed for Techs cards** — `GET /api/Users?listMode=techs` requires admin permissions. Nate's account is `IsTech: true` but `IsAdmin: false`. Need to either:
- Ask JitBit admin to elevate Nate's account, OR
- Create a dedicated service account with admin permissions for the proxy

Everything else is unblocked and confirmed working.

---

## Key decisions

- **Vercel API routes** — proxy in `api/` folder, same repo, one deployment
- **sectionId for filtering** — use sectionId not categoryId when filtering by department
- **Bearer token auth** — token from `/helpdesk/User/Token?json=true`
- **30-second polling** — definition of real-time for this project
- **Stats endpoint for totals** — never aggregate these manually
- **GitHub** — work email account, private repo
- **Vercel** — personal for dev/staging, team account before live credentials in production

---

## What to do next

1. Resolve admin access blocker (loop in JitBit admin)
2. Update FilterBar dropdown in the frontend with real section names and IDs
3. Run T02 Claude Code prompt to build the proxy
4. Test /api/jitbit/stats against live data before starting T03

---

## What not to do
- Do not use ClosedDate — use ResolvedDate
- Do not call /api/technicians — use /api/Users?listMode=techs
- Do not filter by Status string — use StatusID (1/2/3)
- Do not filter sections by categoryId — use sectionId
- Do not hardcode proxy URL — use VITE_PROXY_URL env var
- Do not commit .env or .env.local
- Do not add UI component libraries
- Do not change color tokens without updating tokens.js
