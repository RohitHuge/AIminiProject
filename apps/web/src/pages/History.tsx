import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import type { SessionSummary } from '../types';

const STATUS_BADGE: Record<string, string> = {
  ready: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  error: 'bg-rose-900/50 text-rose-300 border-rose-700',
};

export function History() {
  const navigate = useNavigate();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    api
      .listSessions()
      .then(setSessions)
      .catch((e) => {
        toast.push(e instanceof Error ? e.message : 'Could not load history', 'error');
        setSessions([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Previous Sessions</h1>
        <Link to="/" className="text-sm text-sky-400 hover:text-sky-300">
          ← New session
        </Link>
      </div>

      {sessions === null ? (
        <p className="text-slate-400">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-slate-400">No sessions yet. Start one from the home page.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-slate-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{s.subject ?? '—'}</p>
                  <p className="font-medium text-slate-100">{s.topic ?? 'Untitled topic'}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                    STATUS_BADGE[s.status] ?? 'border-slate-600 bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(s.createdAt).toLocaleString()}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/session/${s.id}`)}
                className="mt-3 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-600"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
