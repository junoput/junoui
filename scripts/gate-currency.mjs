// ════════════════════════════════════════════════════════════════════════
//  junoui — is the gate's consumer still the consumer?
// ════════════════════════════════════════════════════════════════════════
//  A module of its own, not an export from consumer-gate.mjs, for the reason
//  scripts/token-names.mjs exists: the gate RUNS on import. A test importing it
//  to reach one pure function executes a two-minute release gate as a side
//  effect of asking a question about exit codes — which is what happened on the
//  first attempt, taking 64 seconds to fail for reasons unrelated to the claim.
// ════════════════════════════════════════════════════════════════════════

/**
 * Is the checked-out consumer current with the branch it is a lane of?
 *
 * Pure and exported so the decision is testable directly rather than through a
 * two-minute gate run. The first attempt to mutation-test this pointed `--ref`
 * at a SHA — not a branch — so the check never ran and every mutation
 * "survived" against an empty result.
 *
 * @param ancestorCode `git merge-base --is-ancestor` exit: 0 contained, 1 not
 *   contained, anything else = insufficient history, which is NOT an answer.
 * @param behind commits the lane is missing, or null if unknown.
 */
export function baselineVerdict({ ancestorCode, behind = null, ref, baseline }) {
  if (ancestorCode === 0) return { ok: true, detail: `${ref} carries all of ${baseline}` };
  if (ancestorCode === 1) {
    return {
      ok: false,
      detail: `${ref} is ${behind ?? '?'} commit(s) behind ${baseline} — this is a snapshot, not the consumer`,
    };
  }
  // A gate that cannot tell whether its consumer is current is the gate this
  // check exists to replace. Fail closed.
  return {
    ok: false,
    detail: `could not compare ${ref} with ${baseline} — a gate that cannot tell is not a gate`,
  };
}
