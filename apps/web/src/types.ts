// Mirrors the backend contracts (apps/server/src/types).

export type SessionStatus =
  | 'created'
  | 'conversation'
  | 'understanding'
  | 'generating'
  | 'validating'
  | 'ready'
  | 'error';

export interface Session {
  id: string;
  createdAt: string;
  status: SessionStatus;
  subject: string | null;
  topic: string | null;
  simulation: { status: 'pending' | 'generating' | 'ready' | 'error'; entryPoint: string };
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  subject: string | null;
  topic: string | null;
  status: SessionStatus;
}

export type GenerationStep =
  | 'understanding'
  | 'planning'
  | 'creating_files'
  | 'validating'
  | 'fixing'
  | 'ready'
  | 'error';

export interface GenerationStatus {
  status: 'generating' | 'ready' | 'error';
  step: GenerationStep;
  message: string;
}

export interface LearningBrief {
  subject: string;
  topic: string;
  studentLevel: string;
  studentAlreadyUnderstands?: string[];
  confusion: string;
  learningGoal: string;
  preferredDemonstration?: string;
  requiredInteractions?: string[];
}

export interface LiveKitToken {
  token: string;
  url: string;
  room: string;
  identity: string;
}
