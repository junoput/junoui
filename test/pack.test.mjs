// Package-contents test. Asserts the npm tarball ships what consumers need
// and leaks nothing that belongs to the repo only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const MUST_SHIP = [
  'dist/css/juno.css',
  'dist/css/juno-tokens.css',
  'dist/css/juno-fonts.css',
  'dist/js/tokens.js',
  'dist/js/tokens.d.ts',
  'dist/json/tokens.json',
  'dist/scss/_juno-tokens.scss',
  'dist/android/colors.xml',
  'dist/ios/JunoTokens.swift',
  'dist/flutter/juno_tokens.dart',
  'dist/icons/juno-icons.svg',
  'src/css/base.css',
  'README.md',
  'package.json',
];

const MUST_NOT_SHIP = [
  /^test\//,
  /^showcase\//,
  /^design\//,
  /^docs\//,
  /^scripts\//,
  /^\.changeset\//,
];

test('npm tarball ships the right files', () => {
  // --ignore-scripts: skip `prepare` (dist is already built by `npm test`,
  // and its stdout would corrupt the --json output)
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
  });
  const files = JSON.parse(out)[0].files.map((f) => f.path);
  for (const f of MUST_SHIP) {
    assert.ok(files.includes(f), `tarball missing ${f}`);
  }
  const leaked = files.filter((f) => MUST_NOT_SHIP.some((re) => re.test(f)));
  assert.deepEqual(leaked, [], `repo-only files leaked into tarball: ${leaked.join(', ')}`);
  assert.ok(
    files.some((f) => /^dist\/fonts\/.+\.woff2$/.test(f)),
    'tarball missing woff2 fonts',
  );
});
