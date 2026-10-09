import { writeFile } from '../artifacts/fileTools';
import type { LearningBrief } from '../types';

/**
 * Offline fallback used when OPENAI_API_KEY is not set. Writes a real,
 * interactive Newton's Second Law simulation (spec §42) so the full pipeline —
 * generate → status → static serve → sandboxed iframe — can be exercised
 * without a live model. The real generation agent replaces this when a key is
 * present. It also documents the quality bar we expect from the agent.
 */
export async function generateMockSimulation(sessionId: string, _brief: LearningBrief): Promise<void> {
  await writeFile(sessionId, 'index.html', INDEX_HTML);
  await writeFile(sessionId, 'style.css', STYLE_CSS);
  await writeFile(sessionId, 'app.js', APP_JS);
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newton's Second Law — F = m a</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="lab">
    <h1>Newton's Second Law <span class="eq">F = m &times; a</span></h1>
    <p class="hint">Drag the sliders and watch how acceleration — and the box — respond.</p>

    <div class="controls">
      <label>
        <span>Force <strong id="forceVal">40</strong> N</span>
        <input id="force" type="range" min="0" max="100" value="40" step="1" />
      </label>
      <label>
        <span>Mass <strong id="massVal">10</strong> kg</span>
        <input id="mass" type="range" min="1" max="50" value="10" step="1" />
      </label>
      <button id="reset" type="button">Reset box</button>
    </div>

    <canvas id="stage" width="640" height="220" aria-label="Animated box pushed by a force"></canvas>

    <div class="readout">
      <div class="metric"><span class="k">Force</span><span class="v"><em id="rForce">40</em> N</span></div>
      <div class="metric"><span class="k">Mass</span><span class="v"><em id="rMass">10</em> kg</span></div>
      <div class="metric accel"><span class="k">Acceleration</span><span class="v"><em id="rAccel">4.0</em> m/s&sup2;</span></div>
    </div>
  </main>
  <script src="app.js"></script>
</body>
</html>
`;

const STYLE_CSS = `:root {
  --bg: #0f172a;
  --panel: #1e293b;
  --ink: #e2e8f0;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --accent-2: #f59e0b;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  justify-content: center;
  padding: 24px;
}
.lab { width: 100%; max-width: 720px; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
.eq { color: var(--accent); font-weight: 600; margin-left: 6px; }
.hint { color: var(--muted); margin: 0 0 20px; }
.controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;
}
label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
label span strong { color: var(--accent); }
input[type="range"] { width: 100%; accent-color: var(--accent); cursor: pointer; }
button {
  background: var(--panel); color: var(--ink); border: 1px solid #334155;
  padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
}
button:hover { border-color: var(--accent); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
canvas {
  width: 100%; height: auto; background: var(--panel);
  border: 1px solid #334155; border-radius: 12px; display: block;
}
.readout { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
.metric {
  flex: 1 1 140px; background: var(--panel); border: 1px solid #334155;
  border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;
}
.metric .k { color: var(--muted); font-size: 0.8rem; }
.metric .v { font-size: 1.3rem; font-weight: 600; }
.metric.accel .v em { color: var(--accent-2); font-style: normal; }
@media (max-width: 560px) {
  .controls { grid-template-columns: 1fr; }
}
`;

const APP_JS = `(function () {
  'use strict';

  const forceEl = document.getElementById('force');
  const massEl = document.getElementById('mass');
  const resetEl = document.getElementById('reset');
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  const out = {
    forceVal: document.getElementById('forceVal'),
    massVal: document.getElementById('massVal'),
    rForce: document.getElementById('rForce'),
    rMass: document.getElementById('rMass'),
    rAccel: document.getElementById('rAccel'),
  };

  const BOX = 48;
  let x = 20;          // box position (px)
  let v = 0;           // velocity (px/s, scaled)
  let last = 0;

  function params() {
    const force = Number(forceEl.value);
    const mass = Number(massEl.value);
    const accel = force / mass; // F = m a  ->  a = F / m
    return { force, mass, accel };
  }

  function syncLabels(p) {
    out.forceVal.textContent = p.force;
    out.massVal.textContent = p.mass;
    out.rForce.textContent = p.force;
    out.rMass.textContent = p.mass;
    out.rAccel.textContent = p.accel.toFixed(1);
  }

  function reset() {
    x = 20; v = 0;
  }

  function frame(t) {
    if (!last) last = t;
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;

    const p = params();
    syncLabels(p);

    // Integrate motion: a scales velocity, box drifts right and wraps.
    v += p.accel * dt * 12;
    v *= 0.995; // mild damping so it stays readable
    x += v * dt * 6;

    const maxX = canvas.width - BOX - 10;
    if (x > maxX) { x = maxX; v = -v * 0.4; } // bounce off the right wall
    if (x < 10) { x = 10; v = Math.abs(v) * 0.4; }

    draw(p);
    requestAnimationFrame(frame);
  }

  function draw(p) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ground line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.lineTo(canvas.width, 170);
    ctx.stroke();

    // box (size hints at mass)
    const size = BOX + (p.mass - 10) * 1.2;
    const top = 170 - size;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, top, size, size);
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px system-ui';
    ctx.fillText(p.mass + ' kg', x + 8, top + size / 2 + 4);

    // force arrow (length hints at force)
    const arrow = 20 + p.force * 0.9;
    const ay = top + size / 2;
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - arrow, ay);
    ctx.lineTo(x - 4, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4, ay - 7);
    ctx.lineTo(x + 6, ay);
    ctx.lineTo(x - 4, ay + 7);
    ctx.fill();
  }

  forceEl.addEventListener('input', () => syncLabels(params()));
  massEl.addEventListener('input', () => syncLabels(params()));
  resetEl.addEventListener('click', reset);

  syncLabels(params());
  requestAnimationFrame(frame);
})();
`;
