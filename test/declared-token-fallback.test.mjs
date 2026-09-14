// A `var()` FALLBACK ON A DECLARED TOKEN IS DEAD CODE THAT READS AS A FLOOR
// (20260914-139).
//
// junoui uses `var(--x, <default>)` for one thing: a CONSUMER KNOB. `--juno-measure`,
// `--juno-stack-space`, `--juno-grid-min` are deliberately undefined, the caller sets
// them, and the fallback IS the shipped value. That idiom is correct and there are 35
// of them.
//
// `.juno-pagination__item` carried a thirty-sixth that was not a knob:
//
//     min-inline-size: var(--juno-size-tap-min, var(--juno-space-32));
//
// --juno-size-tap-min is declared at :root in every build, so the 32 was unreachable.
// The author wanted a floor — three lines below, the same rule's own comment says
// "reading the token straight would SHRINK it on desktop" and uses `max()` on the
// block axis to prevent exactly that. But a var() fallback fires only when a property
// is UNDEFINED, never when its value is merely smaller, so the inline axis did the
// thing the comment warns about for the whole life of the file. The rule carried the
// argument against its own line.
//
// WHY A TEST RATHER THAN A FIXED LINE: the defect is invisible by inspection — the
// wrong form and the right one are one comma apart and both compile, render and pass
// every other check. What separates them is whether the name is a knob or a token,
// which is a fact about a different file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Every `--juno-*` declared in the UNCONDITIONAL `:root` block of the generated
 *  token stylesheet — i.e. defined in every build regardless of palette or mode.
 *  Scoped to that block on purpose: a token declared only under
 *  `:root[data-juno-palette="colorblind"]` genuinely can be undefined, so wrapping
 *  it in a fallback would be legitimate and must not be flagged. */
function alwaysDeclared() {
  const css = readFileSync('dist/css/juno-tokens.css', 'utf8');
  // MEASURED RATHER THAN ASSUMED: the generated stylesheet has exactly ONE
  // unqualified `:root` block, holding 111 names; the other nine are palette- and
  // mode-qualified (`:root[data-juno-palette="soft"]…`). This walks every
  // unqualified block in case that ever becomes more than one, and deliberately
  // excludes the qualified ones — a colour token declared only under a palette
  // CAN be undefined, so a fallback on it is legitimate. The scoping therefore
  // errs toward missing an offender rather than inventing one.
  const blocks = [...css.matchAll(/^:root \{([^}]*)\}/gm)].map((m) => m[1]);
  assert.ok(blocks.length >= 1, 'no unconditional :root block in the token stylesheet');
  // `[\w-]`, not `[a-z0-9-]`: --juno-font-lineHeight-relaxed is camelCase, and a
  // lowercase-only class silently truncates it at the capital (20260914-114).
  return new Set(
    blocks.flatMap((b) => [...b.matchAll(/^\s*(--juno-[\w-]+)\s*:/gm)].map((m) => m[1])),
  );
}

/**
 * Blank out comment bodies, keeping newlines so line numbers survive.
 *
 * FOUND BY RUNNING IT: the first version scanned raw source and flagged
 * `pagination.css` — at the line INSIDE the comment that quotes the defective
 * form while explaining it. A checker that cannot tell code from a comment
 * makes the fix for a defect look like the defect, which is the one shape that
 * guarantees nobody can ever write the explanation down.
 */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/** Every `--juno-*` name junoui reads WITH a fallback, with where it reads it. */
function fallbackReads() {
  const out = [];
  for (const d of ['src/css', 'src/css/components']) {
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.css')) continue;
      const p = join(d, f);
      const src = stripComments(readFileSync(p, 'utf8'));
      for (const m of src.matchAll(/var\(\s*(--juno-[\w-]+)\s*,/g)) {
        out.push({ file: p, name: m[1], line: src.slice(0, m.index).split('\n').length });
      }
    }
  }
  return out;
}

test('both instruments saw real data (vacuity floor)', () => {
  // The assertion below is an EMPTY-SET check, so it passes for free if either
  // side collects nothing. A renamed dist path or a changed var() spelling has
  // to fail here rather than read as a clean sweep.
  const declared = alwaysDeclared();
  const reads = fallbackReads();
  assert.ok(declared.size >= 100, `only ${declared.size} tokens in the :root block`);
  assert.ok(new Set(reads.map((r) => r.name)).size >= 30, `only ${reads.length} fallback reads`);

  // And both sets have to DISCRIMINATE, not merely be large: a knob must be absent
  // from the declared set and a token must be present. Without this the check also
  // passes when `alwaysDeclared()` returns everything or nothing.
  assert.ok(declared.has('--juno-size-tap-min'), 'a known token is missing from :root');
  assert.ok(!declared.has('--juno-stack-space'), 'a known consumer knob is declared at :root');
});

test('no stylesheet reads a DECLARED token through a var() fallback', () => {
  const declared = alwaysDeclared();
  const offenders = fallbackReads()
    .filter((r) => declared.has(r.name))
    .map((r) => `${r.file}:${r.line}  var(${r.name}, …)`);
  assert.deepEqual(
    offenders,
    [],
    'this token is declared at :root in every build, so the fallback can never ' +
      'fire — it is dead code that reads like a floor. If a floor is what was ' +
      'wanted, write it: max(var(--token), <value>). If the fallback was defensive, ' +
      'it is not needed and it is not how the other 35 fallback reads work.',
  );
});
