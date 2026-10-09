import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';

export function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const { sessionId } = await api.createSession();
      navigate(`/session/${sessionId}`);
    } catch (e) {
      toast.push(e instanceof Error ? e.message : 'Could not start a session', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl space-y-6"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-50">AI Interactive Learning Lab</h1>
        <p className="text-lg text-slate-400">
          Talk about something you don't understand. We'll build an interactive demonstration
          targeted at exactly what's confusing you.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="rounded-xl bg-sky-500 px-8 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start Learning'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="text-sm text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            View History
          </button>
        </div>
      </motion.div>
    </div>
  );
}
