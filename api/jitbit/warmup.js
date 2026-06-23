// Cron target — called every minute by Vercel scheduler (or any external cron).
// Fires GET requests to the stats endpoint for the most time-sensitive periods so
// the in-memory cache is always warm when a user loads the dashboard.
//
// Requires APP_BASE_URL env var set to the deployment root
//   e.g. https://luminate-support-dashboard.vercel.app
// Falls back to VERCEL_URL (auto-set by Vercel on each deploy) when APP_BASE_URL is absent.

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const BASE_URL =
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

// Pre-warm these periods every cron tick.
// 'today' is critical — 25 s TTL, refreshed every 30 s by the frontend.
// 'last7days' covers the Analytics default view with one extra call.
// Historical periods (last30days, thisquarter, thisyear) have long TTLs and
// warm themselves on first user request — no need to cron-hit them.
const WARM_PERIODS = ['today', 'last7days'];

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!BASE_URL) {
    return res.status(500).json({
      error: 'APP_BASE_URL env var not set — add it in Vercel project settings (or set VERCEL_URL)',
    });
  }

  const started = Date.now();

  const results = await Promise.allSettled(
    WARM_PERIODS.map(period =>
      fetch(`${BASE_URL}/api/jitbit/stats?period=${period}`)
        .then(r => ({
          period,
          status:  r.status,
          cached:  r.headers.get('x-cache') ?? 'n/a',
          ms:      Date.now() - started,
        }))
    )
  );

  const warmed = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { period: WARM_PERIODS[i], error: r.reason?.message ?? 'unknown' }
  );

  return res.status(200).json({
    ok:        true,
    baseUrl:   BASE_URL,
    warmed,
    totalMs:   Date.now() - started,
    timestamp: new Date().toISOString(),
  });
};
