
# USER STORY
## Build Backend Proxy and JitBit API Integration

**Priority:** High · **Project:** Luminate Support Dashboard · **Reporter:** Nate Paulo

---

## Description

### Background
Build a Vercel serverless proxy at `api/jitbit/stats.js` that authenticates with the JitBit API using a Bearer token, calls verified endpoints, aggregates all 12 dashboard metrics, and returns a single JSON object to the frontend. All field names, endpoint paths, section IDs, and auth method have been verified against the live API.

### ROI
Secures the JitBit Bearer token server-side, eliminates CORS errors, and delivers live helpdesk data to the dashboard replacing all mock values.

### Location
Vercel serverless function at `api/jitbit/stats.js` in the existing frontend repo. Accessible at `GET /api/jitbit/stats`. Same repo and deployment as the frontend.

---

## Technical Criteria

### Notes to Developer
- Auth: `Authorization: Bearer [JITBIT_TOKEN]`. Read token from env var `JITBIT_TOKEN`. Base URL: `https://luminatebank.jitbit.com/helpdesk/api/`
- Use `GET /api/Stats` for the four total counts (TotalTickets, Closed, InProcess, NewTickets). Do NOT aggregate these manually.
- Verified field names: `ResolvedDate` (not ClosedDate), `LastSeen` (not LastSeenDate), `StartDate` (proxy for first response time), `StatusID` (not Status string).
- StatusID values confirmed: 1 = New, 2 = In Progress, 3 = Closed.
- Section filtering: use `sectionId` parameter on Tickets calls, NOT `categoryId`. Real sectionIds: IT 163173, HR 168963, Accounting/Finance 167008, Branch & Loan Ops 167041, Bank Ops 167039, Other 167044.
- No `/api/technicians` endpoint exists. Use `GET /api/Users?listMode=techs&count=500`. REQUIRES ADMIN PERMISSIONS — coordinate with JitBit admin before building tech status logic.
- `OutOfOffice` (boolean) and `LastSeen` (ISO datetime) confirmed present on user objects from live API.
- Max 300 tickets per request. Paginate with offset if count returned equals 300. Rate limit: 90 req/min.
- Run Stats call and Users call in parallel with Promise.all.

### Functional Requirements
1. Vercel serverless function at `api/jitbit/stats.js`. Accepts GET requests with `period` and `section` query params. Returns JSON.
2. CORS headers on all responses scoped to the Vercel frontend domain.
3. Health check: return `{ ok: true, timestamp }` before any JitBit calls are added. Deploy and verify this is reachable first.
4. Call `GET /api/Stats` to source TotalTickets, NewTickets, Closed, InProcess directly.
5. Call `GET /api/Tickets?dateFrom=TODAY&dateTo=TODAY&count=300` for Tickets Opened Today. Paginate if needed.
6. Call `GET /api/Tickets?statusId=3&updatedFrom=TODAY&updatedTo=TODAY&count=300` for Tickets Closed Today.
7. Calculate Tickets Per Hour: Opened Today divided by current hour of day. Return 0 if current hour is 0.
8. Calculate Response Time: average of (StartDate minus IssueDate) for today tickets where StartDate is not null. Format as "Xh Ym".
9. Calculate Resolution Time: average of (ResolvedDate minus IssueDate) where ResolvedDate is not null. Format as "Xh Ym".
10. Call `GET /api/Users?listMode=techs&count=500` (admin account required). Derive techsOnline (LastSeen within 10 min) and techsOOO (OutOfOffice === true) as email string arrays. Return empty arrays if admin access unavailable.
11. Accept `period` query param (yesterday, today, last7days, last30days, thisquarter, thisyear). Apply correct dateFrom/dateTo values server-side.
12. Accept `section` query param. Pass `sectionId` to Tickets calls when set. Valid values: 163173, 168963, 167008, 167041, 167039, 167044.
13. Calculate 4 delta values (opened, closed, perHour, perDay) by fetching current and prior period concurrently with Promise.all. Return null when prior value is 0.
14. Return all 12 metric values and 4 delta values as a single JSON object.

---

## Testing Results

### Notes to QA
- Call `GET /api/Stats` directly and verify TotalTickets, Closed, InProcess, NewTickets match the JitBit dashboard.
- Verify Tickets Opened Today count matches the JitBit dashboard for the current day.
- Test period filter — switch between Today and Last 7 Days and confirm metric values change.
- Test section filter — switch between Information Technology (163173) and Accounting / Finance (167008) and confirm different counts.
- Test invalid token — confirm HTTP 401 is returned with a clear error message.
- Confirm `.env.local` is not committed to the repository.
- Test the health check endpoint returns `{ ok: true }` before any other testing.

### Acceptance Criteria
1. Health check at `GET /api/jitbit/stats` returns `{ ok: true }` before JitBit calls are added.
2. `GET /api/jitbit/stats` returns a valid JSON object with all 12 metric fields.
3. TotalTickets, Closed, InProcess, NewTickets sourced from `/api/Stats` and match the JitBit dashboard.
4. Tickets Opened Today matches the JitBit dashboard count for the current day.
5. Period and section query params filter results correctly. All sections and periods tested.
6. Delta values are signed, rounded to 2 decimal places, and return null when prior period is zero.
7. techsOnline and techsOOO return correct arrays or empty arrays when admin access is unavailable.
8. Bearer token stored in `JITBIT_TOKEN` env var only. Not present in source code.
9. No CORS errors when called from the Vercel frontend domain.

---

## Deployment Notes
- Proxy lives in `api/jitbit/stats.js` in the same repo. One Vercel deployment covers both frontend and proxy.
- Required env vars: `JITBIT_TOKEN` (Bearer token from `https://luminatebank.jitbit.com/helpdesk/User/Token?json=true`), `JITBIT_BASE_URL` (`https://luminatebank.jitbit.com/helpdesk/api/`).
- Set env vars in Vercel project settings for production. Add to `.env.local` for local dev.
- Add `.env.local` to `.gitignore` before first commit containing credentials.
- Regenerate `JITBIT_TOKEN` before adding to `.env.local` — previous token was shared in chat.
- After deploying, test `GET /api/jitbit/stats` directly in the browser to confirm live data returns before starting T03.
- Admin access blocker: coordinate with JitBit admin for elevated permissions before the Techs Online and Techs OOO cards can show live data.
