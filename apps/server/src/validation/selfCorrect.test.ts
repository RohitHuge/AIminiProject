import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selfCorrect } from './selfCorrect';

test('passes on the first attempt when valid — no repair', async () => {
  let gen = 0;
  let rep = 0;
  const r = await selfCorrect({
    generate: async () => { gen++; },
    repair: async () => { rep++; },
    validate: async () => ({ ok: true, errors: [] }),
    canRepair: true,
  });
  assert.deepEqual([r.ok, r.attempts, gen, rep], [true, 1, 1, 0]);
});

test('recovers after one repair', async () => {
  let rep = 0;
  let checks = 0;
  const r = await selfCorrect({
    generate: async () => {},
    repair: async () => { rep++; },
    validate: async () => {
      checks++;
      return checks >= 2 ? { ok: true, errors: [] } : { ok: false, errors: ['bad'] };
    },
    canRepair: true,
  });
  assert.deepEqual([r.ok, r.attempts, rep], [true, 2, 1]);
});

test('fails after max attempts (1 generate + 2 repairs)', async () => {
  let gen = 0;
  let rep = 0;
  const r = await selfCorrect({
    generate: async () => { gen++; },
    repair: async () => { rep++; },
    validate: async () => ({ ok: false, errors: ['always bad'] }),
    canRepair: true,
    maxAttempts: 3,
  });
  assert.deepEqual([r.ok, r.attempts, gen, rep], [false, 3, 1, 2]);
  assert.deepEqual(r.errors, ['always bad']);
});

test('stops after first failure when repair is not possible (mock mode)', async () => {
  let rep = 0;
  const r = await selfCorrect({
    generate: async () => {},
    repair: async () => { rep++; },
    validate: async () => ({ ok: false, errors: ['bad'] }),
    canRepair: false,
  });
  assert.deepEqual([r.ok, r.attempts, rep], [false, 1, 0]);
});
