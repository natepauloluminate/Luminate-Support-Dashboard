// WG Onboarding SLA endpoint — FSM Onboarding White Glove program.
// SectionID 170661 ("FSM Onboarding - White Glove") — its single category is
// 663227 ("FSM Onboarding Support"), so filtering by sectionId covers the program.
//
// Deliberately NOT sharing code with stats.js (per instruction) — the business-hours
// cluster and pagination helpers below are duplicated verbatim from that file.

const JITBIT_BASE_URL = process.env.JITBIT_BASE_URL || 'https://luminatebank.jitbit.com/helpdesk/api/';
const JITBIT_TOKEN = process.env.JITBIT_TOKEN;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const SECTION_ID = '170661';

// ─── Server-side response cache ───────────────────────────────────────────────
// Module-level Map persists across warm-instance reuse; resets on cold start.
// Prefixed "wg|" so keys can never collide with stats.js's cache (separate module,
// separate Map instance anyway, but the prefix keeps this true even if ever merged).
const _serverCache = new Map();
const CACHE_TTL_MS = 25 * 1000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jitbitHeaders() {
  return { Authorization: `Bearer ${JITBIT_TOKEN}` };
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

// ─── Business-hours helpers (Mon–Fri, 8am–5pm America/Chicago) ───────────────
// Duplicated verbatim from stats.js.

const CENTRAL_TZ   = 'America/Chicago';
const BIZ_START_H  = 8;
const BIZ_END_H    = 17;

// Constructing Intl.DateTimeFormat is expensive and these run in hot per-day loops
// over thousands of tickets, so build the formatters once at module load.
const _fmtYMD  = new Intl.DateTimeFormat('en-US', { timeZone: CENTRAL_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const _fmtHour = new Intl.DateTimeFormat('en-US', { timeZone: CENTRAL_TZ, hour: 'numeric', hour12: false });
const _fmtDOW  = new Intl.DateTimeFormat('en-US', { timeZone: CENTRAL_TZ, weekday: 'short' });

// Per-date memo caches. centralDOW / centralHourUTC are pure functions of a calendar
// date (timezone is fixed), and businessMs revisits the same days across many tickets,
// so caching collapses what was millions of Intl calls down to one per distinct day.
const _dowCache     = new Map();
const _bizHourCache = new Map();

// Returns "YYYY-MM-DD" for a Date as seen in Central Time
function toCentralDateStr(date) {
  const parts = _fmtYMD.formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// Returns UTC timestamp for a specific Central-Time hour on a "YYYY-MM-DD" date.
// Uses the Intl offset at noon to adjust correctly for DST.
function centralHourUTC(dateStr, hour) {
  const key = `${dateStr}|${hour}`;
  const hit = _bizHourCache.get(key);
  if (hit !== undefined) return new Date(hit);
  const guess = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`);
  let localH = parseInt(_fmtHour.format(guess));
  if (localH === 24) localH = 0;
  const ms = guess.getTime() + (hour - localH) * 3600000;
  _bizHourCache.set(key, ms);
  return new Date(ms);
}

// Returns the same dateStr if it's Mon–Fri, otherwise advances to the next Monday
function getEffectiveBusinessDay(dateStr) {
  const dow = centralDOW(dateStr);
  if (dow === 6) return nextCentralDay(nextCentralDay(dateStr)); // Sat → Mon
  if (dow === 0) return nextCentralDay(dateStr);                 // Sun → Mon
  return dateStr;
}

// Returns the Central-Time business day when the SLA clock first becomes active.
// Uses the full timestamp (not just the date string) so it can detect after-hours submissions.
// Weekend → Monday; weekday after business close → next business day.
// This prevents late-Friday tickets from appearing in Friday's time metrics when
// the team can't act on them until Monday.
function getEffectiveSLADay(issueDateObj) {
  const dateStr = toCentralDateStr(issueDateObj);
  const dow = centralDOW(dateStr);
  if (dow === 0) return nextCentralDay(dateStr);                 // Sun → Mon
  if (dow === 6) return nextCentralDay(nextCentralDay(dateStr)); // Sat → Mon
  // Weekday: check if submitted after business close
  const bizClose = centralHourUTC(dateStr, BIZ_END_H);
  if (issueDateObj >= bizClose) {
    const next = nextCentralDay(dateStr);
    const nextDow = centralDOW(next);
    // Fri after close → Sat → Mon
    if (nextDow === 6) return nextCentralDay(nextCentralDay(next));
    return next;
  }
  return dateStr;
}

// Returns 0 (Sun)…6 (Sat) for a "YYYY-MM-DD" date in Central Time
function centralDOW(dateStr) {
  const hit = _dowCache.get(dateStr);
  if (hit !== undefined) return hit;
  const d = new Date(`${dateStr}T12:00:00Z`); // noon UTC is always same Central calendar day
  const name = _fmtDOW.format(d);
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(name);
  _dowCache.set(dateStr, dow);
  return dow;
}

// Advances a "YYYY-MM-DD" string by one Central calendar day
function nextCentralDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return toCentralDateStr(d);
}

// Milliseconds of business time (Mon–Fri, 8am–5pm Central) between two Date objects
function businessMs(start, end) {
  if (!start || !end || end <= start) return 0;
  let total = 0;
  let dateStr    = toCentralDateStr(start);
  const endStr   = toCentralDateStr(end);
  while (dateStr <= endStr) {
    const dow = centralDOW(dateStr);
    if (dow >= 1 && dow <= 5) {
      const bizOpen  = centralHourUTC(dateStr, BIZ_START_H);
      const bizClose = centralHourUTC(dateStr, BIZ_END_H);
      const oStart = Math.max(start.getTime(), bizOpen.getTime());
      const oEnd   = Math.min(end.getTime(),   bizClose.getTime());
      if (oEnd > oStart) total += oEnd - oStart;
    }
    dateStr = nextCentralDay(dateStr);
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────────────────

// Duplicated verbatim from stats.js.
function getPeriodDates(period) {
  const now = new Date();
  const today = toYMD(now);

  switch (period) {
    case 'yesterday': {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - 1);
      const ymd = toYMD(d);
      return { dateFrom: ymd, dateTo: ymd };
    }
    case 'last7days': {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - 6);
      return { dateFrom: toYMD(d), dateTo: today };
    }
    case 'last30days': {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - 29);
      return { dateFrom: toYMD(d), dateTo: today };
    }
    case 'thisquarter': {
      const month = now.getUTCMonth();
      const quarterStart = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(month / 3) * 3, 1));
      return { dateFrom: toYMD(quarterStart), dateTo: today };
    }
    case 'thisyear':
      return { dateFrom: `${now.getUTCFullYear()}-01-01`, dateTo: today };
    case 'today':
    default:
      return { dateFrom: today, dateTo: today };
  }
}

const PAGE_TIMEOUT_MS = 30_000;
const PAGE_MAX_ATTEMPTS = 3;

async function fetchTicketPage(params, offset, attempt = 1) {
  const qs = new URLSearchParams({ ...params, count: '300', offset: String(offset) });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PAGE_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(`${JITBIT_BASE_URL}Tickets?${qs}`, { headers: jitbitHeaders(), signal: ctrl.signal });
    if (!res.ok) throw Object.assign(new Error('JitBit Tickets failed'), { status: res.status });
    const raw = await res.json();
    // Project only fields used downstream — keeps memory low across thousands of tickets
    return raw.map(({ IssueDate, StartDate, ResolvedDate, UserID }) =>
      ({ IssueDate, StartDate, ResolvedDate, UserID })
    );
  } catch (err) {
    // A hung connection (AbortError), rate-limit (429), or transient 5xx is retriable — without
    // this a single stuck request would stall the whole function until the maxDuration wall.
    const retriable = err.name === 'AbortError' || err.status === 429 || err.status >= 500;
    if (retriable && attempt < PAGE_MAX_ATTEMPTS) {
      console.warn(`[wg-onboarding] page offset=${offset} attempt=${attempt} failed (${err.name || err.status}) after ${Date.now() - t0}ms — retrying`);
      return fetchTicketPage(params, offset, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAllTickets(params, maxPages = 20) {
  const PAGE = 300;
  // JitBit serializes requests per token, so wider waves don't speed fetching up;
  // 5 keeps a modest pipeline without burying the rate limit.
  const WAVE = 5;

  const tickets = [];
  let pagesLoaded = 0;
  let done = false;

  // Signature of the first ticket — detects JitBit's wrap-around pagination bug where it returns
  // offset-0 data again once you exceed the real result count (observed on thisquarter closedParams).
  let firstSig = null;

  // Fire WAVE page requests at once (e.g. offsets 0,300,600,900,1200), await them together,
  // then append in order and stop as soon as any page in the wave is short (< 300 rows).
  while (pagesLoaded < maxPages && !done) {
    const waveSize = Math.min(WAVE, maxPages - pagesLoaded);
    const offsets = Array.from({ length: waveSize }, (_, i) => (pagesLoaded + i) * PAGE);
    const batches = await Promise.all(offsets.map(o => fetchTicketPage(params, o)));

    for (const batch of batches) {
      pagesLoaded++;
      if (firstSig && batch.length > 0 && JSON.stringify(batch[0]) === firstSig) {
        done = true;
        break;
      }
      if (firstSig === null && batch.length > 0) firstSig = JSON.stringify(batch[0]);
      tickets.push(...batch);
      if (batch.length < PAGE) { done = true; break; }
    }
  }

  return tickets;
}

// WG Onboarding SLA targets — 2 business hours to first response, 24 business hours
// to resolution. Deliberately separate names from stats.js's SLA_RESPONSE_MS (4h) /
// SLA_RESOLUTION_MS (72h) — these are a different program with different targets.
const WG_RESPONSE_MS   = 2  * 60 * 60 * 1000;   // 2 hours
const WG_RESOLUTION_MS = 24 * 60 * 60 * 1000;   // 24 hours

// Tickets missing StartDate can't have a response time computed, so they're excluded
// from the denominator (matching stats.js's calcResponseSLA behavior) — but the count
// of excluded tickets is returned so the exclusion is visible rather than silent.
function calcResponseSLA(tickets) {
  const withIssueDate = tickets.filter(t => t.IssueDate);
  const responded = withIssueDate.filter(t => t.StartDate);
  const excluded = withIssueDate.length - responded.length;
  const met = responded.filter(t => businessMs(new Date(t.IssueDate), new Date(t.StartDate)) <= WG_RESPONSE_MS);
  const pct = responded.length > 0 ? Math.round((met.length / responded.length) * 1000) / 10 : null;
  return { target: '02:00', met: met.length, total: responded.length, pct, excluded };
}

function calcResolutionSLA(tickets) {
  const resolved = tickets.filter(t => t.ResolvedDate && t.IssueDate);
  const met = resolved.filter(t => businessMs(new Date(t.IssueDate), new Date(t.ResolvedDate)) <= WG_RESOLUTION_MS);
  const pct = resolved.length > 0 ? Math.round((met.length / resolved.length) * 1000) / 10 : null;
  return { target: '24:00', met: met.length, total: resolved.length, pct };
}

// Duplicated pattern from stats.js's fetchPeriodMetrics — opened tickets (by IssueDate
// in range) and closed tickets (by ResolvedDate/updatedFrom-updatedTo in range),
// both scoped to SECTION_ID.
async function fetchPeriodMetrics(dates) {
  const openParams = { dateFrom: dates.dateFrom, dateTo: dates.dateTo, sectionId: SECTION_ID };
  const closedParams = { statusId: '3', updatedFrom: dates.dateFrom, updatedTo: dates.dateTo, sectionId: SECTION_ID };

  const [openedTickets, closedTickets] = await Promise.all([
    fetchAllTickets(openParams),
    fetchAllTickets(closedParams),
  ]);

  return { openedTickets, closedTickets };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!JITBIT_TOKEN) return res.status(500).json({ error: 'JITBIT_TOKEN env var is not set' });

  const { period = 'today' } = req.query;

  const cacheKey = `wg|${period}`;
  const cached = _serverCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < CACHE_TTL_MS) {
    return res.status(200).json(cached.data);
  }

  try {
    const dates = getPeriodDates(period);
    const metrics = await fetchPeriodMetrics(dates);

    const openedCount = metrics.openedTickets.length;
    const closedCount = metrics.closedTickets.length;

    const payload = {
      ok: true,
      timestamp: new Date().toISOString(),
      period,
      dateFrom: dates.dateFrom,
      dateTo: dates.dateTo,
      openedCount,
      closedCount,
      responseSLA:   calcResponseSLA(metrics.openedTickets),
      resolutionSLA: calcResolutionSLA(metrics.closedTickets),
    };

    _serverCache.set(cacheKey, { data: payload, at: Date.now() });
    return res.status(200).json(payload);
  } catch (err) {
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message });
  }
};
