// ════════════════════════════════════════════════════════════════════════
//  junoui — "is this version already on the registry?", decided not printed
// ════════════════════════════════════════════════════════════════════════
//  A module of its own for the reason gate-currency.mjs and gate-verdict.mjs
//  are: consumer-gate.mjs RUNS on import, so a pure decision extracted here
//  can be tested without a network, a registry or a real consumer checkout.
//
//  THE DEFECT THIS REPLACES (20260909-122). The stage used to ask
//
//      npm view <pkg>@<version> version
//
//  and treat ANY non-zero exit as "registry unreachable". But npm exits
//  NON-ZERO WITH E404 when the version does not exist — which is the SUCCESS
//  condition here. Measured:
//
//      npm view @junoput01/junoui@0.11.0 version  ->  E404, exit 1   NOT published
//      npm view @junoput01/junoui@0.10.0 version  ->  0.10.0, exit 0     published
//
//  So the stage could report FAIL (already published) or SKIP (everything
//  else) and COULD NEVER REPORT PASS FOR A GENUINE RELEASE CANDIDATE, because
//  an unpublished version always 404s. It had been vacuous for every release,
//  and before 20260909-116 it printed that vacuum as PASS.
//
//  Asking for the version LIST instead makes all three outcomes reachable and
//  needs no parsing of npm's error text, which is not a stable interface:
//
//      exit 0, version in the list      -> FAIL   already published
//      exit 0, version not in the list  -> PASS   not published
//      exit != 0                        -> SKIP   genuinely unknown
// ════════════════════════════════════════════════════════════════════════

/**
 * Decide the "not already published" stage from `npm view <pkg> versions --json`.
 *
 * @param code  the command's exit status
 * @param out   its stdout — a JSON array of published versions when code is 0
 * @param version the candidate's version
 * @returns `{ ok, skipped, note }` in the shape consumer-gate's record() takes
 */
export function publishedVerdict({ code, out, version }) {
  if (code !== 0) {
    // Cannot tell. NOT a pass: an unanswered question is not a green one, and
    // saying so is the whole of 20260909-116.
    return { ok: true, skipped: true, note: 'registry unreachable' };
  }
  let versions;
  try {
    versions = JSON.parse(out);
  } catch {
    return { ok: true, skipped: true, note: 'registry returned unparseable version list' };
  }
  // A single-version package yields a bare string rather than an array.
  if (typeof versions === 'string') versions = [versions];
  if (!Array.isArray(versions)) {
    return { ok: true, skipped: true, note: 'registry returned an unexpected version list' };
  }
  if (versions.includes(version)) {
    return {
      ok: false,
      skipped: false,
      note: `${version} is already on the registry — run \`changeset version\` before packing (or pass --dev if you are not releasing)`,
    };
  }
  return { ok: true, skipped: false, note: `${version} is not on the registry` };
}
