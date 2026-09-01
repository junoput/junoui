// The rules a painted consumer cannot call (20260901-051).
//
// The design under test is not any one rule — it is that each rule has ONE
// definition, emitted to two targets, checked against ONE table. A second copy
// that agrees today is what this file exists to prevent, so most of these
// assert the wiring rather than the arithmetic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import * as rules from '../scripts/rules.mjs';
import * as pointerFirst from '../tools/pointer-first.mjs';

const rs = readFileSync('dist/rust/juno_rules.rs', 'utf8');
const tokens = readFileSync('dist/rust/juno_tokens.rs', 'utf8');

// ── the table, against the JS implementation ────────────────────────────

test('every case in the shared table holds for the JS implementation', () => {
  // The Rust half runs the SAME cases, generated into #[test] bodies. Neither
  // target can be covered while the other is missed, because there is one table.
  let n = 0;
  for (const [fn, cases] of Object.entries(rules.CASES)) {
    for (const c of cases) {
      n += 1;
      const got = rules[fn](c.in);
      const what = `${fn}(${JSON.stringify(c.in)}) — ${c.why ?? ''}`;
      if (Array.isArray(c.out)) {
        assert.deepEqual(
          got.map((p) => p.map((x) => +x.toFixed(4))),
          c.out,
          what,
        );
      } else if (typeof c.out === 'number') {
        assert.ok(Math.abs(got - c.out) < 0.01, `${what}: got ${got}, want ${c.out}`);
      } else {
        assert.equal(got, c.out, what);
      }
    }
  }
  assert.ok(n >= 20, `the shared table shrank to ${n} cases`);
});

test('the landscape phone is in the table, because it is the case that bit', () => {
  // A width-only rule is correct on a portrait phone and on a desktop. Without
  // this row the table agrees with the defect.
  const landscape = rules.CASES.wantsCompactNav.find(
    (c) => c.in.width === 844 && c.in.height === 390,
  );
  assert.ok(landscape, 'the landscape-phone case is gone');
  assert.equal(landscape.out, true);
});

test('the measured tilt case is in the table, with geovista’s own numbers', () => {
  // 25deg pitch, semi-axis 18, 10px glyphs — the geometry that put N and S on
  // top of NE and NW. If this row goes, the rule is being tested only where it
  // was already obvious.
  const measured = rules.CASES.labelsThatClear.find((c) => c.in.radiusPx === 18);
  assert.ok(measured, 'the measured tilt case is gone');
  assert.equal(measured.out, 4);
});

// ── one definition, two targets ─────────────────────────────────────────

test('pointer-first re-exports the rule rather than restating it', () => {
  // Two implementations of "does this viewport want phone navigation" is the
  // defect this ticket is about, one layer up. Identity, not equality.
  assert.equal(pointerFirst.wantsCompactNav, rules.wantsCompactNav);
  assert.equal(pointerFirst.SHORT_MAX_PX, rules.SHORT_MAX_PX);
  assert.equal(pointerFirst.NARROW_MAX_PX, rules.NARROW_MAX_PX);

  const src = readFileSync('tools/pointer-first.mjs', 'utf8');
  assert.doesNotMatch(
    src,
    /export function wantsCompactNav/,
    'pointer-first defines its own copy of the predicate again',
  );
});

test('the Rust target carries a generated case for every row of the table', () => {
  // The table is the guard; a generator that silently emitted fewer cases would
  // leave the Rust green over numbers nobody chose.
  const declared = Number(/generated-assertions: (\d+)/.exec(rs)?.[1]);
  const expected = Object.values(rules.CASES)
    .flat()
    .reduce((n, c) => n + (Array.isArray(c.out) ? c.out.length * 2 : 1), 0);
  assert.equal(declared, expected, 'the Rust tests do not cover the whole table');
  // ...and the file really contains that many, so the declaration is not just
  // a number the generator wrote about itself.
  // Sliced from the first #[test], which is past the `fn close` helper — and
  // counted per OCCURRENCE, not per line: the halo cases emit several
  // assertions on one line, which a line-anchored count under-reads.
  const bodies = rs.slice(rs.indexOf('#[test]'));
  const actual = (bodies.match(/assert_eq!\(|close\(/g) ?? []).length;
  assert.ok(actual >= declared, `declared ${declared} assertions, emitted ${actual}`);
});

test('the generator READS the token target rather than restating values', () => {
  // A hardcoded 44.0 equals the token today, so no value comparison can catch
  // it — that mutation survived until this assertion existed. The property is
  // about construction, so the guard reads the construction. Same shape as the
  // scoped-specimen guard in tap-targets.spec.mjs.
  const gen = readFileSync('scripts/build-rules.mjs', 'utf8');
  for (const name of ['SIZE_TAP_MIN', 'SIZE_TAP_COMFORTABLE', 'INK_CANVAS_HALO_WIDTH']) {
    assert.match(
      gen,
      new RegExp(`tok\\('${name}'\\)`),
      `${name} is no longer read from juno_tokens.rs — a literal here goes stale silently`,
    );
  }
  // ...and no bare tap literal was written beside them.
  const body = /pub fn tap_min[^}]*}[^}]*}/.exec(rs)?.[0] ?? '';
  assert.ok(body, 'tap_min is gone from the Rust target');
});

