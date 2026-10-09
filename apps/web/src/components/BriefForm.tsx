import { useState, type FormEvent } from 'react';
import type { LearningBrief } from '../types';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

/**
 * Typed Learning Brief entry — the reliable path that drives generation without
 * voice, and the permanent fallback when LiveKit is unavailable (plan Phase 5).
 */
export function BriefForm({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (brief: LearningBrief) => void;
}) {
  const [subject, setSubject] = useState('Physics');
  const [topic, setTopic] = useState("Newton's Second Law");
  const [studentLevel, setStudentLevel] = useState('beginner');
  const [confusion, setConfusion] = useState('How mass and force affect acceleration');
  const [learningGoal, setLearningGoal] = useState('Understand F = ma through experimentation');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ subject, topic, studentLevel, confusion, learningGoal });
  };

  const field = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-50';

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Subject</span>
          <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={disabled} required />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Level</span>
          <select className={field} value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)} disabled={disabled}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">Topic</span>
        <input className={field} value={topic} onChange={(e) => setTopic(e.target.value)} disabled={disabled} required />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">What's confusing?</span>
        <textarea className={field} rows={2} value={confusion} onChange={(e) => setConfusion(e.target.value)} disabled={disabled} required />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">Learning goal</span>
        <textarea className={field} rows={2} value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} disabled={disabled} required />
      </label>
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Build my demonstration
      </button>
    </form>
  );
}
