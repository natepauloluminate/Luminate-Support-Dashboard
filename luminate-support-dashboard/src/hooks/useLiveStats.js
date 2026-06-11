import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_PROXY_URL || '';

export function useLiveStats(period, section) {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let stale = false;

    async function load() {
      const params = new URLSearchParams({ period });
      if (section) params.set('section', section);

      try {
        const res = await fetch(`${BASE_URL}/api/jitbit/stats?${params}`);
        if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
        const json = await res.json();
        if (!stale) {
          setData(json);
          setError(null);
          setLastSync(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (!stale) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();

    const intervalId = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);

    function handleVisibility() {
      if (!document.hidden) load();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stale = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [period, section]);

  return { data, loading, error, lastSync };
}
