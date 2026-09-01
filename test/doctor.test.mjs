// junoui doctor (conformance kit slice 6, 20260826-036 item F).
//
// The doctor's checks are pure functions over collected DOM facts, which is
// what makes them testable at all — and what lets this file feed them the
// exact defects this program has actually shipped, rather than invented ones.
// Every fixture below is a real bug from this org's history.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  LIMITS,
  PROFILES,
  loadManifest,
  navigationVerdict,
  parseArgs,
  report,
  shortTargets,
  unknownClasses,
} from '../tools/doctor.mjs';

const manifest = loadManifest();

test('the profiles are real devices, not round numbers', () => {
  // Round numbers hide the case the whole program turns on: a landscape phone
  // is WIDER than md, so a profile table of 375/768/1024 never sees it.
  assert.deepEqual(PROFILES['phone-landscape'], { width: 844, height: 390, coarse: true });
  assert.ok(PROFILES['phone-landscape'].width > 768, 'the landscape profile is no longer above md');
  assert.ok(PROFILES.phone.coarse && PROFILES.desktop.coarse === false);
});

// ── unknown classes: the ActionsDialog defect ────────────────────────────

test('it reports a class junoui does not define', () => {
  // Eleven such names once compiled silently in a consumer and rendered a
  // phone dialog as unstyled UA defaults, with its confirm button off the
  // bottom of the screen.
  const found = unknownClasses({
    used: ['juno-btn', 'juno-modal-body', 'juno-row'],
    manifest,
  });
  assert.deepEqual(found, ['juno-modal-body', 'juno-row']);
});

test('it does not report tokens, keyframes or icon ids as unknown classes', () => {
  // A consumer writes junoPx('juno-pillbar-gap') and #juno-i-crosshair, and
  // neither is a class. Reporting them would be telling someone to fix
  // correct code — the exact false positive that made the first version of
  // the class guard unusable.
  const found = unknownClasses({
    used: ['juno-pillbar-gap', 'juno-i-crosshair', 'juno-blink'],
    manifest,
  });
  assert.deepEqual(found, []);
});

test('a consumer can allow its own juno-namespaced names', () => {
  const found = unknownClasses({
    used: ['juno-icons-subset'],
    manifest,
    allowed: ['juno-icons-subset'],
  });
  assert.deepEqual(found, []);
});

// ── tap targets: the pagination and seg__opt defects ─────────────────────

test('it reports a target short on EITHER axis', () => {
  // Pagination was 44 wide and 32 tall — a tap target in one direction and
  // not the other. A check on one axis passed for that bug's entire life.
  const wide = shortTargets({ elements: [{ label: 'page 2', width: 44, height: 32 }], floor: 44 });
  const tall = shortTargets({ elements: [{ label: 'page 2', width: 32, height: 44 }], floor: 44 });
  assert.equal(wide.length, 1);
  assert.equal(tall.length, 1);
  assert.match(wide[0], /44x32/);
});

test('it passes a target that meets the floor on both axes', () => {
  assert.deepEqual(
    shortTargets({ elements: [{ label: 'ok', width: 44, height: 44 }], floor: 44 }),
    [],
  );
});

test('it uses the profile floor, so desktop is not judged by a phone', () => {
  const el = [{ label: 'small', width: 24, height: 24 }];
  assert.deepEqual(shortTargets({ elements: el, floor: 24 }), []);
  assert.equal(shortTargets({ elements: el, floor: 44 }).length, 1);
});

// ── navigation: the landscape-phone hole ─────────────────────────────────

test('it reports a screen with no primary navigation', () => {
  // THE defect slice 3 found: at 844x390 a rail paired with .juno-hide-from-md
  // leaves the rail hidden (coarse and short) AND the dock hidden (844 >= md).
  const v = navigationVerdict({
    profile: PROFILES['phone-landscape'],
    railShown: false,
    dockShown: false,
  });
  assert.match(v, /no primary navigation/);
});

test('it reports both showing at once', () => {
  const v = navigationVerdict({ profile: PROFILES.phone, railShown: true, dockShown: true });
  assert.match(v, /both/);
});

test('it reports the wrong half for the profile', () => {
  // A rail on a landscape phone is the original bug; a dock on a desktop is
  // its mirror, and a probe that only looked for "something is showing" would
  // miss both.
  assert.match(
    navigationVerdict({ profile: PROFILES['phone-landscape'], railShown: true, dockShown: false }),
    /rail is showing where phone navigation belongs/,
  );
  assert.match(
    navigationVerdict({ profile: PROFILES.desktop, railShown: false, dockShown: true }),
    /dock is showing where a rail belongs/,
  );
});

test('it stays quiet when the right half is showing', () => {
  assert.equal(
    navigationVerdict({ profile: PROFILES.phone, railShown: false, dockShown: true }),
    null,
  );
  assert.equal(
    navigationVerdict({ profile: PROFILES.desktop, railShown: true, dockShown: false }),
    null,
  );
});

// ── the report ───────────────────────────────────────────────────────────

test('a clean run still says what it did not cover', () => {
  // A probe that lists only failures reads as a clean bill of health for
  // everything it never looked at. This repo has shipped that mistake more
  // than once, so the limits are printed on EVERY run, in the same block.
  const out = report({
    url: 'http://x',
    junoui: '9.9.9',
    results: [{ profile: 'phone', dims: '390x844', findings: [] }],
    limits: LIMITS,
  });
  assert.equal(out.total, 0);
  assert.match(out.text, /No findings\./);
  assert.match(out.text, /NOT COVERED BY THIS RUN/);
  assert.match(out.text, /WebKit/, 'the run does not admit it is Chromium-only');
  assert.match(out.text, /env\(\)/, 'the run does not admit safe areas are unverified');
});

test('the limits name the things that have actually bitten', () => {
  const joined = LIMITS.join(' ');
  for (const must of ['WebKit', 'env()', 'Routes you did not visit']) {
    assert.ok(joined.includes(must), `the limits do not mention ${must}`);
  }
});

test('findings are counted across profiles, and the exit is derived from them', () => {
  const out = report({
    url: 'http://x',
    junoui: '9.9.9',
    results: [
      { profile: 'phone', dims: '390x844', findings: ['a'] },
      { profile: 'desktop', dims: '1440x900', findings: ['b', 'c'] },
    ],
    limits: LIMITS,
  });
  assert.equal(out.total, 3);
  assert.match(out.text, /3 finding\(s\)/);
});

// ── the CLI surface ──────────────────────────────────────────────────────

test('an unknown profile is refused by name rather than skipped', () => {
  // Skipping would run fewer profiles than asked and still exit 0 — a probe
  // silently covering less than its invocation claimed.
  assert.throws(() => parseArgs(['--url', 'http://x', '--profiles', 'phone,phablet']), /phablet/);
});

test('a missing url is refused', () => {
  assert.throws(() => parseArgs([]), /--url is required/);
});

test('the doctor is exported and executable', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./doctor'], './tools/doctor.mjs');
  assert.equal(pkg.bin['junoui-doctor'], './tools/doctor.mjs');
  assert.ok(pkg.files.includes('tools'), 'tools/ is not in the tarball');
  // playwright must NOT be a hard dependency — the doctor is opt-in
  assert.ok(!(pkg.dependencies ?? {}).playwright, 'playwright became a runtime dependency');
});
