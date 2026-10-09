import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { writeFile } from '../artifacts/fileTools';
import { validateSimulation } from './validateSimulation';

const GOOD_HTML =
  '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head>' +
  '<body><h1>Demo</h1><script src="app.js"></script></body></html>';
const GOOD_JS = '(function () { "use strict"; var x = 1; document.title = String(x); })();';

const created: string[] = [];

async function seed(id: string, files: Record<string, string>): Promise<void> {
  for (const [p, c] of Object.entries(files)) await writeFile(id, p, c);
  created.push(id);
}

afterEach(async () => {
  while (created.length) {
    const id = created.pop()!;
    await fs.rm(path.join(config.sessionsDir, id), { recursive: true, force: true });
  }
});

test('a well-formed simulation passes', async () => {
  await seed('session_aaa001', { 'index.html': GOOD_HTML, 'style.css': 'body{}', 'app.js': GOOD_JS });
  const r = await validateSimulation('session_aaa001');
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('missing required files are reported', async () => {
  await seed('session_aaa002', { 'index.html': GOOD_HTML });
  const r = await validateSimulation('session_aaa002');
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /Missing required file: style\.css/.test(e)));
  assert.ok(r.errors.some((e) => /Missing required file: app\.js/.test(e)));
});

test('missing HTML references are reported', async () => {
  await seed('session_aaa003', {
    'index.html': '<html><body></body></html>',
    'style.css': 'body{}',
    'app.js': GOOD_JS,
  });
  const r = await validateSimulation('session_aaa003');
  assert.ok(r.errors.some((e) => /does not reference style\.css/.test(e)));
  assert.ok(r.errors.some((e) => /does not reference app\.js/.test(e)));
});

test('JavaScript syntax errors are caught', async () => {
  await seed('session_aaa004', {
    'index.html': GOOD_HTML,
    'style.css': 'body{}',
    'app.js': 'function () { var x = ;',
  });
  const r = await validateSimulation('session_aaa004');
  assert.ok(r.errors.some((e) => /syntax error/i.test(e)), r.errors.join('; '));
});

test('forbidden network and dynamic-code APIs in app.js are flagged', async () => {
  await seed('session_aaa005', {
    'index.html': GOOD_HTML,
    'style.css': 'body{}',
    'app.js': 'async function go(){ await fetch("http://x"); } eval("1"); go();',
  });
  const r = await validateSimulation('session_aaa005');
  assert.ok(r.errors.some((e) => /fetch/.test(e)));
  assert.ok(r.errors.some((e) => /eval/.test(e)));
});

test('external script and stylesheet in index.html are flagged', async () => {
  const html =
    '<html><head><link rel="stylesheet" href="https://cdn.example/x.css">' +
    '<link rel="stylesheet" href="style.css"></head>' +
    '<body><script src="https://cdn.example/x.js"></script><script src="app.js"></script></body></html>';
  await seed('session_aaa006', { 'index.html': html, 'style.css': 'body{}', 'app.js': GOOD_JS });
  const r = await validateSimulation('session_aaa006');
  assert.ok(r.errors.some((e) => /external stylesheet/.test(e)), r.errors.join('; '));
  assert.ok(r.errors.some((e) => /external script/.test(e)), r.errors.join('; '));
});
