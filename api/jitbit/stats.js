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

async function fetchStats() {
  const res = await fetch(`${JITBIT_BASE_URL}Stats`, { headers: jitbitHeaders() });
  if (!res.ok) throw Object.assign(new Error('JitBit Stats failed'), { status: res.status });
  return res.json();
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!JITBIT_TOKEN) {
    return res.status(500).json({ error: 'JITBIT_TOKEN env var is not set' });
  }

  try {
    const stats = await fetchStats();

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      totalTickets: stats.TotalTickets,
      newTickets: stats.NewTickets,
      closed: stats.Closed,
      inProcess: stats.InProcess,
    });
  } catch (err) {
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message });
  }
};