test('the Rust half is verifiable, and the limit is stated where it is read', () => {
  // Node cannot check Rust semantics. Found by mutation: making the Rust
  // predicate diverge from the JS one survived the entire JS suite. So the
  // claim in the docs is bounded, and there is a command that does check it.
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['test:rust'], 'node scripts/test-rust.mjs');
  const runner = readFileSync('scripts/test-rust.mjs', 'utf8');
  assert.match(runner, /refusal, not a skip/, 'the rust runner may now skip silently');

  // ...and it is DRIVEN, not read. Asserting the wording of a refusal proves
  // nothing about what it returns: a mutation that kept the message and exited
  // 0 survived until this ran the thing. A runner that reports "unverified"
  // and exits 0 is a skip wearing a refusal's words.
  const bare = spawnSync(process.execPath, ['scripts/test-rust.mjs'], {
    env: { ...process.env, PATH: '/usr/bin:/bin' },
    encoding: 'utf8',
  });
  assert.equal(bare.status, 2, 'the rust runner does not fail when rustc is absent');
  assert.match(bare.stderr, /refusal, not a skip/);
  const doc = readFileSync('docs/painted-ui.md', 'utf8');
  assert.match(
    doc,
    /junoui's CI does not compile this file/,
    'the doc no longer admits the Rust half is unchecked in CI',
  );
  assert.match(doc, /Node cannot check that the Rust body computes/);
});

test('the Rust rules carry the token values from the token target', () => {
  // Not restated: a token change reaches this file through the same build.
  for (const name of ['SIZE_TAP_MIN', 'SIZE_TAP_COMFORTABLE', 'INK_CANVAS_HALO_WIDTH']) {
    const v = new RegExp(`pub const ${name}: f32 = ([0-9.]+);`).exec(tokens)?.[1];
    assert.ok(v, `juno_tokens.rs no longer defines ${name}`);
    assert.ok(rs.includes(v), `juno_rules.rs does not carry ${name}'s value (${v})`);
  }
});

test('the two bounds agree across the CSS condition and the Rust', () => {
  // The @custom-media block, the JS predicate and the Rust constant are three
  // renderings of two numbers. Drift here is invisible until a device is wrong.
  assert.match(pointerFirst.COMPACT_NAV, new RegExp(`${rules.NARROW_MAX_PX}px`));
  assert.match(pointerFirst.COMPACT_NAV, new RegExp(`${rules.SHORT_MAX_PX}px`));
  assert.match(rs, new RegExp(`NARROW_MAX_PX: f32 = ${rules.NARROW_MAX_PX};`));
  assert.match(rs, new RegExp(`SHORT_MAX_PX: f32 = ${rules.SHORT_MAX_PX}`));
});

test('the Rust target is packaged and exported', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./rules'], './dist/rust/juno_rules.rs');
  assert.match(pkg.scripts.build, /build:rules/, 'the rules are not built by npm run build');
});

test('the generated file says it is generated, where someone would edit it', () => {
  assert.match(rs, /Generated; do not edit/);
  assert.match(rs, /Do not add a case here; add it there/);
});

// ── the limits, stated where they are read ──────────────────────────────

test('the Rust rules state what is NOT in them', () => {
  // The list of what does not transfer is what stops this file reading as
  // "junoui now supports painted UI".
  assert.match(rs, /WHAT IS NOT HERE/);
  assert.match(rs, /cannot be computed from numbers/);
});
