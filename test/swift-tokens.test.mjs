// The Swift token target, checked against the DTCG source it is generated
// from — same shape as test/rust-tokens.test.mjs, ported deliberately
// (20260908-083): Swift used to filter coreTokens to /px$/ only, so motion
// durations, the z-index scale, opacity, font weights, line-height and the
// canvas scrim (46 tokens, one-directional against Rust) never reached it.
// That was never a stated scope, so it is fixed rather than documented as
// intentional — see the comment on `ios/juno-swift` in
// style-dictionary.config.mjs. Swift now carries every core token in the
// form its value implies, exactly like Rust, via the same classify().
//
// Every expectation here is re-derived from dist/json/tokens.json using the
// SAME name/value helpers the generator uses — nothing is a remembered list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toHex } from '../scripts/color.mjs';
import { camel, classify, f32Literal, numeric } from '../scripts/token-names.mjs';

const SWIFT = 'dist/ios/JunoTokens.swift';
const swift = readFileSync(SWIFT, 'utf8');
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

/** The const declarations Swift actually carries: name → { type, value }.
 *  Color lines carry no explicit type annotation (`= JunoColor.hex(...)`),
 *  everything else does (`: CGFloat = ...`), so the type group is optional. */
const declared = new Map(
  [...swift.matchAll(/^ {4}public static let (\w+)(?:: (\w+))?\s*=\s*(.+)$/gm)].map((m) => [
    m[1],
    { type: m[2] ?? 'Color', value: m[3].trim() },
  ]),
);

test('the source and the output are both really read', () => {
  assert.ok(swift.length > 2000, `${SWIFT} is suspiciously short`);
  assert.ok(all.length > 100, `only ${all.length} tokens in the DTCG source`);
  assert.ok(declared.size > 100, `only ${declared.size} consts parsed out of ${SWIFT}`);
});

test('every themed color reaches Swift as the same sRGB value', () => {
  const missing = [];
  for (const [path, value] of colors) {
    const name = camel(path.slice(1));
    const want = `JunoColor.hex(0x${toHex(value).slice(1)})`;
    const got = declared.get(name);
    if (!got || got.value !== want) missing.push(`${name}: want ${want}, got ${got?.value ?? '—'}`);
  }
  assert.deepEqual(missing, []);
});

test('every core token reaches Swift in the form its value implies', () => {
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
        ? { type: 'Color', value: `JunoColor.hex(0x${toHex(String(value)).slice(1)})` }
        : kind === 'text'
          ? { type: 'String', value: JSON.stringify(String(value)) }
          : kind === 'px'
            ? { type: 'CGFloat', value: String(parseFloat(String(value))) }
            : kind === 'int'
              ? { type: 'Int', value: String(numeric(value)) }
              : kind === 'ms' || kind === 'float'
                ? { type: 'Double', value: f32Literal(numeric(value)) }
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
  assert.deepEqual(strays, [], 'consts in the Swift output with no token behind them');
});

test('the previously-missing categories are actually present, not just structurally plausible', () => {
  // The concrete regression this ticket exists to prevent: a category
  // filtered out by /px$/ before, spot-checked by name and value rather than
  // trusting the two set-comparison tests above alone.
  const expect = {
    motionDurationBaseMs: { type: 'Double', value: '200.0' },
    zRaised: { type: 'Int', value: '100' },
    opacityDisabled: { type: 'Double', value: '0.45' },
    fontWeightBold: { type: 'Int', value: '700' },
    fontLineHeightRelaxed: { type: 'Double', value: '1.5' },
    inkCanvasScrim: { type: 'Double', value: '0.28' },
  };
  for (const [name, want] of Object.entries(expect)) {
    const got = declared.get(name);
    assert.ok(got, `${name} is absent from the Swift output — the px-only filter regressed`);
    assert.equal(got.type, want.type, `${name} has the wrong Swift type`);
    assert.equal(got.value, want.value, `${name} has the wrong value`);
  }
});

test('the target is exported and shipped', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./ios'], './dist/ios/JunoTokens.swift');
  assert.ok(pkg.files.includes('dist'));
});
