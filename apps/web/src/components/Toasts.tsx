import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';

const STYLES: Record<string, string> = {
  info: 'border-slate-600 bg-slate-800',
  success: 'border-emerald-500/60 bg-emerald-900/40',
  error: 'border-rose-500/60 bg-rose-900/40',
};

export function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-left text-sm text-slate-100 shadow-lg ${STYLES[t.kind]}`}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
