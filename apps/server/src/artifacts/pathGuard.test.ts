import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveSafePath, assertValidSessionId, simulationRoot, PathSecurityError } from './pathGuard';

const SID = 'session_abc123';
const root = simulationRoot(SID);

test('valid session ids pass, invalid ones throw', () => {
  assert.doesNotThrow(() => assertValidSessionId('session_abc123'));
  assert.throws(() => assertValidSessionId('session_ABC123'), PathSecurityError); // uppercase hex
  assert.throws(() => assertValidSessionId('session_abc12'), PathSecurityError); // too short
  assert.throws(() => assertValidSessionId('../../etc'), PathSecurityError);
  assert.throws(() => assertValidSessionId('abc123'), PathSecurityError);
  // @ts-expect-error -- deliberately wrong type
  assert.throws(() => assertValidSessionId(undefined), PathSecurityError);
});

test('allows normal paths inside the simulation root', () => {
  for (const p of ['index.html', 'style.css', 'app.js', 'sub/dir/file.js', 'a/../b.js']) {
    const resolved = resolveSafePath(SID, p);
    assert.ok(
      resolved === root || resolved.startsWith(root + path.sep),
      `${p} -> ${resolved} should be inside ${root}`,
    );
  }
});

test('rejects parent-directory traversal', () => {
  for (const p of ['../../server.ts', '../../../etc/passwd', 'a/../../b', '../secret']) {
    assert.throws(() => resolveSafePath(SID, p), PathSecurityError, `should reject ${p}`);
  }
});

test('rejects Windows-style backslash traversal', () => {
  assert.throws(() => resolveSafePath(SID, '..\\..\\server.ts'), PathSecurityError);
  assert.throws(() => resolveSafePath(SID, '..\\secret.txt'), PathSecurityError);
});

test('rejects absolute paths and drive paths', () => {
  for (const p of ['/etc/passwd', '/index.html', 'C:\\Windows\\system32', 'D:/data.txt']) {
    assert.throws(() => resolveSafePath(SID, p), PathSecurityError, `should reject ${p}`);
  }
});

test('rejects null bytes and empty paths', () => {
  assert.throws(() => resolveSafePath(SID, 'index\0.html'), PathSecurityError);
  assert.throws(() => resolveSafePath(SID, ''), PathSecurityError);
});

test('rejects an invalid session id at resolve time', () => {
  assert.throws(() => resolveSafePath('../../evil', 'index.html'), PathSecurityError);
});
