import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, type RemoteTrack } from 'livekit-client';
import { api } from '../lib/api';

export type ConnState = 'idle' | 'connecting' | 'connected' | 'error';
export type AgentState = 'listening' | 'thinking' | 'speaking' | null;

/**
 * Connects the student to a LiveKit room (room name = session id), publishes the
 * microphone, and plays the agent's audio. The agent's conversational state is
 * read from its `lk.agent.state` participant attribute (listening/thinking/
 * speaking), which LiveKit Agents publishes automatically.
 */
export function useLiveKit() {
  const [state, setState] = useState<ConnState>('idle');
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [error, setError] = useState<string | null>(null);
  // True when the browser is blocking audio autoplay — the UI should offer a
  // tap-to-enable control (which calls enableAudio within a fresh gesture).
  const [audioBlocked, setAudioBlocked] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioEls = useRef<HTMLAudioElement[]>([]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    audioEls.current.forEach((el) => el.remove());
    audioEls.current = [];
    setState('idle');
    setAgentState(null);
    setAudioBlocked(false);
  }, []);

  /** Start audio playback. Must be called within a user gesture when blocked. */
  const enableAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
      setAudioBlocked(!room.canPlaybackAudio);
    } catch {
      setAudioBlocked(true);
    }
  }, []);

  const connect = useCallback(async (sessionId: string) => {
    setState('connecting');
    setError(null);
    try {
      const { token, url } = await api.getLiveKitToken(sessionId);
      const room = new Room({ adaptiveStream: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.style.display = 'none';
          document.body.appendChild(el);
          audioEls.current.push(el);
        }
      });

      // Surfaces when the browser (un)blocks audio playback.
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setAudioBlocked(!room.canPlaybackAudio);
      });

      const readAgentState = (p: RemoteParticipant) => {
        const s = p.attributes?.['lk.agent.state'];
        if (s === 'listening' || s === 'thinking' || s === 'speaking') setAgentState(s);
      };
      room.on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
        if (p instanceof RemoteParticipant) readAgentState(p);
      });
      room.on(RoomEvent.ParticipantConnected, readAgentState);
      room.on(RoomEvent.Disconnected, () => setState('idle'));

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      // Chrome blocks audio autoplay until the app starts it. connect() runs from
      // the "Start talking" click, so the page has user activation — start audio
      // now so the agent's spoken greeting is actually audible.
      try {
        await room.startAudio();
      } catch {
        /* handled below via canPlaybackAudio */
      }
      setAudioBlocked(!room.canPlaybackAudio);

      room.remoteParticipants.forEach(readAgentState);
      setState('connected');
      setAgentState('listening');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect to voice');
      setState('error');
    }
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return { state, agentState, error, audioBlocked, connect, disconnect, enableAudio };
}
