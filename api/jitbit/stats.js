const JITBIT_BASE_URL = process.env.JITBIT_BASE_URL || 'https://luminatebank.jitbit.com/helpdesk/api/';
const JITBIT_TOKEN = process.env.JITBIT_TOKEN;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ─── Server-side response cache ───────────────────────────────────────────────
// Module-level Map persists across warm-instance reuse; resets on cold start.
// Works on any Node.js-compatible host — no external dependencies.
const _serverCache = new Map();

const CACHE_TTL_MS = {
  today:        25 * 1000,        // 25 s — just under the 30 s frontend refresh interval
  yesterday:    10 * 60 * 1000,   // 10 min — historical, doesn't change after day ends
  last7days:     5 * 60 * 1000,   // 5 min
  last30days:   10 * 60 * 1000,   // 10 min
  thisquarter:  20 * 60 * 1000,   // 20 min — quarterly view changes slowly
  thisyear:     30 * 60 * 1000,   // 30 min — yearly view barely moves tick-by-tick
};

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

const CENTRAL_TZ   = 'America/Chicago';
const BIZ_START_H  = 8;
const BIZ_END_H    = 17;

// Returns "YYYY-MM-DD" for a Date as seen in Central Time
function toCentralDateStr(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// Returns UTC timestamp for a specific Central-Time hour on a "YYYY-MM-DD" date.
// Uses the Intl offset at noon to adjust correctly for DST.
function centralHourUTC(dateStr, hour) {
  const guess = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`);
  let localH = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TZ, hour: 'numeric', hour12: false,
  }).format(guess));
  if (localH === 24) localH = 0;
  return new Date(guess.getTime() + (hour - localH) * 3600000);
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
  const d = new Date(`${dateStr}T12:00:00Z`); // noon UTC is always same Central calendar day
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TZ, weekday: 'short',
  }).format(d);
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(name);
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

function getPriorPeriodDates(currentDates) {
  const from = new Date(currentDates.dateFrom + 'T00:00:00Z');
  const to = new Date(currentDates.dateTo + 'T00:00:00Z');
  const spanDays = Math.round((to - from) / 86400000) + 1;

  const priorTo = new Date(from);
  priorTo.setUTCDate(priorTo.getUTCDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setUTCDate(priorFrom.getUTCDate() - (spanDays - 1));

  return { dateFrom: toYMD(priorFrom), dateTo: toYMD(priorTo) };
}

async function fetchStats() {
  const res = await fetch(`${JITBIT_BASE_URL}Stats`, { headers: jitbitHeaders() });
  if (!res.ok) throw Object.assign(new Error('JitBit Stats failed'), { status: res.status });
  return res.json();
}

async function fetchTicketPage(params, offset) {
  const qs = new URLSearchParams({ ...params, count: '300', offset: String(offset) });
  const res = await fetch(`${JITBIT_BASE_URL}Tickets?${qs}`, { headers: jitbitHeaders() });
  if (!res.ok) throw Object.assign(new Error('JitBit Tickets failed'), { status: res.status });
  return res.json();
}

async function fetchAllTickets(params, maxPages = 20) {
  const PAGE = 300;
  const PARALLEL = 3; // pages fetched simultaneously — stays well under 90 req/min

  // Fetch first page serially; if not full, we're done
  const first = await fetchTicketPage(params, 0);
  if (first.length < PAGE || maxPages <= 1) return first;

  const tickets = [...first];
  let offset = PAGE;
  let pagesLoaded = 1;

  // Fire PARALLEL pages at once, advance until a batch contains a partial page or we hit maxPages.
  // The maxPages cap prevents an infinite loop when JitBit returns 300 records at every offset
  // for certain date ranges (observed with thisquarter closedParams).
  while (pagesLoaded < maxPages) {
    const batchSize = Math.min(PARALLEL, maxPages - pagesLoaded);
    const offsets = Array.from({ length: batchSize }, (_, i) => offset + i * PAGE);
    const batches = await Promise.all(offsets.map(o => fetchTicketPage(params, o)));

    let done = false;
    for (const batch of batches) {
      pagesLoaded++;
      tickets.push(...batch);
      if (batch.length < PAGE) { done = true; break; }
    }

    if (done) break;
    offset += batchSize * PAGE;
  }

  return tickets;
}

async function fetchTechs() {
  try {
    const res = await fetch(`${JITBIT_BASE_URL}Users?listMode=techs&count=500`, { headers: jitbitHeaders() });
    if (!res.ok) return { accessible: false, users: null };
    const users = await res.json();
    return { accessible: true, users };
  } catch {
    return { accessible: false, users: null };
  }
}

const SLA_RESPONSE_MS  = 4  * 60 * 60 * 1000;   // 4 hours
const SLA_RESOLUTION_MS = 72 * 60 * 60 * 1000;  // 72 hours

function formatDuration(ms) {
  if (ms <= 0) return '0h 0m';
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function calcResponseSLA(tickets) {
  const responded = tickets.filter(t => t.StartDate && t.IssueDate);
  const met = responded.filter(t => businessMs(new Date(t.IssueDate), new Date(t.StartDate)) <= SLA_RESPONSE_MS);
  const pct = responded.length > 0 ? Math.round((met.length / responded.length) * 1000) / 10 : null;
  return { target: '04:00', met: met.length, total: responded.length, pct };
}

function calcResolutionSLA(tickets) {
  const resolved = tickets.filter(t => t.ResolvedDate && t.IssueDate);
  const met = resolved.filter(t => businessMs(new Date(t.IssueDate), new Date(t.ResolvedDate)) <= SLA_RESOLUTION_MS);
  const pct = resolved.length > 0 ? Math.round((met.length / resolved.length) * 1000) / 10 : null;
  return { target: '72:00', met: met.length, total: resolved.length, pct };
}

function calcResponseTime(tickets) {
  const diffs = tickets
    .filter(t => t.StartDate && t.IssueDate)
    .map(t => businessMs(new Date(t.IssueDate), new Date(t.StartDate)));
  if (!diffs.length) return null;
  return formatDuration(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function calcResolutionTime(tickets) {
  const diffs = tickets
    .filter(t => t.ResolvedDate && t.IssueDate)
    .map(t => businessMs(new Date(t.IssueDate), new Date(t.ResolvedDate)));
  if (!diffs.length) return null;
  return formatDuration(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function safeDelta(current, prior) {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 10000) / 100;
}

// Build [{date: 'Jun 5', opened: N, closed: N}, ...] from ticket arrays
function buildTrendData(openedTickets, closedTickets, dates) {
  const days = {};
  // Weekdays only — same principle as buildTimeData; weekends create misleading dips
  const from = new Date(dates.dateFrom + 'T12:00:00Z');
  const to   = new Date(dates.dateTo   + 'T12:00:00Z');
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = toYMD(d);
    if (centralDOW(dateStr) >= 1 && centralDOW(dateStr) <= 5) {
      days[dateStr] = { opened: 0, closed: 0 };
    }
  }
  for (const t of openedTickets) {
    // Use Central Time date, then roll weekends to Monday so nothing is dropped
    const day = t.IssueDate
      ? getEffectiveBusinessDay(toCentralDateStr(new Date(t.IssueDate)))
      : null;
    if (day && days[day]) days[day].opened++;
  }
  for (const t of closedTickets) {
    const day = t.ResolvedDate
      ? getEffectiveBusinessDay(toCentralDateStr(new Date(t.ResolvedDate)))
      : null;
    if (day && days[day]) days[day].closed++;
  }
  return Object.entries(days).map(([date, counts]) => {
    const dateObj   = new Date(date + 'T12:00:00Z');
    const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekday   = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    return { date: shortDate, label: `${weekday}, ${shortDate}`, ...counts };
  });
}

// Build [{day: 'Mon', response: 0.7, resolution: 32.5}, ...] — weekdays only,
// times measured in business hours (Mon–Fri 8am–5pm Central).
// Each ticket is attributed to the day the SLA clock first became active
// (weekend and after-hours submissions roll to the next business day).
function buildTimeData(openedTickets, dates) {
  const days = {};
  // Anchor at noon UTC so toYMD and toCentralDateStr agree on the calendar date
  const from = new Date(dates.dateFrom + 'T12:00:00Z');
  const to   = new Date(dates.dateTo   + 'T12:00:00Z');
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = toYMD(d);
    if (centralDOW(dateStr) >= 1 && centralDOW(dateStr) <= 5) {
      days[dateStr] = { rt: [], rst: [] };
    }
  }
  for (const t of openedTickets) {
    if (!t.IssueDate) continue;
    const issueDateObj = new Date(t.IssueDate);
    // Use Central Time date + after-hours detection to find the right business day
    const day = getEffectiveSLADay(issueDateObj);
    if (!days[day]) continue;
    if (t.StartDate) {
      days[day].rt.push(businessMs(issueDateObj, new Date(t.StartDate)));
    }
    if (t.ResolvedDate) {
      days[day].rst.push(businessMs(issueDateObj, new Date(t.ResolvedDate)));
    }
  }
  const avgHours = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length / 360000) / 10 : 0;
  return Object.entries(days).map(([date, d]) => {
    const dateObj   = new Date(date + 'T12:00:00Z');
    const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekday   = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      day:        shortDate,
      label:      `${weekday}, ${shortDate}`,
      response:   avgHours(d.rt),
      resolution: avgHours(d.rst),
    };
  });
}

async function fetchPeriodMetrics(dates, sectionId) {
  const openParams = { dateFrom: dates.dateFrom, dateTo: dates.dateTo };
  if (sectionId) openParams.sectionId = sectionId;

  const closedParams = { statusId: '3', updatedFrom: dates.dateFrom, updatedTo: dates.dateTo };
  if (sectionId) closedParams.sectionId = sectionId;

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

  const { period = 'today', section } = req.query;
  const sectionId = section || null;
  const isDetailMode = req.query.detail === 'true';
  const isLongPeriod = period === 'thisquarter' || period === 'thisyear';

  const cacheKey = `${period}|${sectionId ?? ''}`;
  const ttl = CACHE_TTL_MS[period] ?? 25_000;
  const cached = _serverCache.get(cacheKey);
  if (cached) {
    const elapsed = Date.now() - cached.at;
    if (elapsed < ttl) {
      const remainingS = Math.max(1, Math.floor((ttl - elapsed) / 1000));
      res.setHeader('Cache-Control', `public, max-age=${remainingS}, stale-while-revalidate=${Math.floor(ttl / 1000)}`);
      return res.status(200).json(cached.data);
    }
  }

  // Fast summary path for long periods — returns Stats+Techs in ~2s without ticket pagination.
  // The frontend receives detailPending:true and fires a ?detail=true follow-up in the background.
  if (isLongPeriod && !isDetailMode) {
    try {
      const now = new Date();
      const currentDates = getPeriodDates(period);
      const [stats, techUsers] = await Promise.all([fetchStats(), fetchTechs()]);

      let techsOnline = [], techsOOO = [];
      const techsAccessible = techUsers.accessible;
      if (techUsers.accessible && techUsers.users) {
        const tenMinAgo = new Date(now - 10 * 60 * 1000);
        techsOnline = techUsers.users
          .filter(u => u.LastSeen && new Date(u.LastSeen) >= tenMinAgo)
          .map(u => u.Email || u.Username);
        techsOOO = techUsers.users
          .filter(u => u.OutOfOffice === true)
          .map(u => u.Email || u.Username);
      }

      return res.status(200).json({
        ok: true,
        timestamp: now.toISOString(),
        period,
        detailPending: true,
        dateFrom: currentDates.dateFrom,
        dateTo: currentDates.dateTo,
        totalTickets: stats.TotalTickets,
        newTickets: stats.NewTickets,
        closed: stats.Closed,
        inProcess: stats.InProcess,
        openedCount:      null,
        closedCount:      null,
        uniqueSubmitters: null,
        _debugTicketKeys: [],
        ticketsPerHour:   null,
        ticketsPerDay:    null,
        responseTime:     null,
        resolutionTime:   null,
        techsOnline,
        techsOOO,
        techsAccessible,
        responseSLA:   null,
        resolutionSLA: null,
        trendData:     [],
        timeData:      [],
        deltas:        null,
      });
    } catch (err) {
      const status = err.status === 401 ? 401 : 502;
      return res.status(status).json({ error: err.message });
    }
  }

  // Full computation path — long periods reach here only when ?detail=true.
  // Result is cached so subsequent requests (including fast-path re-checks) serve from cache.
  try {
    const currentDates = getPeriodDates(period);
    const priorDates = getPriorPeriodDates(currentDates);
    const now = new Date();
    const currentHour = now.getUTCHours();

    // Skip prior-period fetch for long periods — too many paginated calls, delta not meaningful at year scale
    const skipDelta = period === 'thisquarter' || period === 'thisyear';

    const [stats, techUsers, currentMetrics, priorMetrics, sectionInProcess] = await Promise.all([
      fetchStats(),
      fetchTechs(),
      fetchPeriodMetrics(currentDates, sectionId),
      skipDelta
        ? Promise.resolve({ openedTickets: [], closedTickets: [] })
        : fetchPeriodMetrics(priorDates, sectionId),
      // When a section is active, count in-progress tickets for that section directly.
      // Without a section, the Stats endpoint already gives the global count.
      sectionId
        ? fetchAllTickets({ statusId: '2', sectionId }).then(t => t.length)
        : Promise.resolve(null),
    ]);

    const openedCount        = currentMetrics.openedTickets.length;
    const closedCount        = currentMetrics.closedTickets.length;
    const uniqueSubmitters   = new Set(currentMetrics.openedTickets.map(t => t.UserID).filter(id => id != null)).size;
    const ticketsPerHour     = currentHour > 0 ? Math.round((openedCount / currentHour) * 100) / 100 : 0;
    const ticketsPerDay      = openedCount;

    const responseTime   = calcResponseTime(currentMetrics.openedTickets);
    const resolutionTime = calcResolutionTime(currentMetrics.closedTickets);

    const priorOpened          = priorMetrics.openedTickets.length;
    const priorClosed          = priorMetrics.closedTickets.length;
    const priorUniqueSubmitters = new Set(priorMetrics.openedTickets.map(t => t.UserID).filter(id => id != null)).size;
    const priorPerHour         = currentHour > 0 ? Math.round((priorOpened / currentHour) * 100) / 100 : 0;
    const priorPerDay          = priorOpened;

    let techsOnline = [];
    let techsOOO = [];
    const techsAccessible = techUsers.accessible;
    if (techUsers.accessible && techUsers.users) {
      const tenMinAgo = new Date(now - 10 * 60 * 1000);
      techsOnline = techUsers.users
        .filter(u => u.LastSeen && new Date(u.LastSeen) >= tenMinAgo)
        .map(u => u.Email || u.Username);
      techsOOO = techUsers.users
        .filter(u => u.OutOfOffice === true)
        .map(u => u.Email || u.Username);
    }

    const payload = {
      ok: true,
      timestamp: now.toISOString(),
      period,
      dateFrom: currentDates.dateFrom,
      dateTo: currentDates.dateTo,
      totalTickets: stats.TotalTickets,
      newTickets: stats.NewTickets,
      closed: stats.Closed,
      inProcess:  sectionInProcess !== null ? sectionInProcess : stats.InProcess,
      openedCount,
      closedCount,
      uniqueSubmitters,
      _debugTicketKeys: currentMetrics.openedTickets.length > 0 ? Object.keys(currentMetrics.openedTickets[0]) : [],
      ticketsPerHour,
      ticketsPerDay,
      responseTime,
      resolutionTime,
      techsOnline,
      techsOOO,
      techsAccessible,
      responseSLA:   calcResponseSLA(currentMetrics.openedTickets),
      resolutionSLA: calcResolutionSLA(currentMetrics.closedTickets),
      trendData: buildTrendData(currentMetrics.openedTickets, currentMetrics.closedTickets, currentDates),
      timeData:  buildTimeData(currentMetrics.openedTickets, currentDates),
      deltas: {
        opened:           safeDelta(openedCount,       priorOpened),
        closed:           safeDelta(closedCount,       priorClosed),
        uniqueSubmitters: safeDelta(uniqueSubmitters,  priorUniqueSubmitters),
        perHour:          safeDelta(ticketsPerHour,    priorPerHour),
        perDay:           safeDelta(ticketsPerDay,     priorPerDay),
      },
    };

    _serverCache.set(cacheKey, { data: payload, at: Date.now() });

    // Evict entries older than 30 min to prevent unbounded growth on long-lived instances
    if (_serverCache.size > 100) {
      const cutoff = Date.now() - 30 * 60_000;
      for (const [k, v] of _serverCache) {
        if (v.at < cutoff) _serverCache.delete(k);
      }
    }

    const maxAge = Math.floor(ttl / 1000);
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    return res.status(200).json(payload);
  } catch (err) {
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message });
  }
};
