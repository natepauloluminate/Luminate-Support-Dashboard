import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_PROXY_URL || '';

export const PERIODS = ['today', 'yesterday', 'last7days', 'last30days', 'thisquarter', 'thisyear'];

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

export function useStatsCache(section) {
  const [byPeriod, setByPeriod] = useState(() => {
    // Seed from cache on first render so switching back to a seen section is instant
    const init = {};
    for (const p of PERIODS) {
      const key = `${p}|${section}`;
      if (_cache.has(key)) init[p] = _cache.get(key);
    }
    return init;
  });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const allCached = PERIODS.every(p => _cache.has(`${p}|${section}`));

    if (allCached) {
      // Already have everything for this section — instant switch, no loading flash
      const fromCache = {};
      for (const p of PERIODS) fromCache[p] = _cache.get(`${p}|${section}`);
      setByPeriod(fromCache);
      setLoading(false);
      setLastSync(prev => prev ?? new Date());
    } else {
      setLoading(true);
      Promise.allSettled(PERIODS.map(p => fetchStat(p, section))).then(results => {
        if (cancelled) return;
        const newData = {};
        let anyOk = false;
        for (let i = 0; i < PERIODS.length; i++) {
          if (results[i].status === 'fulfilled') {
            newData[PERIODS[i]] = results[i].value;
            anyOk = true;
          }
        }
        setByPeriod(prev => ({ ...prev, ...newData }));
        setLoading(false);
        if (anyOk) { setLastSync(new Date()); setError(null); }
        else setError('Failed to load — check connection');
      });
    }

    // Only refresh "today" on the 30s interval — historical periods never change mid-session
    async function refreshToday() {
      if (document.hidden) return;
      _cache.delete(`today|${section}`);
      try {
        const data = await fetchStat('today', section);
        if (!cancelled) {
          setByPeriod(prev => ({ ...prev, today: data }));
          setLastSync(new Date());
        }
      } catch { /* silent — error state preserved from last successful load */ }
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
