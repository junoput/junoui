// ════════════════════════════════════════════════════════════════════════
//  junoui/testing — guards a consumer can run against its own source
// ════════════════════════════════════════════════════════════════════════
//  Framework-agnostic: throws an Error with a readable message, so it works
//  under vitest, node:test, jest or a plain script. No dependencies.
//
//    import { assertJunoClasses } from 'junoui/testing';
//    assertJunoClasses(['src/**/*.tsx']);
//
//  WHAT IT ANSWERS, and what it does not. It answers "junoui defines a rule
//  mentioning this class". It does not answer "the class does what your
//  component assumes" — a class that exists but was repurposed upstream
//  passes. What it catches with certainty is a name that matches NOTHING,
//  which is the whole of the defect it was written for: eleven such names
//  once compiled silently in a consumer and rendered a phone dialog as
//  unstyled UA defaults, with its confirm button off the bottom of the screen.
//
//  See docs/conformance-kit.md.
// ════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** `juno-` or the role form `juno--`, then BEM segments.
 *  The leading boundary keeps `--juno-warning` out: a custom property is
 *  always preceded by a hyphen and a class never is. Getting this wrong makes
 *  the guard report components that have no defect. */
const CLASS_RE = /(?<![-\w])juno-{1,2}[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)*/g;

/** The manifest this build ships. */
export function loadJunoClasses() {
  return JSON.parse(readFileSync(join(HERE, '..', 'dist', 'classes.json'), 'utf8'));
}

/**
 * Source with comments removed.
 *
 * Crude by design — it does not parse string literals, so a `//` inside one
 * truncates that line. Worth the simplicity: a class name does not live inside
 * a URL, and the alternative is a second implementation of a compiler to
 * answer a question about strings. Comments MUST be stripped: a file that
 * documents a typo in order to explain it would otherwise be reported for it.
 */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

/**
 * `juno-*` class names appearing in a source file, comments excluded.
 *
 * Matches anywhere in the code rather than parsing JSX: a class reaches the
 * DOM through a template literal, a ternary or a helper as often as through a
 * literal `className="…"`, and a matcher that only understood the literal form
 * would skip the conditional ones — which is exactly where a typo hides.
 */
export function junoClassesIn(source) {
  return [...new Set([...stripComments(source).matchAll(CLASS_RE)].map((m) => m[0]))].sort();
}

/** Minimal glob: supports `**`, `*` and `?`. No braces, no negation — a
 *  consumer wanting more can pass an explicit file list instead. */
function globToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        out += '.*';
        i++;
        if (pattern[i + 1] === '/') i++;
      } else out += '[^/]*';
    } else if (c === '?') out += '[^/]';
    else out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + out + '$');
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** Files matching any of `patterns`, resolved from `cwd`. */
export function resolveFiles(patterns, cwd = process.cwd()) {
  const res = patterns.map(globToRegExp);
  const roots = new Set();
  for (const p of patterns) {
    const literal = p.split(/[*?]/)[0];
    const base = literal.endsWith('/') ? literal : dirname(literal);
    roots.add(base === '' || base === '.' ? cwd : join(cwd, base));
  }
  const files = [];
  for (const root of roots) {
    let st;
    try {
      st = statSync(root);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    for (const f of walk(root)) {
      const rel = relative(cwd, f).split(sep).join('/');
      if (res.some((r) => r.test(rel))) files.push(rel);
    }
  }
  return files.sort();
}

/**
 * Throw if any file names a `juno-*` class this build does not define.
 *
 * @param patterns  globs or explicit paths, relative to `cwd`
 * @param options.allowed  names the CONSUMER defines in its own stylesheet.
 *   Each one is a claim the caller is making; check it against that stylesheet
 *   rather than treating this as a waiver list.
 * @param options.surface  `'all'` (default) or `'public'`.
 *
 *   'all' is the default deliberately, against this kit's own first proposal.
 *   Measured on the 0.7.0 build: 310 classes have rules, 277 are named in
 *   docs/. The 33-name difference is NOT an internals list — it is
 *   `juno-sr-only`, `juno-bg-s0`, `juno-hide-below-lg`, `juno-eyebrow` and
 *   friends, i.e. public utilities nobody wrote up. Defaulting to 'public'
 *   would have failed consumers for using shipped API. 'public' remains
 *   available for a stricter check, and the docs gap is junoui's to close.
 */
export function assertJunoClasses(patterns, options = {}) {
  const { allowed = [], surface = 'all', cwd = process.cwd() } = options;
  const manifest = loadJunoClasses();
  // The claim is "junoui ships NOTHING by this name", not "this is not a
  // class". A consumer writes `junoPx('juno-pillbar-gap')` and `#juno-i-${n}`,
  // and no regex over source text can tell those from a class name — so a
  // guard that only knew about classes would report correct code. Measured on
  // a real consumer: 8 of 24 reports were tokens, an icon-id template and a
  // keyframe, all of them names junoui does ship.
  const shipped = [...manifest.keyframes, ...manifest.tokens, ...manifest.icons];
  const defined = new Set(
    surface === 'public'
      ? [...manifest.public, ...manifest.roles, ...shipped]
      : [...manifest.all, ...shipped],
  );
  const waived = new Set(allowed);

  const files = Array.isArray(patterns)
    ? resolveFiles(patterns, cwd)
    : resolveFiles([patterns], cwd);
  if (files.length === 0) {
    // A guard that inspected nothing and passed is the failure mode this
    // whole kit exists to stop.
    throw new Error(
      `assertJunoClasses: no files matched ${JSON.stringify(patterns)} under ${cwd} — ` +
        `the check would have passed vacuously`,
    );
  }

  const offenders = [];
  for (const f of files) {
    for (const cls of junoClassesIn(readFileSync(join(cwd, f), 'utf8'))) {
      if (!defined.has(cls) && !waived.has(cls)) offenders.push(`${f}: ${cls}`);
    }
  }
  if (offenders.length) {
    throw new Error(
      `junoui ${manifest.version} ships nothing named by ${offenders.length} \`juno-*\` name(s) ` +
        `(surface: ${surface}, ${files.length} file(s) checked):\n  ` +
        offenders.join('\n  '),
    );
  }
  return { files: files.length, checked: defined.size };
}
