import vm from 'node:vm';
import { listFiles, readFile } from '../artifacts/fileTools';

export interface ValidationResult {
  ok: boolean;
  /** Human-readable, agent-actionable error messages. Empty when ok. */
  errors: string[];
}

const REQUIRED_FILES = ['index.html', 'style.css', 'app.js'];

/**
 * Patterns that must not appear in generated files (spec §38). These make the
 * simulation non-self-contained or unsafe; when found they become validation
 * errors that drive self-correction.
 */
const FORBIDDEN: { label: string; re: RegExp }[] = [
  { label: 'network call fetch(', re: /\bfetch\s*\(/ },
  { label: 'network call XMLHttpRequest', re: /\bXMLHttpRequest\b/ },
  { label: 'network call WebSocket', re: /\bWebSocket\b/ },
  { label: 'dynamic code eval(', re: /\beval\s*\(/ },
  { label: 'dynamic code new Function(', re: /\bnew\s+Function\s*\(/ },
  { label: 'external script src', re: /<script[^>]+src\s*=\s*["']https?:\/\//i },
  { label: 'external stylesheet href', re: /<link[^>]+href\s*=\s*["']https?:\/\//i },
];

/** Compile-only syntax check — returns the error message, or null if valid. */
function jsSyntaxError(code: string): string | null {
  try {
    // Compiles without executing; throws SyntaxError on parse failure.
    new vm.Script(code, { filename: 'app.js' });
    return null;
  } catch (e) {
    return e instanceof SyntaxError ? e.message : null;
  }
}

/**
 * Validate a generated simulation (spec §38):
 *  - required files exist
 *  - index.html references style.css and app.js
 *  - app.js is syntactically valid JavaScript
 *  - no forbidden network / dynamic-code / external-resource usage
 */
export async function validateSimulation(sessionId: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const present = new Set(await listFiles(sessionId));

  for (const f of REQUIRED_FILES) {
    if (!present.has(f)) errors.push(`Missing required file: ${f}`);
  }

  let html = '';
  let js = '';

  if (present.has('index.html')) {
    html = await readFile(sessionId, 'index.html');
    if (!/style\.css/.test(html)) {
      errors.push('index.html does not reference style.css (add <link rel="stylesheet" href="style.css">).');
    }
    if (!/app\.js/.test(html)) {
      errors.push('index.html does not reference app.js (add <script src="app.js"></script>).');
    }
  }

  if (present.has('app.js')) {
    js = await readFile(sessionId, 'app.js');
    const syn = jsSyntaxError(js);
    if (syn) errors.push(`app.js has a JavaScript syntax error: ${syn}`);
  }

  for (const { label, re } of FORBIDDEN) {
    if (js && re.test(js)) {
      errors.push(`app.js uses a forbidden ${label}; remove it — the simulation must be self-contained with no network access.`);
    }
    if (html && re.test(html)) {
      errors.push(`index.html uses a forbidden ${label}; remove it — the simulation must be self-contained.`);
    }
  }

  return { ok: errors.length === 0, errors };
}
