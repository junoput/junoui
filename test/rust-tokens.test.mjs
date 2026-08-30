// The Rust token target (X1 / 20260829-021), checked against the DTCG source
// it is generated from.
//
// WHY THIS SHAPE. The ticket's whole argument is that without a Rust target a
// consumer hand-transcribes hex values, "which drift silently on junoui's
// first patch release, and no lint catches a stale copy". A generated file
// with a test that lists its expected contents would be the same defect moved
// one repo to the left — so nothing here is remembered. Every expectation is
// re-derived from dist/json/tokens.json (the DTCG output, the same source the
// CSS and Swift targets read) using the SAME name and value helpers the
// generator uses.
//
// What that buys: adding, removing, renaming or re-valuing a token fails this
// file until the Rust output is regenerated. Editing juno_tokens.rs by hand
// fails it immediately.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

import { toHex } from '../scripts/color.mjs';
import {
  ROLES,
  classify,
  f32Literal,
  numeric,
  screamingSnake,
  snake,
} from '../scripts/token-names.mjs';

const RS = 'dist/rust/juno_tokens.rs';
const rust = readFileSync(RS, 'utf8');
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

/** The const declarations the file actually carries: name → literal. */
const declared = new Map(
  // The whole identifier in one group. An earlier version wrote
  // `([A-Z0-9_]+)(?:_MS)?` and then re-appended the suffix — but the greedy
  // class had already eaten it, so every duration came out MOTION_..._MS_MS
  // and read as absent.
  [...rust.matchAll(/^pub const ([A-Z0-9_]+)\s*:\s*([^=]+?)\s*=\s*([^;]+);$/gm)].map((m) => [
    m[1],
    { type: m[2].trim(), value: m[3].trim() },
  ]),
);

test('the source and the output are both really read', () => {
  // Vacuous-pass insurance: an empty file makes every assertion below pass.
  assert.ok(rust.length > 2000, `${RS} is suspiciously short`);
  assert.ok(all.length > 100, `only ${all.length} tokens in the DTCG source`);
  assert.ok(declared.size > 100, `only ${declared.size} consts parsed out of ${RS}`);
});

test('every color token reaches Rust as the same sRGB value', () => {
  // toHex is the generator's own converter, so this checks the TRANSCRIPTION,
  // not the OKLab maths — which is scripts/color.mjs's own subject. A drift
  // here means a token moved and the output did not.
  const missing = [];
  for (const [path, value] of colors) {
    const name = screamingSnake(path.slice(1));
    const want = `Rgba::hex(0x${toHex(value).slice(1)})`;
    const got = declared.get(name);
    if (!got || got.value !== want) missing.push(`${name}: want ${want}, got ${got?.value ?? '—'}`);
  }
  assert.deepEqual(missing, []);
});

