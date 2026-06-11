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
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDuration(ms) {
  if (ms <= 0) return '0h 0m';
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
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

    const [stats, techUsers, currentMetrics, priorMetrics] = await Promise.all([
      fetchStats(),
      fetchTechs(),
      fetchPeriodMetrics(currentDates, sectionId),
      fetchPeriodMetrics(priorDates, sectionId),
    ]);

    const openedCount = currentMetrics.openedTickets.length;
    const closedCount = currentMetrics.closedTickets.length;
    const ticketsPerHour = currentHour > 0 ? Math.round((openedCount / currentHour) * 100) / 100 : 0;
    const ticketsPerDay = openedCount;

    const responseTime = calcResponseTime(currentMetrics.openedTickets);
    const resolutionTime = calcResolutionTime(currentMetrics.closedTickets);

    const priorOpened = priorMetrics.openedTickets.length;
    const priorClosed = priorMetrics.closedTickets.length;
    const priorPerHour = currentHour > 0 ? Math.round((priorOpened / currentHour) * 100) / 100 : 0;
    const priorPerDay = priorOpened;

    let techsOnline = [];
    let techsOOO = [];
    if (techUsers) {
      const tenMinAgo = new Date(now - 10 * 60 * 1000);
      techsOnline = techUsers
        .filter(u => u.LastSeen && new Date(u.LastSeen) >= tenMinAgo)
        .map(u => u.Email || u.Username);
      techsOOO = techUsers
        .filter(u => u.OutOfOffice === true)
        .map(u => u.Email || u.Username);
    }

    return res.status(200).json({
      ok: true,
      timestamp: now.toISOString(),
      period,
      dateFrom: currentDates.dateFrom,
      dateTo: currentDates.dateTo,
      // All-time stats from /api/Stats
      totalTickets: stats.TotalTickets,
      newTickets: stats.NewTickets,
      closed: stats.Closed,
      inProcess: stats.InProcess,
      // Period-based ticket metrics
      openedCount,
      closedCount,
      ticketsPerHour,
      ticketsPerDay,
      responseTime,
      resolutionTime,
      // Team status (empty arrays if admin access unavailable)
      techsOnline,
      techsOOO,
      // Signed % deltas vs prior period (null when prior = 0)
      deltas: {
        opened: safeDelta(openedCount, priorOpened),
        closed: safeDelta(closedCount, priorClosed),
        perHour: safeDelta(ticketsPerHour, priorPerHour),
        perDay: safeDelta(ticketsPerDay, priorPerDay),
      },
    });
  } catch (err) {
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message });
  }
};
