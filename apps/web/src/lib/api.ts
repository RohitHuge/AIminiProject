import type {
  GenerationStatus,
  LearningBrief,
  LiveKitToken,
  Session,
  SessionSummary,
} from '../types';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getConfig(): Promise<{ voiceEnabled: boolean }> {
    return json(await fetch('/api/config'));
  },

  async createSession(): Promise<{ sessionId: string }> {
    return json(await fetch('/api/sessions', { method: 'POST' }));
  },

  async listSessions(): Promise<SessionSummary[]> {
    return json(await fetch('/api/sessions'));
  },

  async getSession(id: string): Promise<Session> {
    return json(await fetch(`/api/sessions/${id}`));
  },

  async saveBrief(id: string, brief: LearningBrief): Promise<{ ok: true }> {
    return json(
      await fetch(`/api/sessions/${id}/learning-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      }),
    );
  },

  async generate(id: string, brief?: LearningBrief): Promise<GenerationStatus> {
    return json(
      await fetch(`/api/sessions/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief ? { brief } : {}),
      }),
    );
  },

  async getStatus(id: string): Promise<GenerationStatus> {
    return json(await fetch(`/api/sessions/${id}/status`));
  },

  async getSimulation(id: string): Promise<{ ready: boolean; url: string | null }> {
    return json(await fetch(`/api/sessions/${id}/simulation`));
  },

  async getLiveKitToken(id: string): Promise<LiveKitToken> {
    return json(await fetch(`/api/sessions/${id}/livekit-token`, { method: 'POST' }));
  },
};
