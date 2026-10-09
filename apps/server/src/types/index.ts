// ---- Session lifecycle (spec §9) ----
export type SessionStatus =
  | 'created'
  | 'conversation'
  | 'understanding'
  | 'generating'
  | 'validating'
  | 'ready'
  | 'error';

export type SimulationStatus = 'pending' | 'generating' | 'ready' | 'error';

export interface SessionSimulation {
  status: SimulationStatus;
  entryPoint: string; // e.g. "simulation/index.html"
}

export interface Session {
  id: string;
  createdAt: string; // ISO-8601
  status: SessionStatus;
  subject: string | null;
  topic: string | null;
  simulation: SessionSimulation;
}

/** Trimmed shape returned by the history list (spec §33). */
export interface SessionSummary {
  id: string;
  createdAt: string;
  subject: string | null;
  topic: string | null;
  status: SessionStatus;
}

// ---- Generation status (spec §37) ----
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

// ---- Learning Brief (spec §10) ----
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
