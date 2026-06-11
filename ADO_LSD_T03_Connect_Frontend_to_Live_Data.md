# USER STORY
## Connect Frontend to Live Data and Enable Auto-Refresh

**Priority:** High · **Project:** Luminate Support Dashboard · **Reporter:** Nate Paulo

---

## Description

### Background
Replace all mock data in the React frontend with live calls to `GET /api/jitbit/stats`, update the FilterBar section dropdown with real Luminate section names, add loading and error states, and set up 30-second auto-refresh polling. This is the final step that delivers a fully live dashboard.

### ROI
Delivers the complete working product — a live executive dashboard displaying real JitBit data with no manual refresh required.

### Location
React application — `src/pages/Overview.jsx` and `src/pages/Analytics.jsx`. FilterBar section dropdown updated in `src/components/FilterBar.jsx`.

---

## Technical Criteria

### Notes to Developer
- Read proxy base URL from `VITE_PROXY_URL` environment variable. No hardcoded URLs anywhere in source.
- useEffect dependencies: include `period` and `section` so the effect and interval restart on filter change.
- Cleanup: `return () => clearInterval(id)` in every useEffect that sets an interval — no stacking.
- Use AbortController or a stale-flag to prevent race conditions on rapid filter changes.
- Page Visibility API: `document.addEventListener("visibilitychange", handler)` — pause polling when `document.hidden` is true, resume when false.
- The FilterBar section dropdown must be updated from placeholder options to the real Luminate sections below. Pass `sectionId` as the query param value (not the display name).

### Real section dropdown values (replace mock options)
| Display Label | sectionId value |
|---|---|
| All Sections | (empty — omit param) |
| Information Technology | 163173 |
| Human Resources | 168963 |
| Accounting / Finance | 167008 |
| Branch & Loan Operations | 167041 |
| Bank Operations | 167039 |
| Other | 167044 |

### Functional Requirements
1. Replace all `mockData` imports in `Overview.jsx` and `Analytics.jsx` with `fetch` calls to `GET /api/jitbit/stats`.
2. Pass active `period` and `section` values as query parameters on every fetch. Re-fetch when either changes.
3. Update `FilterBar.jsx` section dropdown with the real Luminate section names and sectionId values listed above.
4. Show a loading state on metric cards while data is fetching.
5. Show a visible error state if the proxy is unreachable or returns a non-200 response. App must not crash.
6. Update the FilterBar status dot to green with a last-sync timestamp on successful fetch.
7. Read proxy base URL from `VITE_PROXY_URL` environment variable only. No hardcoded URLs.
8. Set up a 30-second `setInterval` polling cycle that re-calls `GET /api/jitbit/stats` and updates all state on success.
9. Clear the interval in `useEffect` cleanup to prevent memory leaks on component unmount.
10. Pause polling when the browser tab is inactive via the Page Visibility API. Resume when tab becomes active.

---

## Testing Results

### Notes to QA
- Verify live metric values match the JitBit dashboard for the same period and section.
- Change the period filter — confirm a new fetch fires with the updated period param.
- Change the section filter — confirm metrics update to reflect the selected section.
- Set an invalid `VITE_PROXY_URL` — verify the error state renders cleanly and the app does not crash.
- Open DevTools Network tab — confirm API calls fire at 30-second intervals.
- Switch to another browser tab — confirm polling pauses. Switch back — confirm polling resumes.
- Navigate away from the page and back — confirm no duplicate intervals are created.
- Verify the status dot turns green and shows a last-sync timestamp when data is live.

### Acceptance Criteria
1. Dashboard displays live JitBit data on initial page load.
2. Period and section filter changes each trigger a new fetch with updated query parameters.
3. Loading state is visible during fetch. Error state renders correctly when proxy is unreachable.
4. Status dot shows green and last-sync timestamp when live.
5. `VITE_PROXY_URL` used for proxy base URL. No hardcoded URLs in source.
6. Section dropdown shows real Luminate section names and filters data correctly.
7. Auto-refresh fires every 30 seconds — confirmed by Network tab.
8. Polling pauses on inactive tab and resumes on active tab.
9. No memory leaks — interval cleared on component unmount.

---

## Deployment Notes
- Add `VITE_PROXY_URL` to `.env.local` for local development (e.g. `http://localhost:3000` or the Vercel preview URL).
- Add `VITE_PROXY_URL` to Vercel project environment variable settings for production.
- Redeploy frontend to Vercel after adding the env var.
- No additional infrastructure needed — proxy and frontend deploy together from the same repo.
