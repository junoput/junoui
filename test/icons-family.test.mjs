// The icon set as a FAMILY (X8 / 20260829-028).
//
// The ticket's argument is not "we want 14 more glyphs". It is that a consumer
// with no spatial vocabulary sources icons elsewhere, and "the moment they do,
// half the UI stops matching Phosphor bold — which is precisely the cohesion
// junoui exists to provide". So the guard is about cohesion, not inventory: a
// test that only counted symbols would pass with a Material crosshair dropped
// in beside Phosphor's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/icons';
const sprite = readFileSync('dist/icons/juno-icons.svg', 'utf8');
const sources = readdirSync(SRC).filter((f) => f.endsWith('.svg'));

const symbols = [
  ...sprite.matchAll(/<symbol id="(juno-i-[a-z0-9-]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g),
].map(([, id, viewBox, body]) => ({ id, viewBox, body }));

/** The spatial vocabulary this ticket adds. Named, because "the set got bigger"
 *  is not the claim — these specific concepts were the gap. */
const SPATIAL = [
  'crosshair',
  'crosshair-simple',
  'ruler',
  'polygon',
  'path',
  'map-pin',
  'map-trifold',
  'stack',
  'globe',
  'mountains',
  'cube',
  'compass',
  'scissors',
  'selection',
];

test('the sprite and the sources are actually read', () => {
  assert.ok(symbols.length > 60, `only ${symbols.length} symbols parsed`);
  assert.ok(sources.length > 60, `only ${sources.length} sources`);
});

test('the spatial vocabulary is present', () => {
  const ids = new Set(symbols.map((s) => s.id));
  assert.deepEqual(
    SPATIAL.filter((n) => !ids.has(`juno-i-${n}`)),
    [],
  );
});

test('every symbol shares one canvas', () => {
  // Phosphor draws on 0 0 256 256. A glyph from another family arrives on 24
  // or 20 and renders at a different optical size inside .juno-icon's box —
  // which is exactly how a set stops looking like a set.
  const odd = symbols
    .filter((s) => s.viewBox !== '0 0 256 256')
    .map((s) => `${s.id}: ${s.viewBox}`);
  assert.deepEqual(odd, []);
});

test('every symbol inherits its colour', () => {
  // .juno-icon colours by `color`, so a glyph carrying its own fill or stroke
  // ignores the role it is placed in and stays black on a dark panel. A
  // sourced-elsewhere icon almost always carries one.
  const hardcoded = [];
  for (const s of symbols) {
    for (const m of s.body.matchAll(/(fill|stroke)="([^"]+)"/g)) {
      const value = m[2].toLowerCase();
      if (value !== 'none' && value !== 'currentcolor')
        hardcoded.push(`${s.id}: ${m[1]}="${m[2]}"`);
    }
  }
  assert.deepEqual(hardcoded, [], 'symbols that will not take the role colour');
});

test('no symbol smuggles in styling or external references', () => {
  // A <style> block, a class hook or an <image> href would make one glyph
  // behave unlike the other 79 and could reach outside the sprite entirely.
  const offenders = [];
  for (const s of symbols) {
    if (/<style|class=|<image|xlink:href|url\(/i.test(s.body)) offenders.push(s.id);
  }
  assert.deepEqual(offenders, []);
});

test('every source file has the wrapper the builder expects', () => {
  // The builder strips the outer <svg> and keeps the inner geometry. A source
  // that does not match this shape silently contributes an empty symbol —
  // present in the sprite, invisible on the page.
  const bad = [];
  for (const f of sources) {
    const raw = readFileSync(join(SRC, f), 'utf8');
    if (!/^<svg[^>]*viewBox="0 0 256 256"[^>]*>/.test(raw.trim())) bad.push(`${f}: wrapper`);
    else if (!/<(path|circle|rect|polygon|polyline|line|g)\b/.test(raw))
      bad.push(`${f}: no geometry`);
  }
  assert.deepEqual(bad, []);
});

test('no symbol is empty', () => {
  // The failure mode of the check above, stated on the built artifact: a
  // symbol with an id and nothing to draw looks like a working icon to every
  // count-based test.
  const empty = symbols.filter((s) => s.body.trim().length < 20).map((s) => s.id);
  assert.deepEqual(empty, []);
});

test('the sprite and the sources agree, in both directions', () => {
  // A source that never reached the sprite, or a symbol with no source behind
  // it, are both drift between two artifacts that must match.
  const fromSources = sources.map((f) => `juno-i-${f.replace(/\.svg$/, '')}`).sort();
  assert.deepEqual(symbols.map((s) => s.id).sort(), fromSources);
});

test('the licence travels with the glyphs', () => {
  // Phosphor is MIT and the sprite is redistributed; the banner and the file
  // are what keep that true. Adding icons from a differently-licensed family
  // is the quiet way this becomes false.
  assert.match(sprite, /Phosphor/i);
  const license = readFileSync(join(SRC, 'LICENSE'), 'utf8');
  assert.match(license, /MIT License/);
  assert.match(license, /Phosphor Icons/);
});
