import { useEffect } from 'react';
import { useLiveKit } from '../hooks/useLiveKit';
import { VoiceOrb } from './VoiceOrb';
import { useToast } from '../hooks/useToast';

/**
 * Voice conversation panel (spec §28, §47). Connects to the LiveKit room for
 * this session; the voice agent runs server-side and produces the Learning
 * Brief, after which generation starts automatically. Rendered only when the
 * backend reports voice is configured — otherwise the typed BriefForm is used.
 */
export function VoicePanel({ sessionId }: { sessionId: string }) {
  const { state, agentState, error, connect, disconnect } = useLiveKit();
  const toast = useToast();

  useEffect(() => {
    if (state === 'connected') toast.push('Connected to AI', 'success');
    if (state === 'error' && error) toast.push(error, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === 'connected') {
    return (
      <div className="flex flex-col items-center gap-4">
        <VoiceOrb agentState={agentState} />
        <p className="text-center text-xs text-slate-400">
          Talk about what you're struggling with. I'll build a demonstration when I understand.
        </p>
        <button
          type="button"
          onClick={disconnect}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-rose-400 hover:text-rose-300"
        >
          End Conversation
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="text-sm text-slate-300">Start a voice conversation with the AI tutor.</p>
      <button
        type="button"
        onClick={() => connect(sessionId)}
        disabled={state === 'connecting'}
        className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
      >
        {state === 'connecting' ? 'Connecting…' : '🎙 Start talking'}
      </button>
    </div>
  );
}
