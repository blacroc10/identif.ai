import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      if (mountedRef.current) setData(result.data ?? result);
      return result;
    } catch (err) {
      if (mountedRef.current) setError(err.message);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [immediate]);

  return { data, loading, error, execute, setData };
}
