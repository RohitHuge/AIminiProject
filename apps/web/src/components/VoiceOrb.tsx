import { motion } from 'framer-motion';
import type { AgentState } from '../hooks/useLiveKit';

const LABELS: Record<string, string> = {
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

const COLORS: Record<string, string> = {
  listening: '#38bdf8',
  thinking: '#a78bfa',
  speaking: '#34d399',
};

/** Animated voice indicator (spec §47). Subtle, not over-animated. */
export function VoiceOrb({ agentState }: { agentState: AgentState }) {
  const active = agentState ?? 'listening';
  const color = COLORS[active];
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute h-full w-full rounded-full"
          style={{ background: color, opacity: 0.25 }}
          animate={{ scale: active === 'speaking' ? [1, 1.25, 1] : [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: active === 'thinking' ? 2 : 1.4, ease: 'easeInOut' }}
        />
        <motion.span
          className="h-12 w-12 rounded-full"
          style={{ background: color }}
          animate={{ scale: active === 'thinking' ? [1, 0.85, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {LABELS[active]}…
      </p>
    </div>
  );
}
