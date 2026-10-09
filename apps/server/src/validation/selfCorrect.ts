import type { ValidationResult } from './validateSimulation';

export type SelfCorrectStep = 'creating_files' | 'validating' | 'fixing';

export interface SelfCorrectOptions {
  /** Produce the initial simulation (attempt 1). */
  generate: () => Promise<void>;
  /** Repair the simulation given the current validation errors (attempts 2+). */
  repair: (errors: string[]) => Promise<void>;
  /** Validate the current files. */
  validate: () => Promise<ValidationResult>;
  /**
   * Whether repair is possible. False disables retries (e.g. offline/mock mode
   * where there is no agent to fix the files), so a first-pass failure stops
   * immediately instead of looping pointlessly.
   */
  canRepair: boolean;
  /** Max total attempts including the first generation (spec §40: 3). */
  maxAttempts?: number;
  /** Progress callback for status reporting. */
  onStep?: (step: SelfCorrectStep, attempt: number) => void;
}

export interface SelfCorrectResult {
  ok: boolean;
  /** Number of attempts actually used. */
  attempts: number;
  /** Remaining errors if it never passed. */
  errors: string[];
}

/**
 * Generate → validate → (feed errors back → repair → validate) loop with a hard
 * attempt cap (spec §40). Returns once validation passes or attempts run out.
 */
export async function selfCorrect(options: SelfCorrectOptions): Promise<SelfCorrectResult> {
  const max = options.maxAttempts ?? 3;
  let errors: string[] = [];
  let attempt = 0;

  while (attempt < max) {
    attempt++;

    if (attempt === 1) {
      options.onStep?.('creating_files', attempt);
      await options.generate();
    } else {
      options.onStep?.('fixing', attempt);
      await options.repair(errors);
    }

    options.onStep?.('validating', attempt);
    const result = await options.validate();
    if (result.ok) return { ok: true, attempts: attempt, errors: [] };

    errors = result.errors;
    if (!options.canRepair) break; // nothing can fix it — stop early
  }

  return { ok: false, attempts: attempt, errors };
}
