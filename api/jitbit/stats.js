const JITBIT_BASE_URL = process.env.JITBIT_BASE_URL || 'https://luminatebank.jitbit.com/helpdesk/api/';
const JITBIT_TOKEN = process.env.JITBIT_TOKEN;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

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

async function fetchAllTickets(params) {
  const tickets = [];
  let offset = 0;

  while (true) {
    const qs = new URLSearchParams({ ...params, count: '300', offset: String(offset) });
    const res = await fetch(`${JITBIT_BASE_URL}Tickets?${qs}`, { headers: jitbitHeaders() });
    if (!res.ok) throw Object.assign(new Error('JitBit Tickets failed'), { status: res.status });
    const batch = await res.json();
    tickets.push(...batch);
    if (batch.length < 300) break;
    offset += 300;
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
  const met = responded.filter(t => (new Date(t.StartDate) - new Date(t.IssueDate)) <= SLA_RESPONSE_MS && (new Date(t.StartDate) - new Date(t.IssueDate)) >= 0);
  const pct = responded.length > 0 ? Math.round((met.length / responded.length) * 1000) / 10 : null;
  return { target: '04:00', met: met.length, total: responded.length, pct };
}

function calcResolutionSLA(tickets) {
  const resolved = tickets.filter(t => t.ResolvedDate && t.IssueDate);
  const met = resolved.filter(t => (new Date(t.ResolvedDate) - new Date(t.IssueDate)) <= SLA_RESOLUTION_MS && (new Date(t.ResolvedDate) - new Date(t.IssueDate)) >= 0);
  const pct = resolved.length > 0 ? Math.round((met.length / resolved.length) * 1000) / 10 : null;
  return { target: '72:00', met: met.length, total: resolved.length, pct };
}

function calcResponseTime(tickets) {
  const diffs = tickets
    .filter(t => t.StartDate && t.IssueDate)
    .map(t => new Date(t.StartDate) - new Date(t.IssueDate))
    .filter(d => d >= 0);
  if (!diffs.length) return null;
  return formatDuration(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function calcResolutionTime(tickets) {
  const diffs = tickets
    .filter(t => t.ResolvedDate && t.IssueDate)
    .map(t => new Date(t.ResolvedDate) - new Date(t.IssueDate))
    .filter(d => d >= 0);
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
  const from = new Date(dates.dateFrom + 'T00:00:00Z');
  const to   = new Date(dates.dateTo   + 'T00:00:00Z');
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    days[toYMD(d)] = { opened: 0, closed: 0 };
  }
  for (const t of openedTickets) {
    const day = t.IssueDate?.slice(0, 10);
    if (day && days[day]) days[day].opened++;
  }
  for (const t of closedTickets) {
    const day = t.ResolvedDate?.slice(0, 10);
    if (day && days[day]) days[day].closed++;
  }
  return Object.entries(days).map(([date, counts]) => ({
    date: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...counts,
  }));
}

// Build [{day: 'Mon', response: 0.7, resolution: 32.5}, ...] from opened tickets
function buildTimeData(openedTickets, dates) {
  const days = {};
  const from = new Date(dates.dateFrom + 'T00:00:00Z');
  const to   = new Date(dates.dateTo   + 'T00:00:00Z');
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    days[toYMD(d)] = { rt: [], rst: [] };
  }
  for (const t of openedTickets) {
    const day = t.IssueDate?.slice(0, 10);
    if (!day || !days[day]) continue;
    if (t.StartDate) {
      const ms = new Date(t.StartDate) - new Date(t.IssueDate);
      if (ms >= 0) days[day].rt.push(ms);
    }
    if (t.ResolvedDate) {
      const ms = new Date(t.ResolvedDate) - new Date(t.IssueDate);
      if (ms >= 0) days[day].rst.push(ms);
    }
  }
  const avgHours = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length / 360000) / 10 : 0;
  return Object.entries(days).map(([date, d]) => {
    const dateObj  = new Date(date + 'T12:00:00Z');
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

    return res.status(200).json({
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
    });
  } catch (err) {
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message });
  }
};
