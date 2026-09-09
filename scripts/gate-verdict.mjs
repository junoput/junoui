// ════════════════════════════════════════════════════════════════════════
//  junoui — the consumer gate's verdict, computed rather than printed inline
// ════════════════════════════════════════════════════════════════════════
//  A module of its own, not inline in consumer-gate.mjs, for the reason
//  gate-currency.mjs exists: the gate RUNS on import, and a test reaching a
//  pure decision that way pays for a real release gate as a side effect.
//
//  THE DEFECT (20260909-116). Gating the 0.11.0 candidate, the gate printed:
//
//    stage line     PASS  this version is not already published — skipped —
//                         registry unreachable
//    verdict line   PASS  this version is not already published
//    summary        GATE GREEN — 10 stages passed.
//
//  Ten did not pass. Nine passed and one did not run — the stage line carried
//  the caveat, the verdict block stripped it, and the summary upgraded a
//  question nobody could answer into a claim. A SKIPPED stage is neither a
//  pass nor a failure; it is an unanswered question, and the one artefact a
//  release ticket actually gets pasted onto — the summary line — must not be
//  more confident than the detail underneath it.
// ════════════════════════════════════════════════════════════════════════

/**
 * Partition a gate's stage results and compose the final summary line.
 *
 * A stage is exactly one of PASS, FAIL or SKIP — `skipped` takes priority
 * over `ok` on purpose, so a stage recorded as `record(name, true, note, {
 * skipped: true })` is never counted as a pass, no matter what `ok` says.
 * That is the whole fix: the field that means "did not run" cannot be
 * shadowed by the field that used to double as both.
 *
 * @param results `{ name, ok, note, skipped }[]`
 */
export function summarize(results) {
  const passed = results.filter((r) => !r.skipped && r.ok);
  const failed = results.filter((r) => !r.skipped && !r.ok);
  const skipped = results.filter((r) => r.skipped);
  const red = failed.length > 0;

  const line = red
    ? `GATE RED — ${failed.length} of ${results.length} stages failed. This release is blocked.`
    : skipped.length
      ? `GATE GREEN — ${passed.length} passed, ${skipped.length} skipped ` +
        `(${skipped.map((r) => r.note || r.name).join('; ')}).`
      : `GATE GREEN — ${passed.length} stages passed.`;

  return { passed, failed, skipped, red, line };
}

/** One verdict-block row — SKIP (with its reason) beats PASS/FAIL, the same
 * priority `summarize` uses, so the row a reader sees agrees with the count
 * they were just given. */
export function stageLine(r) {
  const tag = r.skipped ? 'SKIP' : r.ok ? 'PASS' : 'FAIL';
  return `${tag}  ${r.name}${r.note ? ` — ${r.note}` : ''}`;
}
