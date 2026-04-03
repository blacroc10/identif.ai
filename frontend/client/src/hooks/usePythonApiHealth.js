import { useState, useEffect, useCallback } from 'react';
import { forensicAPI } from '../services/pythonApi';

export function usePythonApiHealth() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [gpu, setGpu]       = useState(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const res = await forensicAPI.health();
      setStatus('online');
      setGpu(res.data?.gpu || null);
    } catch {
      setStatus('offline');
      setGpu(null);
    }
  }, []);

  useEffect(() => {
    check();
    // Re-check every 30 seconds
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  return { status, gpu, check };
}