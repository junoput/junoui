// Relative links and anchors in the SHIPPED docs (20260914-105).
//
// `docs/` is in package.json's `files`, so every one of these resolves inside a
// consumer's `node_modules`. A dead link there is not a tidiness problem — it is
// a broken path in a published artefact, and nothing checked any of them.
//
// FOUND BY RUNNING IT: `icon-loader.md` pointed at `./loader.md#arc` while the
// heading is `## Arc — circular ring`, whose slug is `arc--circular-ring`. One
// dead anchor out of 73, and it had been there long enough that nobody noticed.
//
// ── THE SLUG RULE IS THE WHOLE TEST, AND GETTING IT WRONG COSTS MORE THAN THE
//    GAP ──────────────────────────────────────────────────────────────────────
//
// The first version of this checker collapsed runs of whitespace before
// hyphenating. GitHub does not: it strips non-word characters and then replaces
// EACH remaining space with a hyphen, so `## Density & text spacing` becomes
// `density--text-spacing` with two hyphens where the `&` was.
//
// That one difference reported NINE dead anchors where there is one. Eight
// correct links, all failing in the same direction — the signature of a lossy
// extractor rather than eight bad links — and "fixing" them would have replaced
// eight working anchors with broken ones.
//
// So the rule below is written to match GitHub's, and the test asserts a known
// double-hyphen anchor resolves. Without that assertion a future simplification
// of the slug rule passes every link by being wrong in the same direction as the
// documents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

/** Every markdown file a consumer receives, plus the repo's own top-level set. */
function docFiles() {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk('docs');
  for (const f of ['README.md', 'CONTRIBUTING.md', 'RELEASING.md']) if (existsSync(f)) out.push(f);
  return out;
}

/**
 * GitHub's heading-to-anchor rule.
 *
 * Lowercase; drop everything that is not a word character, whitespace or a
 * hyphen; then replace each remaining SPACE with a hyphen. The last step is
 * per-character — runs are NOT collapsed, which is why a heading containing
 * `&` or an em dash produces a double hyphen.
 */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/ /g, '-');

const FILES = docFiles();
const HEADINGS = new Map(
  FILES.map((f) => [
    f,
    new Set(
      [...readFileSync(f, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1].trim())),
    ),
  ]),
);

test('the docs were really walked and really parsed (vacuity floor)', () => {
  // Without this, a renamed directory makes every assertion below iterate an
  // empty list and pass — 0 links checked and 0 broken are indistinguishable
  // from a clean tree.
  assert.ok(FILES.length >= 30, `only ${FILES.length} markdown files walked`);
  const totalHeadings = [...HEADINGS.values()].reduce((n, s) => n + s.size, 0);
  assert.ok(totalHeadings >= 200, `only ${totalHeadings} headings parsed`);
});

test('the slug rule matches GitHub, including the double-hyphen case', () => {
  // The control that makes the link checks mean anything. A simplified rule that
  // collapses whitespace passes every link in the repo while being wrong, and
  // reported eight working anchors as dead when it was the checker at fault.
  assert.equal(slug('Density & text spacing'), 'density--text-spacing');
  assert.equal(slug('Arc — circular ring'), 'arc--circular-ring');
  assert.equal(slug('Max vs addition — the rule'), 'max-vs-addition--the-rule');
  assert.equal(slug('Progress API'), 'progress-api');
});

test('every relative link in the shipped docs points at a file that exists', () => {
  const broken = [];
  let checked = 0;
  for (const f of FILES) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\((\.[^)#\s]*)(#[^)\s]*)?\)/g)) {
      checked++;
      if (!existsSync(resolve(dirname(f), m[1]))) broken.push(`${f} -> ${m[1]}`);
    }
  }
  assert.ok(checked >= 200, `only ${checked} relative links found — suspect the regex`);
  assert.deepEqual(broken, [], 'a shipped doc links to a file that does not exist');
});

test('every anchor in the shipped docs points at a heading that exists', () => {
  const broken = [];
  let checked = 0;
  for (const f of FILES) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\((\.[^)#\s]*)?(#[^)\s]+)\)/g)) {
      checked++;
      const key = relative(process.cwd(), m[1] ? resolve(dirname(f), m[1]) : f);
      const headings = HEADINGS.get(key);
      if (!headings) broken.push(`${f} -> ${m[1] ?? ''}${m[2]}  (no such file)`);
      else if (!headings.has(m[2].slice(1).toLowerCase()))
        broken.push(`${f} -> ${m[1] ?? ''}${m[2]}`);
    }
  }
  assert.ok(checked >= 50, `only ${checked} anchors found — suspect the regex`);
  assert.deepEqual(
    broken,
    [],
    'a shipped doc points at a heading that does not exist. Check the HEADING ' +
      'before editing the link: a heading like "## Arc — circular ring" slugs to ' +
      '"arc--circular-ring", not "arc".',
  );
});
