import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { useGenerationStatus } from '../hooks/useGenerationStatus';
import { BriefForm } from '../components/BriefForm';
import { VoicePanel } from '../components/VoicePanel';
import { GenerationProgress } from '../components/GenerationProgress';
import { SimulationViewer } from '../components/SimulationViewer';
import type { LearningBrief, Session as SessionData } from '../types';

type Phase = 'loading' | 'intake' | 'generating' | 'ready' | 'error';

function startedPhase(s: SessionData): Phase {
  if (s.simulation.status === 'ready') return 'ready';
  if (s.simulation.status === 'error' || s.status === 'error') return 'error';
  if (['understanding', 'generating', 'validating'].includes(s.status)) return 'generating';
  return 'intake';
}

export function Session() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('loading');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [simUrl, setSimUrl] = useState<string | null>(null);
  const announced = useRef(false);

  const { status } = useGenerationStatus(id, phase === 'generating');

  // Initial load: config + session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfg, session] = await Promise.all([api.getConfig(), api.getSession(id)]);
        if (cancelled) return;
        setVoiceEnabled(cfg.voiceEnabled);
        const p = startedPhase(session);
        setPhase(p);
        if (p === 'ready') {
          const sim = await api.getSimulation(id);
          if (!cancelled) setSimUrl(sim.url);
        }
      } catch (e) {
        if (!cancelled) {
          toast.push(e instanceof Error ? e.message : 'Could not load session', 'error');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // While in intake, watch for a voice-triggered generation start.
  useEffect(() => {
    if (phase !== 'intake') return;
    const t = window.setInterval(async () => {
      try {
        const s = await api.getSession(id);
        const p = startedPhase(s);
        if (p !== 'intake') setPhase(p);
      } catch {
        /* transient */
      }
    }, 2500);
    return () => window.clearInterval(t);
  }, [phase, id]);

  // React to generation status reaching a terminal state.
  useEffect(() => {
    if (!status) return;
    if (status.status === 'ready' && !announced.current) {
      announced.current = true;
      api
        .getSimulation(id)
        .then((sim) => {
          setSimUrl(sim.url);
          setPhase('ready');
          toast.push('Simulation ready', 'success');
        })
        .catch(() => setPhase('error'));
    }
    if (status.status === 'error') {
      setPhase('error');
      toast.push('Simulation generation failed', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submitBrief = useCallback(
    async (brief: LearningBrief) => {
      try {
        announced.current = false;
        await api.saveBrief(id, brief);
        await api.generate(id, brief);
        setPhase('generating');
        toast.push('Simulation generation started', 'info');
      } catch (e) {
        toast.push(e instanceof Error ? e.message : 'Could not start generation', 'error');
      }
    },
    [id, toast],
  );

  const tryAgain = useCallback(async () => {
    try {
      announced.current = false;
      await api.generate(id);
      setPhase('generating');
    } catch (e) {
      toast.push(e instanceof Error ? e.message : 'Could not retry', 'error');
    }
  }, [id, toast]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <Link to="/" className="font-semibold text-slate-100">
          AI Learning Lab
        </Link>
        <Link to="/history" className="text-sm text-slate-400 hover:text-slate-200">
          History
        </Link>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* Left: voice / brief / status */}
        <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Voice Agent
          </h2>

          {phase === 'loading' && <p className="text-slate-400">Loading…</p>}

          {phase === 'intake' && (
            <div className="space-y-5">
              {voiceEnabled ? (
                <>
                  <VoicePanel sessionId={id} />
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="h-px flex-1 bg-slate-700" /> or type it{' '}
                    <span className="h-px flex-1 bg-slate-700" />
                  </div>
                </>
              ) : (
                <p className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-400">
                  Voice isn't configured on this server. Describe your learning need below and
                  we'll build a demonstration.
                </p>
              )}
              <BriefForm onSubmit={submitBrief} />
            </div>
          )}

          {phase === 'generating' && (
            <p className="text-sm text-slate-400">
              Building your demonstration… this usually takes a few moments.
            </p>
          )}

          {phase === 'ready' && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-300">✓ Demonstration ready — experiment with it!</p>
              {voiceEnabled ? (
                <VoicePanel sessionId={id} />
              ) : (
                <Link to="/" className="inline-block text-sm text-sky-400 hover:text-sky-300">
                  Start a new session →
                </Link>
              )}
            </div>
          )}

          {phase === 'error' && (
            <p className="text-sm text-rose-300">
              Something went wrong. Use “Try Again” on the right.
            </p>
          )}
        </section>

        {/* Right: simulation / progress */}
        <section className="min-h-[60vh] rounded-xl border border-slate-800 bg-slate-900/40">
          {phase === 'ready' && simUrl ? (
            <SimulationViewer url={simUrl} />
          ) : phase === 'generating' ? (
            <GenerationProgress
              step={status?.step ?? 'understanding'}
              message={status?.message ?? 'Starting…'}
            />
          ) : phase === 'error' ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-lg font-medium text-slate-100">Something went wrong</p>
              <p className="max-w-sm text-sm text-slate-400">
                We couldn't build the demonstration. Please try again.
              </p>
              <button
                type="button"
                onClick={tryAgain}
                className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              >
                Try Again
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full items-center justify-center p-8 text-center text-slate-500"
            >
              Your interactive demonstration will appear here.
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
