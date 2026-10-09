import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { GenerationStatus } from '../types';

/**
 * Polls GET /api/sessions/:id/status every ~1.5s while active (spec §36).
 * Stops polling once the status is terminal (ready/error).
 */
export function useGenerationStatus(sessionId: string | undefined, active: boolean) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId || !active) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const s = await api.getStatus(sessionId);
        if (cancelled) return;
        setStatus(s);
        setError(null);
        if (s.status === 'ready' || s.status === 'error') return; // terminal; stop
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Status check failed');
      }
      if (!cancelled) timer.current = window.setTimeout(tick, 1500);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [sessionId, active]);

  return { status, error };
}
