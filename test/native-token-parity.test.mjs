// Cross-target parity, asserted as a RELATIONSHIP rather than a count
// (20260908-083). `assert Swift has 144 consts` passes for the wrong reason
// and rots on the next token added anywhere — what actually matters is that
// Rust, Swift and Dart carry the SAME set of core tokens (and the same
// themed colors), independent of each language's own naming convention.
// Each sibling test (rust-tokens/swift-tokens/dart-tokens) already checks
// its target against the DTCG source in isolation; this file is the missing
// piece — it catches the case those three individually cannot: two targets
// each individually "complete" against the source, but STILL disagreeing
// with each other, because a token reaches one under a name the DTCG-derived
// expectation didn't anticipate. Re-derives each target's own declared-name
// set with the SAME per-target logic the sibling tests use, then compares
// PATHS (language-independent) rather than name strings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { camel, classify, screamingSnake } from '../scripts/token-names.mjs';

const rust = readFileSync('dist/rust/juno_tokens.rs', 'utf8');
const swift = readFileSync('dist/ios/JunoTokens.swift', 'utf8');
const dart = readFileSync('dist/flutter/juno_tokens.dart', 'utf8');
const dtcg = JSON.parse(readFileSync('dist/json/tokens.json', 'utf8'));

function leaves(node, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && v.$value !== undefined) out.push([[...path, k], v.$value]);
    else if (v && typeof v === 'object') out.push(...leaves(v, [...path, k]));
  }
  return out;
}
const all = leaves(dtcg);
const colors = all.filter(([p]) => p[0] === 'color');
const core = all.filter(([p]) => p[0] !== 'color');

const rustNames = new Set([...rust.matchAll(/^pub const ([A-Z0-9_]+)\s*:/gm)].map((m) => m[1]));
const swiftNames = new Set([...swift.matchAll(/^ {4}public static let (\w+)/gm)].map((m) => m[1]));
const dartNames = new Set([...dart.matchAll(/^ {2}static const \w+ (\w+) =/gm)].map((m) => m[1]));

test('the three declared-name sets were all actually read (vacuity floor)', () => {
  assert.ok(rustNames.size > 100, `only ${rustNames.size} names parsed from Rust`);
  assert.ok(swiftNames.size > 100, `only ${swiftNames.size} names parsed from Swift`);
  assert.ok(dartNames.size > 100, `only ${dartNames.size} names parsed from Dart`);
});

test("every DTCG token reaches all three targets, under each target's own naming convention", () => {
  const missing = [];
  const check = (path, kind, targetName, present) => {
    if (!present) missing.push(`${targetName}: ${path.join('.')} (${kind})`);
  };

  for (const [path, value] of [...colors, ...core]) {
    const kind = classify(value);
    const isColorPath = path[0] === 'color';
    const rustBase = isColorPath ? path.slice(1) : path;
    const rustName = screamingSnake(rustBase) + (!isColorPath && kind === 'ms' ? '_MS' : '');
    const camelBase = isColorPath ? path.slice(1) : path;
    const camelName = camel(camelBase) + (!isColorPath && kind === 'ms' ? 'Ms' : '');

    check(path, kind, 'Rust', rustNames.has(rustName));
    check(path, kind, 'Swift', swiftNames.has(camelName));
    check(path, kind, 'Dart', dartNames.has(camelName));
  }

  assert.deepEqual(missing, []);
});

test('Rust-only structural extras (the Palette struct + per-theme constants) are the only declared names with no per-token analogue', () => {
  // The one legitimate asymmetry: Rust groups each (palette, mode) into one
  // Palette constant for a consumer that wants "the theme" as a value, which
  // Swift/Dart do not have (see the format's own comment, X1 / 20260829-021).
  // Every OTHER Rust name must correspond to a real DTCG token — asserted so
  // this test cannot be satisfied by simply widening what counts as "extra".
  const perTokenRustNames = new Set(
    [...colors, ...core].map(([path, value]) => {
      const kind = classify(value);
      const isColorPath = path[0] === 'color';
      const base = isColorPath ? path.slice(1) : path;
      return screamingSnake(base) + (!isColorPath && kind === 'ms' ? '_MS' : '');
    }),
  );
  const themeConstNames = new Set(
    [...new Set(colors.map(([p]) => `${p[1]}/${p[2]}`))].map((theme) => {
      const [palette, mode] = theme.split('/');
      return screamingSnake([palette, mode]);
    }),
  );
  const extras = [...rustNames].filter((n) => !perTokenRustNames.has(n) && !themeConstNames.has(n));
  assert.deepEqual(
    extras,
    [],
    'Rust declares a name with no per-token analogue and no theme-grouping explanation',
  );
});