test('every core token reaches Rust in the form its value implies', () => {
  const wrong = [];
  for (const [path, value] of core) {
    const kind = classify(value);
    const name = screamingSnake(path) + (kind === 'ms' ? '_MS' : '');
    const got = declared.get(name);
    if (!got) {
      wrong.push(`${name}: absent`);
      continue;
    }
    const want =
      kind === 'text'
        ? { type: '&str', value: JSON.stringify(String(value)) }
        : kind === 'int'
          ? { type: 'i32', value: String(numeric(value)) }
          : { type: 'f32', value: f32Literal(numeric(value)) };
    if (got.type !== want.type || got.value !== want.value) {
      wrong.push(`${name}: want ${want.type} = ${want.value}, got ${got.type} = ${got.value}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('the value mapping is pinned, not derived from the thing it checks', () => {
  // THE BLIND SPOT THIS CLOSES. `classify` is shared by the generator and by
  // the assertions above — which is right for NAMES (a mismatch is a compile
  // error either way) and wrong for the value mapping: mutate classify and
  // both sides move together, so a duration emitted as a length passes. Two
  // mutations survived on exactly that before this test existed.
  //
  // So the mapping is stated here as a specification, independently of the
  // implementation. These are remembered values on purpose: they are the
  // contract, not a copy of the data.
  assert.equal(classify('24px'), 'px');
  assert.equal(classify('160ms'), 'ms');
  assert.equal(classify(100), 'int');
  assert.equal(classify(0.45), 'float');
  assert.equal(classify('0 4px 14px rgb(0 0 0 / 0.35)'), 'text');
  assert.equal(classify("'B612', sans-serif"), 'text');

  // ...and the same contract as it lands in the output, on real tokens. A
  // length is not a duration, a count is not a ratio, and a CSS string is not
  // silently numeric.
  const expect = {
    SIZE_TAP_COMFORTABLE: { type: 'f32', value: '44.0' },
    MOTION_DURATION_BASE_MS: { type: 'f32', value: '200.0' },
    Z_RAISED: { type: 'i32', value: '100' },
    OPACITY_DISABLED: { type: 'f32', value: '0.45' },
  };
  for (const [name, want] of Object.entries(expect)) {
    const got = declared.get(name);
    assert.ok(got, `${name} is absent from the Rust output`);
    assert.equal(got.type, want.type, `${name} has the wrong Rust type`);
    assert.equal(got.value, want.value, `${name} has the wrong value`);
  }
  assert.equal(declared.get('SHADOW_2')?.type, '&str');
  assert.match(declared.get('FONT_FAMILY_SANS')?.value ?? '', /^"/);

  // a duration must NOT also appear without its suffix, which is what
  // classifying ms as px produces
  assert.equal(declared.get('MOTION_DURATION_BASE'), undefined);
});

test('the output carries nothing the source does not', () => {
  // The other direction, and the one that catches a hand-edit: a const with no
  // token behind it. Without this the file could accumulate values nobody can
  // trace to the DTCG source, which is the mirrored constant wearing a
  // generated file's clothes.
  const expected = new Set([
    ...colors.map(([p]) => screamingSnake(p.slice(1))),
    ...core.map(([p, v]) => screamingSnake(p) + (classify(v) === 'ms' ? '_MS' : '')),
    // the grouped theme constants, which are derived rather than 1:1 tokens
    ...new Set(colors.map(([p]) => screamingSnake([p[1], p[2]]))),
  ]);
  const strays = [...declared.keys()].filter((n) => !expected.has(n));
  assert.deepEqual(strays, [], 'consts in the Rust output with no token behind them');
});

test('the Palette struct and its constants share one role list', () => {
  // ROLES drives the struct's fields and every theme constant that fills it.
  // A role reaching one and missing the other is a compile error in the
  // consumer's crate, which is a bad place to find out.
  const fields = /pub struct Palette \{([\s\S]*?)\n\}/.exec(rust)?.[1] ?? '';
  assert.ok(fields, 'no Palette struct in the output');
  assert.deepEqual(
    [...fields.matchAll(/pub (\w+): Rgba,/g)].map((m) => m[1]),
    ROLES.map((r) => snake([r])),
  );

  const themes = [...new Set(colors.map(([p]) => `${p[1]}/${p[2]}`))];
  assert.ok(themes.length >= 2, `only ${themes.length} theme(s) found`);
  for (const theme of themes) {
    const [palette, mode] = theme.split('/');
    const name = screamingSnake([palette, mode]);
    const body = new RegExp(`pub const ${name}: Palette = Palette \\{([\\s\\S]*?)\\n\\};`).exec(
      rust,
    )?.[1];
    assert.ok(body, `no ${name} constant`);
    assert.deepEqual(
      [...body.matchAll(/(\w+): Rgba::hex/g)].map((m) => m[1]),
      ROLES.map((r) => snake([r])),
      `${name} does not carry every role`,
    );
  }
});

test('the generated Rust compiles', () => {
  // The claim a static check cannot make. An f32 constant emitted as `44`
  // instead of `44.0`, a reserved word as an identifier, or a malformed
  // literal are all invisible to the assertions above and fatal to a consumer.
  const rustc = join(homedir(), '.cargo', 'bin', 'rustc');
  if (!existsSync(rustc)) {
    // Loud, not silent: a skip that reads like a pass is how a guard becomes
    // decorative (CLAUDE.md §15, 2026-08-12).
    assert.fail(`rustc not found at ${rustc} — this check cannot be skipped quietly`);
  }
  execFileSync(
    rustc,
    [
      '--edition',
      '2021',
      '--crate-type',
      'lib',
      '--emit=metadata',
      '-o',
      join(tmpdir(), 'juno_tokens.rmeta'),
      RS,
    ],
    { stdio: 'pipe' },
  );
});

test('the target is exported and shipped', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./rust'], './dist/rust/juno_tokens.rs');
  // dist/ is already in `files`, but assert it rather than assume: the 0.4.0
  // incident was an exports entry pointing into a directory the tarball did
  // not ship (RELEASING.md).
  assert.ok(pkg.files.includes('dist'));
});
