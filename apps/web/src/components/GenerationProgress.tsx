import { motion } from 'framer-motion';
import type { GenerationStep } from '../types';

// Ordered steps shown to the student (spec §29, §37).
const STEPS: { key: GenerationStep; label: string }[] = [
  { key: 'understanding', label: 'Understanding your learning need' },
  { key: 'planning', label: 'Designing your demonstration' },
  { key: 'creating_files', label: 'Building interactive simulation' },
  { key: 'validating', label: 'Testing the simulation' },
  { key: 'ready', label: 'Ready' },
];

function indexOf(step: GenerationStep): number {
  // 'fixing' sits alongside building/validating.
  if (step === 'fixing') return 3;
  const i = STEPS.findIndex((s) => s.key === step);
  return i === -1 ? 0 : i;
}

export function GenerationProgress({ step, message }: { step: GenerationStep; message: string }) {
  const current = indexOf(step);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8" aria-live="polite">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-sky-400"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
      <div className="w-full max-w-sm space-y-2">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={s.key} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-slate-900'
                    : active
                      ? 'border-sky-400 text-sky-300'
                      : 'border-slate-700 text-slate-600'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={active ? 'text-slate-100' : done ? 'text-slate-400' : 'text-slate-600'}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-slate-400">{message}</p>
    </div>
  );
}
