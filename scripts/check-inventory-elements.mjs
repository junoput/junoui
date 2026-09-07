#!/usr/bin/env node
// Verifies docs/inventory-elements.md's prose against its own per-component
// rows. A prior version of this checker only re-derived counts FROM the rows
// and printed them — it never compared that tally against what the prose
// actually says, so it "confirmed agreement" while two summary lines were
// stale (20260906-054, review #2). This version parses the specific prose
// sentences that state a count and fails, naming the line, on any mismatch.
import { readFileSync } from 'node:fs';

const path = 'docs/inventory-elements.md';
const text = readFileSync(path, 'utf8');
const lines = text.split('\n');

function fail(lineNo, msg) {
  console.error(`FAIL docs/inventory-elements.md:${lineNo + 1}: ${msg}`);
  process.exitCode = 1;
}

// ── derive the tally from the per-component rows (the ground truth) ───────
const blocks = text.split(/\n### `/).slice(1);
if (blocks.length < 45) {
  console.error(
    `VACUOUS: only ${blocks.length} component blocks parsed (floor is 45) — refusing to verify against an empty-looking read`,
  );
  process.exit(1);
}

const rows = blocks.map((b) => {
  const name = b.split('`', 1)[0];
  const partsMatch = b.match(/\*\*BEM parts\*\* \((\d+)\)/);
  const slotMatch = b.match(/\*\*Slot order\*\*: \*\*([\w/-]+)\*\*/);
  const tokensMatch = b.match(/\*\*Tokens read\*\* \((\d+)\)/);
  if (!partsMatch || !slotMatch || !tokensMatch) {
    throw new Error(`block for \`${name}\` is missing a required field — parser or doc is broken`);
  }
  return { name, parts: Number(partsMatch[1]), slot: slotMatch[1], tokens: Number(tokensMatch[1]) };
});

const button = rows.find((r) => r.name === 'button');
if (!button || button.tokens === 0) {
  console.error(
    'VACUOUS: button.css token count is 0 (or button row missing) — the token scan found nothing',
  );
  process.exit(1);
}

// a zero-part row must be n/a, and only zero-part rows may be n/a — this is
// the exact invariant that slipped in the first pass (fold-slot/icon were
// `free` with 0 parts).
for (const r of rows) {
  if ((r.parts === 0) !== (r.slot === 'n/a')) {
    fail(
      0,
      `\`${r.name}\` has ${r.parts} BEM parts but slot order \`${r.slot}\` — a 0-part row must be \`n/a\` and vice versa`,
    );
  }
}

const total = rows.length;
const tally = { fixed: 0, 'n/a': 0, free: 0, ambiguous: 0 };
for (const r of rows) tally[r.slot] = (tally[r.slot] ?? 0) + 1;

const multipart = rows.filter((r) => r.parts > 0);
const mpTally = { fixed: 0, free: 0, ambiguous: 0 };
for (const r of multipart) {
  if (r.slot === 'n/a')
    throw new Error(
      `\`${r.name}\` is multi-part but slot order is n/a — should be unreachable after the check above`,
    );
  mpTally[r.slot] = (mpTally[r.slot] ?? 0) + 1;
}
const mpTotal = multipart.length;
const mpFixedPct = Math.round((mpTally.fixed / mpTotal) * 100);
const rawFixedPct = Math.round((tally.fixed / total) * 100);

// ── check every number the prose actually states, against that tally ──────
// Prose sentences can wrap across a hard line break (prettier's prose-wrap),
// so a pattern is matched against each line joined with its next one, not
// against single lines in isolation — otherwise a wrapped sentence like
// "...reads as 23 of\n52 (44%)..." never matches at all, which FAILED LOUDLY
// the first time this ran rather than silently passing, exactly per the
// vacuity floor: "expected sentence not found" is a red, not a skip.
function checkLine(pattern, expectedByGroup, label) {
  let idx = -1;
  let m = null;
  for (let i = 0; i < lines.length; i++) {
    const joined = (lines[i] + ' ' + (lines[i + 1] ?? '')).replace(/\s+/g, ' ');
    const candidate = joined.match(pattern);
    if (candidate) {
      idx = i;
      m = candidate;
      break;
    }
  }
  if (!m) {
    fail(0, `expected sentence not found: ${label} (pattern: ${pattern})`);
    return;
  }
  for (const [group, expected] of Object.entries(expectedByGroup)) {
    const got = Number(m.groups[group]);
    if (got !== expected) {
      fail(idx, `${label} — prose says ${group}=${got}, rows say ${group}=${expected}`);
    }
  }
}

checkLine(
  /fixed (?<fixed>\d+) · n\/a (?<na>\d+) · free (?<free>\d+) · ambiguous (?<ambiguous>\d+)\.\*\* `n\/a`/,
  { fixed: tally.fixed, na: tally['n/a'], free: tally.free, ambiguous: tally.ambiguous },
  'across-all-52 headline tally',
);

checkLine(
  /Of the \*\*(?<mptotal>\d+) multi-part components\*\*/,
  { mptotal: mpTotal },
  'multi-part denominator',
);

checkLine(
  /fixed (?<fixed>\d+) · free (?<free>\d+) · ambiguous (?<ambiguous>\d+) → (?<num>\d+) of (?<den>\d+) \((?<pct>\d+)%\) have a fixed/,
  {
    fixed: mpTally.fixed,
    free: mpTally.free,
    ambiguous: mpTally.ambiguous,
    num: mpTally.fixed,
    den: mpTotal,
    pct: mpFixedPct,
  },
  'multi-part fixed-slot-order sentence',
);

checkLine(
  /the same fact reads as (?<num>\d+) of (?<den>\d+) \((?<pct>\d+)%\)/,
  { num: tally.fixed, den: total, pct: rawFixedPct },
  'raw-52 comparison sentence',
);

checkLine(
  /\*\*Fixed \((?<num>\d+) of (?<den>\d+) multi-part\)\*\*/,
  { num: tally.fixed, den: mpTotal },
  'Fixed bullet',
);
checkLine(
  /\*\*n\/a \((?<num>\d+) of (?<den>\d+)\)\*\*/,
  { num: tally['n/a'], den: total },
  'n/a bullet',
);
checkLine(
  /\*\*Free \((?<num>\d+) of (?<den>\d+) multi-part\)\*\*/,
  { num: tally.free, den: mpTotal },
  'Free bullet',
);
checkLine(/\*\*Ambiguous \((?<num>\d+)\)\*\*/, { num: tally.ambiguous }, 'Ambiguous bullet');
checkLine(
  /(?<num>\d+) components have zero BEM parts/,
  { num: tally['n/a'] },
  '"N components have zero BEM parts" sentence',
);

if (process.exitCode === 1) {
  console.error(
    `\nDerived tally: fixed ${tally.fixed} · n/a ${tally['n/a']} · free ${tally.free} · ambiguous ${tally.ambiguous} (of ${total}); multi-part: fixed ${mpTally.fixed} · free ${mpTally.free} · ambiguous ${mpTally.ambiguous} (of ${mpTotal})`,
  );
  process.exit(1);
}

console.log(
  `OK — ${total} rows parsed; prose matches the row-derived tally: fixed ${tally.fixed} · n/a ${tally['n/a']} · free ${tally.free} · ambiguous ${tally.ambiguous}; multi-part 23-of-37-style: fixed ${mpTally.fixed} of ${mpTotal} (${mpFixedPct}%)`,
);
