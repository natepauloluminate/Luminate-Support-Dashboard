import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_PROXY_URL || '';

export const PERIODS = ['today', 'yesterday', 'last7days', 'last30days', 'thisquarter', 'thisyear'];

// Periods grouped by how fast they are to fetch
// Each group is loaded sequentially — fast periods first so the UI is usable immediately
const LOAD_ORDER = [
  ['today'],                              // ~2-3 s  — shows data immediately
  ['yesterday', 'last7days'],             // ~4-6 s  — parallel, small datasets
  ['last30days'],                         // ~8-15 s — moderate
  ['thisquarter', 'thisyear'],            // ~20-40 s — slow; loaded last
];

// Module-level cache — survives React re-renders and SPA navigation
const _cache = new Map();

export async function fetchStat(period, section) {
  const key = `${period}|${section}`;
  if (_cache.has(key)) return _cache.get(key);
  const params = new URLSearchParams({ period });
  if (section) params.set('section', section);
  const res = await fetch(`${BASE_URL}/api/jitbit/stats?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  _cache.set(key, data);
  return data;
}

function getCached(period, section) {
  return _cache.get(`${period}|${section}`);
}

export function useStatsCache(section) {
  const [byPeriod, setByPeriod] = useState(() => {
    const init = {};
    for (const p of PERIODS) {
      const v = getCached(p, section);
      if (v) init[p] = v;
    }
    return init;
  });
  const [loading,  setLoading]  = useState(!getCached('today', section));
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // If everything for this section is already cached, switch is instant
    if (PERIODS.every(p => getCached(p, section))) {
      const all = {};
      for (const p of PERIODS) all[p] = getCached(p, section);
      setByPeriod(all);
      setLoading(false);
      setLastSync(prev => prev ?? new Date());
      // Still set up the refresh interval below
    } else {
      setLoading(!getCached('today', section));

      (async () => {
        for (const group of LOAD_ORDER) {
          if (cancelled) return;

          // Only fetch periods not already cached
          const needed = group.filter(p => !getCached(p, section));
          if (needed.length) {
            await Promise.allSettled(needed.map(p => fetchStat(p, section)));
          }
          if (cancelled) return;

          // Update state for everything in this group (cached or just fetched)
          const groupData = {};
          for (const p of group) {
            const v = getCached(p, section);
            if (v) groupData[p] = v;
          }
          setByPeriod(prev => ({ ...prev, ...groupData }));

          // Clear loading as soon as today is ready
          if (group.includes('today')) {
            const todayData = getCached('today', section);
            if (todayData) {
              setLoading(false);
              setLastSync(new Date());
              setError(null);
            } else {
              setLoading(false);
              setError('Failed to load — check connection');
              return;
            }
          }
        }
      })();
    }

    // Only refresh "today" on the 30 s interval — historical periods don't change mid-session.
    // Uses cache: 'no-cache' to bypass the browser's HTTP cache and always get fresh data.
    async function refreshToday() {
      if (document.hidden) return;
      try {
        const params = new URLSearchParams({ period: 'today' });
        if (section) params.set('section', section);
        const res = await fetch(`${BASE_URL}/api/jitbit/stats?${params}`, { cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        _cache.set(`today|${section}`, data);
        if (!cancelled) {
          setByPeriod(prev => ({ ...prev, today: data }));
          setLastSync(new Date());
        }
      } catch { /* silent */ }
    }

    const intervalId = setInterval(refreshToday, 30000);

    function handleVisibility() {
      if (!document.hidden) refreshToday();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [section]);

  return {
    getStats: (period) => byPeriod[period] ?? null,
    loading,
    error,
    lastSync,
  };
}
