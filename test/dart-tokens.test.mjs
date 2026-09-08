// The Dart/Flutter token target, checked against the DTCG source it is
// generated from — same shape as test/rust-tokens.test.mjs and
// test/swift-tokens.test.mjs (20260908-083). Dart carried the same
// /px$/-only gap Swift did; see the comment on `flutter/juno-dart` in
// style-dictionary.config.mjs for the parity decision. Dart now carries
// every core token in the form its value implies, via the same classify().
//
// Every expectation here is re-derived from dist/json/tokens.json using the
// SAME name/value helpers the generator uses — nothing is a remembered list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toHex } from '../scripts/color.mjs';
import { camel, classify, f32Literal, numeric } from '../scripts/token-names.mjs';

const DART = 'dist/flutter/juno_tokens.dart';
const dart = readFileSync(DART, 'utf8');
const dtcg = JSON.parse(readFileSync('dist/json/tokens.json', 'utf8'));

/** Every leaf token in the DTCG tree as [path, value]. */
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

/** The const declarations Dart actually carries: name → { type, value }.
 *  Dart, unlike Swift, always writes an explicit type ("static const TYPE
 *  NAME = VALUE;"), including for Color — no optional-type parsing needed. */
const declared = new Map(
  [...dart.matchAll(/^ {2}static const (\w+) (\w+) = (.+);$/gm)].map((m) => [
    m[2],
    { type: m[1], value: m[3].trim() },
  ]),
);

test('the source and the output are both really read', () => {
  assert.ok(dart.length > 2000, `${DART} is suspiciously short`);
  assert.ok(all.length > 100, `only ${all.length} tokens in the DTCG source`);
  assert.ok(declared.size > 100, `only ${declared.size} consts parsed out of ${DART}`);
});

test('every themed color reaches Dart as the same sRGB value', () => {
  const missing = [];
  for (const [path, value] of colors) {
    const name = camel(path.slice(1));
    const want = `Color(0xFF${toHex(value).slice(1)})`;
    const got = declared.get(name);
    if (!got || got.value !== want) missing.push(`${name}: want ${want}, got ${got?.value ?? '—'}`);
  }
  assert.deepEqual(missing, []);
});

test('every core token reaches Dart in the form its value implies', () => {
  const wrong = [];
  for (const [path, value] of core) {
    const kind = classify(value);
    const name = camel(path) + (kind === 'ms' ? 'Ms' : '');
    const got = declared.get(name);
    if (!got) {
      wrong.push(`${name}: absent`);
      continue;
    }
    const want =
      kind === 'color'
        ? { type: 'Color', value: `Color(0xFF${toHex(String(value)).slice(1)})` }
        : kind === 'text'
          ? { type: 'String', value: JSON.stringify(String(value)) }
          : kind === 'px'
            ? { type: 'double', value: String(parseFloat(String(value))) }
            : kind === 'int'
              ? { type: 'int', value: String(numeric(value)) }
              : kind === 'ms' || kind === 'float'
                ? { type: 'double', value: f32Literal(numeric(value)) }
                : (() => {
                    throw new Error(`unhandled classify() kind: ${kind}`);
                  })();
    if (got.type !== want.type || got.value !== want.value) {
      wrong.push(`${name}: want ${want.type} = ${want.value}, got ${got.type} = ${got.value}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('the output carries nothing the source does not', () => {
  const expected = new Set([
    ...colors.map(([p]) => camel(p.slice(1))),
    ...core.map(([p, v]) => camel(p) + (classify(v) === 'ms' ? 'Ms' : '')),
  ]);
  const strays = [...declared.keys()].filter((n) => !expected.has(n));
  assert.deepEqual(strays, [], 'consts in the Dart output with no token behind them');
});

test('the previously-missing categories are actually present, not just structurally plausible', () => {
  const expect = {
    motionDurationBaseMs: { type: 'double', value: '200.0' },
    zRaised: { type: 'int', value: '100' },
    opacityDisabled: { type: 'double', value: '0.45' },
    fontWeightBold: { type: 'int', value: '700' },
    fontLineHeightRelaxed: { type: 'double', value: '1.5' },
    inkCanvasScrim: { type: 'double', value: '0.28' },
  };
  for (const [name, want] of Object.entries(expect)) {
    const got = declared.get(name);
    assert.ok(got, `${name} is absent from the Dart output — the px-only filter regressed`);
    assert.equal(got.type, want.type, `${name} has the wrong Dart type`);
    assert.equal(got.value, want.value, `${name} has the wrong value`);
  }
});

test('the target is exported and shipped', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./flutter'], './dist/flutter/juno_tokens.dart');
  assert.ok(pkg.files.includes('dist'));
});
